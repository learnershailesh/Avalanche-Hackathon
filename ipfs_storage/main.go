package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	shell "github.com/ipfs/go-ipfs-api"
)

type IPFSServer struct {
	sh            *shell.Shell
	cache         map[string][]byte
	cacheMutex    sync.RWMutex
	fileMetadata  map[string]FileMetadata
	metadataMutex sync.RWMutex
}

type FileMetadata struct {
	OriginalName string `json:"original_name"`
	ContentType  string `json:"content_type"`
	Size         int64  `json:"size"`
	CID          string `json:"cid"`
}

type UploadResponse struct {
	CID      string            `json:"cid"`
	Size     int64             `json:"size"`
	Path     string            `json:"path"`
	Gateways map[string]string `json:"gateways"`
}

type RetrieveResponse struct {
	Content string `json:"content"`
	CID     string `json:"cid"`
	Size    int64  `json:"size"`
}

func NewIPFSServer() *IPFSServer {
	// Connect to local IPFS node (make sure IPFS is running)
	sh := shell.NewShell("localhost:5001")
	// Set timeout for faster responses
	sh.SetTimeout(30 * time.Second)
	return &IPFSServer{
		sh:           sh,
		cache:        make(map[string][]byte),
		fileMetadata: make(map[string]FileMetadata),
	}
}

// getContentType detects the content type based on file content
func getContentType(content []byte) string { // Check for common image formats
	if len(content) >= 4 {
		// JPEG
		if content[0] == 0xFF && content[1] == 0xD8 && content[2] == 0xFF {
			return "image/jpeg"
		}
		// PNG
		if content[0] == 0x89 && content[1] == 0x50 && content[2] == 0x4E && content[3] == 0x47 {
			return "image/png"
		}
		// GIF
		if len(content) >= 6 && (string(content[0:6]) == "GIF87a" || string(content[0:6]) == "GIF89a") {
			return "image/gif"
		}
		// WebP
		if len(content) >= 12 && string(content[0:4]) == "RIFF" && string(content[8:12]) == "WEBP" {
			return "image/webp"
		}
	}

	// Check for PDF
	if len(content) >= 4 && string(content[0:4]) == "%PDF" {
		return "application/pdf"
	}

	// Check for video formats
	if len(content) >= 8 {
		// MP4
		if (content[4] == 0x66 && content[5] == 0x74 && content[6] == 0x79 && content[7] == 0x70) ||
		   (content[0] == 0x00 && content[1] == 0x00 && content[2] == 0x00 && content[3] == 0x18 && content[4] == 0x66 && content[5] == 0x74 && content[6] == 0x79 && content[7] == 0x70) {
			return "video/mp4"
		}
		// AVI
		if content[0] == 0x52 && content[1] == 0x49 && content[2] == 0x46 && content[3] == 0x46 && content[8] == 0x41 && content[9] == 0x56 && content[10] == 0x49 && content[11] == 0x20 {
			return "video/x-msvideo"
		}
		// MOV
		if content[4] == 0x66 && content[5] == 0x72 && content[6] == 0x65 && content[7] == 0x65 {
			return "video/quicktime"
		}
	}

	// Check for audio formats
	if len(content) >= 4 {
		// MP3
		if (content[0] == 0xFF && content[1] == 0xFB) || (content[0] == 0x49 && content[1] == 0x44 && content[2] == 0x33) {
			return "audio/mpeg"
		}
		// WAV
		if content[0] == 0x52 && content[1] == 0x49 && content[2] == 0x46 && content[3] == 0x46 && len(content) >= 12 && content[8] == 0x57 && content[9] == 0x41 && content[10] == 0x56 && content[11] == 0x45 {
			return "audio/wav"
		}
	}

	// Check for ZIP-based formats
	if len(content) >= 4 {
		// ZIP (used by DOCX, XLSX, PPTX, etc.)
		if content[0] == 0x50 && content[1] == 0x4B && content[2] == 0x03 && content[3] == 0x04 {
			return "application/zip"
		}
	}

	// Check for text content
	if isTextContent(content) {
		return "text/plain"
	}

	// Default to binary
	return "application/octet-stream"
}

