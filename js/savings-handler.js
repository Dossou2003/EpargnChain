// Gestionnaire des épargnes
ensureImport('SavingsHandler', () => {
    class SavingsHandler {
        constructor(contractManager) {
            this.contractManager = contractManager;
            this.savingsContract = null;
            this.usdtContract = null;
            this.cakeContract = null;
            this.initialize();
        }

        async initialize() {
            try {
                if (!window.ethereum) {
                    console.warn('Web3 non disponible');
                    return;
                }

                console.log('Initialisation de SavingsHandler...');

                // Initialiser les contrats
                this.savingsContract = this.contractManager.getContract(
                    window.CONFIG.SAVINGS_ADDRESS,
                    window.SAVINGS_ABI
                );

                this.usdtContract = this.contractManager.getContract(
                    window.CONFIG.USDT_ADDRESS,
                    window.USDT_ABI
                );

                this.cakeContract = this.contractManager.getContract(
                    window.CONFIG.CAKE_ADDRESS,
                    window.CAKE_TOKEN_ABI
                );

                if (!this.savingsContract || !this.usdtContract || !this.cakeContract) {
                    throw new Error('Erreur d\'initialisation des contrats');
                }

                console.log('Contrats initialisés:', {
                    savings: window.CONFIG.SAVINGS_ADDRESS,
                    usdt: window.CONFIG.USDT_ADDRESS,
                    cake: window.CONFIG.CAKE_ADDRESS
                });

                // Initialiser les écouteurs d'événements
                this.initializeEventListeners();
                
                // Charger les épargnes existantes
                await this.loadUserSavings();
            } catch (error) {
                console.error('Erreur lors de l\'initialisation de SavingsHandler:', error);
            }
        }

        initializeEventListeners() {
            // Écouteur pour le formulaire de création d'épargne
            const createSavingsForm = document.getElementById('createSavingsForm');
            if (createSavingsForm) {
                createSavingsForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    await this.handleCreateSavings();
                });
            }

            // Écouteur pour le retrait
            const withdrawButton = document.getElementById('withdrawButton');
            if (withdrawButton) {
                withdrawButton.addEventListener('click', async () => {
                    await this.handleWithdraw();
                });
            }
        }

        async handleCreateSavings() {
            try {
                const amountInput = document.getElementById('savingsAmount');
                const durationInput = document.getElementById('savingsDuration');

                if (!amountInput || !durationInput) {
                    console.error('Champs du formulaire non trouvés');
                    return;
                }

                const amount = ethers.utils.parseUnits(amountInput.value, 18); // 18 decimals pour USDT
                const durationDays = parseInt(durationInput.value);
                const durationSeconds = durationDays * 24 * 60 * 60;

                // Vérifier que la durée est d'au moins 30 jours
                if (durationDays < 30) {
                    alert('La durée minimum est de 30 jours');
                    return;
                }

                // Vérifier que le montant est d'au moins 10 USDT
                if (ethers.utils.formatUnits(amount, 18) < 10) {
                    alert('Le montant minimum est de 10 USDT');
                    return;
                }

                const account = await this.contractManager.getSigner().getAddress();

                // Vérifier et demander l'approbation USDT si nécessaire
                const allowance = await this.usdtContract.allowance(account, this.savingsContract.address);
                if (allowance.lt(amount)) {
                    console.log('Demande d\'approbation USDT...');
                    const approveTx = await this.usdtContract.approve(this.savingsContract.address, ethers.constants.MaxUint256);
                    await approveTx.wait();
                    console.log('Approbation USDT effectuée');
                }

                // Créer l'épargne
                console.log('Création de l\'épargne...');
                const tx = await this.savingsContract.createSavings(amount, durationSeconds);
                await tx.wait();
                console.log('Épargne créée avec succès');

                // Recharger les épargnes
                await this.loadUserSavings();
                
                // Réinitialiser le formulaire
                amountInput.value = '';
                durationInput.value = '';

            } catch (error) {
                console.error('Erreur lors de la création de l\'épargne:', error);
                alert('Erreur lors de la création de l\'épargne. Voir la console pour plus de détails.');
            }
        }

        async handleWithdraw() {
            try {
                const account = await this.contractManager.getSigner().getAddress();
                const savings = await this.savingsContract.getUserSavings(account);

                // Vérifier si l'épargne existe
                if (savings.amount.eq(0)) {
                    alert('Vous n\'avez pas d\'épargne active');
                    return;
                }

                // Vérifier si la durée est atteinte
                const now = Math.floor(Date.now() / 1000);
                if (now < savings.startTime.add(savings.duration).toNumber()) {
                    const remainingDays = Math.ceil((savings.startTime.add(savings.duration).toNumber() - now) / (24 * 60 * 60));
                    alert(`Il reste encore ${remainingDays} jours avant de pouvoir retirer`);
                    return;
                }

                // Effectuer le retrait
                console.log('Retrait en cours...');
                const tx = await this.savingsContract.withdraw();
                await tx.wait();
                console.log('Retrait effectué avec succès');

                // Recharger les épargnes
                await this.loadUserSavings();

            } catch (error) {
                console.error('Erreur lors du retrait:', error);
                alert('Erreur lors du retrait. Voir la console pour plus de détails.');
            }
        }

        async loadUserSavings() {
            try {
                const account = await this.contractManager.getSigner().getAddress();
                const savings = await this.savingsContract.getUserSavings(account);
                const rewards = await this.savingsContract.getPendingRewards(account);

                // Mettre à jour l'interface
                this.updateSavingsDisplay(savings, rewards);

            } catch (error) {
                console.error('Erreur lors du chargement des épargnes:', error);
            }
        }

        updateSavingsDisplay(savings, rewards) {
            const savingsDisplay = document.getElementById('savingsDisplay');
            if (!savingsDisplay) return;

            if (savings.amount.eq(0)) {
                savingsDisplay.innerHTML = '<p>Aucune épargne active</p>';
                return;
            }

            const amount = ethers.utils.formatUnits(savings.amount, 18);
            const startDate = new Date(savings.startTime.toNumber() * 1000).toLocaleDateString();
            const endDate = new Date((savings.startTime.add(savings.duration)).toNumber() * 1000).toLocaleDateString();
            const pendingRewards = ethers.utils.formatUnits(rewards, 18);

            savingsDisplay.innerHTML = `
                <div class="savings-info">
                    <h3>Votre Épargne</h3>
                    <p>Montant: ${amount} USDT</p>
                    <p>Date de début: ${startDate}</p>
                    <p>Date de fin: ${endDate}</p>
                    <p>Récompenses en attente: ${pendingRewards} CAKE</p>
                </div>
            `;
        }
    }

    window.SavingsHandler = SavingsHandler;
});

