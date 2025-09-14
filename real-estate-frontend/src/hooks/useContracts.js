import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { CONTRACTS } from '../config/contracts';
import { useWallet } from '../contexts/WalletContext';

// Complete Contract ABIs
const COMPLIANCE_REGISTRY_ABI = [
  // View functions
  "function isKYCed(address user) external view returns (bool)",
  "function isKYCValid(address user) external view returns (bool)",
  "function getKYCInfo(address user) external view returns (bool, uint256, uint256, bool)",
  "function getEncryptedKYCData(address user) external view returns (bytes32)",
  "function commitmentHashes(address user) external view returns (bytes32)",
  // Write functions
  "function setKYC(address user, bool status, uint256 expiryTimestamp, bytes32 encryptedData) external",
  "function batchSetKYC(address[] calldata users, bool status, uint256 expiryTimestamp) external",
  "function setEncryptedKYCData(address user, bytes32 encryptedData) external",
  "function setCommitment(bytes32 commitment) external",
  "function revokeKYC(address user) external",
  "function batchRevokeKYC(address[] calldata users) external",
  // Admin functions
  "function pause() external",
  "function unpause() external",
  // Role management
  "function hasRole(bytes32 role, address account) external view returns (bool)",
  "function grantRole(bytes32 role, address account) external",
  "function revokeRole(bytes32 role, address account) external"
];

const TITLE_NFT_ABI = [
  // View functions
  "function ownerOf(uint256 tokenId) external view returns (address)",
  "function tokenURI(uint256 tokenId) external view returns (string)",
  "function getPropertyData(uint256 tokenId) external view returns (tuple(string location, uint256 value, uint256 area, string propertyType, bool isVerified))",
  "function getPropertyOwner(uint256 tokenId) external view returns (address)",
  "function getMintTimestamp(uint256 tokenId) external view returns (uint256)",
  "function getDocURI(uint256 tokenId) external view returns (string)",
  "function getEncryptedMetadata(uint256 tokenId) external view returns (bytes32)",
  "function balanceOf(address owner) external view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256)",
  "function totalSupply() external view returns (uint256)",
  "function tokenByIndex(uint256 index) external view returns (uint256)",
  // Write functions
  "function mintTitle(address to, string calldata metadataURI, tuple(string location, uint256 value, uint256 area, string propertyType, bool isVerified) data) external returns (uint256)",
  "function burn(uint256 id) external",
  "function updateMetadataURI(uint256 tokenId, string calldata newURI) external",
  "function setEncryptedMetadata(uint256 tokenId, bytes32 encryptedData) external",
  "function updatePropertyData(uint256 tokenId, tuple(string location, uint256 value, uint256 area, string propertyType, bool isVerified) data) external",
  "function verifyProperty(uint256 tokenId) external",
  // Admin functions
  "function pause() external",
  "function unpause() external",
  // Role management
  "function hasRole(bytes32 role, address account) external view returns (bool)",
  "function grantRole(bytes32 role, address account) external",
  "function revokeRole(bytes32 role, address account) external"
];

const GUARDED_ERC20_ABI = [
  // View functions
  "function name() external view returns (string)",
  "function symbol() external view returns (string)",
  "function decimals() external view returns (uint8)",
  "function totalSupply() external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function getEncryptedMetadata(address user) external view returns (bytes32)",
  "function enforceKYC() external view returns (bool)",
  "function registry() external view returns (address)",
  // Write functions
  "function mint(address to, uint256 amount) external",
  "function burn(uint256 amount) external",
  "function burnFrom(address account, uint256 amount) external",
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) external returns (bool)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function setEncryptedMetadata(bytes32 encryptedData) external",
  "function setRegistry(address addr) external",
  "function setEnforceKYC(bool b) external",
  // Admin functions
  "function pause() external",
  "function unpause() external",
  // Role management
  "function hasRole(bytes32 role, address account) external view returns (bool)",
  "function grantRole(bytes32 role, address account) external",
  "function revokeRole(bytes32 role, address account) external"
];