// isTextContent checks if content appears to be text
func isTextContent(content []byte) bool {
	// Limit check to first 1KB for performance
	maxCheck := len(content)
	if maxCheck > 1024 {
		maxCheck = 1024
	}

	for i := 0; i < maxCheck; i++ {
		b := content[i]
		if b == 0 {
			return false // Contains null bytes, likely binary
		}
		if b < 32 && b != 9 && b != 10 && b != 13 { // Not printable, tab, newline, or carriage return
			return false
		}
	}
	return true
}

// cleanupCache removes old entries from cache (simple LRU-like cleanup)
func (s *IPFSServer) cleanupCache() {
	s.cacheMutex.Lock()
	defer s.cacheMutex.Unlock()

	// Simple cleanup: if cache has more than 100 entries, clear it
	if len(s.cache) > 100 {
		s.cache = make(map[string][]byte)
		log.Println("Cache cleaned up")
	}
}

// saveFileToRetrieveFolder saves the file to retrieve folder with original name
func (s *IPFSServer) saveFileToRetrieveFolder(cid string, content []byte, originalName string, contentType string) error {
	// Create retrieve folder if it doesn't exist
	retrieveDir := "retrieve"
	if err := os.MkdirAll(retrieveDir, 0755); err != nil {
		return fmt.Errorf("failed to create retrieve directory: %v", err)
	}

	// Generate filename with CID prefix to avoid conflicts
	ext := filepath.Ext(originalName)
	nameWithoutExt := strings.TrimSuffix(originalName, ext)
	filename := fmt.Sprintf("%s_%s%s", nameWithoutExt, cid[:8], ext)

	// If no extension, try to add one based on content type
	if ext == "" {
		switch contentType {
		case "application/pdf":
			filename += ".pdf"
		case "image/jpeg":
			filename += ".jpg"
		case "image/png":
			filename += ".png"
		case "image/gif":
			filename += ".gif"
		case "image/webp":
			filename += ".webp"
		case "video/mp4":
			filename += ".mp4"
		case "video/x-msvideo":
			filename += ".avi"
		case "video/quicktime":
			filename += ".mov"
		case "audio/mpeg":
			filename += ".mp3"
		case "audio/wav":
			filename += ".wav"
		case "application/zip":
			filename += ".zip"
		case "text/plain":
			filename += ".txt"
		default:
			filename += ".bin"
		}
	}

	filePath := filepath.Join(retrieveDir, filename)

	// Write file
	if err := os.WriteFile(filePath, content, 0644); err != nil {
		return fmt.Errorf("failed to write file: %v", err)
	}

	log.Printf("File saved to retrieve folder: %s", filePath)
	return nil
}

// saveFileToUploadsFolder saves the uploaded file to upload folder with original name
func (s *IPFSServer) saveFileToUploadsFolder(cid string, content []byte, originalName string, contentType string) error {
	uploadsDir := "upload"
	log.Printf("Creating upload directory: %s", uploadsDir)
	if err := os.MkdirAll(uploadsDir, 0755); err != nil {
		return fmt.Errorf("failed to create upload directory: %v", err)
	}

	ext := filepath.Ext(originalName)
	nameWithoutExt := strings.TrimSuffix(originalName, ext)
	filename := fmt.Sprintf("%s_%s%s", nameWithoutExt, cid[:8], ext)
	log.Printf("Generated filename: %s", filename)

	if ext == "" {
		switch contentType {
		case "application/pdf":
			filename += ".pdf"
		case "image/jpeg":
			filename += ".jpg"
		case "image/png":
			filename += ".png"
		case "image/gif":
			filename += ".gif"
		case "image/webp":
			filename += ".webp"
		case "video/mp4":
			filename += ".mp4"
		case "video/x-msvideo":
			filename += ".avi"
		case "video/quicktime":
			filename += ".mov"
		case "audio/mpeg":
			filename += ".mp3"
		case "audio/wav":
			filename += ".wav"
		case "application/zip":
			filename += ".zip"
		case "text/plain":
			filename += ".txt"
		default:
			filename += ".bin"
		}
	}

	filePath := filepath.Join(uploadsDir, filename)
	log.Printf("Writing file to: %s", filePath)

	if err := os.WriteFile(filePath, content, 0644); err != nil {
		return fmt.Errorf("failed to write file: %v", err)
	}

	log.Printf("File saved to upload folder: %s", filePath)
	return nil
}

