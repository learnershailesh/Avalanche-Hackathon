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
  Tooltip,
  Divider
} from '@mui/material';
import {
  Token,
  AttachMoney,
  SwapHoriz,
  Info,
  Warning,
  CheckCircle,
  Cancel,
  Refresh
} from '@mui/icons-material';
import { ethers } from 'ethers';
import { useWallet } from '../contexts/WalletContext';
import { useContracts } from '../hooks/useContracts';

const FractionalizationInterface = () => {
  const { account, isConnected, balance } = useWallet();
  const {
    getUserProperties,
    isPropertyFractionalized,
    getFractionalizationData,
    fractionalizeProperty,
    defractionalizeProperty,
    getFractionalizationFee,
    hasRole
  } = useContracts();

  const [properties, setProperties] = useState([]);
  const [fractionalizedProperties, setFractionalizedProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [fractionalizationFee, setFractionalizationFee] = useState('0');
  const loadingRef = useRef(false);
  const lastLoadTimeRef = useRef(0);

  // Fractionalization form
  const [fractionalizeForm, setFractionalizeForm] = useState({
    tokenId: '',
    name: '',
    symbol: '',
    totalSupply: ''
  });

  // Dialog states
  const [fractionalizeDialogOpen, setFractionalizeDialogOpen] = useState(false);
  const [defractionalizeDialogOpen, setDefractionalizeDialogOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);

  // Check user roles
  useEffect(() => {
    const checkRoles = async () => {
      if (account) {
        try {
          const adminRole = await hasRole('fractionalizer', '0x0000000000000000000000000000000000000000000000000000000000000000', account);
          setIsAdmin(adminRole);
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
      // Prevent multiple simultaneous calls
      if (loadingRef.current) return;
      
      // Prevent rapid successive calls (minimum 3 seconds between calls)
      const now = Date.now();
      if (now - lastLoadTimeRef.current < 3000) return;
      
      if (account && isConnected) {
        loadingRef.current = true;
        lastLoadTimeRef.current = now;
        setLoading(true);
        setError(null);
        try {
          // Load user properties
          const userProperties = await getUserProperties();
          console.log('Loaded properties:', userProperties);
          setProperties(userProperties);

          // Load fractionalization fee
          const fee = await getFractionalizationFee();
          setFractionalizationFee(fee);

          // Balance is now provided by the wallet context

          // Check which properties are fractionalized
          const fractionalized = [];
          for (const property of userProperties) {
            const isFractionalized = await isPropertyFractionalized(property.tokenId);
            if (isFractionalized) {
              const data = await getFractionalizationData(property.tokenId);
              fractionalized.push({
                ...property,
                fractionalizationData: data
              });
            }
          }
          setFractionalizedProperties(fractionalized);
        } catch (err) {
          console.error('Failed to load fractionalization data:', err);
          setError('Failed to load data: ' + err.message);
          setProperties([]);
          setFractionalizedProperties([]);
        } finally {
          setLoading(false);
          loadingRef.current = false;
        }
      } else if (!account || !isConnected) {
        setLoading(false);
        setProperties([]);
        setFractionalizedProperties([]);
        loadingRef.current = false;
      }
    };
    loadData();
    
    // Cleanup function
    return () => {
      loadingRef.current = false;
    };
  }, [account, isConnected]); // Removed function dependencies

  const handleFractionalize = async () => {
    if (!fractionalizeForm.tokenId || !fractionalizeForm.name || !fractionalizeForm.symbol || !fractionalizeForm.totalSupply) {
      setError('Please fill in all required fields');
      return;
    }

    if (parseFloat(balance) < parseFloat(fractionalizationFee)) {
      setError(`Insufficient balance. Required: ${fractionalizationFee} AVAX, Available: ${balance} AVAX`);
      return;
    }

    // Validate token ID
    const tokenId = parseInt(fractionalizeForm.tokenId);
    if (isNaN(tokenId) || tokenId <= 0) {
      setError('Invalid token ID');
      return;
    }

    // Validate total supply
    const totalSupply = parseInt(fractionalizeForm.totalSupply);
    if (isNaN(totalSupply) || totalSupply <= 0) {
      setError('Invalid total supply');
      return;
    }

    // Check if properties are loaded
    if (properties.length === 0) {
      setError('Properties not loaded. Please click refresh to load your properties first.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Check if the property exists and is owned by the user
      console.log('Looking for tokenId:', tokenId, 'in properties:', properties.map(p => ({ tokenId: p.tokenId, type: typeof p.tokenId })));
      const property = properties.find(p => p.tokenId === tokenId.toString());
      if (!property) {
        setError('Property not found in your properties');
        setLoading(false);
        return;
      }
      
      if (property.owner !== account) {
        setError('You do not own this property');
        setLoading(false);
        return;
      }
      
      console.log('Fractionalizing property:', {
        tokenId,
        name: fractionalizeForm.name,
        symbol: fractionalizeForm.symbol,
        totalSupply
      });
      
      await fractionalizeProperty(
        tokenId,
        fractionalizeForm.name,
        fractionalizeForm.symbol,
        totalSupply
      );
      
      setSuccess('Property fractionalized successfully');
      setFractionalizeDialogOpen(false);
      setFractionalizeForm({
        tokenId: '',
        name: '',
        symbol: '',
        totalSupply: ''
      });
      
      // Reload data
      const userProperties = await getUserProperties();
      setProperties(userProperties);
      
      const fractionalized = [];
      for (const property of userProperties) {
        const isFractionalized = await isPropertyFractionalized(property.tokenId);
        if (isFractionalized) {
          const data = await getFractionalizationData(property.tokenId);
          fractionalized.push({
            ...property,
            fractionalizationData: data
          });
        }
      }
      setFractionalizedProperties(fractionalized);
    } catch (err) {
      setError(err.message || 'Failed to fractionalize property');
    } finally {
      setLoading(false);
    }
  };

  const handleDefractionalize = async (tokenId) => {
    if (!window.confirm('Are you sure you want to defractionalize this property? You must own all tokens to defractionalize.')) return;

    setLoading(true);
    setError(null);
    try {
      await defractionalizeProperty(tokenId);
      setSuccess('Property defractionalized successfully');
      
      // Reload data
      const userProperties = await getUserProperties();
      setProperties(userProperties);
      
      const fractionalized = [];
      for (const property of userProperties) {
        const isFractionalized = await isPropertyFractionalized(property.tokenId);
        if (isFractionalized) {
          const data = await getFractionalizationData(property.tokenId);
          fractionalized.push({
            ...property,
            fractionalizationData: data
          });
        }
      }
      setFractionalizedProperties(fractionalized);
    } catch (err) {
      setError(err.message || 'Failed to defractionalize property');
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshData = async () => {
    if (loadingRef.current) return;
    
    setLoading(true);
    setError(null);
    try {
      // Load user properties
      const userProperties = await getUserProperties();
      console.log('Refreshed properties:', userProperties);
      setProperties(userProperties);

      // Load fractionalization fee
      const fee = await getFractionalizationFee();
      setFractionalizationFee(fee);

      // Check which properties are fractionalized
      const fractionalized = [];
      for (const property of userProperties) {
        const isFractionalized = await isPropertyFractionalized(property.tokenId);
        if (isFractionalized) {
          const data = await getFractionalizationData(property.tokenId);
          fractionalized.push({
            ...property,
            fractionalizationData: data
          });
        }
      }
      setFractionalizedProperties(fractionalized);
      setSuccess('Data refreshed successfully');
    } catch (err) {
      setError('Failed to refresh data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatValue = (value) => {
    return ethers.utils.formatEther(value);
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  if (!isConnected) {
    return (
      <Box p={3}>
        <Alert severity="info">
          Please connect your Core Wallet to manage property fractionalization.
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Property Fractionalization
        </Typography>
        
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={handleRefreshData}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

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

      {/* Fee Information */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Fractionalization Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color="text.secondary">
                Fractionalization Fee
              </Typography>
              <Typography variant="h6">
                {fractionalizationFee} AVAX
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color="text.secondary">
                Your Balance
              </Typography>
              <Typography variant="h6">
                {balance} AVAX
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color="text.secondary">
                Status
              </Typography>
              <Chip
                label={parseFloat(balance) >= parseFloat(fractionalizationFee) ? "Sufficient" : "Insufficient"}
                color={parseFloat(balance) >= parseFloat(fractionalizationFee) ? "success" : "error"}
                size="small"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Available Properties for Fractionalization */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Available Properties
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Properties that can be fractionalized into tradeable tokens
              </Typography>
              
              {loading ? (
                <Box display="flex" justifyContent="center" p={2}>
                  <CircularProgress />
                </Box>
              ) : properties.filter(p => !fractionalizedProperties.some(fp => fp.tokenId === p.tokenId)).length === 0 ? (
                <Typography color="text.secondary" textAlign="center" py={2}>
                  No properties available for fractionalization
                </Typography>
              ) : (
                <Box>
                  {properties
                    .filter(p => !fractionalizedProperties.some(fp => fp.tokenId === p.tokenId))
                    .map((property) => (
                      <Card key={property.tokenId} sx={{ mb: 2 }}>
                        <CardContent>
                          <Box display="flex" justifyContent="space-between" alignItems="start" mb={1}>
                            <Typography variant="subtitle1">
                              Property #{property.tokenId}
                            </Typography>
                            <Chip
                              label={property.isVerified ? "Verified" : "Pending"}
                              color={property.isVerified ? "success" : "warning"}
                              size="small"
                            />
                          </Box>
                          
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            {property.location}
                          </Typography>
                          
                          <Typography variant="body2">
                            <strong>Value:</strong> {formatValue(property.value)} AVAX
                          </Typography>
                          <Typography variant="body2">
                            <strong>Area:</strong> {property.area} sq ft
                          </Typography>
                          
                          <Box mt={2}>
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<Token />}
                              onClick={() => {
                                setFractionalizeForm({
                                  tokenId: property.tokenId,
                                  name: `${property.propertyType} #${property.tokenId}`,
                                  symbol: property.propertyType.substring(0, 3).toUpperCase(),
                                  totalSupply: '1000000'
                                });
                                setFractionalizeDialogOpen(true);
                              }}
                              disabled={!property.isVerified}
                            >
                              Fractionalize
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Fractionalized Properties */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Fractionalized Properties
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Properties that have been converted into tradeable tokens
              </Typography>
              
              {loading ? (
                <Box display="flex" justifyContent="center" p={2}>
                  <CircularProgress />
                </Box>
              ) : fractionalizedProperties.length === 0 ? (
                <Typography color="text.secondary" textAlign="center" py={2}>
                  No fractionalized properties
                </Typography>
              ) : (
                <Box>
                  {fractionalizedProperties.map((property) => (
                    <Card key={property.tokenId} sx={{ mb: 2 }}>
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="start" mb={1}>
                          <Typography variant="subtitle1">
                            Property #{property.tokenId}
                          </Typography>
                          <Chip
                            label="Fractionalized"
                            color="primary"
                            size="small"
                          />
                        </Box>
                        
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {property.location}
                        </Typography>
                        
                        {property.fractionalizationData && (
                          <Box>
                            <Typography variant="body2">
                              <strong>Token:</strong> {property.fractionalizationData.tokenAddress}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Total Supply:</strong> {formatValue(property.fractionalizationData.totalSupply)}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Fractionalized:</strong> {formatTimestamp(property.fractionalizationData.timestamp)}
                            </Typography>
                          </Box>
                        )}
                        
                        <Box mt={2}>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<SwapHoriz />}
                            onClick={() => handleDefractionalize(property.tokenId)}
                            color="warning"
                          >
                            Defractionalize
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Fractionalize Dialog */}
      <Dialog open={fractionalizeDialogOpen} onClose={() => setFractionalizeDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Fractionalize Property</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            This will convert your property NFT into tradeable ERC20 tokens. The NFT will be held by the contract until defractionalized.
          </Alert>
          
          <TextField
            fullWidth
            label="Token ID"
            value={fractionalizeForm.tokenId}
            onChange={(e) => setFractionalizeForm({ ...fractionalizeForm, tokenId: e.target.value })}
            margin="normal"
            disabled
          />
          
          <TextField
            fullWidth
            label="Token Name"
            value={fractionalizeForm.name}
            onChange={(e) => setFractionalizeForm({ ...fractionalizeForm, name: e.target.value })}
            margin="normal"
            required
          />
          
          <TextField
            fullWidth
            label="Token Symbol"
            value={fractionalizeForm.symbol}
            onChange={(e) => setFractionalizeForm({ ...fractionalizeForm, symbol: e.target.value })}
            margin="normal"
            required
            inputProps={{ maxLength: 10 }}
          />
          
          <TextField
            fullWidth
            label="Total Supply"
            type="number"
            value={fractionalizeForm.totalSupply}
            onChange={(e) => setFractionalizeForm({ ...fractionalizeForm, totalSupply: e.target.value })}
            margin="normal"
            required
            helperText="Total number of tokens to mint"
          />
          
          
          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Fee:</strong> {fractionalizationFee} AVAX will be charged for fractionalization
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFractionalizeDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleFractionalize} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={20} /> : 'Fractionalize Property'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FractionalizationInterface;