// Variables globales
let savingsProvider;

// Initialisation
async function initializeSavings() {
    savingsProvider = new ethers.providers.Web3Provider(window.ethereum);
    await window.savingsService.initialize(savingsProvider);
    await updateActiveSavingsList();
    window.ethereum.on('accountsChanged', updateActiveSavingsList);
}

// Création d'épargne
async function handleCreateSavings(e) {
    e.preventDefault();
    try {
        const amount = document.getElementById('savingsAmount').value;
        const duration = document.getElementById('savingsDuration').value;
        document.getElementById('loadingOverlay').classList.remove('hidden');
        await window.savingsService.createSavings(amount, duration * 30 * 24 * 60 * 60);
        await updateActiveSavingsList();
        e.target.reset();
        window.notifySuccess('Épargne créée avec succès !');
    } catch (error) {
        window.notifyError('Erreur lors de la création de l\'épargne');
        console.error(error);
    } finally {
        document.getElementById('loadingOverlay').classList.add('hidden');
    }
}

// Mise à jour de la liste des épargnes actives
async function updateActiveSavingsList() {
    const activeSavingsList = document.getElementById('activeSavingsList');
    const accounts = await savingsProvider.listAccounts();
    if (accounts.length === 0) return;

    const savings = await window.savingsService.getActiveSavings(accounts[0]);
    
    if (savings.length === 0) {
        activeSavingsList.innerHTML = `
            <div class="text-center text-gray-400 py-8">
                <i class="ph-fill ph-piggy-bank text-4xl mb-2"></i>
                <p>Aucune épargne active</p>
            </div>
        `;
        return;
    }

    activeSavingsList.innerHTML = savings.map(saving => `
        <div class="glass-effect p-4" data-id="${saving.id}">
            <div class="flex justify-between items-start">
                <div>
                    <h3 class="font-bold">${saving.amount} VASS</h3>
                    <p class="text-sm text-gray-400">
                        Temps restant: ${window.savingsService.calculateTimeLeft(saving.startTime, saving.duration)}
                    </p>
                </div>
                <div class="text-right">
                    <p class="text-primary-400 font-medium">${saving.rewards} VASS</p>
                    <p class="text-sm text-gray-400">Récompenses</p>
                </div>
            </div>
            ${parseInt(saving.duration) + parseInt(saving.startTime) <= Math.floor(Date.now() / 1000) ? 
                `<button onclick="withdrawSavings('${saving.id}')" class="w-full mt-4 btn-primary">
                    <i class="ph-fill ph-money text-xl mr-2"></i>
                    <span>Retirer</span>
                </button>` : 
                ''}
        </div>
    `).join('');
}

// Retrait d'épargne
async function withdrawSavings(savingsId) {
    try {
        document.getElementById('loadingOverlay').classList.remove('hidden');
        await window.savingsService.withdrawSavings(savingsId);
        await updateActiveSavingsList();
        window.notifySuccess('Retrait effectué avec succès !');
    } catch (error) {
        window.notifyError('Erreur lors du retrait');
        console.error(error);
    } finally {
        document.getElementById('loadingOverlay').classList.add('hidden');
    }
}

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    initializeSavings();
    document.getElementById('createSavingsForm').addEventListener('submit', handleCreateSavings);
});

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    async function initSavingsHandler() {
        if (window.ContractManager && window.ethereum) {
            const contractManager = new window.ContractManager();
            await contractManager.initialize();
            window.savingsHandler = new window.SavingsHandler(contractManager);
        } else {
            console.warn('ContractManager ou Web3 non disponible');
        }
    }
    
    initSavingsHandler();
});
