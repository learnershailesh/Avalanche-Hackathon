// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

contract TitleNFT is ERC721, ERC721URIStorage, ERC721Enumerable, AccessControl, Pausable, ReentrancyGuard {
    // Roles
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    
    uint256 private _nextId = 1;
    
    // Privacy: Encrypted metadata
    mapping(uint256 => bytes32) private encryptedMetadata;
    mapping(uint256 => string) private docUri;
    mapping(uint256 => address) private propertyOwners;
    mapping(uint256 => uint256) private mintTimestamps;
    
    // Property data
    struct PropertyData {
        string location;
        uint256 value;
        uint256 area;
        string propertyType;
        bool isVerified;
    }
    
    mapping(uint256 => PropertyData) private propertyData;
    
    // Events
    event TitleMinted(uint256 indexed tokenId, address indexed to, string metadataURI);
    event TitleBurned(uint256 indexed tokenId);
    event MetadataUpdated(uint256 indexed tokenId, string newURI);
    event EncryptedMetadataUpdated(uint256 indexed tokenId, bytes32 encryptedData);
    event PropertyDataUpdated(uint256 indexed tokenId, PropertyData data);
    
    // Modifiers
    modifier onlyPropertyOwner(uint256 tokenId) {
        require(ownerOf(tokenId) == msg.sender, "Not property owner");
        _;
    }
    
    constructor(address admin) ERC721("PropertyTitle", "PTITLE") {
        require(admin != address(0), "Invalid admin");
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);
        _grantRole(BURNER_ROLE, admin);
    }
    
    // Mint title with enhanced validation
    function mintTitle(
        address to,
        string calldata metadataURI,
        PropertyData calldata data
    ) external onlyRole(MINTER_ROLE) whenNotPaused returns (uint256) {
        require(to != address(0), "Mint to zero address");
        require(bytes(metadataURI).length > 0, "Invalid metadata URI");
        require(bytes(data.location).length > 0, "Invalid location");
        require(data.value > 0, "Invalid value");
        require(data.area > 0, "Invalid area");
        
        uint256 id = _nextId++;
        _mint(to, id);
        _setTokenURI(id, metadataURI);
        
        docUri[id] = metadataURI;
        propertyOwners[id] = to;
        mintTimestamps[id] = block.timestamp;
        propertyData[id] = data;
        
        emit TitleMinted(id, to, metadataURI);
        emit PropertyDataUpdated(id, data);
        
        return id;
    }
    
    // Burn title with enhanced validation
    function burn(uint256 id) external onlyRole(BURNER_ROLE) whenNotPaused {
        require(_ownerOf(id) != address(0), "Token does not exist");
        
        _burn(id);
        delete docUri[id];
        delete propertyOwners[id];
        delete mintTimestamps[id];
        delete propertyData[id];
        delete encryptedMetadata[id];
        
        emit TitleBurned(id);
    }
    
    // Update metadata URI
    function updateMetadataURI(uint256 tokenId, string calldata newURI) 
        external 
        onlyPropertyOwner(tokenId) 
        whenNotPaused 
    {
        require(bytes(newURI).length > 0, "Invalid URI");
        _setTokenURI(tokenId, newURI);
        docUri[tokenId] = newURI;
        emit MetadataUpdated(tokenId, newURI);
    }
    
    // Privacy: Set encrypted metadata
    function setEncryptedMetadata(uint256 tokenId, bytes32 encryptedData) 
        external 
        onlyPropertyOwner(tokenId) 
    {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        encryptedMetadata[tokenId] = encryptedData;
        emit EncryptedMetadataUpdated(tokenId, encryptedData);
    }
    
    // Get encrypted metadata
    function getEncryptedMetadata(uint256 tokenId) external view returns (bytes32) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return encryptedMetadata[tokenId];
    }
    
    // Update property data
    function updatePropertyData(uint256 tokenId, PropertyData calldata data) 
        external 
        onlyPropertyOwner(tokenId) 
        whenNotPaused 
    {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        require(bytes(data.location).length > 0, "Invalid location");
        require(data.value > 0, "Invalid value");
        require(data.area > 0, "Invalid area");
        
        propertyData[tokenId] = data;
        emit PropertyDataUpdated(tokenId, data);
    }
    
    // Verify property (admin only)
    function verifyProperty(uint256 tokenId) external onlyRole(ADMIN_ROLE) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        propertyData[tokenId].isVerified = true;
        emit PropertyDataUpdated(tokenId, propertyData[tokenId]);
    }
    
    // Emergency functions
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }
    
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
    
    // View functions
    function getPropertyData(uint256 tokenId) external view returns (PropertyData memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return propertyData[tokenId];
    }
    
    function getPropertyOwner(uint256 tokenId) external view returns (address) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return propertyOwners[tokenId];
    }
    
    function getMintTimestamp(uint256 tokenId) external view returns (uint256) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return mintTimestamps[tokenId];
    }
    
    function getDocURI(uint256 tokenId) external view returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return docUri[tokenId];
    }
    
    // Override required functions
    function _increaseBalance(address account, uint128 value) internal override(ERC721, ERC721Enumerable) {
        super._increaseBalance(account, value);
    }
    
    function _update(address to, uint256 tokenId, address auth) internal override(ERC721, ERC721Enumerable) returns (address) {
        return super._update(to, tokenId, auth);
    }
    
    
    function tokenURI(uint256 tokenId) 
        public 
        view 
        override(ERC721, ERC721URIStorage) 
        returns (string memory) 
    {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage, ERC721Enumerable, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
