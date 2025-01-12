class SavingsService {
    constructor() {
        this.contract = null;
        this.provider = null;
        this.signer = null;
    }

    async initialize(provider) {
        this.provider = provider;
        this.signer = provider.getSigner();
        this.contract = new ethers.Contract(
            contractConfig.addresses.savingsV3,
            savingsV3ABI,
            this.signer
        );
    }

    async createSavings(amount, duration) {
        try {
            const amountInWei = ethers.utils.parseEther(amount.toString());
            const tx = await this.contract.createSavings(amountInWei, duration);
            await tx.wait();
            return true;
        } catch (error) {
            console.error('Error creating savings:', error);
            throw error;
        }
    }

    async getActiveSavings(address) {
        try {
            const savings = await this.contract.getSavingsByAddress(address);
            return savings.map(saving => ({
                id: saving.id.toString(),
                amount: ethers.utils.formatEther(saving.amount),
                duration: saving.duration.toString(),
                startTime: saving.startTime.toString(),
                rewards: ethers.utils.formatEther(saving.rewards),
                isActive: saving.isActive
            }));
        } catch (error) {
            console.error('Error getting active savings:', error);
            return [];
        }
    }

    async withdrawSavings(savingsId) {
        try {
            const tx = await this.contract.withdraw(savingsId);
            await tx.wait();
            return true;
        } catch (error) {
            console.error('Error withdrawing savings:', error);
            throw error;
        }
    }

    calculateTimeLeft(startTime, duration) {
        const now = Math.floor(Date.now() / 1000);
        const endTime = parseInt(startTime) + parseInt(duration);
        const timeLeft = endTime - now;
        
        if (timeLeft <= 0) return 'Terminé';
        
        const days = Math.floor(timeLeft / 86400);
        const hours = Math.floor((timeLeft % 86400) / 3600);
        
        return `${days}j ${hours}h`;
    }
}

// Créer l'instance et la rendre disponible globalement
window.savingsService = new SavingsService();
