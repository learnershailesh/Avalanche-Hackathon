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
  Fab
} from '@mui/material';
import {
  Add,
  Home,
  Edit,
  Delete,
  Verified,
  Security,
  Image,
  Info,
  Refresh
} from '@mui/icons-material';
import { ethers } from 'ethers';
import { useWallet } from '../contexts/WalletContext';
import { useContracts } from '../hooks/useContracts';

const PropertyManagement = () => {
  const { account, isConnected } = useWallet();
  const {
    getUserProperties,
    mintProperty,
    updatePropertyData,
    setEncryptedMetadata,
    verifyProperty,
    burnProperty,
    hasRole
  } = useContracts();

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMinter, setIsMinter] = useState(false);
  const loadingRef = useRef(false);
  const lastLoadTimeRef = useRef(0);

  // Property form
  const [propertyForm, setPropertyForm] = useState({
    to: '',
    metadataURI: '',
    location: '',
    value: '',
    area: '',
    propertyType: 'House',
    isVerified: false
  });

  // Update property form
  const [updateForm, setUpdateForm] = useState({
    tokenId: '',
    location: '',
    value: '',
    area: '',
    propertyType: 'House'
  });

  // Encrypted metadata form
  const [encryptedForm, setEncryptedForm] = useState({
    tokenId: '',
    encryptedData: ''
  });

  // Dialog states
  const [mintDialogOpen, setMintDialogOpen] = useState(false);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [encryptedDialogOpen, setEncryptedDialogOpen] = useState(false);

  // Check user roles
  useEffect(() => {
    const checkRoles = async () => {
      if (account) {
        try {
          const adminRole = await hasRole('titleNFT', '0x0000000000000000000000000000000000000000000000000000000000000000', account);
          const minterRole = await hasRole('titleNFT', ethers.utils.keccak256(ethers.utils.toUtf8Bytes('MINTER_ROLE')), account);
          setIsAdmin(adminRole);
          setIsMinter(minterRole);
        } catch (err) {
          console.error('Failed to check roles:', err);
        }
      }
    };
    checkRoles();
  }, [account, hasRole]);

  // Load properties
  useEffect(() => {
    const loadProperties = async () => {
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
          const userProperties = await getUserProperties();
          setProperties(userProperties);
        } catch (err) {
          console.error('Failed to load properties:', err);
          setError('Failed to load properties: ' + err.message);
          setProperties([]);
        } finally {
          setLoading(false);
          loadingRef.current = false;
        }
      } else if (!account || !isConnected) {
        setLoading(false);
        setProperties([]);
        loadingRef.current = false;
      }
    };
    loadProperties();
    
    // Cleanup function
    return () => {
      loadingRef.current = false;
    };
  }, [account, isConnected]); // Removed getUserProperties from dependencies

  const handleMintProperty = async () => {
    if (!propertyForm.to || !propertyForm.metadataURI || !propertyForm.location || !propertyForm.value || !propertyForm.area) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const propertyData = {
        location: propertyForm.location,
        value: ethers.utils.parseEther(propertyForm.value),
        area: propertyForm.area,
        propertyType: propertyForm.propertyType,
        isVerified: propertyForm.isVerified
      };

      await mintProperty(propertyForm.to, propertyForm.metadataURI, propertyData);
      setSuccess('Property minted successfully');
      setMintDialogOpen(false);
      setPropertyForm({
        to: '',
        metadataURI: '',
        location: '',
        value: '',
        area: '',
        propertyType: 'House',
        isVerified: false
      });
      
      // Reload properties
      const userProperties = await getUserProperties();
      setProperties(userProperties);
    } catch (err) {
      setError(err.message || 'Failed to mint property');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProperty = async () => {
    if (!updateForm.tokenId || !updateForm.location || !updateForm.value || !updateForm.area) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const propertyData = {
        location: updateForm.location,
        value: ethers.utils.parseEther(updateForm.value),
        area: updateForm.area,
        propertyType: updateForm.propertyType,
        isVerified: false // Reset verification when updating
      };

      await updatePropertyData(updateForm.tokenId, propertyData);
      setSuccess('Property updated successfully');
      setUpdateDialogOpen(false);
      setUpdateForm({
        tokenId: '',
        location: '',
        value: '',
        area: '',
        propertyType: 'House'
      });
      
      // Reload properties
      const userProperties = await getUserProperties();
      setProperties(userProperties);
    } catch (err) {
      setError(err.message || 'Failed to update property');
    } finally {
      setLoading(false);
    }
  };

  const handleSetEncryptedMetadata = async () => {
    if (!encryptedForm.tokenId || !encryptedForm.encryptedData) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const encryptedData = ethers.utils.formatBytes32String(encryptedForm.encryptedData);
      await setEncryptedMetadata(encryptedForm.tokenId, encryptedData);
      setSuccess('Encrypted metadata set successfully');
      setEncryptedDialogOpen(false);
      setEncryptedForm({ tokenId: '', encryptedData: '' });
    } catch (err) {
      setError(err.message || 'Failed to set encrypted metadata');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyProperty = async (tokenId) => {
    if (!window.confirm('Are you sure you want to verify this property?')) return;

    setLoading(true);
    setError(null);
    try {
      await verifyProperty(tokenId);
      setSuccess('Property verified successfully');
      
      // Reload properties
      const userProperties = await getUserProperties();
      setProperties(userProperties);
    } catch (err) {
      setError(err.message || 'Failed to verify property');
    } finally {
      setLoading(false);
    }
  };

  const handleBurnProperty = async (tokenId) => {
    if (!window.confirm('Are you sure you want to burn this property? This action cannot be undone.')) return;

    setLoading(true);
    setError(null);
    try {
      await burnProperty(tokenId);
      setSuccess('Property burned successfully');
      
      // Reload properties
      const userProperties = await getUserProperties();
      setProperties(userProperties);
    } catch (err) {
      setError(err.message || 'Failed to burn property');
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshProperties = async () => {
    if (loadingRef.current) return;
    
    setLoading(true);
    setError(null);
    try {
      const userProperties = await getUserProperties();
      setProperties(userProperties);
      setSuccess('Properties refreshed');
    } catch (err) {
      setError('Failed to refresh properties: ' + err.message);
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
          Please connect your Core Wallet to manage properties.
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Property Management
        </Typography>
        
        <Box display="flex" gap={2} alignItems="center">
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={handleRefreshProperties}
            disabled={loading}
          >
            Refresh
          </Button>
          
          {isMinter && (
            <Fab
              color="primary"
              aria-label="add"
              onClick={() => setMintDialogOpen(true)}
            >
              <Add />
            </Fab>
          )}
        </Box>
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

      {loading ? (
        <Box display="flex" justifyContent="center" p={3}>
          <CircularProgress />
        </Box>
      ) : properties.length === 0 ? (
        <Card>
          <CardContent>
            <Box textAlign="center" py={4}>
              <Home sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No properties found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {isMinter ? 'Mint your first property to get started' : 'You don\'t have any properties yet'}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      ) : (
      <Grid container spacing={3}>
        {properties.map((property) => (
          <Grid item xs={12} md={6} lg={4} key={property.tokenId}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                    <Typography variant="h6" component="div">
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
                  
                  <Box mb={2}>
                    <Typography variant="body2">
                      <strong>Value:</strong> {formatValue(property.value)} AVAX
                    </Typography>
                    <Typography variant="body2">
                      <strong>Area:</strong> {property.area} sq ft
                    </Typography>
                    <Typography variant="body2">
                      <strong>Type:</strong> {property.propertyType}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Minted:</strong> {formatTimestamp(property.mintTimestamp)}
                    </Typography>
                  </Box>
                  
                  <Box display="flex" gap={1} flexWrap="wrap">
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Edit />}
                      onClick={() => {
                        setUpdateForm({
                          tokenId: property.tokenId,
                          location: property.location,
                          value: formatValue(property.value),
                          area: property.area,
                          propertyType: property.propertyType
                        });
                        setUpdateDialogOpen(true);
                      }}
                    >
                      Edit
                    </Button>
                    
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Security />}
                      onClick={() => {
                        setEncryptedForm({ tokenId: property.tokenId, encryptedData: '' });
                        setEncryptedDialogOpen(true);
                      }}
                    >
                      Encrypt
                    </Button>
                    
                    {isAdmin && !property.isVerified && (
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<Verified />}
                        onClick={() => handleVerifyProperty(property.tokenId)}
                        color="success"
                      >
                        Verify
                      </Button>
                    )}
                    
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Delete />}
                      onClick={() => handleBurnProperty(property.tokenId)}
                      color="error"
                    >
                      Burn
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Mint Property Dialog */}
      <Dialog open={mintDialogOpen} onClose={() => setMintDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Mint New Property</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Recipient Address"
            value={propertyForm.to}
            onChange={(e) => setPropertyForm({ ...propertyForm, to: e.target.value })}
            margin="normal"
            helperText="Address to receive the property NFT"
          />
          
          <TextField
            fullWidth
            label="Metadata URI"
            value={propertyForm.metadataURI}
            onChange={(e) => setPropertyForm({ ...propertyForm, metadataURI: e.target.value })}
            margin="normal"
            helperText="IPFS URI or URL to property metadata"
          />
          
          <TextField
            fullWidth
            label="Location"
            value={propertyForm.location}
            onChange={(e) => setPropertyForm({ ...propertyForm, location: e.target.value })}
            margin="normal"
            required
          />
          
          <TextField
            fullWidth
            label="Value (AVAX)"
            type="number"
            value={propertyForm.value}
            onChange={(e) => setPropertyForm({ ...propertyForm, value: e.target.value })}
            margin="normal"
            required
          />
          
          <TextField
            fullWidth
            label="Area (sq ft)"
            type="number"
            value={propertyForm.area}
            onChange={(e) => setPropertyForm({ ...propertyForm, area: e.target.value })}
            margin="normal"
            required
          />
          
          <FormControl fullWidth margin="normal">
            <InputLabel>Property Type</InputLabel>
            <Select
              value={propertyForm.propertyType}
              onChange={(e) => setPropertyForm({ ...propertyForm, propertyType: e.target.value })}
            >
              <MenuItem value="House">House</MenuItem>
              <MenuItem value="Apartment">Apartment</MenuItem>
              <MenuItem value="Condo">Condo</MenuItem>
              <MenuItem value="Commercial">Commercial</MenuItem>
              <MenuItem value="Land">Land</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMintDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleMintProperty} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={20} /> : 'Mint Property'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Update Property Dialog */}
      <Dialog open={updateDialogOpen} onClose={() => setUpdateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Update Property</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Token ID"
            value={updateForm.tokenId}
            onChange={(e) => setUpdateForm({ ...updateForm, tokenId: e.target.value })}
            margin="normal"
            disabled
          />
          
          <TextField
            fullWidth
            label="Location"
            value={updateForm.location}
            onChange={(e) => setUpdateForm({ ...updateForm, location: e.target.value })}
            margin="normal"
            required
          />
          
          <TextField
            fullWidth
            label="Value (AVAX)"
            type="number"
            value={updateForm.value}
            onChange={(e) => setUpdateForm({ ...updateForm, value: e.target.value })}
            margin="normal"
            required
          />
          
          <TextField
            fullWidth
            label="Area (sq ft)"
            type="number"
            value={updateForm.area}
            onChange={(e) => setUpdateForm({ ...updateForm, area: e.target.value })}
            margin="normal"
            required
          />
          
          <FormControl fullWidth margin="normal">
            <InputLabel>Property Type</InputLabel>
            <Select
              value={updateForm.propertyType}
              onChange={(e) => setUpdateForm({ ...updateForm, propertyType: e.target.value })}
            >
              <MenuItem value="House">House</MenuItem>
              <MenuItem value="Apartment">Apartment</MenuItem>
              <MenuItem value="Condo">Condo</MenuItem>
              <MenuItem value="Commercial">Commercial</MenuItem>
              <MenuItem value="Land">Land</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUpdateDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleUpdateProperty} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={20} /> : 'Update Property'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Set Encrypted Metadata Dialog */}
      <Dialog open={encryptedDialogOpen} onClose={() => setEncryptedDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Set Encrypted Metadata</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Token ID"
            value={encryptedForm.tokenId}
            onChange={(e) => setEncryptedForm({ ...encryptedForm, tokenId: e.target.value })}
            margin="normal"
            disabled
          />
          
          <TextField
            fullWidth
            label="Encrypted Data"
            value={encryptedForm.encryptedData}
            onChange={(e) => setEncryptedForm({ ...encryptedForm, encryptedData: e.target.value })}
            margin="normal"
            multiline
            rows={3}
            helperText="Enter encrypted metadata for privacy"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEncryptedDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSetEncryptedMetadata} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={20} /> : 'Set Encrypted Data'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PropertyManagement;
