// Service pour gérer les soldes et les prix
class BalanceService {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.vassContract = null;
        this.bnbPrice = 0;
        this.vassPrice = 0;
        this.updateInterval = null;
    }

    async initialize() {
        try {
            console.log("Initializing BalanceService...");
            if (!window.ethereum || !window.ethereum.isConnected()) {
                throw new Error("MetaMask n'est pas connecté");
            }

            this.provider = new ethers.providers.Web3Provider(window.ethereum);
            this.signer = this.provider.getSigner();
            
            // Initialiser le contrat VASS
            if (!VASS_ADDRESS || !VASS_ABI) {
                throw new Error("Configuration VASS manquante");
            }

            console.log("Initializing VASS contract at:", VASS_ADDRESS);
            this.vassContract = new ethers.Contract(
                VASS_ADDRESS,
                VASS_ABI,
                this.signer
            );

            // Mettre à jour immédiatement
            await this.updateAll();

            // Nettoyer l'ancien intervalle s'il existe
            if (this.updateInterval) {
                clearInterval(this.updateInterval);
            }

            // Mettre à jour toutes les 30 secondes
            this.updateInterval = setInterval(() => this.updateAll(), 30000);
            
            console.log("BalanceService initialized successfully");
            return true;
        } catch (error) {
            console.error("Error initializing BalanceService:", error);
            if (window.notificationCenter) {
                window.notificationCenter.error("Erreur d'initialisation du service de soldes: " + error.message);
            }
            return false;
        }
    }

    async updatePrices() {
        try {
            console.log("Updating prices...");
            // TODO: Intégrer une API de prix réelle
            this.bnbPrice = 250; // Prix BNB en USD
            this.vassPrice = 1; // Prix VASS en USD

            const bnbBalance = parseFloat(document.getElementById('bnbBalance').textContent) || 0;
            const vassBalance = parseFloat(document.getElementById('vassBalance').textContent) || 0;

            const bnbValue = (bnbBalance * this.bnbPrice).toFixed(2);
            const vassValue = (vassBalance * this.vassPrice).toFixed(2);

            console.log(`BNB Value: $${bnbValue}, VASS Value: $${vassValue}`);

            document.getElementById('bnbValue').textContent = bnbValue;
            document.getElementById('vassValue').textContent = vassValue;
        } catch (error) {
            console.error("Error updating prices:", error);
        }
    }

    async updateBalances() {
        try {
            console.log("Updating balances...");
            if (!this.signer) {
                throw new Error("Signer not initialized");
            }

            const address = await this.signer.getAddress();
            console.log("Fetching balances for address:", address);

            // Obtenir le solde BNB
            const bnbBalance = await this.provider.getBalance(address);
            const formattedBnbBalance = parseFloat(ethers.utils.formatEther(bnbBalance)).toFixed(4);
            console.log("BNB Balance:", formattedBnbBalance);
            document.getElementById('bnbBalance').textContent = formattedBnbBalance;

            // Obtenir le solde VASS
            const vassBalance = await this.vassContract.balanceOf(address);
            const formattedVassBalance = parseFloat(ethers.utils.formatEther(vassBalance)).toFixed(2);
            console.log("VASS Balance:", formattedVassBalance);
            document.getElementById('vassBalance').textContent = formattedVassBalance;

            // Obtenir les données d'épargne
            const totalSavings = await this.vassContract.getTotalSavings(address);
            const activeSavings = await this.vassContract.getActiveSavingsCount(address);
            const rewards = await this.vassContract.getTotalRewards(address);
            const apy = await this.vassContract.getAPY();

            document.getElementById('totalSavings').textContent = parseFloat(ethers.utils.formatEther(totalSavings)).toFixed(2);
            document.getElementById('activeSavingsCount').textContent = activeSavings.toString();
            document.getElementById('totalRewards').textContent = parseFloat(ethers.utils.formatEther(rewards)).toFixed(2);
            document.getElementById('currentAPY').textContent = (parseFloat(apy) / 100).toFixed(2);

            // Mettre à jour les valeurs en USD
            await this.updatePrices();

            // Mettre à jour les mini graphiques
            await this.updateMiniCharts();
        } catch (error) {
            console.error("Error updating balances:", error);
        }
    }

    async updateMiniCharts() {
        // Mise à jour des mini graphiques
        const miniChartOptions = {
            type: 'line',
            data: {
                labels: Array(10).fill(''),
                datasets: [{
                    data: [],
                    borderColor: '#FFB237',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { display: false },
                    y: { display: false }
                },
                elements: { point: { radius: 0 } }
            }
        };

        // BNB Mini Chart
        const bnbData = await this.getHistoricalData('bnb', 10);
        const bnbChart = new Chart(
            document.getElementById('bnbMiniChart').getContext('2d'),
            {...miniChartOptions, data: {...miniChartOptions.data, datasets: [{...miniChartOptions.data.datasets[0], data: bnbData}]}}
        );

        // VASS Mini Chart
        const vassData = await this.getHistoricalData('vass', 10);
        const vassChart = new Chart(
            document.getElementById('vassMiniChart').getContext('2d'),
            {...miniChartOptions, data: {...miniChartOptions.data, datasets: [{...miniChartOptions.data.datasets[0], data: vassData}]}}
        );

        // Savings Mini Chart
        const savingsData = await this.getHistoricalData('savings', 10);
        const savingsChart = new Chart(
            document.getElementById('savingsMiniChart').getContext('2d'),
            {...miniChartOptions, data: {...miniChartOptions.data, datasets: [{...miniChartOptions.data.datasets[0], data: savingsData}]}}
        );

        // Rewards Mini Chart
        const rewardsData = await this.getHistoricalData('rewards', 10);
        const rewardsChart = new Chart(
            document.getElementById('rewardsMiniChart').getContext('2d'),
            {...miniChartOptions, data: {...miniChartOptions.data, datasets: [{...miniChartOptions.data.datasets[0], data: rewardsData}]}}
        );
    }

    async getHistoricalData(type, points) {
        // Simuler des données historiques pour la démonstration
        // Dans un cas réel, ces données viendraient du smart contract ou d'une API
        const data = [];
        for (let i = 0; i < points; i++) {
            switch(type) {
                case 'bnb':
                    data.push(Math.random() * 2 + 1);
                    break;
                case 'vass':
                    data.push(Math.random() * 1000 + 500);
                    break;
                case 'savings':
                    data.push(Math.random() * 5000 + 1000);
                    break;
                case 'rewards':
                    data.push(Math.random() * 100 + 50);
                    break;
            }
        }
        return data;
    }

    async updateAll() {
        try {
            await this.updateBalances();
            await this.updatePrices();
        } catch (error) {
            console.error("Error in updateAll:", error);
        }
    }

    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }
}

// Initialiser le service
const balanceService = new BalanceService();

// Initialiser lors de la connexion du wallet
window.addEventListener('walletConnected', async () => {
    console.log("Wallet connected, initializing balance service...");
    await balanceService.initialize();
});

// Nettoyer lors de la déconnexion
window.addEventListener('walletDisconnected', () => {
    console.log("Wallet disconnected, cleaning up balance service...");
    balanceService.destroy();
});