const FRACTIONALIZER_ABI = [
  // View functions
  "function getFractionalizationData(uint256 tokenId) external view returns (tuple(address tokenAddress, uint256 totalSupply, address fractionalizer, uint256 timestamp, bool isActive))",
  "function isPropertyFractionalized(uint256 tokenId) external view returns (bool)",
  "function getPropertyFromToken(address tokenAddress) external view returns (uint256)",
  "function fractionalizationFee() external view returns (uint256)",
  "function feeRecipient() external view returns (address)",
  "function title() external view returns (address)",
  "function registry() external view returns (address)",
  // Write functions
  "function fractionalize(uint256 tokenId, string calldata name, string calldata symbol, uint256 totalSupply) external payable returns (address)",
  "function defractionalize(uint256 tokenId) external",
  "function emergencyDefractionalize(uint256 tokenId) external",
  "function setFractionalizationFee(uint256 newFee) external",
  "function setFeeRecipient(address newRecipient) external",
  "function withdrawFees() external",
  // Admin functions
  "function pause() external",
  "function unpause() external",
  // Role management
  "function hasRole(bytes32 role, address account) external view returns (bool)",
  "function grantRole(bytes32 role, address account) external",
  "function revokeRole(bytes32 role, address account) external"
];

const RENT_POOL_MERKLE_ABI = [
  // View functions
  "function getEpochTotalDeposits(uint256 epochId) external view returns (uint256)",
  "function isClaimed(uint256 epochId, address user) external view returns (bool)",
  "function epochRoot(uint256 epochId) external view returns (bytes32)",
  "function getEncryptedAmount(uint256 epochId, address user) external view returns (bytes32)",
  "function stable() external view returns (address)",
  "function owner() external view returns (address)",
  // Write functions
  "function depositRent(uint256 epochId, uint256 amount) external",
  "function setEpochRoot(uint256 epochId, bytes32 root) external",
  "function claim(uint256 epochId, uint256 amount, bytes32[] calldata proof) external",
  "function setEncryptedAmount(uint256 epochId, bytes32 encryptedAmount) external",
  "function emergencyWithdraw(address token, uint256 amount) external"
];