func (s *IPFSServer) uploadHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	err := r.ParseMultipartForm(50 << 20) // 50 MB max
	if err != nil {
		http.Error(w, "Error parsing form", http.StatusBadRequest)
		return
	}

	file, fileHeader, err := r.FormFile("file")
	if err != nil {
		http.Error(w, "Error getting file", http.StatusBadRequest)
		return
	}
	defer file.Close()

	originalName := fileHeader.Filename
	if originalName == "" {
		originalName = "unknown_file"
	}

	fileContent, err := io.ReadAll(file)
	if err != nil {
		http.Error(w, "Error reading file", http.StatusInternalServerError)
		return
	}

	contentType := getContentType(fileContent)

	// Use bytes.NewReader to avoid data corruption
	cid, err := s.sh.Add(bytes.NewReader(fileContent))
	if err != nil {
		http.Error(w, fmt.Sprintf("Error adding to IPFS: %v", err), http.StatusInternalServerError)
		return
	}

	s.cacheMutex.Lock()
	s.cache[cid] = fileContent
	s.cacheMutex.Unlock()

	s.metadataMutex.Lock()
	s.fileMetadata[cid] = FileMetadata{
		OriginalName: originalName,
		ContentType:  contentType,
		Size:         int64(len(fileContent)),
		CID:          cid,
	}
	s.metadataMutex.Unlock()

	s.cleanupCache()

	log.Printf("Attempting to save file to upload folder: %s", originalName)
	err = s.saveFileToUploadsFolder(cid, fileContent, originalName, contentType)
	if err != nil {
		log.Printf("Warning: Could not save file to upload folder: %v", err)
	} else {
		log.Printf("Successfully saved file to upload folder: %s", originalName)
	}

	response := UploadResponse{
		CID:  cid,
		Size: int64(len(fileContent)),
		Path: fmt.Sprintf("/ipfs/%s", cid),
		Gateways: map[string]string{
			"ipfs_io":    fmt.Sprintf("https://ipfs.io/ipfs/%s", cid),
			"pinata":     fmt.Sprintf("https://gateway.pinata.cloud/ipfs/%s", cid),
			"cloudflare": fmt.Sprintf("https://cloudflare-ipfs.com/ipfs/%s", cid),
		},
	}

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Cache-Control", "no-cache")
	json.NewEncoder(w).Encode(response)

	log.Printf("File uploaded successfully: %s (Size: %d bytes)", cid, len(fileContent))
}

func (s *IPFSServer) retrieveHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Get CID from query parameter
	cid := r.URL.Query().Get("cid")
	if cid == "" {
		http.Error(w, "CID parameter is required", http.StatusBadRequest)
		return
	}

	// Check cache first for faster retrieval
	s.cacheMutex.RLock()
	content, found := s.cache[cid]
	s.cacheMutex.RUnlock()

	if !found {
		// Retrieve file from IPFS if not in cache
		reader, err := s.sh.Cat(cid)
		if err != nil {
			http.Error(w, fmt.Sprintf("Error retrieving from IPFS: %v", err), http.StatusInternalServerError)
			return
		}
		defer reader.Close()

		// Read content
		content, err = io.ReadAll(reader)
		if err != nil {
			http.Error(w, "Error reading content", http.StatusInternalServerError)
			return
		}

		// Cache the content for future requests
		s.cacheMutex.Lock()
		s.cache[cid] = content
		s.cacheMutex.Unlock()
	}

	// Get file metadata
	s.metadataMutex.RLock()
	metadata, hasMetadata := s.fileMetadata[cid]
	s.metadataMutex.RUnlock()

	// Detect content type
	contentType := getContentType(content)
	originalName := "retrieved_file"

	if hasMetadata {
		contentType = metadata.ContentType
		originalName = metadata.OriginalName
	}

	// Save file to retrieve folder with original name
	err := s.saveFileToRetrieveFolder(cid, content, originalName, contentType)
	if err != nil {
		log.Printf("Warning: Could not save file to retrieve folder: %v", err)
	}

	// Check if it's a text file (return JSON) or binary file (return raw data)
	if contentType == "text/plain" {
		// Return JSON response for text files
		response := RetrieveResponse{
			Content: string(content),
			CID:     cid,
			Size:    int64(len(content)),
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
		log.Printf("Text file retrieved successfully: %s (Size: %d bytes, Type: %s)", cid, len(content), contentType)
	} else {
		// Return raw binary data for all other files (images, PDFs, documents, etc.)
		w.Header().Set("Content-Type", contentType)
		w.Header().Set("Content-Length", fmt.Sprintf("%d", len(content)))
		w.Header().Set("Cache-Control", "public, max-age=3600")
		w.Header().Set("Content-Disposition", fmt.Sprintf("inline; filename=\"%s\"", originalName))
		w.Write(content)
		log.Printf("File retrieved successfully: %s (Size: %d bytes, Type: %s, Name: %s)", cid, len(content), contentType, originalName)
	}
}

