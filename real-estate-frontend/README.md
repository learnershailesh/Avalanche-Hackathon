# 🏠 Avalanche Real Estate Platform Frontend

A modern Web3 frontend for the Avalanche Real Estate Platform, built with React and Material-UI, integrated with Core Wallet.

## 🚀 Features

- **Core Wallet Integration**: Seamless connection with Avalanche's official wallet
- **Property Management**: View and manage your real estate properties
- **KYC Compliance**: Submit and verify your identity
- **Property Fractionalization**: Convert properties into tradeable tokens
- **Rental Income Distribution**: Claim rental income using Merkle proofs
- **Responsive Design**: Works on desktop and mobile devices

## 🛠️ Tech Stack

- **React 19**: Modern React with hooks
- **Material-UI**: Beautiful, responsive UI components
- **Ethers.js v5**: Ethereum/Avalanche blockchain interaction
- **Avalanche.js**: Avalanche-specific utilities
- **Vite**: Fast build tool and dev server

## 📦 Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Build for production:**
   ```bash
   npm run build
   ```

## 🔗 Smart Contract Integration

The frontend is connected to the following deployed contracts on Avalanche Testnet:

- **ComplianceRegistry**: `0x67b05db7F8BE825eDac5158F0efb02565726a073`
- **TitleNFT**: `0x3733c466f293841886653B4cC1B1F0a89D6746Aa`
- **Fractionalizer**: `0x779672A76b1358b42b4aEc5B0786503DA2f626cB`
- **RentPoolMerkle**: `0x846E9f0Bd90b6BEFB7024A6Eba6a0B2CeC002FCD`

## 🎯 Getting Started

1. **Install Core Wallet**: Download from [core.app](https://core.app/)
2. **Connect Wallet**: Click "Connect Wallet" in the header
3. **Switch to Avalanche Testnet**: The app will prompt you to switch networks
4. **Get Testnet AVAX**: Visit the [Avalanche Faucet](https://faucet.avax-test.network/)

## 🏗️ Project Structure

```
src/
├── components/          # React components
│   ├── Header.jsx      # Navigation header
│   ├── WalletConnection.jsx  # Wallet connection modal
│   └── PropertyDashboard.jsx # Main dashboard
├── hooks/              # Custom React hooks
│   ├── useCoreWallet.js    # Core Wallet integration
│   └── useContracts.js     # Smart contract interactions
├── config/             # Configuration files
│   └── contracts.js    # Contract addresses and network config
└── App.jsx             # Main application component
```

## 🔧 Configuration

### Network Configuration
The app is configured for Avalanche Testnet by default. To switch to mainnet:

1. Update `CURRENT_NETWORK` in `src/config/contracts.js`
2. Update contract addresses to mainnet deployments
3. Update RPC URLs and block explorer URLs

### Contract Addresses
Update contract addresses in `src/config/contracts.js` if you deploy to different networks.

## 🎨 Customization

### Theme
The app uses a custom Material-UI theme with Avalanche colors. Modify `src/App.jsx` to customize:

- Primary color: Avalanche red (#E84142)
- Secondary color: Avalanche orange (#FF6B35)
- Typography and component styles

### Styling
Global styles are in `src/App.css`. Component-specific styles use Material-UI's `sx` prop.

## 🚀 Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variables if needed
4. Deploy

### Netlify
1. Build the project: `npm run build`
2. Upload `dist` folder to Netlify
3. Configure redirects for SPA routing

### Environment Variables
Create `.env.local` for local development:
```
VITE_CONTRACT_REGISTRY=0x67b05db7F8BE825eDac5158F0efb02565726a073
VITE_CONTRACT_TITLE_NFT=0x3733c466f293841886653B4cC1B1F0a89D6746Aa
VITE_CONTRACT_FRACTIONALIZER=0x779672A76b1358b42b4aEc5B0786503DA2f626cB
VITE_CONTRACT_RENT_POOL=0x846E9f0Bd90b6BEFB7024A6Eba6a0B2CeC002FCD
```

## 🧪 Testing

The app includes mock data for demonstration. To test with real contracts:

1. Ensure you have testnet AVAX
2. Connect Core Wallet
3. Try the different features:
   - Property minting
   - KYC submission
   - Property fractionalization
   - Rental income claiming

## 🐛 Troubleshooting

### Common Issues

1. **"Core Wallet not detected"**
   - Ensure Core Wallet is installed and unlocked
   - Refresh the page

2. **"Wrong network"**
   - The app will prompt to switch to Avalanche Testnet
   - Click "Switch Network" when prompted

3. **"Transaction failed"**
   - Check you have enough AVAX for gas
   - Ensure you're on the correct network
   - Check contract addresses are correct

4. **"Contract not initialized"**
   - Ensure wallet is connected
   - Check network connection
   - Verify contract addresses

## 📱 Mobile Support

The app is fully responsive and works on mobile devices. Core Wallet mobile app is supported.

## 🔒 Security

- All transactions require user confirmation
- Private keys never leave the wallet
- Contract interactions use read-only methods when possible
- Input validation on all user inputs

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For issues and questions:
- Check the troubleshooting section
- Open an issue on GitHub
- Contact the development team

---

**Built with ❤️ for the Avalanche ecosystem**