// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract RentPoolMerkle is Ownable, ReentrancyGuard, Pausable {
    IERC20 public stable;
    mapping(uint256 => bytes32) public epochRoot;
    mapping(uint256 => mapping(address => bool)) public claimed;
    mapping(uint256 => uint256) public epochTotalDeposits;
    
    // Privacy: Encrypted claim amounts for privacy
    mapping(uint256 => mapping(address => bytes32)) private encryptedAmounts;
    
    // Events
    event Deposit(uint256 indexed epochId, uint256 amount, address indexed depositor);
    event EpochRootSet(uint256 indexed epochId, bytes32 root);
    event Claimed(uint256 indexed epochId, address indexed user, uint256 amount);
    event EmergencyWithdraw(address indexed token, uint256 amount);
    
    // Modifiers
    modifier validEpoch(uint256 epochId) {
        require(epochId > 0, "Invalid epoch");
        _;
    }
    
    constructor(address stableAddr) {
        require(stableAddr != address(0), "Invalid stable address");
        stable = IERC20(stableAddr);
    }
    
    // Deposit rent with validation
    function depositRent(uint256 epochId, uint256 amount) 
        external 
        validEpoch(epochId)
        whenNotPaused 
    {
        require(amount > 0, "Zero amount");
        require(stable.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        
        epochTotalDeposits[epochId] += amount;
        emit Deposit(epochId, amount, msg.sender);
    }
    
    // Set epoch root with validation
    function setEpochRoot(uint256 epochId, bytes32 root) 
        external 
        onlyOwner 
        validEpoch(epochId) 
    {
        require(root != bytes32(0), "Invalid root");
        epochRoot[epochId] = root;
        emit EpochRootSet(epochId, root);
    }
    
    // Fixed reentrancy vulnerability
    function claim(uint256 epochId, uint256 amount, bytes32[] calldata proof) 
        external 
        nonReentrant
        validEpoch(epochId)
        whenNotPaused 
    {
        require(!claimed[epochId][msg.sender], "Already claimed");
        require(amount > 0, "Zero amount");
        
        bytes32 root = epochRoot[epochId];
        require(root != bytes32(0), "Root not set");
        
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender, amount));
        require(MerkleProof.verify(proof, root, leaf), "Invalid proof");
        
        // State update BEFORE external call (CEI pattern)
        claimed[epochId][msg.sender] = true;
        
        // External call after state update
        require(stable.transfer(msg.sender, amount), "Transfer failed");
        emit Claimed(epochId, msg.sender, amount);
    }
    
    // Privacy: Store encrypted claim amount
    function setEncryptedAmount(uint256 epochId, bytes32 encryptedAmount) external {
        encryptedAmounts[epochId][msg.sender] = encryptedAmount;
    }
    
    // Get encrypted amount for privacy
    function getEncryptedAmount(uint256 epochId, address user) external view returns (bytes32) {
        return encryptedAmounts[epochId][user];
    }
    
    // Emergency functions
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        IERC20(token).transfer(owner(), amount);
        emit EmergencyWithdraw(token, amount);
    }
    
    // View functions
    function getEpochTotalDeposits(uint256 epochId) external view returns (uint256) {
        return epochTotalDeposits[epochId];
    }
    
    function isClaimed(uint256 epochId, address user) external view returns (bool) {
        return claimed[epochId][user];
    }
}
