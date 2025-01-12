class MinimumAmountsService {
    constructor() {
        this.contract = null;
        this.provider = null;
    }

    initialize(provider, contractAddress, contractABI) {
        try {
            this.provider = provider;
            this.contract = new ethers.Contract(contractAddress, contractABI, provider);
            this.updateMinimumAmounts();
            console.log('MinimumAmountsService initialized with contract:', contractAddress);
        } catch (error) {
            console.error('Error initializing MinimumAmountsService:', error);
        }
    }

    async updateMinimumAmounts() {
        try {
            if (!this.contract) {
                throw new Error('Contract not initialized');
            }

            // Récupérer les montants minimums depuis le contrat
            const minDepositAmount = await this.contract.MIN_DEPOSIT_AMOUNT();
            const minGroupAmount = await this.contract.MIN_GROUP_AMOUNT();

            // Convertir les montants en format lisible
            const formattedMinDeposit = this.formatAmount(minDepositAmount);
            const formattedMinGroup = this.formatAmount(minGroupAmount);

            // Mettre à jour l'interface
            this.updateUI(formattedMinDeposit, formattedMinGroup);

            console.log('Minimum amounts updated:', {
                individual: formattedMinDeposit,
                group: formattedMinGroup
            });

        } catch (error) {
            console.error('Error updating minimum amounts:', error);
            // En cas d'erreur, afficher les valeurs par défaut
            this.updateUI('5.00 VASS', '10.00 VASS');
        }
    }

    formatAmount(amount) {
        try {
            const formatted = ethers.utils.formatUnits(amount, 18);
            return `${parseFloat(formatted).toFixed(2)} VASS`;
        } catch (error) {
            console.error('Error formatting amount:', error);
            return '0.00 VASS';
        }
    }

    updateUI(individualAmount, groupAmount) {
        const individualElement = document.getElementById('minSavingsAmount');
        const groupElement = document.getElementById('minGroupSavingsAmount');

        if (individualElement) {
            individualElement.innerHTML = `
                <span class="text-2xl font-bold">${individualAmount}</span>
                <span class="text-sm text-gray-400 ml-2">minimum</span>
            `;
        }

        if (groupElement) {
            groupElement.innerHTML = `
                <span class="text-2xl font-bold">${groupAmount}</span>
                <span class="text-sm text-gray-400 ml-2">minimum</span>
            `;
        }
    }
}

// Créer l'instance et la rendre disponible globalement
window.minimumAmountsService = new MinimumAmountsService();
