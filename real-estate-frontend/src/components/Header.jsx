import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Alert
} from '@mui/material';
import {
  AccountBalanceWallet,
  AccountBalance,
  MoreVert,
  Menu as MenuIcon,
  Home,
  VerifiedUser,
  Business,
  Token,
  TrendingUp,
  AdminPanelSettings
} from '@mui/icons-material';
import { useWallet } from '../contexts/WalletContext';
import WalletConnection from './WalletConnection';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { account, isConnected, disconnect, balance, error } = useWallet();
  const [walletDialogOpen, setWalletDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDisconnect = () => {
    console.log('Disconnect button clicked');
    disconnect();
    handleMenuClose();
    console.log('Disconnect completed');
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const navigationItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <Home /> },
    { path: '/kyc', label: 'KYC Management', icon: <VerifiedUser /> },
    { path: '/properties', label: 'Properties', icon: <Business /> },
    { path: '/fractionalization', label: 'Fractionalization', icon: <Token /> },
    { path: '/rental-income', label: 'Rental Income', icon: <TrendingUp /> },
    { path: '/admin', label: 'Admin Panel', icon: <AdminPanelSettings /> }
  ];

  const isActivePath = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname === path;
  };

  // Hide navigation on landing page
  const isLandingPage = location.pathname === '/';

  const NavigationMenu = ({ isMobile = false }) => {
    const handleNavigation = (path) => {
      console.log('Navigation clicked:', path);
      console.log('Current location:', location.pathname);
      navigate(path);
      console.log('Navigation completed');
    };

    return (
      <Box display="flex" alignItems="center" gap={1}>
        {isMobile ? (
          <List>
            {navigationItems.map((item) => (
              <ListItem
                key={item.path}
                button
                onClick={() => {
                  handleNavigation(item.path);
                  setMobileDrawerOpen(false);
                }}
                selected={isActivePath(item.path)}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItem>
            ))}
          </List>
        ) : (
          navigationItems.map((item) => (
            <Button
              key={item.path}
              color="inherit"
              startIcon={item.icon}
              onClick={() => handleNavigation(item.path)}
            sx={{
              backgroundColor: isActivePath(item.path) ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
              color: isActivePath(item.path) ? '#3b82f6' : '#64748b',
              fontWeight: isActivePath(item.path) ? 600 : 500,
              borderRadius: 2,
              '&:hover': {
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                color: '#3b82f6'
              },
              pointerEvents: 'auto',
              cursor: 'pointer',
              minWidth: 'auto',
              padding: '8px 16px',
              transition: 'all 0.2s ease'
            }}
            >
              {item.label}
            </Button>
          ))
        )}
      </Box>
    );
  };

  return (
    <>
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 0 }}
          action={
            error.includes('switch to Avalanche Testnet') ? (
              <Button 
                color="inherit" 
                size="small" 
                onClick={() => window.location.reload()}
              >
                Switch Network
              </Button>
            ) : null
          }
        >
          {error}
        </Alert>
      )}
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <Box display="flex" alignItems="center" gap={2} flexGrow={1}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white'
                }}
              >
                <AccountBalance />
              </Box>
              <Typography variant="h6" component="div" sx={{ fontWeight: 700, color: '#1e293b' }}>
                Avalanche Real Estate
              </Typography>
            </Box>
            <Chip 
              label="Testnet" 
              size="small" 
              sx={{ 
                backgroundColor: '#dbeafe',
                color: '#1e40af',
                fontWeight: 600,
                border: '1px solid #bfdbfe'
              }}
            />
          </Box>

          {/* Desktop Navigation */}
          {!isLandingPage && (
            <Box display={{ xs: 'none', md: 'flex' }} alignItems="center" gap={2}>
              <NavigationMenu />
            </Box>
          )}

          {/* Mobile Menu Button */}
          {!isLandingPage && (
            <IconButton
              color="inherit"
              onClick={() => setMobileDrawerOpen(true)}
              sx={{ display: { xs: 'block', md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
          )}

          <Box display="flex" alignItems="center" gap={2} ml={2}>
            {isConnected ? (
              <>
                <Box 
                  display="flex" 
                  alignItems="center" 
                  gap={2}
                  sx={{
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderRadius: 2,
                    padding: '8px 12px',
                    border: '1px solid rgba(59, 130, 246, 0.2)'
                  }}
                >
                  <Typography variant="body2" sx={{ color: '#1e293b', fontWeight: 600 }}>
                    {formatAddress(account)}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#10b981', fontWeight: 600 }}>
                    {balance} AVAX
                  </Typography>
                </Box>
                
                {/* Disconnect Button */}
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleDisconnect}
                  sx={{
                    borderColor: '#ef4444',
                    color: '#ef4444',
                    fontWeight: 600,
                    borderRadius: 2,
                    px: 2,
                    py: 0.5,
                    fontSize: '0.75rem',
                    '&:hover': {
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      borderColor: '#dc2626',
                      color: '#dc2626'
                    },
                    transition: 'all 0.2s ease'
                  }}
                >
                  Disconnect
                </Button>
                
                {/* Menu Button for additional options */}
                <IconButton
                  color="inherit"
                  onClick={handleMenuClick}
                  sx={{ color: '#64748b' }}
                >
                  <MoreVert />
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleMenuClose}
                  PaperProps={{
                    sx: {
                      borderRadius: 2,
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                      border: '1px solid #e2e8f0'
                    }
                  }}
                >
                  <MenuItem 
                    onClick={() => {
                      handleMenuClose();
                      setWalletDialogOpen(true);
                    }}
                    sx={{ 
                      color: '#1e293b',
                      fontWeight: 500,
                      '&:hover': {
                        backgroundColor: 'rgba(59, 130, 246, 0.1)'
                      }
                    }}
                  >
                    Wallet Details
                  </MenuItem>
                  <MenuItem 
                    onClick={handleDisconnect}
                    sx={{ 
                      color: '#ef4444',
                      fontWeight: 500,
                      '&:hover': {
                        backgroundColor: 'rgba(239, 68, 68, 0.1)'
                      }
                    }}
                  >
                    Disconnect Wallet
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <Button
                variant="contained"
                onClick={() => setWalletDialogOpen(true)}
                startIcon={<AccountBalanceWallet />}
                sx={{
                  background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                  color: 'white',
                  fontWeight: 600,
                  borderRadius: 2,
                  px: 3,
                  py: 1,
                  boxShadow: '0 4px 14px 0 rgba(59, 130, 246, 0.4)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 6px 20px 0 rgba(59, 130, 246, 0.4)'
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                Connect Wallet
              </Button>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      {!isLandingPage && (
        <Drawer
          anchor="left"
          open={mobileDrawerOpen}
          onClose={() => setMobileDrawerOpen(false)}
        >
          <Box sx={{ width: 250, pt: 2 }}>
            <Box px={2} pb={2}>
              <Typography variant="h6" gutterBottom>
                Navigation
              </Typography>
              <Divider />
            </Box>
            <NavigationMenu isMobile />
          </Box>
        </Drawer>
      )}

      <WalletConnection
        open={walletDialogOpen}
        onClose={() => setWalletDialogOpen(false)}
      />
    </>
  );
};

export default Header;