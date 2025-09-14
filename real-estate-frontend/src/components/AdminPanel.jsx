import React, { useState, useEffect } from 'react';
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
  Tooltip,
  Tabs,
  Tab,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  AdminPanelSettings,
  Security,
  Pause,
  PlayArrow,
  PersonAdd,
  PersonRemove,
  AttachMoney,
  Warning,
  CheckCircle,
  Cancel
} from '@mui/icons-material';
import { ethers } from 'ethers';
import { useWallet } from '../contexts/WalletContext';
import { useContracts } from '../hooks/useContracts';

const AdminPanel = () => {
  const { account, isConnected } = useWallet();
  const {
    hasRole,
    grantRole,
    revokeRole,
    pauseContract,
    unpauseContract,
    getFractionalizationFee,
    contracts
  } = useContracts();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  
  // Role management
  const [roleForm, setRoleForm] = useState({
    contract: '',
    role: '',
    address: ''
  });

  // Contract management
  const [contractStates, setContractStates] = useState({});
  const [fractionalizationFee, setFractionalizationFee] = useState('0');

  // Dialog states
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [pauseDialogOpen, setPauseDialogOpen] = useState(false);
  const [feeDialogOpen, setFeeDialogOpen] = useState(false);

  // Check admin roles
  useEffect(() => {
    const checkAdminRoles = async () => {
      if (account) {
        try {
          const adminRoles = {};
          const contracts = ['complianceRegistry', 'titleNFT', 'fractionalizer', 'rentPoolMerkle'];
          
          for (const contract of contracts) {
            const isAdmin = await hasRole(contract, '0x0000000000000000000000000000000000000000000000000000000000000000', account);
            adminRoles[contract] = isAdmin;
          }
          
          setContractStates(adminRoles);
        } catch (err) {
          console.error('Failed to check admin roles:', err);
        }
      }
    };
    checkAdminRoles();
  }, [account, hasRole]);

  // Load fractionalization fee
  useEffect(() => {
    const loadFee = async () => {
      try {
        const fee = await getFractionalizationFee();
        setFractionalizationFee(fee);
      } catch (err) {
        console.error('Failed to load fractionalization fee:', err);
      }
    };
    loadFee();
  }, [getFractionalizationFee]);

  const handleGrantRole = async () => {
    if (!roleForm.contract || !roleForm.role || !roleForm.address) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await grantRole(roleForm.contract, roleForm.role, roleForm.address);
      setSuccess('Role granted successfully');
      setRoleDialogOpen(false);
      setRoleForm({ contract: '', role: '', address: '' });
    } catch (err) {
      setError(err.message || 'Failed to grant role');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeRole = async () => {
    if (!roleForm.contract || !roleForm.role || !roleForm.address) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await revokeRole(roleForm.contract, roleForm.role, roleForm.address);
      setSuccess('Role revoked successfully');
      setRoleDialogOpen(false);
      setRoleForm({ contract: '', role: '', address: '' });
    } catch (err) {
      setError(err.message || 'Failed to revoke role');
    } finally {
      setLoading(false);
    }
  };

  const handlePauseContract = async (contractName) => {
    if (!window.confirm(`Are you sure you want to pause ${contractName}?`)) return;

    setLoading(true);
    setError(null);
    try {
      await pauseContract(contractName);
      setSuccess(`${contractName} paused successfully`);
    } catch (err) {
      setError(err.message || `Failed to pause ${contractName}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUnpauseContract = async (contractName) => {
    if (!window.confirm(`Are you sure you want to unpause ${contractName}?`)) return;

    setLoading(true);
    setError(null);
    try {
      await unpauseContract(contractName);
      setSuccess(`${contractName} unpaused successfully`);
    } catch (err) {
      setError(err.message || `Failed to unpause ${contractName}`);
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = Object.values(contractStates).some(state => state);

  if (!isConnected) {
    return (
      <Box p={3}>
        <Alert severity="info">
          Please connect your Core Wallet to access admin functions.
        </Alert>
      </Box>
    );
  }

  if (!isAdmin) {
    return (
      <Box p={3}>
        <Alert severity="warning">
          You don't have admin privileges for any contracts.
        </Alert>
      </Box>
    );
  }

  const roleOptions = [
    { value: '0x0000000000000000000000000000000000000000000000000000000000000000', label: 'DEFAULT_ADMIN_ROLE' },
    { value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes('ADMIN_ROLE')), label: 'ADMIN_ROLE' },
    { value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes('MINTER_ROLE')), label: 'MINTER_ROLE' },
    { value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes('BURNER_ROLE')), label: 'BURNER_ROLE' },
    { value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes('COMPLIANCE_OFFICER_ROLE')), label: 'COMPLIANCE_OFFICER_ROLE' },
    { value: ethers.utils.keccak256(ethers.utils.toUtf8Bytes('FRACTIONALIZER_ROLE')), label: 'FRACTIONALIZER_ROLE' }
  ];

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Admin Panel
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

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Role Management" />
          <Tab label="Contract Management" />
          <Tab label="Fee Management" />
        </Tabs>
      </Box>

      {/* Role Management Tab */}
      {tabValue === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Grant Role
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Grant roles to addresses for contract management
                </Typography>
                
                <Button
                  variant="contained"
                  startIcon={<PersonAdd />}
                  onClick={() => {
                    setRoleForm({ contract: '', role: '', address: '' });
                    setRoleDialogOpen(true);
                  }}
                  fullWidth
                >
                  Grant Role
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Revoke Role
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Revoke roles from addresses
                </Typography>
                
                <Button
                  variant="outlined"
                  startIcon={<PersonRemove />}
                  onClick={() => {
                    setRoleForm({ contract: '', role: '', address: '' });
                    setRoleDialogOpen(true);
                  }}
                  fullWidth
                >
                  Revoke Role
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Contract Management Tab */}
      {tabValue === 1 && (
        <Grid container spacing={3}>
          {Object.entries(contractStates).map(([contractName, isAdmin]) => (
            <Grid item xs={12} md={6} key={contractName}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6" textTransform="capitalize">
                      {contractName}
                    </Typography>
                    <Chip
                      label={isAdmin ? "Admin" : "Not Admin"}
                      color={isAdmin ? "success" : "default"}
                      size="small"
                    />
                  </Box>
                  
                  {isAdmin && (
                    <Box display="flex" gap={1}>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<Pause />}
                        onClick={() => handlePauseContract(contractName)}
                        disabled={loading}
                      >
                        Pause
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<PlayArrow />}
                        onClick={() => handleUnpauseContract(contractName)}
                        disabled={loading}
                      >
                        Unpause
                      </Button>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Fee Management Tab */}
      {tabValue === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Fractionalization Fee
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Current fee: {fractionalizationFee} AVAX
                </Typography>
                
                <Button
                  variant="outlined"
                  startIcon={<AttachMoney />}
                  onClick={() => setFeeDialogOpen(true)}
                  fullWidth
                >
                  Update Fee
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Role Management Dialog */}
      <Dialog open={roleDialogOpen} onClose={() => setRoleDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Manage Role</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>Contract</InputLabel>
            <Select
              value={roleForm.contract}
              onChange={(e) => setRoleForm({ ...roleForm, contract: e.target.value })}
            >
              <MenuItem value="complianceRegistry">Compliance Registry</MenuItem>
              <MenuItem value="titleNFT">Title NFT</MenuItem>
              <MenuItem value="fractionalizer">Fractionalizer</MenuItem>
              <MenuItem value="rentPoolMerkle">Rent Pool Merkle</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl fullWidth margin="normal">
            <InputLabel>Role</InputLabel>
            <Select
              value={roleForm.role}
              onChange={(e) => setRoleForm({ ...roleForm, role: e.target.value })}
            >
              {roleOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <TextField
            fullWidth
            label="Address"
            value={roleForm.address}
            onChange={(e) => setRoleForm({ ...roleForm, address: e.target.value })}
            margin="normal"
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRoleDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleGrantRole} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={20} /> : 'Grant Role'}
          </Button>
          <Button onClick={handleRevokeRole} variant="outlined" disabled={loading}>
            {loading ? <CircularProgress size={20} /> : 'Revoke Role'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Fee Management Dialog */}
      <Dialog open={feeDialogOpen} onClose={() => setFeeDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Update Fractionalization Fee</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            This will update the fee required for property fractionalization.
          </Alert>
          
          <TextField
            fullWidth
            label="New Fee (AVAX)"
            type="number"
            value={fractionalizationFee}
            onChange={(e) => setFractionalizationFee(e.target.value)}
            margin="normal"
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFeeDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={20} /> : 'Update Fee'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminPanel;