func (s *IPFSServer) listHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Get list of pinned objects
	pins, err := s.sh.Pins()
	if err != nil {
		http.Error(w, fmt.Sprintf("Error getting pins: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(pins)

	log.Printf("Listed %d pinned objects", len(pins))
}

func (s *IPFSServer) healthHandler(w http.ResponseWriter, r *http.Request) {
	// Check if IPFS node is running
	version, _, err := s.sh.Version()
	if err != nil {
		http.Error(w, fmt.Sprintf("IPFS node not available: %v", err), http.StatusServiceUnavailable)
		return
	}

	response := map[string]interface{}{
		"status":  "healthy",
		"version": version,
		"node":    "connected",
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func main() {
	// Create IPFS server
	server := NewIPFSServer()

	// Check if IPFS is running
	_, _, err := server.sh.Version()
	if err != nil {
		log.Fatal("IPFS node is not running. Please start IPFS with: ipfs daemon")
	}

	// Setup routes
	http.HandleFunc("/upload", server.uploadHandler)
	http.HandleFunc("/retrieve", server.retrieveHandler)
	http.HandleFunc("/list", server.listHandler)
	http.HandleFunc("/health", server.healthHandler)

	// API documentation
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/" {
			html := `
<!DOCTYPE html>
<html>
<head>
    <title>IPFS File Storage API</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .endpoint { background: #f5f5f5; padding: 10px; margin: 10px 0; border-radius: 5px; }
        .method { color: #007bff; font-weight: bold; }
        .url { color: #28a745; }
    </style>
</head>
<body>
    <h1>IPFS File Storage API</h1>
    <p>Available endpoints for Postman testing:</p>
    
    <div class="endpoint">
        <span class="method">GET</span> <span class="url">/health</span>
        <p>Check if IPFS node is running</p>
    </div>
    
    <div class="endpoint">
        <span class="method">POST</span> <span class="url">/upload</span>
        <p>Upload a file to IPFS. Use form-data with key "file"</p>
    </div>
    
    <div class="endpoint">
        <span class="method">GET</span> <span class="url">/retrieve?cid=YOUR_CID</span>
        <p>Retrieve a file from IPFS using its CID</p>
    </div>
    
    <div class="endpoint">
        <span class="method">GET</span> <span class="url">/list</span>
        <p>List all pinned objects in IPFS</p>
    </div>
    
    <h2>Postman Setup:</h2>
    <ol>
        <li>Create a new POST request to <code>http://localhost:8080/upload</code></li>
        <li>Go to Body → form-data</li>
        <li>Add key "file" with type "File"</li>
        <li>Select your image file</li>
        <li>Send the request</li>
        <li>Copy the CID from response</li>
        <li>Create a GET request to <code>http://localhost:8080/retrieve?cid=YOUR_CID</code></li>
    </ol>
</body>
</html>
			`
			w.Header().Set("Content-Type", "text/html")
			w.Write([]byte(html))
		}
	})

	// Create optimized HTTP server
	httpServer := &http.Server{
		Addr:           ":8081",
		ReadTimeout:    30 * time.Second,
		WriteTimeout:   30 * time.Second,
		IdleTimeout:    120 * time.Second,
		MaxHeaderBytes: 1 << 20, // 1 MB
	}

	log.Printf("IPFS File Storage API server starting on port %s", httpServer.Addr)
	log.Printf("Make sure IPFS is running: ipfs daemon")
	log.Printf("Visit http://localhost%s for API documentation", httpServer.Addr)
	log.Printf("🚀 Optimized server with caching enabled!")

	if err := httpServer.ListenAndServe(); err != nil {
		log.Fatal("Server failed to start:", err)
	}
}
