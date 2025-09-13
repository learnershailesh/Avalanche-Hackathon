// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract ComplianceRegistry is AccessControl, Pausable {
    using ECDSA for bytes32;
    
    // Roles
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant COMPLIANCE_OFFICER_ROLE = keccak256("COMPLIANCE_OFFICER_ROLE");
    bytes32 public constant AUDITOR_ROLE = keccak256("AUDITOR_ROLE");
    
    // Privacy: Encrypted KYC data
    mapping(address => bytes32) private encryptedKYCData;
    mapping(address => bool) public isKYCed;
    mapping(address => uint256) public kycTimestamp;
    mapping(address => uint256) public kycExpiry;
    
    // Privacy: Zero-knowledge proof support
    mapping(address => bytes32) public commitmentHashes;
    
    // Events
    event KYCSet(address indexed user, bool status, uint256 timestamp, uint256 expiry);
    event KYCDataUpdated(address indexed user, bytes32 encryptedData);
    event CommitmentSet(address indexed user, bytes32 commitment);
    event BatchKYCUpdated(uint256 count, bool status);
    
    // Modifiers
    modifier onlyComplianceOrAdmin() {
        require(
            hasRole(COMPLIANCE_OFFICER_ROLE, msg.sender) || hasRole(ADMIN_ROLE, msg.sender),
            "Not compliance officer or admin"
        );
        _;
    }
    
    constructor(address admin) {
        require(admin != address(0), "Invalid admin");
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
        _grantRole(COMPLIANCE_OFFICER_ROLE, admin);
    }
    
    // Set KYC with expiry
    function setKYC(
        address user, 
        bool status, 
        uint256 expiryTimestamp,
        bytes32 encryptedData
    ) external onlyComplianceOrAdmin whenNotPaused {
        require(user != address(0), "Invalid user");
        require(expiryTimestamp > block.timestamp, "Invalid expiry");
        
        isKYCed[user] = status;
        kycTimestamp[user] = block.timestamp;
        kycExpiry[user] = expiryTimestamp;
        
        if (encryptedData != bytes32(0)) {
            encryptedKYCData[user] = encryptedData;
            emit KYCDataUpdated(user, encryptedData);
        }
        
        emit KYCSet(user, status, block.timestamp, expiryTimestamp);
    }
    
    // Batch KYC update with gas optimization
    function batchSetKYC(
        address[] calldata users, 
        bool status, 
        uint256 expiryTimestamp
    ) external onlyComplianceOrAdmin whenNotPaused {
        require(users.length > 0, "Empty array");
        require(users.length <= 100, "Too many users"); // Gas limit protection
        require(expiryTimestamp > block.timestamp, "Invalid expiry");
        
        for (uint256 i = 0; i < users.length; i++) {
            address user = users[i];
            require(user != address(0), "Invalid user");
            
            isKYCed[user] = status;
            kycTimestamp[user] = block.timestamp;
            kycExpiry[user] = expiryTimestamp;
            
            emit KYCSet(user, status, block.timestamp, expiryTimestamp);
        }
        
        emit BatchKYCUpdated(users.length, status);
    }
    
    // Privacy: Set encrypted KYC data
    function setEncryptedKYCData(address user, bytes32 encryptedData) 
        external 
        onlyComplianceOrAdmin 
    {
        require(user != address(0), "Invalid user");
        encryptedKYCData[user] = encryptedData;
        emit KYCDataUpdated(user, encryptedData);
    }
    
    // Get encrypted KYC data
    function getEncryptedKYCData(address user) external view returns (bytes32) {
        return encryptedKYCData[user];
    }
    
    // Privacy: Set commitment for zero-knowledge proofs
    function setCommitment(bytes32 commitment) external {
        commitmentHashes[msg.sender] = commitment;
        emit CommitmentSet(msg.sender, commitment);
    }
    
    // Check if KYC is valid (not expired)
    function isKYCValid(address user) external view returns (bool) {
        return isKYCed[user] && kycExpiry[user] > block.timestamp;
    }
    
    // Get KYC info
    function getKYCInfo(address user) external view returns (
        bool kycStatus,
        uint256 timestamp,
        uint256 expiry,
        bool isValid
    ) {
        kycStatus = isKYCed[user];
        timestamp = kycTimestamp[user];
        expiry = kycExpiry[user];
        isValid = kycStatus && expiry > block.timestamp;
    }
    
    // Emergency functions
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }
    
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
    
    // Revoke KYC
    function revokeKYC(address user) external onlyComplianceOrAdmin {
        require(user != address(0), "Invalid user");
        isKYCed[user] = false;
        kycExpiry[user] = 0;
        emit KYCSet(user, false, block.timestamp, 0);
    }
    
    // Batch revoke KYC
    function batchRevokeKYC(address[] calldata users) external onlyComplianceOrAdmin {
        require(users.length > 0, "Empty array");
        require(users.length <= 50, "Too many users");
        
        for (uint256 i = 0; i < users.length; i++) {
            address user = users[i];
            require(user != address(0), "Invalid user");
            isKYCed[user] = false;
            kycExpiry[user] = 0;
            emit KYCSet(user, false, block.timestamp, 0);
        }
        
        emit BatchKYCUpdated(users.length, false);
    }
}
