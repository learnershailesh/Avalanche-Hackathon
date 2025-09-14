import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Tabs,
  Tab
} from '@mui/material';
import {
  Home,
  Token,
  AccountBalance,
  TrendingUp
} from '@mui/icons-material';
import { ethers } from 'ethers';
import { useWallet } from '../contexts/WalletContext';
import { useContracts } from '../hooks/useContracts';

const PropertyDashboard = () => {
  const { account, isConnected } = useWallet();
  const {
    getUserProperties,
    getFractionalizationData,
    isPropertyFractionalized,
    getEpochTotalDeposits,
    isClaimed
  } = useContracts();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [properties, setProperties] = useState([]);
  const [fractionalizedTokens, setFractionalizedTokens] = useState([]);
  const [rentalData, setRentalData] = useState([]);
  const loadingRef = useRef(false);
  const lastLoadTimeRef = useRef(0);

  // Load user data
  useEffect(() => {
    const loadUserData = async () => {
      // Prevent multiple simultaneous calls
      if (loadingRef.current) return;
      
      // Prevent rapid successive calls (minimum 3 seconds between calls)
      const now = Date.now();
      if (now - lastLoadTimeRef.current < 3000) return;
      
      if (account && isConnected) {
        loadingRef.current = true;
        lastLoadTimeRef.current = now;
        setLoading(true);
        try {
          // Load properties
          const userProperties = await getUserProperties();
          console.log('PropertyDashboard loaded properties:', userProperties);
          setProperties(userProperties);

          // Load fractionalized properties
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
          setFractionalizedTokens(fractionalized);

          // Load rental income data
          const rentalInfo = [];
          for (let i = 1; i <= 5; i++) {
            try {
              const deposits = await getEpochTotalDeposits(i);
              const claimed = await isClaimed(i);
              rentalInfo.push({
                epochId: i,
                totalDeposits: deposits,
                isClaimed: claimed
              });
            } catch (err) {
              rentalInfo.push({
                epochId: i,
                totalDeposits: '0',
                isClaimed: false
              });
            }
          }
          setRentalData(rentalInfo);
        } catch (err) {
          setError('Failed to load user data');
        } finally {
          setLoading(false);
          loadingRef.current = false;
        }
      }
    };
    loadUserData();
    
    // Cleanup function
    return () => {
      loadingRef.current = false;
    };
  }, [account, isConnected]); // Removed function dependencies to prevent infinite re-renders

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
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
          Please connect your Core Wallet to view your properties and manage your real estate portfolio.
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Property Dashboard
      </Typography>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="My Properties" icon={<Home />} />
          <Tab label="Fractionalized Tokens" icon={<Token />} />
          <Tab label="Rental Income" icon={<TrendingUp />} />
        </Tabs>
      </Box>

      {tabValue === 0 && (
        <Grid container spacing={3}>
          {loading ? (
            <Grid size={12}>
              <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress />
              </Box>
            </Grid>
          ) : properties.length === 0 ? (
            <Grid size={12}>
              <Card>
                <CardContent>
                  <Box textAlign="center" py={4}>
                    <Home sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                      No properties found
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      You don't have any properties yet
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ) : (
            properties.map((property) => (
              <Grid size={{ xs: 12, md: 6, lg: 4 }} key={property.tokenId}>
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
                    
                    <Box display="flex" gap={1}>
                      <Button
                        variant="outlined"
                        size="small"
                        disabled={!property.isVerified}
                      >
                        Fractionalize
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                      >
                        View Details
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      )}

      {tabValue === 1 && (
        <Grid container spacing={3}>
          {loading ? (
            <Grid size={12}>
              <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress />
              </Box>
            </Grid>
          ) : fractionalizedTokens.length === 0 ? (
            <Grid size={12}>
              <Card>
                <CardContent>
                  <Box textAlign="center" py={4}>
                    <Token sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                      No fractionalized properties
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Fractionalize your properties to create tradeable tokens
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ) : (
            fractionalizedTokens.map((property) => (
              <Grid size={{ xs: 12, md: 6, lg: 4 }} key={property.tokenId}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                      <Typography variant="h6" component="div">
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
                      <Box mb={2}>
                        <Typography variant="body2">
                          <strong>Token Address:</strong> {property.fractionalizationData.tokenAddress.slice(0, 10)}...
                        </Typography>
                        <Typography variant="body2">
                          <strong>Total Supply:</strong> {formatValue(property.fractionalizationData.totalSupply)}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Fractionalized:</strong> {formatTimestamp(property.fractionalizationData.timestamp)}
                        </Typography>
                      </Box>
                    )}
                    
                    <Box display="flex" gap={1}>
                      <Button
                        variant="outlined"
                        size="small"
                      >
                        Trade
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                      >
                        View Details
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      )}

      {tabValue === 2 && (
        <Box>
          <Alert severity="info" sx={{ mb: 3 }}>
            Rental income distribution is managed through Merkle proofs for gas efficiency.
          </Alert>
          
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Available Claims
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    You have rental income available to claim from your fractionalized properties.
                  </Typography>
                  
                  {rentalData.filter(epoch => !epoch.isClaimed && parseFloat(epoch.totalDeposits) > 0).length > 0 ? (
                    <Button
                      variant="contained"
                      startIcon={<TrendingUp />}
                    >
                      Claim Rental Income
                    </Button>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No claims available
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
            
            <Grid size={{ xs: 12, md: 6 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Claim History
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Track your rental income claims across different epochs.
                  </Typography>
                  
                  {rentalData.filter(epoch => epoch.isClaimed).length > 0 ? (
                    <Box>
                      {rentalData
                        .filter(epoch => epoch.isClaimed)
                        .map(epoch => (
                          <Box key={epoch.epochId} display="flex" justifyContent="space-between" alignItems="center" py={1}>
                            <Typography variant="body2">
                              Epoch #{epoch.epochId}
                            </Typography>
                            <Chip
                              label="Claimed"
                              color="success"
                              size="small"
                            />
                          </Box>
                        ))}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No claims made yet
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
};

export default PropertyDashboard;