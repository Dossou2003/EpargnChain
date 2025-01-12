// Configuration globale
window.CONFIG = {
    // Network Constants
    BSC_TESTNET_CHAIN_ID: '0x61',
    NETWORK_NAME: 'BSC Testnet',
    RPC_URLS: [
        'https://data-seed-prebsc-1-s1.binance.org:8545/'                    // Backup 1
    ],
    BLOCK_EXPLORER_URL: 'https://testnet.bscscan.com/',

    // Contract Addresses
    VASS_ADDRESS: '0xDeE8941520D1c5d6bf9BC73B7B6e7B8C7116490b', // Adresse du token VASS/USDT
    PANCAKE_INTEGRATION_ADDRESS: '0x1C1e9B8eDbFC5994580Ec2969373af30beDa655E',
    USDT_ADDRESS: '0xDeE8941520D1c5d6bf9BC73B7B6e7B8C7116490b',  // Mise à jour avec la bonne adresse USDT
    CAKE_ADDRESS: '0xFa60D973F7642B748046464e165A65B7323b0DEE',  // Updated CAKE address
    MASTERCHEF_ADDRESS: '0xB4A466911556e39210a6bB2FaECBB59E4eB7E43d',  // Updated to MasterChef v2
    LPTOKEN_ADDRESS: '0xb98C30fA9f5e9cf6749B7021b4DDc0DBFe73b73e',  // Updated to CAKE-BUSD LP
    PANCAKE_ROUTER_ADDRESS: '0xD99D1c33F9fC3444f8101754aBC46c52416550D1',
    SAVINGS_ADDRESS: '0x68B19253271A10Ba6E890F6332CF88F4C8F736b4',  // Mise à jour avec la bonne adresse du contrat
    GROUP_SAVINGS_ADDRESS: '0xe8d404bB92fd8481b065874f78Ee0Cffeb6164b1',
    
    // BSC Testnet Token Addresses
    WBNB_ADDRESS: '0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd',  // Wrapped BNB on BSC Testnet
    BUSD_ADDRESS: '0x8516Fc284AEEaa0374E66037BD2309349FF728eA',  // Updated BUSD address

    // Contract Constants
    CAKE_DECIMALS: 18,
    USDT_DECIMALS: 18,  // BUSD utilise 18 décimales

    // UI Constants
    UI_UPDATE_INTERVAL: 5000,      // 5 secondes
    NOTIFICATION_DURATION: 3000,
    LOADING_TIMEOUT: 30000,
    REFRESH_INTERVAL: 15000,
    MAX_DECIMALS: 6,
    CACHE_TTL: 30000,             // 30 secondes
    ERROR_DISPLAY_DURATION: 5000,
    SUCCESS_DISPLAY_DURATION: 3000,

    // RPC Settings
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000,
    HEALTH_CHECK_INTERVAL: 30000,
    
    // Contract Settings
    GAS_LIMIT_MULTIPLIER: 1.2,
    DEFAULT_GAS_LIMIT: 3000000,

    // BSC Testnet Config
    BSC_TESTNET_CONFIG: {
        chainId: '0x61',
        chainName: 'BSC Testnet',
        nativeCurrency: {
            name: 'BNB',
            symbol: 'tBNB',
            decimals: 18
        },
        rpcUrls: ['https://data-seed-prebsc-1-s1.binance.org:8545/'],
        blockExplorerUrls: ['https://testnet.bscscan.com/']
    },

    // Savings Durations
    SAVINGS_DURATIONS: [
        { days: 30, apy: 20 },
        { days: 90, apy: 25 },
        { days: 180, apy: 30 },
        { days: 365, apy: 35 }
    ],

    // Fees Configuration
    FEES: {
        DEPOSIT: 0.5,
        MANAGEMENT: 1,
        EARLY_WITHDRAW: 3
    }
};

const contractConfig = {
    addresses: {
        vassToken: '0xDeE8941520D1c5d6bf9BC73B7B6e7B8C7116490b',
        savingsV3: '0x...' // Ajoutez l'adresse de votre contrat SavingsV3 ici
    },
    networks: {
        bscTestnet: {
            chainId: '0x61',
            chainName: 'BSC Testnet',
            nativeCurrency: {
                name: 'BNB',
                symbol: 'BNB',
                decimals: 18
            },
            rpcUrls: ['https://data-seed-prebsc-1-s1.binance.org:8545/'],
            blockExplorerUrls: ['https://testnet.bscscan.com']
        }
    }
};

window.contractConfig = contractConfig;
