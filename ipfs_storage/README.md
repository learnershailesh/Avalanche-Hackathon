# IPFS File Storage API

A dynamic Go-based IPFS server for storing and retrieving files with automatic gateway links. Perfect for Postman testing!

## 🚀 Quick Start Commands

### **Method 1: Manual Commands**
```bash
# 1. Start IPFS daemon (required first)
ipfs daemon &

# 2. Start your Go server
go run main.go &

# 3. Test the system
curl http://localhost:8081/health
```

### **Method 2: Setup Script**
```bash
# One-time setup (installs IPFS if needed)
chmod +x setup.sh
./setup.sh

# Then start the server
go run main.go &
```

### **Method 3: Complete Fresh Start**
```bash
# Start IPFS daemon
ipfs daemon &

# Wait for IPFS to start
sleep 5

# Start Go server
go run main.go &

# Test it works
curl http://localhost:8081/health
```

## 📍 Access Points
- **API Documentation**: http://localhost:8081
- **Server**: http://localhost:8081
- **IPFS WebUI**: http://127.0.0.1:5001/webui

## 📡 API Endpoints

### 1. Health Check
- **Method:** GET
- **URL:** `http://localhost:8081/health`
- **Description:** Check if IPFS node is running

### 2. Upload File
- **Method:** POST
- **URL:** `http://localhost:8081/upload`
- **Body:** form-data
- **Key:** `file` (type: File)
- **Description:** Upload any file to IPFS (images, documents, videos, etc.)

**Response:**
```json
{
  "cid": "QmUCVnrZfFj8UNgcuawUBzP4Gteuf97RtqRymZL3i4XQLp",
  "size": 1607,
  "path": "/ipfs/QmUCVnrZfFj8UNgcuawUBzP4Gteuf97RtqRymZL3i4XQLp",
  "gateways": {
    "ipfs_io": "https://ipfs.io/ipfs/QmUCVnrZfFj8UNgcuawUBzP4Gteuf97RtqRymZL3i4XQLp",
    "pinata": "https://gateway.pinata.cloud/ipfs/QmUCVnrZfFj8UNgcuawUBzP4Gteuf97RtqRymZL3i4XQLp",
    "cloudflare": "https://cloudflare-ipfs.com/ipfs/QmUCVnrZfFj8UNgcuawUBzP4Gteuf97RtqRymZL3i4XQLp"
  }
}
```

**Gateway Links (Ready to Use!):**
- **IPFS.io**: `https://ipfs.io/ipfs/YOUR_CID`
- **Pinata Gateway**: `https://gateway.pinata.cloud/ipfs/YOUR_CID`
- **Cloudflare**: `https://cloudflare-ipfs.com/ipfs/YOUR_CID`

### 3. Retrieve File
- **Method:** GET
- **URL:** `http://localhost:8081/retrieve?cid=YOUR_CID`
- **Description:** Retrieve file content using CID

**Response:**
```json
{
  "content": "file content here",
  "cid": "QmYourFileHash",
  "size": 12345
}
```

### 4. List Files
- **Method:** GET
- **URL:** `http://localhost:8081/list`
- **Description:** List all pinned objects

## 🧪 Dynamic Postman Testing

### Quick Start:

1. **Import Collection:**
   - Import `IPFS-API.postman_collection.json` into Postman
   - The collection is fully dynamic and automated!

2. **Upload Any File:**
   - Use "📤 Upload File (Dynamic)" request
   - Select ANY file (images, documents, videos, etc.)
   - Click `Send`
   - The CID is automatically saved for you!

3. **Retrieve Your File:**
   - Use "📥 Retrieve File (Auto CID)" request
   - Click `Send` - no need to enter CID manually!
   - Your file content will be returned

4. **View Online:**
   - Use "🌐 View File in Browser" request
   - Click `Send` to open your file in IPFS gateway

### Dynamic Features:

- ✅ **Auto CID Extraction**: CID is automatically saved after upload
- ✅ **Environment Variables**: Base URL and file CID are managed automatically
- ✅ **Smart Scripts**: JavaScript automatically handles CID extraction
- ✅ **Multiple Options**: Auto CID or manual CID retrieval
- ✅ **Gateway Links**: Direct links to view files online
- ✅ **Health Monitoring**: Built-in health check

## 🧪 Testing with cURL

### **Complete Test Workflow:**

```bash
# 1. Health Check
curl http://localhost:8081/health

# 2. Upload a file
curl -X POST -F "file=@your-file.jpg" http://localhost:8081/upload

# 3. Retrieve file (replace CID with actual CID from upload response)
curl "http://localhost:8081/retrieve?cid=QmYourFileHash"

# 4. List all files
curl http://localhost:8081/list
```

