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
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  TrendingUp,
  AttachMoney,
  Security,
  Info,
  ExpandMore,
  CheckCircle,
  Cancel,
  Warning
} from '@mui/icons-material';
import { ethers } from 'ethers';
import { useWallet } from '../contexts/WalletContext';
import { useContracts } from '../hooks/useContracts';

const RentalIncomeManagement = () => {
  const { account, isConnected, balance } = useWallet();
  const {
    getEpochTotalDeposits,
    isClaimed,
    depositRent,
    claimRentalIncome,
    setEncryptedAmount,
    hasRole
  } = useContracts();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isOwner, setIsOwner] = useState(false);

  // Epoch data
  const [epochs, setEpochs] = useState([]);
  const [currentEpoch, setCurrentEpoch] = useState(1);

  // Deposit form
  const [depositForm, setDepositForm] = useState({
    epochId: '',
    amount: ''
  });

  // Claim form
  const [claimForm, setClaimForm] = useState({
    epochId: '',
    amount: '',
    proof: ''
  });

  // Encrypted amount form
  const [encryptedForm, setEncryptedForm] = useState({
    epochId: '',
    encryptedAmount: ''
  });

  // Dialog states
  const [depositDialogOpen, setDepositDialogOpen] = useState(false);
  const [claimDialogOpen, setClaimDialogOpen] = useState(false);
  const [encryptedDialogOpen, setEncryptedDialogOpen] = useState(false);

  // Check user roles
  useEffect(() => {
    const checkRoles = async () => {
      if (account) {
        try {
          const ownerRole = await hasRole('rentPoolMerkle', '0x0000000000000000000000000000000000000000000000000000000000000000', account);
          setIsOwner(ownerRole);
        } catch (err) {
          console.error('Failed to check roles:', err);
        }
      }
    };
    checkRoles();
  }, [account, hasRole]);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      if (account && isConnected) {
        setLoading(true);
        try {
          // Load balance
          const userBalance = balance;
          // Balance is now provided by the wallet context

          // Load epoch data
          const epochData = [];
          for (let i = 1; i <= 5; i++) { // Check last 5 epochs
            try {
              const deposits = await getEpochTotalDeposits(i);
              const claimed = await isClaimed(i);
              epochData.push({
                epochId: i,
                totalDeposits: deposits,
                isClaimed: claimed
              });
            } catch (err) {
              // Epoch might not exist
              epochData.push({
                epochId: i,
                totalDeposits: '0',
                isClaimed: false
              });
            }
          }
          setEpochs(epochData);
        } catch (err) {
          setError('Failed to load data');
        } finally {
          setLoading(false);
        }
      }
    };
    loadData();
  }, [account, isConnected, getEpochTotalDeposits, isClaimed, balance]);

  const handleDepositRent = async () => {
    if (!depositForm.epochId || !depositForm.amount) {
      setError('Please fill in all required fields');
      return;
    }

    if (parseFloat(balance) < parseFloat(depositForm.amount)) {
      setError(`Insufficient balance. Required: ${depositForm.amount} AVAX, Available: ${balance} AVAX`);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await depositRent(
        parseInt(depositForm.epochId),
        ethers.utils.parseEther(depositForm.amount)
      );
      
      setSuccess('Rent deposited successfully');
      setDepositDialogOpen(false);
      setDepositForm({ epochId: '', amount: '' });
      
      // Reload data
      const userBalance = await getBalance();
      setBalance(userBalance);
      
      const epochData = [];
      for (let i = 1; i <= 5; i++) {
        try {
          const deposits = await getEpochTotalDeposits(i);
          const claimed = await isClaimed(i);
          epochData.push({
            epochId: i,
            totalDeposits: deposits,
            isClaimed: claimed
          });
        } catch (err) {
          epochData.push({
            epochId: i,
            totalDeposits: '0',
            isClaimed: false
          });
        }
      }
      setEpochs(epochData);
    } catch (err) {
      setError(err.message || 'Failed to deposit rent');
    } finally {
      setLoading(false);
    }
  };

  const handleClaimRentalIncome = async () => {
    if (!claimForm.epochId || !claimForm.amount || !claimForm.proof) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Parse proof from comma-separated string
      const proof = claimForm.proof.split(',').map(p => p.trim()).filter(p => p);
      
      await claimRentalIncome(
        parseInt(claimForm.epochId),
        ethers.utils.parseEther(claimForm.amount),
        proof
      );
      
      setSuccess('Rental income claimed successfully');
      setClaimDialogOpen(false);
      setClaimForm({ epochId: '', amount: '', proof: '' });
      
      // Reload data
      const epochData = [];
      for (let i = 1; i <= 5; i++) {
        try {
          const deposits = await getEpochTotalDeposits(i);
          const claimed = await isClaimed(i);
          epochData.push({
            epochId: i,
            totalDeposits: deposits,
            isClaimed: claimed
          });
        } catch (err) {
          epochData.push({
            epochId: i,
            totalDeposits: '0',
            isClaimed: false
          });
        }
      }
      setEpochs(epochData);
    } catch (err) {
      setError(err.message || 'Failed to claim rental income');
    } finally {
      setLoading(false);
    }
  };

  const handleSetEncryptedAmount = async () => {
    if (!encryptedForm.epochId || !encryptedForm.encryptedAmount) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const encryptedData = ethers.utils.formatBytes32String(encryptedForm.encryptedAmount);
      await setEncryptedAmount(parseInt(encryptedForm.epochId), encryptedData);
      
      setSuccess('Encrypted amount set successfully');
      setEncryptedDialogOpen(false);
      setEncryptedForm({ epochId: '', encryptedAmount: '' });
    } catch (err) {
      setError(err.message || 'Failed to set encrypted amount');
    } finally {
      setLoading(false);
    }
  };

  const formatValue = (value) => {
    return ethers.utils.formatEther(value);
  };

  if (!isConnected) {
    return (
      <Box p={3}>
        <Alert severity="info">
          Please connect your Core Wallet to manage rental income.
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Rental Income Management
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

      {/* Balance Information */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Account Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">
                Your Balance
              </Typography>
              <Typography variant="h6">
                {balance} AVAX
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">
                Current Epoch
              </Typography>
              <Typography variant="h6">
                #{currentEpoch}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Deposit Rent */}
        {isOwner && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Deposit Rent
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Deposit rental income for distribution to token holders
                </Typography>
                
                <Button
                  variant="contained"
                  startIcon={<AttachMoney />}
                  onClick={() => setDepositDialogOpen(true)}
                  fullWidth
                >
                  Deposit Rent
                </Button>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Claim Rental Income */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Claim Rental Income
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Claim your share of rental income using Merkle proofs
              </Typography>
              
              <Button
                variant="contained"
                startIcon={<TrendingUp />}
                onClick={() => setClaimDialogOpen(true)}
                fullWidth
              >
                Claim Income
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Epoch Information */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Epoch Information
          </Typography>
          
          {loading ? (
            <Box display="flex" justifyContent="center" p={2}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Epoch ID</TableCell>
                    <TableCell>Total Deposits</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {epochs.map((epoch) => (
                    <TableRow key={epoch.epochId}>
                      <TableCell>#{epoch.epochId}</TableCell>
                      <TableCell>{formatValue(epoch.totalDeposits)} AVAX</TableCell>
                      <TableCell>
                        <Chip
                          label={epoch.isClaimed ? "Claimed" : "Available"}
                          color={epoch.isClaimed ? "success" : "default"}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          startIcon={<Security />}
                          onClick={() => {
                            setEncryptedForm({ epochId: epoch.epochId.toString(), encryptedAmount: '' });
                            setEncryptedDialogOpen(true);
                          }}
                        >
                          Encrypt
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Deposit Rent Dialog */}
      <Dialog open={depositDialogOpen} onClose={() => setDepositDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Deposit Rent</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            This will deposit rental income for distribution to token holders using Merkle proofs.
          </Alert>
          
          <TextField
            fullWidth
            label="Epoch ID"
            type="number"
            value={depositForm.epochId}
            onChange={(e) => setDepositForm({ ...depositForm, epochId: e.target.value })}
            margin="normal"
            required
          />
          
          <TextField
            fullWidth
            label="Amount (AVAX)"
            type="number"
            value={depositForm.amount}
            onChange={(e) => setDepositForm({ ...depositForm, amount: e.target.value })}
            margin="normal"
            required
            helperText={`Available: ${balance} AVAX`}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDepositDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDepositRent} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={20} /> : 'Deposit Rent'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Claim Rental Income Dialog */}
      <Dialog open={claimDialogOpen} onClose={() => setClaimDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Claim Rental Income</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            You need a valid Merkle proof to claim rental income. Contact the property manager for your proof.
          </Alert>
          
          <TextField
            fullWidth
            label="Epoch ID"
            type="number"
            value={claimForm.epochId}
            onChange={(e) => setClaimForm({ ...claimForm, epochId: e.target.value })}
            margin="normal"
            required
          />
          
          <TextField
            fullWidth
            label="Amount (AVAX)"
            type="number"
            value={claimForm.amount}
            onChange={(e) => setClaimForm({ ...claimForm, amount: e.target.value })}
            margin="normal"
            required
          />
          
          <TextField
            fullWidth
            label="Merkle Proof"
            value={claimForm.proof}
            onChange={(e) => setClaimForm({ ...claimForm, proof: e.target.value })}
            margin="normal"
            multiline
            rows={3}
            required
            helperText="Enter Merkle proof as comma-separated values"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClaimDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleClaimRentalIncome} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={20} /> : 'Claim Income'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Set Encrypted Amount Dialog */}
      <Dialog open={encryptedDialogOpen} onClose={() => setEncryptedDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Set Encrypted Amount</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Set encrypted claim amount for privacy in rental income distribution.
          </Alert>
          
          <TextField
            fullWidth
            label="Epoch ID"
            value={encryptedForm.epochId}
            onChange={(e) => setEncryptedForm({ ...encryptedForm, epochId: e.target.value })}
            margin="normal"
            disabled
          />
          
          <TextField
            fullWidth
            label="Encrypted Amount"
            value={encryptedForm.encryptedAmount}
            onChange={(e) => setEncryptedForm({ ...encryptedForm, encryptedAmount: e.target.value })}
            margin="normal"
            multiline
            rows={2}
            required
            helperText="Enter encrypted amount data"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEncryptedDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSetEncryptedAmount} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={20} /> : 'Set Encrypted Amount'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RentalIncomeManagement;
