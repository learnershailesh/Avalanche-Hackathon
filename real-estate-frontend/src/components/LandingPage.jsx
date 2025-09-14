import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Container,
  Grid,
  Card,
  CardContent,
  Chip,
  Avatar,
  Paper,
  useTheme,
  useMediaQuery,
  Fade,
  Slide,
  Zoom,
  Stack,
  Divider
} from '@mui/material';
import {
  AccountBalance,
  Token,
  TrendingUp,
  VerifiedUser,
  Business,
  Security,
  Speed,
  Public,
  Star,
  ArrowForward,
  CheckCircle,
  People,
  AttachMoney,
  Home,
  Shield,
  FlashOn
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';

const LandingPage = () => {
  const navigate = useNavigate();
  const { isConnected, account } = useWallet();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [currentFeature, setCurrentFeature] = useState(0);

  const features = [
    {
      icon: <Business />,
      title: "Property Tokenization",
      description: "Transform real estate into digital assets on Avalanche blockchain",
      color: "#2563eb",
      gradient: "linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)"
    },
    {
      icon: <Token />,
      title: "Fractional Ownership",
      description: "Own premium properties with investments as low as $100",
      color: "#7c3aed",
      gradient: "linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)"
    },
    {
      icon: <TrendingUp />,
      title: "Rental Income",
      description: "Earn passive income through automated rental distributions",
      color: "#10b981",
      gradient: "linear-gradient(135deg, #10b981 0%, #34d399 100%)"
    },
    {
      icon: <VerifiedUser />,
      title: "KYC Compliance",
      description: "Built-in regulatory compliance and identity verification",
      color: "#f59e0b",
      gradient: "linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)"
    }
  ];

  const stats = [
    { number: "1,200+", label: "Properties Listed", icon: <Home />, color: "#2563eb" },
    { number: "$75M+", label: "Total Value", icon: <AttachMoney />, color: "#10b981" },
    { number: "15K+", label: "Active Users", icon: <People />, color: "#7c3aed" },
    { number: "99.9%", label: "Uptime", icon: <Shield />, color: "#f59e0b" }
  ];

  const benefits = [
    {
      icon: <Speed />,
      title: "Lightning Fast",
      description: "Sub-second finality with Avalanche's consensus mechanism",
      color: "#2563eb"
    },
    {
      icon: <Security />,
      title: "Bank-Grade Security",
      description: "Military-grade encryption and smart contract security",
      color: "#10b981"
    },
    {
      icon: <Public />,
      title: "Global Access",
      description: "Trade real estate 24/7 from anywhere in the world",
      color: "#7c3aed"
    },
    {
      icon: <FlashOn />,
      title: "Low Fees",
      description: "Minimal transaction costs compared to traditional real estate",
      color: "#f59e0b"
    }
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Real Estate Investor",
      avatar: "SC",
      content: "This platform revolutionized my investment strategy. The fractional ownership model is brilliant!",
      rating: 5
    },
    {
      name: "Michael Rodriguez",
      role: "Crypto Enthusiast",
      avatar: "MR",
      content: "Finally, a way to combine my passion for crypto with real estate. The UI is absolutely stunning!",
      rating: 5
    },
    {
      name: "Emily Johnson",
      role: "Property Manager",
      avatar: "EJ",
      content: "The rental income distribution is seamless. My tenants love the transparency and efficiency!",
      rating: 5
    }
  ];

  const steps = [
    {
      step: "01",
      title: "Complete KYC",
      description: "Verify your identity with our secure compliance system",
      icon: <VerifiedUser />
    },
    {
      step: "02",
      title: "Browse Properties",
      description: "Explore tokenized real estate properties worldwide",
      icon: <Business />
    },
    {
      step: "03",
      title: "Purchase Tokens",
      description: "Buy fractional ownership with AVAX or other cryptocurrencies",
      icon: <Token />
    },
    {
      step: "04",
      title: "Earn Returns",
      description: "Receive rental income and benefit from property appreciation",
      icon: <TrendingUp />
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [features.length]);

  const handleGetStarted = () => {
    if (isConnected) {
      navigate('/properties');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%)',
          color: 'white',
          py: { xs: 8, md: 12 },
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Background Pattern */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(124, 58, 237, 0.1) 0%, transparent 50%)',
            zIndex: 0
          }}
        />
        
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <Fade in timeout={1000}>
                <Box>
                  <Chip
                    label="Powered by Avalanche"
                    sx={{
                      mb: 3,
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      color: '#60a5fa',
                      border: '1px solid rgba(59, 130, 246, 0.2)',
                      fontWeight: 600
                    }}
                  />
                  <Typography
                    variant="h1"
                    sx={{
                      fontWeight: 800,
                      mb: 3,
                      fontSize: { xs: '2.5rem', md: '4rem' },
                      lineHeight: 1.1,
                      background: 'linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}
                  >
                    Real Estate
                    <br />
                    <Box component="span" sx={{ 
                      background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}>
                      Reimagined
                    </Box>
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{
                      mb: 4,
                      opacity: 0.9,
                      fontSize: { xs: '1.1rem', md: '1.3rem' },
                      lineHeight: 1.6,
                      color: '#cbd5e1'
                    }}
                  >
                    Tokenize, fractionalize, and trade real estate like never before.
                    Own a piece of premium properties with cryptocurrency.
                  </Typography>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 4 }}>
                    <Button
                      variant="contained"
                      size="large"
                      onClick={handleGetStarted}
                      endIcon={<ArrowForward />}
                      sx={{
                        background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                        color: 'white',
                        px: 4,
                        py: 1.5,
                        fontSize: '1.1rem',
                        fontWeight: 700,
                        borderRadius: 2,
                        boxShadow: '0 4px 14px 0 rgba(59, 130, 246, 0.4)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 8px 25px 0 rgba(59, 130, 246, 0.4)'
                        },
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                    >
                      {isConnected ? 'Explore Properties' : 'Get Started Free'}
                    </Button>
                    <Button
                      variant="outlined"
                      size="large"
                      onClick={() => navigate('/kyc')}
                      sx={{
                        borderColor: 'rgba(255, 255, 255, 0.3)',
                        color: 'white',
                        px: 4,
                        py: 1.5,
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        borderRadius: 2,
                        borderWidth: 2,
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          borderColor: 'rgba(255, 255, 255, 0.5)',
                          borderWidth: 2
                        }
                      }}
                    >
                      Start KYC
                    </Button>
                  </Stack>
                  
                  {/* Trust Indicators */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CheckCircle sx={{ color: '#10b981', fontSize: '1.2rem' }} />
                      <Typography variant="body2" sx={{ color: '#cbd5e1' }}>
                        No Setup Fees
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CheckCircle sx={{ color: '#10b981', fontSize: '1.2rem' }} />
                      <Typography variant="body2" sx={{ color: '#cbd5e1' }}>
                        Instant Trading
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CheckCircle sx={{ color: '#10b981', fontSize: '1.2rem' }} />
                      <Typography variant="body2" sx={{ color: '#cbd5e1' }}>
                        Global Access
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Fade>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Fade in timeout={1500}>
                <Box sx={{ position: 'relative' }}>
                  <Paper
                    elevation={0}
                    sx={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      backdropFilter: 'blur(20px)',
                      borderRadius: 4,
                      p: 4,
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                    }}
                  >
                    <Typography variant="h6" sx={{ mb: 3, textAlign: 'center', fontWeight: 600 }}>
                      Platform Features
                    </Typography>
                    <Grid container spacing={2}>
                      {features.map((feature, index) => (
                        <Grid item xs={6} key={index}>
                          <Card
                            sx={{
                              p: 2,
                              background: currentFeature === index 
                                ? 'rgba(255, 255, 255, 0.1)' 
                                : 'rgba(255, 255, 255, 0.05)',
                              border: currentFeature === index 
                                ? '1px solid rgba(255, 255, 255, 0.2)' 
                                : '1px solid rgba(255, 255, 255, 0.1)',
                              borderRadius: 2,
                              cursor: 'pointer',
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                background: 'rgba(255, 255, 255, 0.1)',
                                transform: 'translateY(-2px)'
                              }
                            }}
                            onClick={() => setCurrentFeature(index)}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <Box
                                sx={{
                                  color: feature.color,
                                  mr: 1.5,
                                  fontSize: '1.5rem'
                                }}
                              >
                                {feature.icon}
                              </Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                                {feature.title}
                              </Typography>
                            </Box>
                            <Typography variant="caption" sx={{ opacity: 0.8, fontSize: '0.75rem' }}>
                              {feature.description}
                            </Typography>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </Paper>
                </Box>
              </Fade>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Stats Section */}
      <Box sx={{ py: 8, backgroundColor: 'white' }}>
        <Container maxWidth="lg">
          <Slide in timeout={1000}>
            <Grid container spacing={4}>
              {stats.map((stat, index) => (
                <Grid item xs={6} md={3} key={index}>
                  <Card
                    sx={{
                      textAlign: 'center',
                      p: 4,
                      height: '100%',
                      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                      border: '1px solid #e2e8f0',
                      borderRadius: 3,
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                      },
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                  >
                    <CardContent>
                      <Box
                        sx={{
                          color: stat.color,
                          mb: 2,
                          fontSize: '2.5rem'
                        }}
                      >
                        {stat.icon}
                      </Box>
                      <Typography
                        variant="h3"
                        sx={{
                          fontWeight: 800,
                          color: stat.color,
                          mb: 1,
                          fontSize: { xs: '1.8rem', md: '2.5rem' }
                        }}
                      >
                        {stat.number}
                      </Typography>
                      <Typography variant="body1" sx={{ color: '#64748b', fontWeight: 500 }}>
                        {stat.label}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Slide>
        </Container>
      </Box>

      {/* Features Section */}
      <Box sx={{ py: 12, backgroundColor: '#f8fafc' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 10 }}>
            <Typography
              variant="h2"
              sx={{
                fontWeight: 800,
                mb: 3,
                color: '#1e293b',
                fontSize: { xs: '2rem', md: '3rem' }
              }}
            >
              Why Choose Our Platform?
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: '#64748b',
                maxWidth: '600px',
                mx: 'auto',
                fontSize: '1.2rem',
                lineHeight: 1.6
              }}
            >
              Experience the future of real estate investment with cutting-edge blockchain technology
            </Typography>
          </Box>
          
          <Grid container spacing={6}>
            {benefits.map((benefit, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Zoom in timeout={1000 + index * 200}>
                  <Card
                    sx={{
                      p: 4,
                      height: '100%',
                      background: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: 3,
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                      },
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3 }}>
                      <Box
                        sx={{
                          background: `linear-gradient(135deg, ${benefit.color}20 0%, ${benefit.color}10 100%)`,
                          color: benefit.color,
                          borderRadius: 2,
                          p: 2,
                          fontSize: '2rem',
                          minWidth: '60px',
                          height: '60px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {benefit.icon}
                      </Box>
                      <Box>
                        <Typography
                          variant="h5"
                          sx={{
                            fontWeight: 700,
                            mb: 2,
                            color: '#1e293b'
                          }}
                        >
                          {benefit.title}
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#64748b', lineHeight: 1.6 }}>
                          {benefit.description}
                        </Typography>
                      </Box>
                    </Box>
                  </Card>
                </Zoom>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* How It Works Section */}
      <Box sx={{ py: 12, backgroundColor: 'white' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 10 }}>
            <Typography
              variant="h2"
              sx={{
                fontWeight: 800,
                mb: 3,
                color: '#1e293b',
                fontSize: { xs: '2rem', md: '3rem' }
              }}
            >
              How It Works
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: '#64748b',
                maxWidth: '600px',
                mx: 'auto',
                fontSize: '1.2rem',
                lineHeight: 1.6
              }}
            >
              Get started in just a few simple steps
            </Typography>
          </Box>
          
          <Grid container spacing={4}>
            {steps.map((step, index) => (
              <Grid item xs={12} md={3} key={index}>
                <Box sx={{ textAlign: 'center', position: 'relative' }}>
                  {/* Connection Line */}
                  {index < steps.length - 1 && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: '40px',
                        left: '50%',
                        right: '-50%',
                        height: '2px',
                        background: 'linear-gradient(90deg, #e2e8f0 0%, #cbd5e1 100%)',
                        zIndex: 0,
                        display: { xs: 'none', md: 'block' }
                      }}
                    />
                  )}
                  
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 3,
                      fontSize: '1.5rem',
                      fontWeight: 800,
                      position: 'relative',
                      zIndex: 1,
                      boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.4)'
                    }}
                  >
                    {step.step}
                  </Box>
                  
                  <Box
                    sx={{
                      color: '#3b82f6',
                      mb: 2,
                      fontSize: '2rem'
                    }}
                  >
                    {step.icon}
                  </Box>
                  
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 700,
                      mb: 2,
                      color: '#1e293b'
                    }}
                  >
                    {step.title}
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#64748b', lineHeight: 1.6 }}>
                    {step.description}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Testimonials Section */}
      <Box sx={{ py: 12, backgroundColor: '#f8fafc' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 10 }}>
            <Typography
              variant="h2"
              sx={{
                fontWeight: 800,
                mb: 3,
                color: '#1e293b',
                fontSize: { xs: '2rem', md: '3rem' }
              }}
            >
              What Our Users Say
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: '#64748b',
                maxWidth: '600px',
                mx: 'auto',
                fontSize: '1.2rem',
                lineHeight: 1.6
              }}
            >
              Join thousands of satisfied investors worldwide
            </Typography>
          </Box>
          
          <Grid container spacing={4}>
            {testimonials.map((testimonial, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card
                  sx={{
                    p: 4,
                    height: '100%',
                    background: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: 3,
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                    },
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Avatar
                      sx={{
                        background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                        mr: 2,
                        width: 50,
                        height: 50,
                        fontWeight: 700
                      }}
                    >
                      {testimonial.avatar}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>
                        {testimonial.name}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#64748b' }}>
                        {testimonial.role}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Typography variant="body1" sx={{ fontStyle: 'italic', mb: 3, lineHeight: 1.6, color: '#475569' }}>
                    "{testimonial.content}"
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} sx={{ color: '#fbbf24', fontSize: '1.2rem' }} />
                    ))}
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box
        sx={{
          py: 12,
          background: 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%)',
          color: 'white',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Background Pattern */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 30% 70%, rgba(59, 130, 246, 0.1) 0%, transparent 50%), radial-gradient(circle at 70% 30%, rgba(124, 58, 237, 0.1) 0%, transparent 50%)',
            zIndex: 0
          }}
        />
        
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              variant="h2"
              sx={{
                fontWeight: 800,
                mb: 3,
                fontSize: { xs: '2rem', md: '3rem' }
              }}
            >
              Ready to Start Investing?
            </Typography>
            <Typography
              variant="h6"
              sx={{
                mb: 6,
                opacity: 0.9,
                maxWidth: '600px',
                mx: 'auto',
                fontSize: '1.2rem',
                lineHeight: 1.6
              }}
            >
              Join the future of real estate investment today. Start with as little as $100 and own a piece of premium properties.
            </Typography>
            
            <Stack 
              direction={{ xs: 'column', sm: 'row' }} 
              spacing={3} 
              sx={{ 
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <Button
                variant="contained"
                size="large"
                onClick={handleGetStarted}
                endIcon={<ArrowForward />}
                sx={{
                  background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                  color: 'white',
                  px: 6,
                  py: 2,
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  borderRadius: 2,
                  boxShadow: '0 4px 14px 0 rgba(59, 130, 246, 0.4)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px 0 rgba(59, 130, 246, 0.4)'
                  },
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                {isConnected ? 'Explore Properties' : 'Get Started Free'}
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate('/kyc')}
                sx={{
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  color: 'white',
                  px: 6,
                  py: 2,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  borderRadius: 2,
                  borderWidth: 2,
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                    borderWidth: 2
                  }
                }}
              >
                Complete KYC
              </Button>
            </Stack>
          </Box>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ py: 8, backgroundColor: '#1e293b', color: 'white' }}>
        <Container maxWidth="lg">
          <Grid container spacing={6}>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <AccountBalance sx={{ mr: 1, fontSize: '2rem', color: '#3b82f6' }} />
                <Typography variant="h5" sx={{ fontWeight: 800 }}>
                  Avalanche Real Estate
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ opacity: 0.8, lineHeight: 1.6, mb: 3 }}>
                The future of real estate investment is here. Tokenize, trade, and earn with cutting-edge blockchain technology.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Chip label="Avalanche" color="primary" size="small" />
                <Chip label="DeFi" color="secondary" size="small" />
                <Chip label="Real Estate" sx={{ backgroundColor: '#10b981', color: 'white' }} size="small" />
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                Quick Links
              </Typography>
              <Stack spacing={1}>
                {[
                  { label: 'Dashboard', path: '/dashboard' },
                  { label: 'Properties', path: '/properties' },
                  { label: 'KYC Management', path: '/kyc' },
                  { label: 'Fractionalization', path: '/fractionalization' },
                  { label: 'Rental Income', path: '/rental-income' },
                  { label: 'Admin Panel', path: '/admin' }
                ].map((link) => (
                  <Button
                    key={link.path}
                    color="inherit"
                    onClick={() => navigate(link.path)}
                    sx={{ 
                      justifyContent: 'flex-start', 
                      textTransform: 'none',
                      opacity: 0.8,
                      '&:hover': { opacity: 1 }
                    }}
                  >
                    {link.label}
                  </Button>
                ))}
              </Stack>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                Features
              </Typography>
              <Stack spacing={1}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircle sx={{ color: '#10b981', fontSize: '1rem' }} />
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Property Tokenization
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircle sx={{ color: '#10b981', fontSize: '1rem' }} />
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Fractional Ownership
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircle sx={{ color: '#10b981', fontSize: '1rem' }} />
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Rental Income Distribution
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircle sx={{ color: '#10b981', fontSize: '1rem' }} />
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    KYC Compliance
                  </Typography>
                </Box>
              </Stack>
            </Grid>
          </Grid>
          
          <Divider sx={{ my: 4, borderColor: 'rgba(255, 255, 255, 0.1)' }} />
          
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" sx={{ opacity: 0.6 }}>
              © 2024 Avalanche Real Estate. Built on Avalanche Blockchain. All rights reserved.
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage;