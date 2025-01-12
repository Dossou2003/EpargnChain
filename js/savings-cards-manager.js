class SavingsCardsManager {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.savingsContract = null;
        this.usdtContract = null;
        this.initialized = false;
        this.initialize();
    }

    async initialize() {
        try {
            console.log('Initialisation du gestionnaire de cartes...');
            if (typeof window.ethereum !== 'undefined') {
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                if (!accounts || accounts.length === 0) {
                    console.log('En attente de la connexion du wallet...');
                    return;
                }

                this.provider = new ethers.providers.Web3Provider(window.ethereum);
                this.signer = this.provider.getSigner();
                
                if (!window.CONFIG.SAVINGS_ADDRESS || !window.CONFIG.USDT_ADDRESS) {
                    throw new Error('Adresses des contrats non définies');
                }
                
                console.log('Création des contrats avec les adresses:', {
                    savings: window.CONFIG.SAVINGS_ADDRESS,
                    usdt: window.CONFIG.USDT_ADDRESS
                });

                this.savingsContract = new ethers.Contract(
                    window.CONFIG.SAVINGS_ADDRESS,
                    window.SAVINGS_ABI,
                    this.signer
                );
                
                this.usdtContract = new ethers.Contract(
                    window.CONFIG.USDT_ADDRESS,
                    window.USDT_ABI,
                    this.signer
                );

                console.log('Création du container des cartes...');
                await this.createSavingsContainer();

                console.log('Initialisation des écouteurs d\'événements...');
                await this.initializeEventListeners();

                console.log('Première mise à jour des cartes...');
                await this.updateAllCards();

                // Mettre à jour toutes les 30 secondes
                setInterval(() => this.updateAllCards(), 30000);

                this.initialized = true;
                console.log('Gestionnaire de cartes initialisé avec succès');
            }
        } catch (error) {
            console.error('Erreur d\'initialisation:', error);
            if (window.notyf) {
                window.notyf.error('Erreur d\'initialisation des cartes d\'épargne');
            }
        }
    }

    async createSavingsContainer() {
        // Trouver la section des épargnes actives
        const savingsSection = document.querySelector('.glass-effect');
        const savingsSections = Array.from(document.querySelectorAll('.glass-effect'));
        const targetSection = savingsSections.find(section => {
            const h2 = section.querySelector('h2');
            return h2 && h2.textContent.includes('Épargnes Actives');
        });
        
        console.log('Section des épargnes trouvée:', targetSection);
        
        if (!targetSection) {
            console.error('Section des épargnes actives non trouvée');
            return;
        }

        // Créer le container des cartes s'il n'existe pas
        let cardsContainer = document.getElementById('savings-cards-container');
        if (!cardsContainer) {
            console.log('Création du container des cartes...');
            cardsContainer = document.createElement('div');
            cardsContainer.id = 'savings-cards-container';
            cardsContainer.className = 'space-y-4 mt-4';
            targetSection.appendChild(cardsContainer);
        }
    }

    async initializeEventListeners() {
        if (!this.savingsContract) {
            console.error('Contract not initialized');
            return;
        }

        // Écouteurs pour les épargnes individuelles
        this.savingsContract.on('SavingsCreated', async (savingsId, user, amount, duration, event) => {
            console.log('Nouvelle épargne créée:', { savingsId, user, amount, duration });
            await this.updateAllCards();
        });

        // Ajouter les écouteurs pour le tri
        const sortByAmount = document.getElementById('sortByAmount');
        const sortByDuration = document.getElementById('sortByDuration');
        const sortByAPY = document.getElementById('sortByAPY');

        if (sortByAmount) sortByAmount.addEventListener('click', () => this.sortSavings('amount'));
        if (sortByDuration) sortByDuration.addEventListener('click', () => this.sortSavings('duration'));
        if (sortByAPY) sortByAPY.addEventListener('click', () => this.sortSavings('apy'));
    }

    async updateAllCards() {
        if (!this.initialized) {
            console.log('Le gestionnaire n\'est pas encore initialisé');
            return;
        }
        console.log('Mise à jour de toutes les cartes...');
        await this.updateSavingsCards();
    }

    async updateSavingsCards() {
        try {
            if (!this.signer || !this.savingsContract) {
                console.error('Contrats non initialisés');
                return;
            }

            const userAddress = await this.signer.getAddress();
            console.log('Mise à jour des cartes pour:', userAddress);

            // Récupérer le nombre total d'épargnes
            const savingsCount = await this.savingsContract.savingsCount();
            console.log('Nombre total d\'épargnes:', savingsCount.toString());

            const savingsContainer = document.getElementById('savings-cards-container');
            if (!savingsContainer) {
                console.error('Container des épargnes non trouvé');
                await this.createSavingsContainer();
                return;
            }

            savingsContainer.innerHTML = '';
            let userSavings = [];

            // Parcourir toutes les épargnes pour trouver celles de l'utilisateur
            for (let i = 0; i < savingsCount.toNumber(); i++) {
                const saving = await this.savingsContract.savings(i);
                if (saving.user.toLowerCase() === userAddress.toLowerCase() && saving.active) {
                    console.log('Épargne trouvée:', { id: i, saving });
                    userSavings.push({ id: i, ...saving });
                }
            }

            console.log('Épargnes de l\'utilisateur:', userSavings);

            // Créer les cartes pour chaque épargne
            for (const saving of userSavings) {
                const card = await this.createSavingCard(saving, saving.id);
                savingsContainer.appendChild(card);
            }

            if (userSavings.length === 0) {
                savingsContainer.innerHTML = '<p class="text-gray-400 text-center">Aucune épargne active</p>';
            }
        } catch (error) {
            console.error('Erreur lors de la mise à jour des cartes d\'épargne:', error);
            if (window.notyf) {
                window.notyf.error('Erreur lors de la mise à jour des cartes d\'épargne');
            }
        }
    }

    async createSavingCard(saving, savingId) {
        console.log('Création de la carte pour l\'épargne', savingId);
        const card = document.createElement('div');
        card.className = 'glass-effect p-4 rounded-lg';
        card.dataset.amount = saving.amount.toString();
        card.dataset.duration = saving.duration.toString();
        
        const timeLeft = await this.calculateTimeLeft(saving.startTime, saving.duration);
        const amountFormatted = ethers.utils.formatUnits(saving.amount, 18);
        const amountUSD = window.priceService ? 
            window.priceService.calculateUSDValue(amountFormatted, 'vass') : 
            amountFormatted;

        card.innerHTML = `
            <div class="flex justify-between items-start">
                <div class="space-y-2">
                    <h3 class="text-lg font-semibold">Épargne #${savingId}</h3>
                    <p class="text-gray-300">Montant: ${amountFormatted} VASS</p>
                    <p class="text-gray-300">Valeur: $${amountUSD}</p>
                    <p class="text-gray-300">Durée: ${saving.duration.toString()} mois</p>
                    <p class="text-gray-300">Temps restant: ${timeLeft}</p>
                </div>
                <button class="btn-primary withdraw-btn ${timeLeft === 'Terminé' ? '' : 'opacity-50 cursor-not-allowed'}" 
                    data-savings-id="${savingId}" 
                    ${timeLeft === 'Terminé' ? '' : 'disabled'}>
                    ${timeLeft === 'Terminé' ? 'Retirer' : 'En cours'}
                </button>
            </div>
        `;

        // Ajouter l'événement pour le retrait
        const withdrawBtn = card.querySelector('.withdraw-btn');
        if (withdrawBtn && timeLeft === 'Terminé') {
            withdrawBtn.onclick = () => this.handleWithdraw(savingId);
        }

        return card;
    }

    async calculateTimeLeft(startTime, duration) {
        const endTime = startTime.add(duration.mul(30 * 24 * 60 * 60)); // duration * 30 jours en secondes
        const now = Math.floor(Date.now() / 1000);
        
        if (now >= endTime) {
            return 'Terminé';
        }

        const timeLeft = endTime - now;
        const daysLeft = Math.floor(timeLeft / (24 * 60 * 60));
        return `${daysLeft} jours`;
    }

    async handleWithdraw(savingId) {
        try {
            console.log('Tentative de retrait pour l\'épargne', savingId);
            const tx = await this.savingsContract.withdraw(savingId, {
                gasLimit: 500000
            });
            console.log('Transaction de retrait envoyée:', tx.hash);
            await tx.wait();
            
            if (window.notyf) {
                window.notyf.success('Retrait effectué avec succès');
            }
            
            await this.updateSavingsCards();
        } catch (error) {
            console.error('Erreur lors du retrait:', error);
            if (window.notyf) {
                window.notyf.error(error.message || 'Erreur lors du retrait');
            }
        }
    }

    sortSavings(criteria) {
        const container = document.getElementById('savings-cards-container');
        if (!container) return;

        const cards = Array.from(container.children);
        
        cards.sort((a, b) => {
            switch (criteria) {
                case 'amount':
                    return BigInt(b.dataset.amount) - BigInt(a.dataset.amount);
                case 'duration':
                    return parseInt(b.dataset.duration) - parseInt(a.dataset.duration);
                default:
                    return 0;
            }
        });

        container.innerHTML = '';
        cards.forEach(card => container.appendChild(card));
    }
}

// Initialiser le gestionnaire de cartes
window.addEventListener('DOMContentLoaded', () => {
    console.log('Initialisation du gestionnaire de cartes...');
    if (!window.savingsCardsManager) {
        window.savingsCardsManager = new SavingsCardsManager();
    }
});
