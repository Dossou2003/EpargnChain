class PriceService {
    constructor() {
        this.prices = {
            bnb: 0,
            vass: 0
        };
        this.updateInterval = null;
    }

    async initialize() {
        try {
            // Démarrer les mises à jour de prix
            await this.updatePrices();
            
            // Mettre à jour les prix toutes les 30 secondes
            this.updateInterval = setInterval(() => this.updatePrices(), 30000);
            
            console.log('PriceService initialized');
        } catch (error) {
            console.error('Error initializing PriceService:', error);
        }
    }

    async updatePrices() {
        try {
            // Récupérer le prix du BNB depuis Binance
            const bnbResponse = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BNBUSDT');
            const bnbData = await bnbResponse.json();
            this.prices.bnb = parseFloat(bnbData.price);

            // Pour VASS, nous utiliserons un prix fixe pour l'instant
            this.prices.vass = 1.00; // Prix fixe de 1 USD

            console.log('Prices updated:', this.prices);
            
            // Mettre à jour l'interface seulement si les éléments existent
            if (document.getElementById('bnbBalance')) {
                this.updateUI();
            }
        } catch (error) {
            console.error('Error updating prices:', error);
        }
    }

    updateUI() {
        try {
            const elements = {
                bnbBalance: document.getElementById('bnbBalance'),
                vassBalance: document.getElementById('vassBalance'),
                bnbValue: document.getElementById('bnbValue'),
                vassValue: document.getElementById('vassValue'),
                totalValue: document.getElementById('totalValue')
            };

            // Vérifier que tous les éléments nécessaires existent
            if (!Object.values(elements).every(el => el)) {
                console.log('Certains éléments UI ne sont pas encore disponibles');
                return;
            }

            // Récupérer les soldes actuels
            const bnbBalance = parseFloat(elements.bnbBalance.textContent) || 0;
            const vassBalance = parseFloat(elements.vassBalance.textContent) || 0;

            // Calculer les valeurs en USD
            const bnbValue = (bnbBalance * this.prices.bnb).toFixed(2);
            const vassValue = (vassBalance * this.prices.vass).toFixed(2);

            // Mettre à jour l'interface
            elements.bnbValue.textContent = bnbValue;
            elements.vassValue.textContent = vassValue;

            // Mettre à jour le total
            const totalValue = (parseFloat(bnbValue) + parseFloat(vassValue)).toFixed(2);
            elements.totalValue.textContent = totalValue;

            console.log('UI updated with values:', {
                bnb: bnbValue,
                vass: vassValue,
                total: totalValue
            });
        } catch (error) {
            console.error('Error updating UI with prices:', error);
        }
    }

    getPrice(symbol) {
        return this.prices[symbol.toLowerCase()] || 0;
    }

    calculateUSDValue(amount, symbol) {
        const price = this.getPrice(symbol);
        return (amount * price).toFixed(2);
    }

    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }
}

// Créer l'instance et la rendre disponible globalement
window.priceService = new PriceService();
