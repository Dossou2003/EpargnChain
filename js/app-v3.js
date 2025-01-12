class App {
    constructor() {
        this.initializeElements();
        this.initializeNotifications();
        this.attachEventListeners();
        this.initializeServices();
    }

    initializeElements() {
        // Buttons
        this.connectWalletBtn = document.getElementById('connectWalletBtn');
        this.disconnectWalletBtn = document.getElementById('disconnectWalletBtn');
        this.createSavingsForm = document.getElementById('createSavingsForm');
        this.createGroupForm = document.getElementById('createGroupForm');
        this.depositToGroupForm = document.getElementById('depositToGroupForm');
        this.calculatorBtn = document.getElementById('calculatorBtn');
        this.calculatorModal = document.getElementById('calculatorModal');
        this.closeCalculatorBtn = document.getElementById('closeCalculatorBtn');

        // Display elements
        this.walletAddress = document.getElementById('walletAddress');
        this.minSavingsAmount = document.getElementById('minSavingsAmount');
        this.minGroupSavingsAmount = document.getElementById('minGroupSavingsAmount');
        this.activeSavingsList = document.getElementById('activeSavingsList');
        this.activeGroupsList = document.getElementById('activeGroupsList');
        this.loadingOverlay = document.getElementById('loadingOverlay');
    }

    initializeNotifications() {
        // Initialiser Notyf avec une configuration personnalisée
        window.notyf = new Notyf({
            duration: 3000,
            position: {
                x: 'right',
                y: 'top',
            },
            types: [
                {
                    type: 'success',
                    background: '#10B981',
                    icon: {
                        className: 'ph-fill ph-check-circle',
                        tagName: 'i'
                    }
                },
                {
                    type: 'error',
                    background: '#EF4444',
                    icon: {
                        className: 'ph-fill ph-x-circle',
                        tagName: 'i'
                    }
                }
            ]
        });
    }

    attachEventListeners() {
        // Wallet connection
        if (this.connectWalletBtn) {
            this.connectWalletBtn.addEventListener('click', async () => {
                try {
                    await window.walletConnect.connect();
                } catch (error) {
                    console.error('Failed to connect wallet:', error);
                }
            });
        }

        if (this.disconnectWalletBtn) {
            this.disconnectWalletBtn.addEventListener('click', () => {
                window.walletConnect.disconnect();
            });
        }

        // Calculator
        if (this.calculatorBtn) {
            this.calculatorBtn.addEventListener('click', () => {
                if (this.calculatorModal) {
                    this.calculatorModal.classList.remove('hidden');
                }
            });
        }

        if (this.closeCalculatorBtn) {
            this.closeCalculatorBtn.addEventListener('click', () => {
                if (this.calculatorModal) {
                    this.calculatorModal.classList.add('hidden');
                }
            });
        }

        // Close calculator when clicking outside
        window.addEventListener('click', (event) => {
            if (event.target === this.calculatorModal) {
                this.calculatorModal.classList.add('hidden');
            }
        });

        // Forms
        this.createSavingsForm?.addEventListener('submit', (e) => this.handleCreateSavings(e));
        this.createGroupForm?.addEventListener('submit', (e) => this.handleCreateGroup(e));
        this.depositToGroupForm?.addEventListener('submit', (e) => this.handleDepositToGroup(e));

        // MetaMask events
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', (accounts) => {
                if (accounts.length === 0) {
                    window.walletConnect.resetState();
                } else {
                    window.walletConnect.initializeConnection(accounts[0]);
                }
            });

            window.ethereum.on('chainChanged', () => {
                window.location.reload();
            });
        }
    }

    async initializeServices() {
        try {
            if (typeof window.ethereum === 'undefined') {
                console.error('MetaMask not installed');
                return;
            }

            const provider = new ethers.providers.Web3Provider(window.ethereum);
            
            // Check if already connected
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            
            // Initialiser les services dans l'ordre
            // 1. Initialiser le service des prix
            if (window.priceService) {
                await window.priceService.initialize();
            }

            // 2. Initialiser les mini graphiques
            if (window.MiniChartsService) {
                const miniChartsService = new MiniChartsService();
                miniChartsService.initialize();
            }

            // 3. Initialiser le service des montants minimums
            if (window.minimumAmountsService) {
                window.minimumAmountsService.initialize(
                    provider,
                    window.CONFIG.SAVINGS_ADDRESS,
                    [
                        'function MIN_DEPOSIT_AMOUNT() view returns (uint256)',
                        'function MIN_GROUP_AMOUNT() view returns (uint256)'
                    ]
                );
            }

            // 4. Initialiser le gestionnaire de cartes d'épargne
            if (accounts.length > 0) {
                console.log('Compte connecté, initialisation du gestionnaire de cartes...');
                if (!window.savingsCardsManager) {
                    window.savingsCardsManager = new SavingsCardsManager();
                } else {
                    console.log('Mise à jour des cartes...');
                    await window.savingsCardsManager.updateAllCards();
                }
            }

            if (accounts.length > 0) {
                await window.walletConnect.initializeConnection(accounts[0]);
                
                // Mettre à jour les statistiques d'épargne
                await this.updateSavingsStats();
                // Mettre à jour toutes les 30 secondes
                setInterval(() => this.updateSavingsStats(), 30000);
            }

            // Mettre à jour les soldes périodiquement
            this.updateBalances();
            setInterval(() => this.updateBalances(), 30000);

            // Mettre à jour les groupes actifs
            this.updateActiveGroups();
            setInterval(() => this.updateActiveGroups(), 30000);
        } catch (error) {
            console.error('Error initializing services:', error);
            if (window.notyf) {
                window.notyf.error('Erreur lors de l\'initialisation des services');
            }
        }
    }

    async updateBalances() {
        try {
            if (!window.ethereum) return;

            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (accounts.length === 0) return;

            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();

            // Obtenir le solde BNB
            const bnbBalance = await provider.getBalance(accounts[0]);
            const bnbBalanceEth = ethers.utils.formatEther(bnbBalance);
            document.getElementById('bnbBalance').textContent = parseFloat(bnbBalanceEth).toFixed(4);

            // Obtenir le solde VASS
            const vassContract = new ethers.Contract(
                window.CONFIG.VASS_ADDRESS,
                window.VASS_ABI,
                signer
            );
            const vassBalance = await vassContract.balanceOf(accounts[0]);
            const vassBalanceFormatted = ethers.utils.formatUnits(vassBalance, 18);
            document.getElementById('vassBalance').textContent = parseFloat(vassBalanceFormatted).toFixed(2);

            // Mettre à jour les valeurs en USD
            if (window.priceService) {
                window.priceService.updateUI();
            }
        } catch (error) {
            console.error('Error updating balances:', error);
        }
    }

    async updateSavingsStats() {
        try {
            if (!window.ethereum) {
                console.log('MetaMask non détecté');
                return;
            }

            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (accounts.length === 0) {
                console.log('Aucun compte connecté');
                return;
            }

            console.log('Compte connecté:', accounts[0]);

            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            const userAddress = await signer.getAddress();
            
            console.log('Adresse du contrat:', window.CONFIG.SAVINGS_ADDRESS);
            console.log('ABI du contrat:', window.SAVINGS_ABI);

            const contract = new ethers.Contract(
                window.CONFIG.SAVINGS_ADDRESS,
                window.SAVINGS_ABI,
                signer
            );

            // Récupérer le nombre total d'épargnes
            const savingsCount = await contract.savingsCount();
            console.log('Nombre total d\'épargnes:', savingsCount.toString());

            let totalSavingsAmount = ethers.BigNumber.from(0);
            let activeSavingsCount = 0;

            // Parcourir toutes les épargnes de l'utilisateur
            for (let i = 0; i < savingsCount; i++) {
                try {
                    console.log('Vérification de l\'épargne', i);
                    const savings = await contract.savings(i);
                    console.log('Épargne trouvée:', savings);
                    
                    if (savings.user.toLowerCase() === userAddress.toLowerCase() && savings.active) {
                        console.log('Épargne active trouvée:', {
                            id: i,
                            amount: ethers.utils.formatUnits(savings.amount, 18)
                        });
                        totalSavingsAmount = totalSavingsAmount.add(savings.amount);
                        activeSavingsCount++;
                    }
                } catch (error) {
                    console.error(`Error fetching savings ${i}:`, error);
                }
            }

            console.log('Stats finales:', {
                totalSavings: ethers.utils.formatUnits(totalSavingsAmount, 18),
                activeSavingsCount
            });

            // Mettre à jour l'interface
            const totalSavingsFormatted = ethers.utils.formatUnits(totalSavingsAmount, 18);
            document.getElementById('totalSavings').textContent = parseFloat(totalSavingsFormatted).toFixed(2);
            document.getElementById('activeSavingsCount').textContent = activeSavingsCount;

            // Mettre à jour le graphique si MiniChartsService est disponible
            if (window.MiniChartsService && window.MiniChartsService.updateSavingsChart) {
                const savingsHistory = await this.getSavingsHistory(contract, userAddress);
                window.MiniChartsService.updateSavingsChart(savingsHistory);
            }

        } catch (error) {
            console.error('Error updating savings stats:', error);
        }
    }

    async getSavingsHistory(contract, userAddress) {
        try {
            // Récupérer les événements SavingsCreated des 30 derniers jours
            const filter = contract.filters.SavingsCreated(null, userAddress);
            const blockNumber = await contract.provider.getBlockNumber();
            const fromBlock = blockNumber - 200000; // environ 30 jours en blocs
            const events = await contract.queryFilter(filter, fromBlock);

            // Organiser les données pour le graphique
            const history = events.map(event => ({
                timestamp: event.block.timestamp,
                amount: ethers.utils.formatUnits(event.args.amount, 18)
            }));

            return history;

        } catch (error) {
            console.error('Error getting savings history:', error);
            return [];
        }
    }

    async handleCreateSavings(e) {
        e.preventDefault();
        try {
            const amount = document.getElementById('savingsAmount').value;
            const duration = document.getElementById('savingsDuration').value;

            if (!amount || !duration) {
                throw new Error('Veuillez remplir tous les champs');
            }

            const amountWei = ethers.utils.parseUnits(amount.toString(), 18);
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            const contract = new ethers.Contract(
                window.CONFIG.SAVINGS_ADDRESS,
                window.SAVINGS_ABI,
                signer
            );

            // Approuver d'abord les USDT
            const usdtContract = new ethers.Contract(
                window.CONFIG.USDT_ADDRESS,
                window.USDT_ABI,
                signer
            );

            const approveTx = await usdtContract.approve(window.CONFIG.SAVINGS_ADDRESS, amountWei);
            await approveTx.wait();

            // Créer l'épargne
            const tx = await contract.createSavings(amountWei, duration);
            await tx.wait();

            // Notification de succès
            if (window.notyf) {
                window.notyf.success('✅ Épargne créée !');
            }

            // Réinitialiser le formulaire
            document.getElementById('createSavingsForm').reset();

        } catch (error) {
            console.error('Erreur lors de la création de l\'épargne:', error);
            if (window.notyf) {
                window.notyf.error('❌ Erreur: ' + (error.message || 'Erreur lors de la création de l\'épargne'));
            }
        }
    }

    async handleCreateGroup(e) {
        e.preventDefault();
        try {
            const name = document.getElementById('groupName').value;
            const amount = document.getElementById('minMonthlyAmount').value;
            const durationInSeconds = document.getElementById('duration').value;
            const maxMembers = document.getElementById('maxMembers').value;

            // Convertir la durée de secondes en mois
            const durationInMonths = Number(durationInSeconds) / (30 * 24 * 60 * 60);

            if (!name || !amount || !durationInSeconds || !maxMembers) {
                throw new Error('Veuillez remplir tous les champs');
            }

            const amountWei = ethers.utils.parseUnits(amount.toString(), 18);
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            const contract = new ethers.Contract(
                window.CONFIG.SAVINGS_ADDRESS,
                window.SAVINGS_ABI,
                signer
            );

            // Approuver d'abord les USDT
            const usdtContract = new ethers.Contract(
                window.CONFIG.USDT_ADDRESS,
                window.USDT_ABI,
                signer
            );

            const approveTx = await usdtContract.approve(window.CONFIG.SAVINGS_ADDRESS, amountWei);
            await approveTx.wait();

            // Créer le groupe
            const tx = await contract.createGroup(
                name,
                durationInMonths,
                amountWei,
                Number(maxMembers)
            );
            await tx.wait();

            // Notification de succès
            if (window.notyf) {
                window.notyf.success('✅ Groupe créé !');
            }

            // Réinitialiser le formulaire
            document.getElementById('createGroupForm').reset();

            // Mettre à jour l'affichage des groupes si la fonction existe
            if (typeof this.updateGroupsList === 'function') {
                await this.updateGroupsList();
            }

        } catch (error) {
            console.error('Erreur lors de la création du groupe:', error);
            if (window.notyf) {
                window.notyf.error('❌ Erreur: ' + (error.message || 'Erreur lors de la création du groupe'));
            }
        }
    }

    async handleDepositToGroup(e) {
        e.preventDefault();
        try {
            const groupId = document.getElementById('depositGroupId').value;
            const amount = document.getElementById('depositAmount').value;

            if (!groupId || !amount) {
                window.notyf.error('Veuillez remplir tous les champs');
                return;
            }

            console.log('Données de dépôt:', { groupId, amount });

            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            const userAddress = await signer.getAddress();

            console.log('Adresse de l\'utilisateur:', userAddress);
            console.log('ABI VASS:', window.VASS_ABI);
            console.log('Adresse VASS:', window.CONFIG.VASS_ADDRESS);

            // Vérifier le groupe
            const contract = new ethers.Contract(
                window.CONFIG.SAVINGS_ADDRESS,
                window.SAVINGS_ABI,
                signer
            );

            const group = await contract.groups(groupId);
            console.log('Groupe pour dépôt:', group);

            if (!group || !group.active) {
                window.notyf.error('Ce groupe n\'existe pas ou n\'est pas actif');
                return;
            }

            // Convertir le montant en wei
            const depositAmount = ethers.utils.parseUnits(amount.toString(), 18);
            console.log('Montant à déposer:', depositAmount.toString());

            // Approuver le contrat pour le token VASS
            const vassContract = new ethers.Contract(
                window.CONFIG.VASS_ADDRESS,
                window.VASS_ABI,
                signer
            );

            // Vérifier le solde
            const balance = await vassContract.balanceOf(userAddress);
            console.log('Solde VASS:', ethers.utils.formatUnits(balance, 18));

            if (balance.lt(depositAmount)) {
                window.notyf.error('Solde VASS insuffisant');
                return;
            }

            // Approuver
            console.log('Approbation du contrat...');
            const approveTx = await vassContract.approve(
                window.CONFIG.SAVINGS_ADDRESS,
                depositAmount
            );
            window.notyf.success('Approbation en cours...');
            await approveTx.wait();
            window.notyf.success('Approbation réussie!');

            // Faire le dépôt
            console.log('Dépôt en cours...');
            const tx = await contract.depositToGroup(groupId, depositAmount);
            window.notyf.success('Transaction de dépôt envoyée...');

            const receipt = await tx.wait();
            if (receipt.status === 1) {
                window.notyf.success('Dépôt effectué avec succès!');
                document.getElementById('depositToGroupForm').reset();
                await this.updateActiveGroups();
            } else {
                window.notyf.error('La transaction a échoué');
            }

        } catch (error) {
            console.error('Erreur lors du dépôt:', error);
            if (error.message.includes('Amount too low')) {
                window.notyf.error('Montant trop faible');
            } else if (error.message.includes('Deposit too early')) {
                window.notyf.error('Vous devez attendre un mois entre chaque dépôt');
            } else if (error.message.includes('insufficient allowance')) {
                window.notyf.error('Veuillez approuver le contrat pour utiliser vos VASS');
            } else {
                window.notyf.error('Erreur lors du dépôt dans le groupe');
            }
        }
    }

    async handleMaxDepositAmount() {
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            const userAddress = await signer.getAddress();

            // Obtenir le solde VASS
            const vassContract = new ethers.Contract(
                window.CONFIG.VASS_ADDRESS,
                window.VASS_ABI,
                signer
            );

            const balance = await vassContract.balanceOf(userAddress);
            const balanceFormatted = ethers.utils.formatUnits(balance, 18);
            
            // Mettre à jour le champ de montant
            document.getElementById('depositAmount').value = balanceFormatted;

        } catch (error) {
            console.error('Erreur lors de la récupération du montant maximum:', error);
            window.notyf.error('Impossible de récupérer votre solde');
        }
    }

    async handleJoinGroup(e) {
        e.preventDefault();
        try {
            const groupId = document.getElementById('groupId').value;
            if (!groupId) {
                window.notyf.error('Veuillez entrer l\'ID du groupe');
                return;
            }

            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();

            const contract = new ethers.Contract(
                window.CONFIG.SAVINGS_ADDRESS,
                window.SAVINGS_ABI,
                signer
            );

            // Vérifier si le groupe existe et est actif
            const group = await contract.groups(groupId);
            console.log('Groupe trouvé:', group);
            
            if (!group || !group.active) {
                window.notyf.error('Ce groupe n\'existe pas ou n\'est pas actif');
                return;
            }

            // Récupérer la liste des membres de manière sécurisée
            let members = [];
            try {
                members = group.members || [];
            } catch (error) {
                console.log('Impossible de récupérer la liste des membres:', error);
            }

            // Vérifier si le groupe n'est pas plein
            const memberCount = members.length || 0;
            const maxMembers = group.maxMembers ? group.maxMembers.toNumber() : 0;
            
            console.log('Membres:', {
                current: memberCount,
                max: maxMembers
            });

            if (memberCount >= maxMembers) {
                window.notyf.error('Ce groupe est complet');
                return;
            }

            // Rejoindre le groupe
            console.log('Tentative de rejoindre le groupe...');
            const tx = await contract.joinGroup(groupId);
            window.notyf.success('Transaction envoyée...');

            // Attendre la confirmation
            const receipt = await tx.wait();
            if (receipt.status === 1) {
                window.notyf.success('Vous avez rejoint le groupe avec succès!');
                
                // Réinitialiser le formulaire
                document.getElementById('joinGroupForm').reset();
                
                // Mettre à jour l'affichage des groupes
                await this.updateActiveGroups();
            } else {
                window.notyf.error('La transaction a échoué');
            }

        } catch (error) {
            console.error('Erreur lors de la tentative de rejoindre le groupe:', error);
            if (error.message.includes('Group is full')) {
                window.notyf.error('Le groupe est complet');
            } else if (error.message.includes('Already a member')) {
                window.notyf.error('Vous êtes déjà membre de ce groupe');
            } else if (error.message.includes('Group not active')) {
                window.notyf.error('Ce groupe n\'est pas actif');
            } else {
                window.notyf.error('Erreur lors de la tentative de rejoindre le groupe');
            }
        }
    }

    async updateActiveGroups() {
        try {
            if (!window.ethereum) return;

            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (accounts.length === 0) return;

            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();

            const contract = new ethers.Contract(
                window.CONFIG.SAVINGS_ADDRESS,
                window.SAVINGS_ABI,
                signer
            );

            // Récupérer le nombre total de groupes
            const groupCount = await contract.groupCount();
            console.log('Nombre total de groupes:', groupCount.toString());

            // Récupérer tous les groupes actifs
            const activeGroups = [];
            for (let i = 0; i < groupCount; i++) {
                try {
                    const group = await contract.groups(i);
                    console.log(`Groupe ${i}:`, group);
                    
                    // Vérifier si le groupe existe et est actif
                    if (group && group.active) {
                        // Récupérer la liste des membres
                        let members = [];
                        try {
                            members = group.members || [];
                        } catch (error) {
                            console.log(`Impossible de récupérer les membres du groupe ${i}:`, error);
                        }

                        activeGroups.push({
                            id: i,
                            name: group.name || 'Sans nom',
                            duration: group.duration ? group.duration.toString() : '0',
                            minMonthlyAmount: group.minMonthlyAmount ? ethers.utils.formatUnits(group.minMonthlyAmount, 18) : '0',
                            maxMembers: group.maxMembers ? group.maxMembers.toString() : '0',
                            totalAmount: group.totalAmount ? ethers.utils.formatUnits(group.totalAmount, 18) : '0',
                            memberCount: members.length,
                            creator: group.creator || '0x0000000000000000000000000000000000000000'
                        });
                    }
                } catch (error) {
                    console.error(`Erreur lors de la récupération du groupe ${i}:`, error);
                }
            }

            console.log('Groupes actifs trouvés:', activeGroups);

            // Mettre à jour l'interface
            const activeGroupsList = document.getElementById('activeGroupsList');
            if (activeGroups.length === 0) {
                activeGroupsList.innerHTML = `
                    <div class="text-center text-gray-400 py-4">
                        <i class="ph-fill ph-users-three text-2xl mb-2"></i>
                        <p>Aucun groupe actif</p>
                    </div>
                `;
            } else {
                activeGroupsList.innerHTML = activeGroups.map(group => `
                    <div class="glass-effect p-4 hover-scale">
                        <div class="flex justify-between items-center mb-2">
                            <h3 class="font-bold">${group.name}</h3>
                            <span class="text-sm text-primary-400">${group.duration} mois</span>
                        </div>
                        <div class="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p class="text-gray-400">Membres</p>
                                <p>${group.memberCount}/${group.maxMembers}</p>
                            </div>
                            <div>
                                <p class="text-gray-400">Montant Total</p>
                                <p>${parseFloat(group.totalAmount).toFixed(2)} VASS</p>
                            </div>
                            <div>
                                <p class="text-gray-400">Dépôt Mensuel</p>
                                <p>${parseFloat(group.minMonthlyAmount).toFixed(2)} VASS</p>
                            </div>
                            <div>
                                <p class="text-gray-400">Créateur</p>
                                <p class="truncate" title="${group.creator}">${group.creator.substring(0, 6)}...${group.creator.substring(38)}</p>
                            </div>
                        </div>
                    </div>
                `).join('');
            }

            // Ajouter les gestionnaires d'événements pour le tri
            document.getElementById('sortByMembers').onclick = () => {
                const sorted = [...activeGroups].sort((a, b) => b.memberCount - a.memberCount);
                this.updateGroupsList(sorted);
            };

            document.getElementById('sortByGroupAmount').onclick = () => {
                const sorted = [...activeGroups].sort((a, b) => parseFloat(b.totalAmount) - parseFloat(a.totalAmount));
                this.updateGroupsList(sorted);
            };

        } catch (error) {
            console.error('Erreur lors de la mise à jour des groupes actifs:', error);
        }
    }

    updateGroupsList(groups) {
        const activeGroupsList = document.getElementById('activeGroupsList');
        activeGroupsList.innerHTML = groups.map(group => `
            <div class="glass-effect p-4 hover-scale">
                <div class="flex justify-between items-center mb-2">
                    <h3 class="font-bold">${group.name}</h3>
                    <span class="text-sm text-primary-400">${group.duration} mois</span>
                </div>
                <div class="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <p class="text-gray-400">Membres</p>
                        <p>${group.memberCount}/${group.maxMembers}</p>
                    </div>
                    <div>
                        <p class="text-gray-400">Montant Total</p>
                        <p>${parseFloat(group.totalAmount).toFixed(2)} VASS</p>
                    </div>
                    <div>
                        <p class="text-gray-400">Dépôt Mensuel</p>
                        <p>${parseFloat(group.minMonthlyAmount).toFixed(2)} VASS</p>
                    </div>
                    <div>
                        <p class="text-gray-400">Créateur</p>
                        <p class="truncate" title="${group.creator}">${group.creator.substring(0, 6)}...${group.creator.substring(38)}</p>
                    </div>
                </div>
            </div>
        `).join('');
    }
}

// Initialize app
window.addEventListener('load', () => {
    window.app = new App();
    const joinGroupForm = document.getElementById('joinGroupForm');
    if (joinGroupForm) {
        joinGroupForm.addEventListener('submit', (e) => window.app.handleJoinGroup(e));
    }
    const depositToGroupForm = document.getElementById('depositToGroupForm');
    if (depositToGroupForm) {
        depositToGroupForm.addEventListener('submit', (e) => window.app.handleDepositToGroup(e));
    }
    const maxDepositButton = document.getElementById('maxDepositAmount');
    if (maxDepositButton) {
        maxDepositButton.addEventListener('click', () => window.app.handleMaxDepositAmount());
    }
});
