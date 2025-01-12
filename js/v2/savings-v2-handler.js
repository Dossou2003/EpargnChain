// Handler pour SavingsV2
class SavingsV2Handler {
    constructor() {
        this.contract = null;
        this.usdtContract = null;
        this.initialize();
    }

    async initialize() {
        try {
            // Initialiser les contrats
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            
            this.contract = new ethers.Contract(
                CONFIG.SAVINGS_V2_ADDRESS,
                SAVINGS_V2_ABI,
                signer
            );

            this.usdtContract = new ethers.Contract(
                CONFIG.USDT_ADDRESS,
                USDT_ABI,
                signer
            );

            // Écouter les événements
            this.listenToEvents();
        } catch (error) {
            console.error("Erreur d'initialisation:", error);
            showError("Erreur d'initialisation du contrat");
        }
    }

    // Épargne Individuelle
    async createSavings(amount, duration) {
        try {
            const amountWei = ethers.utils.parseUnits(amount.toString(), 18);
            
            // Vérifier et demander l'approbation USDT
            const allowance = await this.usdtContract.allowance(
                await this.contract.signer.getAddress(),
                this.contract.address
            );

            if (allowance.lt(amountWei)) {
                const approveTx = await this.usdtContract.approve(
                    this.contract.address,
                    amountWei
                );
                await approveTx.wait();
            }

            // Créer l'épargne
            const tx = await this.contract.createSavings(amountWei, duration);
            await tx.wait();

            showSuccess("Épargne créée avec succès!");
            return true;
        } catch (error) {
            console.error("Erreur création épargne:", error);
            showError(error.message);
            return false;
        }
    }

    // Groupe
    async createGroup(name, duration, minMonthlyAmount, maxMembers) {
        try {
            const minAmountWei = ethers.utils.parseUnits(minMonthlyAmount.toString(), 18);
            
            const tx = await this.contract.createGroup(
                name,
                duration,
                minAmountWei,
                maxMembers
            );
            await tx.wait();

            showSuccess("Groupe créé avec succès!");
            return true;
        } catch (error) {
            console.error("Erreur création groupe:", error);
            showError(error.message);
            return false;
        }
    }

    async inviteMember(groupId, memberAddress) {
        try {
            const tx = await this.contract.inviteMember(groupId, memberAddress);
            await tx.wait();
            showSuccess("Invitation envoyée!");
            return true;
        } catch (error) {
            console.error("Erreur invitation:", error);
            showError(error.message);
            return false;
        }
    }

    async joinGroup(groupId) {
        try {
            const tx = await this.contract.joinGroup(groupId);
            await tx.wait();
            showSuccess("Vous avez rejoint le groupe!");
            return true;
        } catch (error) {
            console.error("Erreur adhésion:", error);
            showError(error.message);
            return false;
        }
    }

    async depositToGroup(groupId, amount) {
        try {
            const amountWei = ethers.utils.parseUnits(amount.toString(), 18);
            
            // Vérifier et demander l'approbation USDT
            const allowance = await this.usdtContract.allowance(
                await this.contract.signer.getAddress(),
                this.contract.address
            );

            if (allowance.lt(amountWei)) {
                const approveTx = await this.usdtContract.approve(
                    this.contract.address,
                    amountWei
                );
                await approveTx.wait();
            }

            const tx = await this.contract.depositToGroup(groupId, amountWei);
            await tx.wait();
            
            showSuccess("Dépôt effectué avec succès!");
            return true;
        } catch (error) {
            console.error("Erreur dépôt:", error);
            showError(error.message);
            return false;
        }
    }

    // Événements
    listenToEvents() {
        this.contract.on("SavingsCreated", (user, amount, duration) => {
            console.log("Nouvelle épargne créée:", { user, amount, duration });
            // Mettre à jour l'interface
            this.updateUI();
        });

        this.contract.on("GroupCreated", (groupId, name, creator) => {
            console.log("Nouveau groupe créé:", { groupId, name, creator });
            // Mettre à jour l'interface
            this.updateUI();
        });

        // Autres événements...
    }

    // Utilitaires
    async updateUI() {
        // Mettre à jour l'interface utilisateur
        // À implémenter selon vos besoins
    }
}

// Exporter l'instance
window.savingsV2Handler = new SavingsV2Handler();
