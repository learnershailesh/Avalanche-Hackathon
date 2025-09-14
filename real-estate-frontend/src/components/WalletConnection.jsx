import React from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Chip
} from '@mui/material';
import {
  AccountBalanceWallet,
  CheckCircle,
  Error as ErrorIcon,
  Launch
} from '@mui/icons-material';
import { useWallet } from '../contexts/WalletContext';

const WalletConnection = ({ open, onClose }) => {
  const {
    account,
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
    balance,
    isCoreWalletInstalled
  } = useWallet();

  const handleConnect = async () => {
    const success = await connect();
    if (success) {
      onClose();
    }
  };

  const handleDisconnect = () => {
    disconnect();
    onClose();
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const openExplorer = () => {
    if (account) {
      window.open(`https://testnet.snowtrace.io/address/${account}`, '_blank');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <AccountBalanceWallet color="primary" />
          <Typography variant="h6">Core Wallet Connection</Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {!isCoreWalletInstalled ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="body2">
              Core Wallet is not installed. Please install Core Wallet to continue.
            </Typography>
            <Button
              variant="outlined"
              size="small"
              sx={{ mt: 1 }}
              onClick={() => window.open('https://core.app/', '_blank')}
              startIcon={<Launch />}
            >
              Install Core Wallet
            </Button>
          </Alert>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="body2">{error}</Typography>
          </Alert>
        ) : isConnected ? (
          <Box>
            <Alert severity="success" sx={{ mb: 2 }}>
              <Typography variant="body2">
                Successfully connected to Core Wallet
              </Typography>
            </Alert>
            
            <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Connected Account
              </Typography>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Typography variant="body2" fontFamily="monospace">
                  {formatAddress(account)}
                </Typography>
                <Button
                  size="small"
                  startIcon={<Launch />}
                  onClick={openExplorer}
                >
                  View
                </Button>
              </Box>
              
              <Typography variant="subtitle2" gutterBottom>
                Balance
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {balance} AVAX
              </Typography>
            </Box>
          </Box>
        ) : (
          <Box>
            <Typography variant="body1" paragraph>
              Connect your Core Wallet to access the Real Estate Platform
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              You'll be able to manage properties, fractionalize ownership, and claim rental income.
            </Typography>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        {isConnected ? (
          <>
            <Button 
              onClick={handleDisconnect} 
              variant="outlined"
              color="error"
              sx={{
                borderColor: '#ef4444',
                color: '#ef4444',
                fontWeight: 600,
                '&:hover': {
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  borderColor: '#dc2626'
                }
              }}
            >
              Disconnect Wallet
            </Button>
            <Button 
              onClick={onClose}
              variant="contained"
              sx={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)'
                }
              }}
            >
              Close
            </Button>
          </>
        ) : (
          <>
            <Button onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleConnect}
              disabled={!isCoreWalletInstalled || isConnecting}
              variant="contained"
              startIcon={isConnecting ? <CircularProgress size={20} /> : <AccountBalanceWallet />}
              sx={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)'
                }
              }}
            >
              {isConnecting ? 'Connecting...' : 'Connect Core Wallet'}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default WalletConnection;
