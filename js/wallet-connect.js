if (typeof window !== 'undefined' && !window.WalletConnect) {
    class WalletConnect {
        constructor() {
            this.provider = null;
            this.signer = null;
            this.isConnected = false;
            this.currentAccount = null;
            this.vassContract = null;
            this.init();
        }

        init() {
            if (typeof window.ethereum === 'undefined') {
                console.warn('MetaMask n\'est pas installé');
                return;
            }

            // Écouteurs d'événements MetaMask
            window.ethereum.on('accountsChanged', this.handleAccountsChanged.bind(this));
            window.ethereum.on('chainChanged', this.handleChainChanged.bind(this));
            window.ethereum.on('connect', this.handleConnect.bind(this));
            window.ethereum.on('disconnect', this.handleDisconnect.bind(this));

            // Vérifier immédiatement si déjà connecté
            this.checkConnection();
        }

        async checkConnection() {
            try {
                if (!window.ethereum) return;

                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                console.log('Checking connection, accounts:', accounts);

                if (accounts && accounts.length > 0) {
                    console.log('Account found:', accounts[0]);
                    await this.initializeConnection(accounts[0]);
                } else {
                    console.log('No account found');
                    this.resetState();
                }
            } catch (error) {
                console.error('Error checking connection:', error);
                this.resetState();
            }
        }

        async connect() {
            try {
                if (!window.ethereum) {
                    throw new Error('MetaMask is not installed');
                }

                console.log('Requesting account access...');
                const accounts = await window.ethereum.request({
                    method: 'eth_requestAccounts'
                });

                if (!accounts || accounts.length === 0) {
                    throw new Error('No account access granted');
                }

                await this.initializeConnection(accounts[0]);
                await this.checkAndSwitchNetwork();
                await this.updateBalances();

                return true;
            } catch (error) {
                console.error('Connection error:', error);
                this.resetState();
                return false;
            }
        }

        async checkAndSwitchNetwork() {
            try {
                const chainId = await window.ethereum.request({ method: 'eth_chainId' });
                const bscTestnetChainId = '0x61'; // BSC Testnet
                
                if (chainId !== bscTestnetChainId) {
                    try {
                        await window.ethereum.request({
                            method: 'wallet_switchEthereumChain',
                            params: [{ chainId: bscTestnetChainId }],
                        });
                    } catch (switchError) {
                        if (switchError.code === 4902) {
                            await window.ethereum.request({
                                method: 'wallet_addEthereumChain',
                                params: [{
                                    chainId: bscTestnetChainId,
                                    chainName: 'BSC Testnet',
                                    nativeCurrency: {
                                        name: 'BNB',
                                        symbol: 'BNB',
                                        decimals: 18
                                    },
                                    rpcUrls: ['https://data-seed-prebsc-1-s1.binance.org:8545/'],
                                    blockExplorerUrls: ['https://testnet.bscscan.com']
                                }]
                            });
                        } else {
                            throw switchError;
                        }
                    }
                }
            } catch (error) {
                console.error('Failed to switch network:', error);
                throw error;
            }
        }

        async initializeConnection(account) {
            try {
                console.log('Initializing connection for account:', account);
                this.provider = new ethers.providers.Web3Provider(window.ethereum);
                this.signer = this.provider.getSigner();
                this.currentAccount = account;
                this.isConnected = true;

                // Initialiser le contrat VASS
                this.vassContract = new ethers.Contract(
                    contractConfig.addresses.vassToken,
                    [
                        'function balanceOf(address account) view returns (uint256)',
                        'function decimals() view returns (uint8)',
                        'function symbol() view returns (string)'
                    ],
                    this.signer
                );

                // Mettre à jour l'interface
                await this.updateUI();
                await this.updateBalances();

            } catch (error) {
                console.error('Error initializing connection:', error);
                this.resetState();
            }
        }

        async updateBalances() {
            try {
                if (!this.isConnected || !this.currentAccount) return;

                // Get BNB balance
                const bnbBalance = await this.provider.getBalance(this.currentAccount);
                const formattedBNB = ethers.utils.formatEther(bnbBalance);
                document.getElementById('bnbBalance').textContent = parseFloat(formattedBNB).toFixed(4);

                // Get VASS balance
                const vassBalance = await this.vassContract.balanceOf(this.currentAccount);
                const vassDecimals = await this.vassContract.decimals();
                const formattedVASS = ethers.utils.formatUnits(vassBalance, vassDecimals);
                document.getElementById('vassBalance').textContent = parseFloat(formattedVASS).toFixed(2);

                // Update USD values using price service
                if (window.priceService) {
                    window.priceService.updateUI();
                }

            } catch (error) {
                console.error('Error updating balances:', error);
            }
        }

        async updateUI() {
            const connectButton = document.getElementById('connectWalletBtn');
            const disconnectButton = document.getElementById('disconnectWalletBtn');
            const walletAddress = document.getElementById('walletAddress');

            if (this.isConnected && this.currentAccount) {
                connectButton.style.display = 'none';
                disconnectButton.style.display = 'block';
                walletAddress.textContent = `${this.currentAccount.slice(0, 6)}...${this.currentAccount.slice(-4)}`;
                walletAddress.style.display = 'block';
            } else {
                connectButton.style.display = 'block';
                disconnectButton.style.display = 'none';
                walletAddress.textContent = 'Non connecté';
                walletAddress.style.display = 'none';
            }
        }

        disconnect() {
            this.resetState();
            this.updateUI();
        }

        resetState() {
            this.provider = null;
            this.signer = null;
            this.currentAccount = null;
            this.isConnected = false;
            this.vassContract = null;
            this.updateUI();
            
            // Reset balances
            document.getElementById('bnbBalance').textContent = '0.00';
            document.getElementById('vassBalance').textContent = '0.00';
            document.getElementById('bnbValue').textContent = '0.00';
            document.getElementById('vassValue').textContent = '0.00';
        }

        handleAccountsChanged(accounts) {
            console.log('Accounts changed:', accounts);
            if (accounts.length === 0) {
                this.resetState();
            } else if (accounts[0] !== this.currentAccount) {
                this.initializeConnection(accounts[0]);
            }
        }

        handleChainChanged(chainId) {
            console.log('Chain changed:', chainId);
            window.location.reload();
        }

        handleConnect() {
            console.log('MetaMask connected');
        }

        handleDisconnect() {
            console.log('MetaMask disconnected');
            this.resetState();
        }

        getProvider() {
            return this.provider;
        }

        getSigner() {
            return this.signer;
        }

        getAddress() {
            return this.currentAccount;
        }

        isWalletConnected() {
            return this.isConnected;
        }
    }

    // Export dans le scope global
    window.WalletConnect = WalletConnect;
    
    // Créer une instance globale
    window.walletConnect = new WalletConnect();

    // Initialisation des écouteurs d'événements
    document.addEventListener('DOMContentLoaded', () => {
        const disconnectButton = document.getElementById('disconnectWalletBtn');
        if (disconnectButton) {
            disconnectButton.addEventListener('click', () => {
                window.walletConnect.disconnect();
            });
        }
    });
}
