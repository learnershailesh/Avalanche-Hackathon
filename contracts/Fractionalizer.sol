// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "./TitleNFT.sol";
import "./GuardedERC20.sol";
import "./ComplianceRegistry.sol";

contract Fractionalizer is AccessControl, Pausable, ReentrancyGuard {
    TitleNFT public title;
    ComplianceRegistry public registry;
    
    // Roles
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant FRACTIONALIZER_ROLE = keccak256("FRACTIONALIZER_ROLE");
    
    // Fractionalization data
    struct FractionalizationData {
        address tokenAddress;
        uint256 totalSupply;
        address fractionalizer;
        uint256 timestamp;
        bool isActive;
    }
    
    mapping(uint256 => FractionalizationData) public fractionalizations;
    mapping(address => uint256) public tokenToProperty;
    mapping(address => bool) public isFractionalizedToken;
    
    // Fees
    uint256 public fractionalizationFee = 0.01 ether; // 0.01 AVAX
    address public feeRecipient;
    
    // Events
    event Fractionalized(
        uint256 indexed tokenId, 
        address indexed tokenAddress, 
        uint256 totalSupply,
        address indexed fractionalizer
    );
    event Defractionalized(uint256 indexed tokenId, address indexed tokenAddress);
    event FeeUpdated(uint256 oldFee, uint256 newFee);
    event FeeRecipientUpdated(address oldRecipient, address newRecipient);
    
    // Modifiers
    modifier onlyPropertyOwner(uint256 tokenId) {
        require(title.ownerOf(tokenId) == msg.sender, "Not property owner");
        _;
    }
    
    modifier validFractionalization(uint256 tokenId) {
        require(title.ownerOf(tokenId) != address(0), "Property does not exist");
        require(!fractionalizations[tokenId].isActive, "Already fractionalized");
        _;
    }
    
    constructor(
        address titleAddr, 
        address registryAddr,
        address admin
    ) {
        require(titleAddr != address(0), "Invalid title address");
        require(registryAddr != address(0), "Invalid registry address");
        require(admin != address(0), "Invalid admin");
        
        title = TitleNFT(titleAddr);
        registry = ComplianceRegistry(registryAddr);
        feeRecipient = admin;
        
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
        _grantRole(FRACTIONALIZER_ROLE, admin);
    }
    
    // Fractionalize property with enhanced validation
    function fractionalize(
        uint256 tokenId,
        string calldata name,
        string calldata symbol,
        uint256 totalSupply,
        address propertyOwner
    ) external 
        payable 
        nonReentrant 
        whenNotPaused 
        validFractionalization(tokenId)
        returns (address) 
    {
        require(bytes(name).length > 0, "Invalid name");
        require(bytes(symbol).length > 0, "Invalid symbol");
        require(totalSupply > 0, "Invalid total supply");
        require(propertyOwner != address(0), "Invalid property owner");
        require(msg.value >= fractionalizationFee, "Insufficient fee");
        
        // Transfer NFT to this contract
        title.transferFrom(propertyOwner, address(this), tokenId);
        
        // Deploy token with enhanced features
        GuardedERC20 token = new GuardedERC20(
            name, 
            symbol, 
            address(registry),
            propertyOwner
        );
        
        // Mint tokens to property owner
        token.mint(propertyOwner, totalSupply);
        
        // Store fractionalization data
        fractionalizations[tokenId] = FractionalizationData({
            tokenAddress: address(token),
            totalSupply: totalSupply,
            fractionalizer: propertyOwner,
            timestamp: block.timestamp,
            isActive: true
        });
        
        tokenToProperty[address(token)] = tokenId;
        isFractionalizedToken[address(token)] = true;
        
        // Transfer fee to recipient
        if (msg.value > 0) {
            payable(feeRecipient).transfer(msg.value);
        }
        
        emit Fractionalized(tokenId, address(token), totalSupply, propertyOwner);
        return address(token);
    }
    
    // Defractionalize property (burn all tokens to redeem NFT)
    function defractionalize(uint256 tokenId) external nonReentrant whenNotPaused {
        FractionalizationData storage data = fractionalizations[tokenId];
        require(data.isActive, "Not fractionalized");
        require(data.fractionalizer == msg.sender, "Not fractionalizer");
        
        GuardedERC20 token = GuardedERC20(data.tokenAddress);
        
        // Check if caller owns all tokens
        require(token.balanceOf(msg.sender) == data.totalSupply, "Not all tokens owned");
        
        // Burn all tokens
        token.burn(data.totalSupply);
        
        // Transfer NFT back to fractionalizer
        title.transferFrom(address(this), msg.sender, tokenId);
        
        // Update state
        data.isActive = false;
        isFractionalizedToken[data.tokenAddress] = false;
        delete tokenToProperty[data.tokenAddress];
        
        emit Defractionalized(tokenId, data.tokenAddress);
    }
    
    // Emergency defractionalize (admin only)
    function emergencyDefractionalize(uint256 tokenId) external onlyRole(ADMIN_ROLE) {
        FractionalizationData storage data = fractionalizations[tokenId];
        require(data.isActive, "Not fractionalized");
        
        // Transfer NFT to admin
        title.transferFrom(address(this), msg.sender, tokenId);
        
        // Update state
        data.isActive = false;
        isFractionalizedToken[data.tokenAddress] = false;
        delete tokenToProperty[data.tokenAddress];
        
        emit Defractionalized(tokenId, data.tokenAddress);
    }
    
    // Update fractionalization fee
    function setFractionalizationFee(uint256 newFee) external onlyRole(ADMIN_ROLE) {
        uint256 oldFee = fractionalizationFee;
        fractionalizationFee = newFee;
        emit FeeUpdated(oldFee, newFee);
    }
    
    // Update fee recipient
    function setFeeRecipient(address newRecipient) external onlyRole(ADMIN_ROLE) {
        require(newRecipient != address(0), "Invalid recipient");
        address oldRecipient = feeRecipient;
        feeRecipient = newRecipient;
        emit FeeRecipientUpdated(oldRecipient, newRecipient);
    }
    
    // Emergency functions
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }
    
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
    
    // View functions
    function getFractionalizationData(uint256 tokenId) external view returns (FractionalizationData memory) {
        return fractionalizations[tokenId];
    }
    
    function isPropertyFractionalized(uint256 tokenId) external view returns (bool) {
        return fractionalizations[tokenId].isActive;
    }
    
    function getPropertyFromToken(address tokenAddress) external view returns (uint256) {
        return tokenToProperty[tokenAddress];
    }
    
    // Withdraw fees
    function withdrawFees() external onlyRole(ADMIN_ROLE) {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        payable(feeRecipient).transfer(balance);
    }
}
