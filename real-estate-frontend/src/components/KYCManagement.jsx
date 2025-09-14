import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Chip,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  VerifiedUser,
  PersonAdd,
  Block,
  Security,
  Refresh,
  AdminPanelSettings,
  GroupAdd
} from '@mui/icons-material';
import { ethers } from 'ethers';
import { useWallet } from '../contexts/WalletContext';
import { useContracts } from '../hooks/useContracts';

const KYCManagement = () => {
  const { account, isConnected } = useWallet();
  const {
    checkKYC,
    getKYCInfo,
    setKYC,
    batchSetKYC,
    setEncryptedKYCData,
    setCommitment,
    revokeKYC,
    hasRole,
    loading: contractsLoading
  } = useContracts();

  const [kycInfo, setKycInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isComplianceOfficer, setIsComplianceOfficer] = useState(false);
  const loadingRef = useRef(false);
  const lastLoadTimeRef = useRef(0);

  // KYC submission form
  const [kycForm, setKycForm] = useState({
    userAddress: '',
    status: true,
    expiryDays: 365,
    encryptedData: ''
  });

  // Batch KYC form
  const [batchForm, setBatchForm] = useState({
    userAddresses: '',
    status: true,
    expiryDays: 365
  });

  // Commitment form
  const [commitmentForm, setCommitmentForm] = useState({
    commitment: ''
  });

  // Dialog states
  const [kycDialogOpen, setKycDialogOpen] = useState(false);
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [commitmentDialogOpen, setCommitmentDialogOpen] = useState(false);

  // Check user roles
  useEffect(() => {
    const checkRoles = async () => {
      if (account) {
        try {
          const adminRole = await hasRole('complianceRegistry', '0x0000000000000000000000000000000000000000000000000000000000000000', account);
          const complianceRole = await hasRole('complianceRegistry', ethers.utils.keccak256(ethers.utils.toUtf8Bytes('COMPLIANCE_OFFICER_ROLE')), account);
          setIsAdmin(adminRole);
          setIsComplianceOfficer(complianceRole);
        } catch (err) {
          console.error('Failed to check roles:', err);
        }
      }
    };
    checkRoles();
  }, [account, hasRole]);

  // Load KYC info
  useEffect(() => {
    const loadKYCInfo = async () => {
      // Prevent multiple simultaneous calls
      if (loadingRef.current) return;
      
      // Prevent rapid successive calls (minimum 2 seconds between calls)
      const now = Date.now();
      if (now - lastLoadTimeRef.current < 2000) return;
      
      if (account && isConnected && !contractsLoading) {
        loadingRef.current = true;
        lastLoadTimeRef.current = now;
        setLoading(true);
        setError(null);
        try {
          console.log('Loading KYC info for account:', account);
          
          // Add timeout to prevent infinite loading
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout')), 10000)
          );
          
          const infoPromise = getKYCInfo();
          const info = await Promise.race([infoPromise, timeoutPromise]);
          
          console.log('KYC info received:', info);
          setKycInfo(info);
        } catch (err) {
          console.error('Failed to load KYC information:', err);
          setError('Failed to load KYC information: ' + err.message);
          // Set default KYC info if loading fails
          setKycInfo({
            kycStatus: false,
            timestamp: 0,
            expiry: 0,
            isValid: false
          });
        } finally {
          setLoading(false);
          loadingRef.current = false;
        }
      } else if (!account || !isConnected) {
        setLoading(false);
        setKycInfo(null);
        loadingRef.current = false;
      }
    };
    
    // Only run if we have the required dependencies
    if (account && isConnected && !contractsLoading) {
      loadKYCInfo();
    } else if (!account || !isConnected) {
      setLoading(false);
      setKycInfo(null);
      loadingRef.current = false;
    }
    
    // Cleanup function
    return () => {
      loadingRef.current = false;
    };
  }, [account, isConnected, contractsLoading]);

  const handleSetKYC = async () => {
    if (!kycForm.userAddress) {
      setError('Please enter user address');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const expiryTimestamp = Math.floor(Date.now() / 1000) + (kycForm.expiryDays * 24 * 60 * 60);
      const encryptedData = kycForm.encryptedData ? ethers.utils.formatBytes32String(kycForm.encryptedData) : ethers.utils.formatBytes32String('');
      
      await setKYC(kycForm.userAddress, kycForm.status, expiryTimestamp, encryptedData);
      setSuccess('KYC status updated successfully');
      setKycDialogOpen(false);
      setKycForm({ userAddress: '', status: true, expiryDays: 365, encryptedData: '' });
    } catch (err) {
      setError(err.message || 'Failed to set KYC');
    } finally {
      setLoading(false);
    }
  };

  const handleBatchSetKYC = async () => {
    if (!batchForm.userAddresses) {
      setError('Please enter user addresses');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const addresses = batchForm.userAddresses.split(',').map(addr => addr.trim()).filter(addr => addr);
      const expiryTimestamp = Math.floor(Date.now() / 1000) + (batchForm.expiryDays * 24 * 60 * 60);
      
      await batchSetKYC(addresses, batchForm.status, expiryTimestamp);
      setSuccess(`KYC status updated for ${addresses.length} users`);
      setBatchDialogOpen(false);
      setBatchForm({ userAddresses: '', status: true, expiryDays: 365 });
    } catch (err) {
      setError(err.message || 'Failed to batch set KYC');
    } finally {
      setLoading(false);
    }
  };

  const handleSetCommitment = async () => {
    if (!commitmentForm.commitment) {
      setError('Please enter commitment');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const commitment = ethers.utils.formatBytes32String(commitmentForm.commitment);
      await setCommitment(commitment);
      setSuccess('Commitment set successfully');
      setCommitmentDialogOpen(false);
      setCommitmentForm({ commitment: '' });
    } catch (err) {
      setError(err.message || 'Failed to set commitment');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeKYC = async (userAddress) => {
    if (!window.confirm('Are you sure you want to revoke KYC for this user?')) return;

    setLoading(true);
    setError(null);
    try {
      await revokeKYC(userAddress);
      setSuccess('KYC revoked successfully');
    } catch (err) {
      setError(err.message || 'Failed to revoke KYC');
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshKYC = async () => {
    if (loadingRef.current) return;
    
    setLoading(true);
    setError(null);
    try {
      const info = await getKYCInfo();
      setKycInfo(info);
      setSuccess('KYC info refreshed');
    } catch (err) {
      setError('Failed to refresh KYC info: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  if (!isConnected) {
    return (
      <Box p={3}>
        <Alert severity="info">
          Please connect your Core Wallet to manage KYC compliance.
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        KYC Management
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* My KYC Status */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  My KYC Status
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={handleRefreshKYC}
                  disabled={loading || contractsLoading}
                  startIcon={<Refresh />}
                >
                  Refresh
                </Button>
              </Box>
              
              {loading || contractsLoading ? (
                <Box display="flex" justifyContent="center" p={2}>
                  <CircularProgress />
                  <Typography variant="body2" sx={{ ml: 2 }}>
                    {contractsLoading ? 'Loading contracts...' : 'Loading KYC info...'}
                  </Typography>
                </Box>
              ) : kycInfo ? (
                <Box>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <Chip
                      label={kycInfo.isValid ? "Verified" : "Not Verified"}
                      color={kycInfo.isValid ? "success" : "error"}
                      icon={kycInfo.isValid ? <VerifiedUser /> : <Block />}
                    />
                  </Box>
                  
                  <Typography variant="body2" gutterBottom>
                    <strong>Status:</strong> {kycInfo.kycStatus ? "KYC Verified" : "Not KYC Verified"}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Timestamp:</strong> {formatTimestamp(kycInfo.timestamp)}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Expiry:</strong> {formatTimestamp(kycInfo.expiry)}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Valid:</strong> {kycInfo.isValid ? "Yes" : "No"}
                  </Typography>
                </Box>
              ) : (
                <Typography color="text.secondary">
                  No KYC information available
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Admin/Compliance Officer Actions */}
        {(isAdmin || isComplianceOfficer) && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Compliance Actions
                </Typography>
                
                <Box display="flex" flexDirection="column" gap={2}>
                  <Button
                    variant="outlined"
                    startIcon={<PersonAdd />}
                    onClick={() => setKycDialogOpen(true)}
                  >
                    Set KYC Status
                  </Button>
                  
                  <Button
                    variant="outlined"
                    startIcon={<GroupAdd />}
                    onClick={() => setBatchDialogOpen(true)}
                  >
                    Batch Set KYC
                  </Button>
                  
                  <Button
                    variant="outlined"
                    startIcon={<Security />}
                    onClick={() => setCommitmentDialogOpen(true)}
                  >
                    Set Commitment
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Set KYC Dialog */}
      <Dialog open={kycDialogOpen} onClose={() => setKycDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Set KYC Status</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="User Address"
            value={kycForm.userAddress}
            onChange={(e) => setKycForm({ ...kycForm, userAddress: e.target.value })}
            margin="normal"
          />
          
          <FormControl fullWidth margin="normal">
            <InputLabel>Status</InputLabel>
            <Select
              value={kycForm.status}
              onChange={(e) => setKycForm({ ...kycForm, status: e.target.value })}
            >
              <MenuItem value={true}>Verified</MenuItem>
              <MenuItem value={false}>Not Verified</MenuItem>
            </Select>
          </FormControl>
          
          <TextField
            fullWidth
            label="Expiry (Days)"
            type="number"
            value={kycForm.expiryDays}
            onChange={(e) => setKycForm({ ...kycForm, expiryDays: parseInt(e.target.value) })}
            margin="normal"
          />
          
          <TextField
            fullWidth
            label="Encrypted Data (Optional)"
            value={kycForm.encryptedData}
            onChange={(e) => setKycForm({ ...kycForm, encryptedData: e.target.value })}
            margin="normal"
            multiline
            rows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setKycDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSetKYC} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={20} /> : 'Set KYC'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Batch Set KYC Dialog */}
      <Dialog open={batchDialogOpen} onClose={() => setBatchDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Batch Set KYC Status</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="User Addresses (comma-separated)"
            value={batchForm.userAddresses}
            onChange={(e) => setBatchForm({ ...batchForm, userAddresses: e.target.value })}
            margin="normal"
            multiline
            rows={4}
            helperText="Enter addresses separated by commas"
          />
          
          <FormControl fullWidth margin="normal">
            <InputLabel>Status</InputLabel>
            <Select
              value={batchForm.status}
              onChange={(e) => setBatchForm({ ...batchForm, status: e.target.value })}
            >
              <MenuItem value={true}>Verified</MenuItem>
              <MenuItem value={false}>Not Verified</MenuItem>
            </Select>
          </FormControl>
          
          <TextField
            fullWidth
            label="Expiry (Days)"
            type="number"
            value={batchForm.expiryDays}
            onChange={(e) => setBatchForm({ ...batchForm, expiryDays: parseInt(e.target.value) })}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBatchDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleBatchSetKYC} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={20} /> : 'Batch Set KYC'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Set Commitment Dialog */}
      <Dialog open={commitmentDialogOpen} onClose={() => setCommitmentDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Set Zero-Knowledge Commitment</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Commitment Data"
            value={commitmentForm.commitment}
            onChange={(e) => setCommitmentForm({ ...commitmentForm, commitment: e.target.value })}
            margin="normal"
            multiline
            rows={3}
            helperText="Enter your commitment data for zero-knowledge proofs"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCommitmentDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSetCommitment} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={20} /> : 'Set Commitment'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default KYCManagement;