### **Example Upload Response:**
```json
{
  "cid": "QmUCVnrZfFj8UNgcuawUBzP4Gteuf97RtqRymZL3i4XQLp",
  "size": 1607,
  "path": "/ipfs/QmUCVnrZfFj8UNgcuawUBzP4Gteuf97RtqRymZL3i4XQLp",
  "gateways": {
    "ipfs_io": "https://ipfs.io/ipfs/QmUCVnrZfFj8UNgcuawUBzP4Gteuf97RtqRymZL3i4XQLp",
    "pinata": "https://gateway.pinata.cloud/ipfs/QmUCVnrZfFj8UNgcuawUBzP4Gteuf97RtqRymZL3i4XQLp",
    "cloudflare": "https://cloudflare-ipfs.com/ipfs/QmUCVnrZfFj8UNgcuawUBzP4Gteuf97RtqRymZL3i4XQLp"
  }
}
```

### **Use Gateway Links:**
- Copy any gateway URL from the response
- Paste in browser to view your file online
- Share with anyone - works globally!

## 📱 Postman Testing

### **Import Collection:**
1. Import `IPFS-API.postman_collection.json` into Postman
2. The collection is fully dynamic and automated!

### **Upload Any File:**
- Use "📤 Upload File (Dynamic)" request
- Select ANY file (images, documents, videos, etc.)
- Click `Send`
- The CID is automatically saved for you!

### **Retrieve Your File:**
- Use "📥 Retrieve File (Auto CID)" request
- Click `Send` - no need to enter CID manually!
- Your file content will be returned

### **View Online:**
- Use "🌐 View File in Browser" request
- Click `Send` to open your file in IPFS gateway

### **Dynamic Features:**
- ✅ **Auto CID Extraction**: CID is automatically saved after upload
- ✅ **Environment Variables**: Base URL and file CID are managed automatically
- ✅ **Smart Scripts**: JavaScript automatically handles CID extraction
- ✅ **Multiple Options**: Auto CID or manual CID retrieval
- ✅ **Gateway Links**: Direct links to view files online
- ✅ **Health Monitoring**: Built-in health check

## 🔧 Troubleshooting

### **Common Issues & Solutions:**

#### IPFS Not Running:
```bash
# Start IPFS daemon
ipfs daemon &

# Check if running
curl http://localhost:8081/health
```

#### Port Already in Use:
```bash
# Kill process on port 8081
lsof -ti:8081 | xargs kill -9

# Or kill all Go processes
pkill -f "go run main.go"
```

#### Server Won't Start:
```bash
# Check if IPFS is running first
ipfs daemon &

# Wait for IPFS to start
sleep 5

# Then start Go server
go run main.go &
```

#### Build Errors:
```bash
# Clean and rebuild
go clean
go mod tidy
go build -o ipfs-server main.go
```

#### File Upload Issues:
```bash
# Make sure file exists
ls -la your-file.jpg

# Test with a simple file
echo "test content" > test.txt
curl -X POST -F "file=@test.txt" http://localhost:8081/upload
```

## 🎯 **Quick Commands Summary**

```bash
# Start everything
ipfs daemon & && sleep 5 && go run main.go &

# Test upload
curl -X POST -F "file=@test.txt" http://localhost:8081/upload

# Test retrieve
curl "http://localhost:8081/retrieve?cid=YOUR_CID"

# Health check
curl http://localhost:8081/health
```

## 🚀 **Your POC is Complete!**

You now have a fully functional IPFS file storage system with:
- ✅ Dynamic file upload/retrieval
- ✅ Automatic gateway links (IPFS.io, Pinata, Cloudflare)
- ✅ Postman collection with auto-CID handling
- ✅ cURL testing examples
- ✅ Complete documentation

**Ready to use!** 🎉

## 📁 File Structure

```
filecoin-poc/
├── main.go          # Go server code
├── go.mod           # Go module file
├── setup.sh         # Setup script
├── README.md        # This file
└── files/           # Your test files
    └── myfile.txt
```

## 🌐 IPFS Links

After uploading, you can also access your files via IPFS gateways:
- https://ipfs.io/ipfs/YOUR_CID
- https://gateway.pinata.cloud/ipfs/YOUR_CID
- https://cloudflare-ipfs.com/ipfs/YOUR_CID

## 🎯 Features

- ✅ Upload images to IPFS
- ✅ Retrieve images by CID
- ✅ List all stored files
- ✅ Health check endpoint
- ✅ Web interface for testing
- ✅ JSON API responses
- ✅ Error handling