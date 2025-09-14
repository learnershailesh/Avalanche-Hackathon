import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { AVALANCHE_NETWORKS, CURRENT_NETWORK } from '../config/contracts';

const WalletContext = createContext();

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

export const WalletProvider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [balance, setBalance] = useState('0');

  // Check if Core Wallet is installed
  const isCoreWalletInstalled = () => {
    return typeof window !== 'undefined' && window.ethereum && window.ethereum.isAvalanche;
  };

  // Update balance
  const updateBalance = useCallback(async () => {
    if (!provider || !account) {
      setBalance('0');
      return;
    }
    
    try {
      const balance = await provider.getBalance(account);
      setBalance(ethers.utils.formatEther(balance));
    } catch (err) {
      console.error('Failed to get balance:', err);
      setBalance('0');
    }
  }, [provider, account]);

  // Connect to Core Wallet
  const connect = useCallback(async () => {
    if (!isCoreWalletInstalled()) {
      setError('Core Wallet is not installed. Please install Core Wallet to continue.');
      return false;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const account = accounts[0];
      setAccount(account);

      // Create provider and signer
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      
      setProvider(provider);
      setSigner(signer);

      // Check if we're on the correct network
      const network = await provider.getNetwork();
      setChainId(network.chainId);

      if (network.chainId !== parseInt(CURRENT_NETWORK.chainId, 16)) {
        await switchToAvalancheNetwork();
      }

      setIsConnected(true);
      await updateBalance();
      return true;

    } catch (err) {
      console.error('Failed to connect to Core Wallet:', err);
      setError(err.message || 'Failed to connect to Core Wallet');
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, [updateBalance]);

  // Switch to Avalanche network
  const switchToAvalancheNetwork = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: CURRENT_NETWORK.chainId }],
      });
    } catch (switchError) {
      // If the network doesn't exist, add it
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [CURRENT_NETWORK],
          });
        } catch (addError) {
          throw new Error('Failed to add Avalanche network');
        }
      } else {
        throw switchError;
      }
    }
  };

  // Disconnect wallet
  const disconnect = useCallback(() => {
    console.log('Disconnecting wallet...');
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setIsConnected(false);
    setError(null);
    setChainId(null);
    setBalance('0');
    console.log('Wallet disconnected successfully');
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (!isCoreWalletInstalled()) return;

    const handleAccountsChanged = async (accounts) => {
      if (accounts.length === 0) {
        disconnect();
      } else if (accounts[0] !== account) {
        setAccount(accounts[0]);
        // Update provider and signer for new account
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        setProvider(provider);
        setSigner(signer);
        await updateBalance();
      }
    };

    const handleChainChanged = async (chainId) => {
      const newChainId = parseInt(chainId, 16);
      setChainId(newChainId);
      
      // Check if we're on the correct network
      if (newChainId !== parseInt(CURRENT_NETWORK.chainId, 16)) {
        console.warn(`Wrong network detected: ${newChainId}. Expected: ${parseInt(CURRENT_NETWORK.chainId, 16)}`);
        setError(`Please switch to Avalanche Testnet (Chain ID: ${parseInt(CURRENT_NETWORK.chainId, 16)})`);
        return;
      }
      
      // Update provider and signer for new chain
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      setProvider(provider);
      setSigner(signer);
      setError(null); // Clear any previous network errors
      await updateBalance();
    };

    // Remove existing listeners first to prevent memory leaks
    if (window.ethereum) {
      window.ethereum.removeAllListeners('accountsChanged');
      window.ethereum.removeAllListeners('chainChanged');
      
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
      }
    };
  }, []); // Empty dependency array to prevent re-adding listeners

  // Check if already connected on mount
  useEffect(() => {
    const checkConnection = async () => {
      if (isCoreWalletInstalled()) {
        try {
          const accounts = await window.ethereum.request({
            method: 'eth_accounts'
          });
          
          if (accounts.length > 0) {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            const network = await provider.getNetwork();
            
            setAccount(accounts[0]);
            setProvider(provider);
            setSigner(signer);
            setChainId(network.chainId);
            
            // Check if we're on the correct network
            if (network.chainId !== parseInt(CURRENT_NETWORK.chainId, 16)) {
              console.warn(`Wrong network detected: ${network.chainId}. Expected: ${parseInt(CURRENT_NETWORK.chainId, 16)}`);
              setError(`Please switch to Avalanche Testnet (Chain ID: ${parseInt(CURRENT_NETWORK.chainId, 16)})`);
              setIsConnected(false);
              return;
            }
            
            setIsConnected(true);
            setError(null);
            await updateBalance();
          }
        } catch (err) {
          console.error('Failed to check connection:', err);
        }
      }
    };

    checkConnection();
  }, [updateBalance]);

  // Update balance when account or provider changes
  useEffect(() => {
    updateBalance();
  }, [updateBalance]);

  const value = {
    account,
    provider,
    signer,
    isConnected,
    isConnecting,
    error,
    chainId,
    balance,
    connect,
    disconnect,
    updateBalance,
    isCoreWalletInstalled: isCoreWalletInstalled()
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};
