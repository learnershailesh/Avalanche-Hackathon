import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { AVALANCHE_NETWORKS, CURRENT_NETWORK } from '../config/contracts';

export const useCoreWallet = () => {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [chainId, setChainId] = useState(null);

  // Check if Core Wallet is installed
  const isCoreWalletInstalled = () => {
    return typeof window !== 'undefined' && window.ethereum && window.ethereum.isAvalanche;
  };

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
      return true;

    } catch (err) {
      console.error('Failed to connect to Core Wallet:', err);
      setError(err.message || 'Failed to connect to Core Wallet');
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, []);

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
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setIsConnected(false);
    setError(null);
    setChainId(null);
  }, []);

  // Get account balance
  const getBalance = useCallback(async () => {
    if (!provider || !account) return '0';
    
    try {
      const balance = await provider.getBalance(account);
      return ethers.utils.formatEther(balance);
    } catch (err) {
      console.error('Failed to get balance:', err);
      return '0';
    }
  }, [provider, account]);

  // Listen for account changes
  useEffect(() => {
    if (!isCoreWalletInstalled()) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        disconnect();
      } else if (accounts[0] !== account) {
        setAccount(accounts[0]);
      }
    };

    const handleChainChanged = (chainId) => {
      setChainId(parseInt(chainId, 16));
      // Optionally reconnect or show network change message
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [account, disconnect]);

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
            setIsConnected(true);
          }
        } catch (err) {
          console.error('Failed to check connection:', err);
        }
      }
    };

    checkConnection();
  }, []);

  return {
    account,
    provider,
    signer,
    isConnected,
    isConnecting,
    error,
    chainId,
    connect,
    disconnect,
    getBalance,
    isCoreWalletInstalled: isCoreWalletInstalled()
  };
};