export const useContracts = () => {
  const { provider, signer, account, isConnected } = useWallet();
  const [contracts, setContracts] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  // Initialize contracts
  useEffect(() => {
    if (provider && signer && isConnected) {
      try {
        const contractInstances = {
          complianceRegistry: new ethers.Contract(
            CONTRACTS.ComplianceRegistry,
            COMPLIANCE_REGISTRY_ABI,
            signer
          ),
          titleNFT: new ethers.Contract(
            CONTRACTS.TitleNFT,
            TITLE_NFT_ABI,
            signer
          ),
          fractionalizer: new ethers.Contract(
            CONTRACTS.Fractionalizer,
            FRACTIONALIZER_ABI,
            signer
          ),
          rentPoolMerkle: new ethers.Contract(
            CONTRACTS.RentPoolMerkle,
            RENT_POOL_MERKLE_ABI,
            signer
          )
        };
        setContracts(contractInstances);
        setError(null);
        setRetryCount(0); // Reset retry count on successful initialization
      } catch (err) {
        console.error('Failed to initialize contracts:', err);
        setError('Failed to initialize contracts');
      }
    }
  }, [provider, signer, isConnected]);

  // ==================== COMPLIANCE REGISTRY FUNCTIONS ====================

  const checkKYC = useCallback(async (userAddress = account) => {
    if (!contracts.complianceRegistry || !userAddress) return false;
    try {
      return await contracts.complianceRegistry.isKYCValid(userAddress);
    } catch (err) {
      console.error('Failed to check KYC:', err);
      return false;
    }
  }, [contracts.complianceRegistry]);

  const getKYCInfo = useCallback(async (userAddress = account) => {
    if (!contracts.complianceRegistry || !userAddress) {
      console.log('getKYCInfo: Missing contracts or userAddress', { 
        hasContract: !!contracts.complianceRegistry, 
        userAddress 
      });
      return null;
    }
    try {
      console.log('getKYCInfo: Calling contract method for', userAddress);
      const [kycStatus, timestamp, expiry, isValid] = await contracts.complianceRegistry.getKYCInfo(userAddress);
      console.log('getKYCInfo: Raw response', { kycStatus, timestamp, expiry, isValid });
      return {
        kycStatus,
        timestamp: timestamp.toNumber(),
        expiry: expiry.toNumber(),
        isValid
      };
    } catch (err) {
      console.error('Failed to get KYC info:', err);
      return null;
    }
  }, [contracts.complianceRegistry]);

  const setKYC = useCallback(async (userAddress, status, expiryTimestamp, encryptedData = ethers.utils.formatBytes32String('')) => {
    if (!contracts.complianceRegistry) throw new Error('Contract not initialized');
    try {
      // Ensure the address is properly formatted and not treated as ENS
      const formattedAddress = ethers.utils.getAddress(userAddress);
      const tx = await contracts.complianceRegistry.setKYC(
        formattedAddress,
        status,
        expiryTimestamp,
        encryptedData
      );
      await tx.wait();
      return tx;
    } catch (err) {
      console.error('Failed to set KYC:', err);
      throw err;
    }
  }, [contracts.complianceRegistry]);

  const batchSetKYC = useCallback(async (users, status, expiryTimestamp) => {
    if (!contracts.complianceRegistry) throw new Error('Contract not initialized');
    try {
      // Ensure all addresses are properly formatted and not treated as ENS
      const formattedUsers = users.map(user => ethers.utils.getAddress(user));
      const tx = await contracts.complianceRegistry.batchSetKYC(formattedUsers, status, expiryTimestamp);
      await tx.wait();
      return tx;
    } catch (err) {
      console.error('Failed to batch set KYC:', err);
      throw err;
    }
  }, [contracts.complianceRegistry]);

  const setEncryptedKYCData = useCallback(async (userAddress, encryptedData) => {
    if (!contracts.complianceRegistry) throw new Error('Contract not initialized');
    try {
      // Ensure the address is properly formatted and not treated as ENS
      const formattedAddress = ethers.utils.getAddress(userAddress);
      const tx = await contracts.complianceRegistry.setEncryptedKYCData(formattedAddress, encryptedData);
      await tx.wait();
      return tx;
    } catch (err) {
      console.error('Failed to set encrypted KYC data:', err);
      throw err;
    }
  }, [contracts.complianceRegistry]);

  const setCommitment = useCallback(async (commitment) => {
    if (!contracts.complianceRegistry) throw new Error('Contract not initialized');
    try {
      const tx = await contracts.complianceRegistry.setCommitment(commitment);
      await tx.wait();
      return tx;
    } catch (err) {
      console.error('Failed to set commitment:', err);
      throw err;
    }
  }, [contracts.complianceRegistry]);

  const revokeKYC = useCallback(async (userAddress) => {
    if (!contracts.complianceRegistry) throw new Error('Contract not initialized');
    try {
      // Ensure the address is properly formatted and not treated as ENS
      const formattedAddress = ethers.utils.getAddress(userAddress);
      const tx = await contracts.complianceRegistry.revokeKYC(formattedAddress);
      await tx.wait();
      return tx;
    } catch (err) {
      console.error('Failed to revoke KYC:', err);
      throw err;
    }
  }, [contracts.complianceRegistry]);

  // ==================== TITLE NFT FUNCTIONS ====================

  const mintProperty = useCallback(async (to, metadataURI, propertyData) => {
    if (!contracts.titleNFT) throw new Error('Contract not initialized');
    try {
      // Ensure the address is properly formatted and not treated as ENS
      const recipientAddress = ethers.utils.getAddress(to);
      const tx = await contracts.titleNFT.mintTitle(recipientAddress, metadataURI, propertyData);
      await tx.wait();
      return tx;
    } catch (err) {
      console.error('Failed to mint property:', err);
      throw err;
    }
  }, [contracts.titleNFT]);

  const getPropertyData = useCallback(async (tokenId) => {
    if (!contracts.titleNFT) return null;
    try {
      const data = await contracts.titleNFT.getPropertyData(tokenId);
      return {
        location: data.location,
        value: data.value.toString(),
        area: data.area.toString(),
        propertyType: data.propertyType,
        isVerified: data.isVerified
      };
    } catch (err) {
      console.error('Failed to get property data:', err);
      return null;
    }
  }, [contracts.titleNFT]);

  const getUserProperties = useCallback(async (userAddress = account) => {
    if (!contracts.titleNFT || !userAddress) return [];
    try {
      // Ensure the address is properly formatted and not treated as ENS
      const formattedAddress = ethers.utils.getAddress(userAddress);
      const balance = await contracts.titleNFT.balanceOf(formattedAddress);
      const properties = [];
      
      for (let i = 0; i < balance.toNumber(); i++) {
        const tokenId = await contracts.titleNFT.tokenOfOwnerByIndex(formattedAddress, i);
        const propertyData = await getPropertyData(tokenId);
        const owner = await contracts.titleNFT.getPropertyOwner(tokenId);
        const mintTimestamp = await contracts.titleNFT.getMintTimestamp(tokenId);
        const docURI = await contracts.titleNFT.getDocURI(tokenId);
        
        properties.push({
          tokenId: tokenId.toString(),
          owner,
          mintTimestamp: mintTimestamp.toNumber(),
          docURI,
          ...propertyData
        });
      }
      
      return properties;
    } catch (err) {
      // Don't log network errors repeatedly
      if (!err.message.includes('underlying network changed') && !err.message.includes('CALL_EXCEPTION')) {
        console.error('Failed to get user properties:', err);
      }
      return [];
    }
  }, [contracts.titleNFT, getPropertyData]);

  const updatePropertyData = useCallback(async (tokenId, propertyData) => {
    if (!contracts.titleNFT) throw new Error('Contract not initialized');
    try {
      const tx = await contracts.titleNFT.updatePropertyData(tokenId, propertyData);
      await tx.wait();
      return tx;
    } catch (err) {
      console.error('Failed to update property data:', err);
      throw err;
    }
  }, [contracts.titleNFT]);

  const setEncryptedMetadata = useCallback(async (tokenId, encryptedData) => {
    if (!contracts.titleNFT) throw new Error('Contract not initialized');
    try {
      const tx = await contracts.titleNFT.setEncryptedMetadata(tokenId, encryptedData);
      await tx.wait();
      return tx;
    } catch (err) {
      console.error('Failed to set encrypted metadata:', err);
      throw err;
    }
  }, [contracts.titleNFT]);

  const verifyProperty = useCallback(async (tokenId) => {
    if (!contracts.titleNFT) throw new Error('Contract not initialized');
    try {
      const tx = await contracts.titleNFT.verifyProperty(tokenId);
      await tx.wait();
      return tx;
    } catch (err) {
      console.error('Failed to verify property:', err);
      throw err;
    }
  }, [contracts.titleNFT]);

  const burnProperty = useCallback(async (tokenId) => {
    if (!contracts.titleNFT) throw new Error('Contract not initialized');
    try {
      const tx = await contracts.titleNFT.burn(tokenId);
      await tx.wait();
      return tx;
    } catch (err) {
      console.error('Failed to burn property:', err);
      throw err;
    }
  }, [contracts.titleNFT]);

  // ==================== FRACTIONALIZATION FUNCTIONS ====================

  const fractionalizeProperty = useCallback(async (tokenId, name, symbol, totalSupply) => {
    if (!contracts.fractionalizer) throw new Error('Contract not initialized');
    try {
      const fee = await contracts.fractionalizer.fractionalizationFee();
      const tx = await contracts.fractionalizer.fractionalize(
        tokenId,
        name,
        symbol,
        totalSupply,
        { value: fee }
      );
      await tx.wait();
      return tx;
    } catch (err) {
      console.error('Failed to fractionalize property:', err);
      throw err;
    }
  }, [contracts.fractionalizer]);

  const defractionalizeProperty = useCallback(async (tokenId) => {
    if (!contracts.fractionalizer) throw new Error('Contract not initialized');
    try {
      const tx = await contracts.fractionalizer.defractionalize(tokenId);
      await tx.wait();
      return tx;
    } catch (err) {
      console.error('Failed to defractionalize property:', err);
      throw err;
    }
  }, [contracts.fractionalizer]);

  const getFractionalizationData = useCallback(async (tokenId) => {
    if (!contracts.fractionalizer) return null;
    try {
      const data = await contracts.fractionalizer.getFractionalizationData(tokenId);
      return {
        tokenAddress: data.tokenAddress,
        totalSupply: data.totalSupply.toString(),
        fractionalizer: data.fractionalizer,
        timestamp: data.timestamp.toNumber(),
        isActive: data.isActive
      };
    } catch (err) {
      console.error('Failed to get fractionalization data:', err);
      return null;
    }
  }, [contracts.fractionalizer]);

  const isPropertyFractionalized = useCallback(async (tokenId) => {
    if (!contracts.fractionalizer) return false;
    try {
      return await contracts.fractionalizer.isPropertyFractionalized(tokenId);
    } catch (err) {
      console.error('Failed to check fractionalization status:', err);
      return false;
    }
  }, [contracts.fractionalizer]);

  const getFractionalizationFee = useCallback(async () => {
    if (!contracts.fractionalizer) return '0';
    try {
      const fee = await contracts.fractionalizer.fractionalizationFee();
      return ethers.utils.formatEther(fee);
    } catch (err) {
      console.error('Failed to get fractionalization fee:', err);
      return '0';
    }
  }, [contracts.fractionalizer]);

  // ==================== RENTAL INCOME FUNCTIONS ====================

  const depositRent = useCallback(async (epochId, amount) => {
    if (!contracts.rentPoolMerkle) throw new Error('Contract not initialized');
    try {
      const tx = await contracts.rentPoolMerkle.depositRent(epochId, amount);
      await tx.wait();
      return tx;
    } catch (err) {
      console.error('Failed to deposit rent:', err);
      throw err;
    }
  }, [contracts.rentPoolMerkle]);

  const claimRentalIncome = useCallback(async (epochId, amount, proof) => {
    if (!contracts.rentPoolMerkle) throw new Error('Contract not initialized');
    try {
      const tx = await contracts.rentPoolMerkle.claim(epochId, amount, proof);
      await tx.wait();
      return tx;
    } catch (err) {
      console.error('Failed to claim rental income:', err);
      throw err;
    }
  }, [contracts.rentPoolMerkle]);

  const isClaimed = useCallback(async (epochId, userAddress = account) => {
    if (!contracts.rentPoolMerkle || !userAddress) return false;
    try {
      // Ensure the address is properly formatted and not treated as ENS
      const formattedAddress = ethers.utils.getAddress(userAddress);
      return await contracts.rentPoolMerkle.isClaimed(epochId, formattedAddress);
    } catch (err) {
      // Don't log network errors repeatedly
      if (!err.message.includes('underlying network changed') && !err.message.includes('CALL_EXCEPTION')) {
        console.error('Failed to check claim status:', err);
      }
      return false;
    }
  }, [contracts.rentPoolMerkle]);

  const getEpochTotalDeposits = useCallback(async (epochId) => {
    if (!contracts.rentPoolMerkle || retryCount > 5) return '0';
    try {
      const deposits = await contracts.rentPoolMerkle.getEpochTotalDeposits(epochId);
      setRetryCount(0); // Reset on success
      return ethers.utils.formatEther(deposits);
    } catch (err) {
      // Don't log network errors repeatedly
      if (!err.message.includes('underlying network changed') && !err.message.includes('CALL_EXCEPTION')) {
        console.error('Failed to get epoch deposits:', err);
      }
      setRetryCount(prev => prev + 1);
      return '0';
    }
  }, [contracts.rentPoolMerkle, retryCount]);

  const setEncryptedAmount = useCallback(async (epochId, encryptedAmount) => {
    if (!contracts.rentPoolMerkle) throw new Error('Contract not initialized');
    try {
      const tx = await contracts.rentPoolMerkle.setEncryptedAmount(epochId, encryptedAmount);
      await tx.wait();
      return tx;
    } catch (err) {
      console.error('Failed to set encrypted amount:', err);
      throw err;
    }
  }, [contracts.rentPoolMerkle]);

  // ==================== ROLE MANAGEMENT FUNCTIONS ====================

  const hasRole = useCallback(async (contractName, role, address) => {
    const contract = contracts[contractName];
    if (!contract) return false;
    try {
      // RentPoolMerkle doesn't have hasRole, it uses Ownable
      if (contractName === 'rentPoolMerkle') {
        const owner = await contract.owner();
        return owner.toLowerCase() === address.toLowerCase();
      }
      return await contract.hasRole(role, address);
    } catch (err) {
      console.error(`Failed to check role for ${contractName}:`, err);
      return false;
    }
  }, [contracts]);

  const grantRole = useCallback(async (contractName, role, address) => {
    const contract = contracts[contractName];
    if (!contract) throw new Error('Contract not initialized');
    try {
      // Ensure the address is properly formatted and not treated as ENS
      const formattedAddress = ethers.utils.getAddress(address);
      const tx = await contract.grantRole(role, formattedAddress);
      await tx.wait();
      return tx;
    } catch (err) {
      console.error(`Failed to grant role for ${contractName}:`, err);
      throw err;
    }
  }, [contracts]);

  const revokeRole = useCallback(async (contractName, role, address) => {
    const contract = contracts[contractName];
    if (!contract) throw new Error('Contract not initialized');
    try {
      // Ensure the address is properly formatted and not treated as ENS
      const formattedAddress = ethers.utils.getAddress(address);
      const tx = await contract.revokeRole(role, formattedAddress);
      await tx.wait();
      return tx;
    } catch (err) {
      console.error(`Failed to revoke role for ${contractName}:`, err);
      throw err;
    }
  }, [contracts]);

  // ==================== EMERGENCY FUNCTIONS ====================

  const pauseContract = useCallback(async (contractName) => {
    const contract = contracts[contractName];
    if (!contract) throw new Error('Contract not initialized');
    try {
      const tx = await contract.pause();
      await tx.wait();
      return tx;
    } catch (err) {
      console.error(`Failed to pause ${contractName}:`, err);
      throw err;
    }
  }, [contracts]);

  const unpauseContract = useCallback(async (contractName) => {
    const contract = contracts[contractName];
    if (!contract) throw new Error('Contract not initialized');
    try {
      const tx = await contract.unpause();
      await tx.wait();
      return tx;
    } catch (err) {
      console.error(`Failed to unpause ${contractName}:`, err);
      throw err;
    }
  }, [contracts]);

  return {
    contracts,
    loading,
    error,
    
    // Compliance Registry
    checkKYC,
    getKYCInfo,
    setKYC,
    batchSetKYC,
    setEncryptedKYCData,
    setCommitment,
    revokeKYC,
    
    // Title NFT
    mintProperty,
    getPropertyData,
    getUserProperties,
    updatePropertyData,
    setEncryptedMetadata,
    verifyProperty,
    burnProperty,
    
    // Fractionalization
    fractionalizeProperty,
    defractionalizeProperty,
    getFractionalizationData,
    isPropertyFractionalized,
    getFractionalizationFee,
    
    // Rental Income
    depositRent,
    claimRentalIncome,
    isClaimed,
    getEpochTotalDeposits,
    setEncryptedAmount,
    
    // Role Management
    hasRole,
    grantRole,
    revokeRole,
    
    // Emergency Functions
    pauseContract,
    unpauseContract
  };
};