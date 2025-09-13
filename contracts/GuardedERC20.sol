// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./ComplianceRegistry.sol";

contract GuardedERC20 is ERC20, AccessControl, Pausable, ReentrancyGuard {
    ComplianceRegistry public registry;
    bool public enforceKYC = true;
    
    // Roles
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant COMPLIANCE_ROLE = keccak256("COMPLIANCE_ROLE");
    
    // Privacy: Encrypted metadata
    mapping(address => bytes32) private encryptedMetadata;
    
    // Events
    event RegistryUpdated(address indexed oldRegistry, address indexed newRegistry);
    event KYCEnforcementToggled(bool enabled);
    event MetadataUpdated(address indexed user, bytes32 encryptedData);
    event TokensBurned(address indexed account, uint256 amount);
    
    // Modifiers
    modifier onlyComplianceOrAdmin() {
        require(
            hasRole(COMPLIANCE_ROLE, msg.sender) || hasRole(ADMIN_ROLE, msg.sender),
            "Not compliance or admin"
        );
        _;
    }
    
    constructor(
        string memory name, 
        string memory symbol, 
        address registryAddr,
        address admin
    ) ERC20(name, symbol) {
        require(registryAddr != address(0), "Invalid registry");
        require(admin != address(0), "Invalid admin");
        
        registry = ComplianceRegistry(registryAddr);
        
        // Set up roles
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);
        _grantRole(COMPLIANCE_ROLE, admin);
    }
    
    // Mint with role-based access
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        require(to != address(0), "Mint to zero address");
        require(amount > 0, "Mint amount must be positive");
        _mint(to, amount);
    }
    
    // Burn tokens
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
        emit TokensBurned(msg.sender, amount);
    }
    
    // Burn from specific account (with allowance)
    function burnFrom(address account, uint256 amount) external {
        uint256 currentAllowance = allowance(account, msg.sender);
        require(currentAllowance >= amount, "Burn amount exceeds allowance");
        
        _approve(account, msg.sender, currentAllowance - amount);
        _burn(account, amount);
        emit TokensBurned(account, amount);
    }
    
    // Update registry with proper access control
    function setRegistry(address addr) external onlyRole(ADMIN_ROLE) {
        require(addr != address(0), "Invalid registry address");
        address oldRegistry = address(registry);
        registry = ComplianceRegistry(addr);
        emit RegistryUpdated(oldRegistry, addr);
    }
    
    // Toggle KYC enforcement
    function setEnforceKYC(bool b) external onlyComplianceOrAdmin {
        enforceKYC = b;
        emit KYCEnforcementToggled(b);
    }
    
    // Privacy: Set encrypted metadata
    function setEncryptedMetadata(bytes32 encryptedData) external {
        encryptedMetadata[msg.sender] = encryptedData;
        emit MetadataUpdated(msg.sender, encryptedData);
    }
    
    // Get encrypted metadata
    function getEncryptedMetadata(address user) external view returns (bytes32) {
        return encryptedMetadata[user];
    }
    
    // Override transfer functions with KYC and pause checks
    function transfer(address to, uint256 amount) 
        public 
        override 
        whenNotPaused 
        nonReentrant 
        returns (bool) 
    {
        _checkKYC(to);
        return super.transfer(to, amount);
    }
    
    function transferFrom(address from, address to, uint256 amount) 
        public 
        override 
        whenNotPaused 
        nonReentrant 
        returns (bool) 
    {
        _checkKYC(to);
        return super.transferFrom(from, to, amount);
    }
    
    // Internal KYC check
    function _checkKYC(address to) internal view {
        if (enforceKYC && to != address(0)) {
            require(registry.isKYCed(to), "Recipient not KYCed");
        }
    }
    
    // Emergency functions
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }
    
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
    
    // Override _beforeTokenTransfer to include pause check
    function _beforeTokenTransfer(address from, address to, uint256 amount) 
        internal 
        override 
        whenNotPaused 
    {
        super._beforeTokenTransfer(from, to, amount);
        _checkKYC(to);
    }
}
