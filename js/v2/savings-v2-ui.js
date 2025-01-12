// UI Handler pour SavingsV2
class SavingsV2UI {
    constructor() {
        this.initialize();
        this.setupEventListeners();
    }

    initialize() {
        // Initialiser les templates
        this.savingsTemplate = document.getElementById('savingsTemplateV2');
        this.groupTemplate = document.getElementById('groupTemplateV2');
        
        // Mettre à jour les statistiques
        this.updateStats();
        
        // Mettre à jour les listes
        this.updateSavingsList();
        this.updateGroupsList();
        
        // Configurer les écouteurs d'événements pour les récompenses
        document.getElementById('claimIndividualRewardsV2').addEventListener('click', () => this.claimIndividualRewards());
        document.getElementById('claimGroupRewardsV2').addEventListener('click', () => this.claimGroupRewards());
        
        // Configurer les écouteurs pour les retraits d'urgence
        document.getElementById('emergencyWithdrawSavingsV2').addEventListener('click', () => {
            const id = document.getElementById('emergencyWithdrawIdV2').value;
            this.handleEmergencyWithdraw(id);
        });
        
        document.getElementById('emergencyWithdrawGroupV2').addEventListener('click', () => {
            const id = document.getElementById('emergencyWithdrawIdV2').value;
            this.handleGroupEmergencyWithdraw(id);
        });
        
        // Configurer l'actualisation des détails du groupe
        document.getElementById('refreshGroupDetailsV2').addEventListener('click', () => {
            const groupId = document.getElementById('groupIdDetailsV2').value;
            this.updateGroupDetails(groupId);
        });

        // Configurer les contrôles administrateur
        document.getElementById('setMinSavingsAmountV2').addEventListener('click', () => this.setMinSavingsAmount());
        document.getElementById('setMinGroupSavingsAmountV2').addEventListener('click', () => this.setMinGroupSavingsAmount());
        document.getElementById('pauseContractV2').addEventListener('click', () => this.pauseContract());
        document.getElementById('unpauseContractV2').addEventListener('click', () => this.unpauseContract());
        
        // Configurer les actualisations
        document.getElementById('refreshPancakeInfoV2').addEventListener('click', () => this.updatePancakeInfo());
        document.getElementById('refreshRewardsV2').addEventListener('click', () => this.updateDetailedRewards());
        
        // Mettre à jour toutes les informations
        this.updatePancakeInfo();
        this.updateDetailedRewards();
        this.updateContractStatus();
    }

    setupEventListeners() {
        // Formulaire de création d'épargne
        document.getElementById('createSavingsFormV2').addEventListener('submit', async (e) => {
            e.preventDefault();
            const amount = document.getElementById('savingsAmountV2').value;
            const duration = document.getElementById('savingsDurationV2').value;
            
            await savingsV2Handler.createSavings(amount, duration);
            this.updateSavingsList();
        });

        // Formulaire de création de groupe
        document.getElementById('createGroupFormV2').addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('groupNameV2').value;
            const duration = document.getElementById('groupDurationV2').value;
            const minAmount = document.getElementById('groupMinAmountV2').value;
            const maxMembers = document.getElementById('groupMaxMembersV2').value;
            
            await savingsV2Handler.createGroup(name, duration, minAmount, maxMembers);
            this.updateGroupsList();
        });

        // Formulaire d'invitation
        document.getElementById('inviteMemberFormV2').addEventListener('submit', async (e) => {
            e.preventDefault();
            const groupId = document.getElementById('inviteGroupIdV2').value;
            const address = document.getElementById('inviteMemberAddressV2').value;
            
            await savingsV2Handler.inviteMember(groupId, address);
        });

        // Formulaire pour rejoindre un groupe
        document.getElementById('joinGroupFormV2').addEventListener('submit', async (e) => {
            e.preventDefault();
            const groupId = document.getElementById('joinGroupIdV2').value;
            
            await savingsV2Handler.joinGroup(groupId);
            this.updateGroupsList();
        });

        // Formulaire de dépôt dans un groupe
        document.getElementById('depositGroupFormV2').addEventListener('submit', async (e) => {
            e.preventDefault();
            const groupId = document.getElementById('depositGroupIdV2').value;
            const amount = document.getElementById('depositGroupAmountV2').value;
            
            await savingsV2Handler.depositToGroup(groupId, amount);
            this.updateGroupsList();
        });
    }

    async updateSavingsList() {
        const listElement = document.getElementById('activeSavingsListV2');
        listElement.innerHTML = '';

        try {
            const userAddress = await ethereum.request({ method: 'eth_requestAccounts' }).then(accounts => accounts[0]);
            const savings = await savingsV2Handler.contract.getUserSavings(userAddress);

            for (const saving of savings) {
                const clone = this.savingsTemplate.content.cloneNode(true);
                
                // Mettre à jour les informations
                clone.querySelector('.amount').textContent = ethers.utils.formatUnits(saving.amount, 18);
                clone.querySelector('.duration').textContent = saving.duration / (30 * 24 * 60 * 60);
                clone.querySelector('.startDate').textContent = new Date(saving.startTime * 1000).toLocaleDateString();
                
                // Ajouter les événements
                const withdrawBtn = clone.querySelector('.withdraw-btn');
                withdrawBtn.addEventListener('click', () => this.handleWithdraw(saving.id));
                
                const emergencyBtn = clone.querySelector('.emergency-withdraw-btn');
                emergencyBtn.addEventListener('click', () => this.handleEmergencyWithdraw(saving.id));
                
                listElement.appendChild(clone);
            }
        } catch (error) {
            console.error('Erreur lors de la mise à jour des épargnes:', error);
            showError('Impossible de charger les épargnes');
        }
    }

    async updateGroupsList() {
        const listElement = document.getElementById('myGroupsListV2');
        listElement.innerHTML = '';

        try {
            const userAddress = await ethereum.request({ method: 'eth_requestAccounts' }).then(accounts => accounts[0]);
            const groups = await savingsV2Handler.contract.getUserGroups(userAddress);

            for (const groupId of groups) {
                const groupInfo = await savingsV2Handler.contract.getGroupInfo(groupId);
                const memberInfo = await savingsV2Handler.contract.getMemberContribution(groupId, userAddress);
                
                const clone = this.groupTemplate.content.cloneNode(true);
                
                // Mettre à jour les informations
                clone.querySelector('.name').textContent = groupInfo.name;
                clone.querySelector('.amount').textContent = ethers.utils.formatUnits(groupInfo.totalAmount, 18);
                clone.querySelector('.members').textContent = (await savingsV2Handler.contract.getGroupMembers(groupId)).length;
                clone.querySelector('.maxMembers').textContent = groupInfo.maxMembers;
                clone.querySelector('.minAmount').textContent = ethers.utils.formatUnits(groupInfo.minMonthlyAmount, 18);
                clone.querySelector('.myContribution').textContent = ethers.utils.formatUnits(memberInfo.amount, 18);
                
                // Ajouter les événements
                const withdrawBtn = clone.querySelector('.withdraw-btn');
                withdrawBtn.addEventListener('click', () => this.handleGroupWithdraw(groupId));
                
                const emergencyBtn = clone.querySelector('.emergency-withdraw-btn');
                emergencyBtn.addEventListener('click', () => this.handleGroupEmergencyWithdraw(groupId));
                
                listElement.appendChild(clone);
            }
        } catch (error) {
            console.error('Erreur lors de la mise à jour des groupes:', error);
            showError('Impossible de charger les groupes');
        }
    }

    async updateStats() {
        try {
            const userAddress = await ethereum.request({ method: 'eth_requestAccounts' }).then(accounts => accounts[0]);
            
            // Total des épargnes
            const totalSavings = await savingsV2Handler.contract.getTotalSavings();
            document.getElementById('totalSavingsV2').textContent = ethers.utils.formatUnits(totalSavings, 18);
            
            // Récompenses totales
            const totalRewards = await savingsV2Handler.contract.getPendingRewards();
            document.getElementById('totalRewardsV2').textContent = ethers.utils.formatUnits(totalRewards, 18);
            
            // Groupes actifs
            const groups = await savingsV2Handler.contract.getUserGroups(userAddress);
            document.getElementById('activeGroupsV2').textContent = groups.length;
            
            // Récompenses individuelles et de groupe
            const individualRewards = await savingsV2Handler.contract.getPendingIndividualRewards(userAddress);
            const groupRewards = await savingsV2Handler.contract.getPendingGroupRewards(userAddress);
            
            document.getElementById('individualRewardsV2').textContent = ethers.utils.formatUnits(individualRewards, 18);
            document.getElementById('groupRewardsV2').textContent = ethers.utils.formatUnits(groupRewards, 18);
        } catch (error) {
            console.error('Erreur lors de la mise à jour des statistiques:', error);
        }
    }

    async updateGroupDetails(groupId) {
        try {
            const groupInfo = await savingsV2Handler.contract.getGroupInfo(groupId);
            const members = await savingsV2Handler.contract.getGroupMembers(groupId);
            
            // Mettre à jour les informations générales
            document.getElementById('groupNameDetailsV2').textContent = groupInfo.name;
            document.getElementById('groupCreatorV2').textContent = groupInfo.creator;
            document.getElementById('groupDurationDetailsV2').textContent = `${groupInfo.duration / (30 * 24 * 60 * 60)} mois`;
            document.getElementById('groupMinAmountDetailsV2').textContent = ethers.utils.formatUnits(groupInfo.minMonthlyAmount, 18);
            document.getElementById('groupTotalAmountV2').textContent = ethers.utils.formatUnits(groupInfo.totalAmount, 18);
            
            // Mettre à jour la liste des membres
            const membersList = document.getElementById('groupMembersListV2');
            membersList.innerHTML = '';
            
            for (const member of members) {
                const memberInfo = await savingsV2Handler.contract.getMemberContribution(groupId, member);
                const div = document.createElement('div');
                div.className = 'flex justify-between items-center p-2 bg-dark-700 rounded';
                div.innerHTML = `
                    <span class="text-sm">${member}</span>
                    <span class="text-sm font-bold">${ethers.utils.formatUnits(memberInfo.amount, 18)} USDT</span>
                `;
                membersList.appendChild(div);
            }
        } catch (error) {
            console.error('Erreur lors de la mise à jour des détails du groupe:', error);
            showError('Impossible de charger les détails du groupe');
        }
    }

    async handleWithdraw(savingsId) {
        try {
            await savingsV2Handler.contract.withdraw(savingsId);
            showSuccess('Retrait effectué avec succès');
            this.updateSavingsList();
        } catch (error) {
            console.error('Erreur lors du retrait:', error);
            showError(error.message);
        }
    }

    async handleEmergencyWithdraw(savingsId) {
        if (!confirm('Attention: Le retrait d\'urgence entraîne une pénalité de 25%. Continuer?')) return;
        
        try {
            await savingsV2Handler.contract.emergencyWithdraw(savingsId);
            showSuccess('Retrait d\'urgence effectué');
            this.updateSavingsList();
        } catch (error) {
            console.error('Erreur lors du retrait d\'urgence:', error);
            showError(error.message);
        }
    }

    async handleGroupWithdraw(groupId) {
        try {
            await savingsV2Handler.contract.withdrawFromGroup(groupId);
            showSuccess('Retrait du groupe effectué');
            this.updateGroupsList();
        } catch (error) {
            console.error('Erreur lors du retrait du groupe:', error);
            showError(error.message);
        }
    }

    async handleGroupEmergencyWithdraw(groupId) {
        if (!confirm('Attention: Le retrait d\'urgence du groupe entraîne une pénalité de 30%. Continuer?')) return;
        
        try {
            await savingsV2Handler.contract.emergencyWithdrawFromGroup(groupId);
            showSuccess('Retrait d\'urgence du groupe effectué');
            this.updateGroupsList();
        } catch (error) {
            console.error('Erreur lors du retrait d\'urgence du groupe:', error);
            showError(error.message);
        }
    }

    async claimIndividualRewards() {
        try {
            await savingsV2Handler.contract.claimIndividualRewards();
            showSuccess('Récompenses individuelles réclamées');
            this.updateStats();
        } catch (error) {
            console.error('Erreur lors de la réclamation des récompenses:', error);
            showError(error.message);
        }
    }
    
    async claimGroupRewards() {
        try {
            await savingsV2Handler.contract.claimGroupRewards();
            showSuccess('Récompenses de groupe réclamées');
            this.updateStats();
        } catch (error) {
            console.error('Erreur lors de la réclamation des récompenses:', error);
            showError(error.message);
        }
    }

    async updateContractStatus() {
        try {
            const isPaused = await savingsV2Handler.contract.paused();
            const statusElement = document.getElementById('contractStatusV2');
            
            if (isPaused) {
                statusElement.textContent = 'En Pause';
                statusElement.className = 'px-3 py-1 rounded-full text-sm bg-red-500 text-white';
            } else {
                statusElement.textContent = 'Actif';
                statusElement.className = 'px-3 py-1 rounded-full text-sm bg-green-500 text-white';
            }
        } catch (error) {
            console.error('Erreur lors de la mise à jour du statut:', error);
        }
    }

    async updatePancakeInfo() {
        try {
            // Taux de change USDT/CAKE
            const path = [
                savingsV2Handler.contract.usdtToken(),
                savingsV2Handler.contract.cakeToken()
            ];
            const amountIn = ethers.utils.parseUnits("1", 18); // 1 USDT
            const amounts = await savingsV2Handler.pancakeRouter.getAmountsOut(amountIn, path);
            const rate = ethers.utils.formatUnits(amounts[1], 18);
            document.getElementById('usdtToCakeRateV2').textContent = parseFloat(rate).toFixed(4);

            // APY du staking
            const totalAllocPoint = await savingsV2Handler.masterChef.totalAllocPoint();
            const cakePerBlock = await savingsV2Handler.masterChef.cakePerBlock();
            const poolInfo = await savingsV2Handler.masterChef.poolInfo(savingsV2Handler.contract.pid());
            const apy = this.calculateApy(cakePerBlock, poolInfo.allocPoint, totalAllocPoint);
            document.getElementById('stakingApyV2').textContent = apy.toFixed(2);

            // Total staké
            const stakedInfo = await savingsV2Handler.masterChef.userInfo(
                savingsV2Handler.contract.pid(),
                savingsV2Handler.contract.address
            );
            document.getElementById('totalStakedV2').textContent = 
                ethers.utils.formatUnits(stakedInfo[0], 18);
        } catch (error) {
            console.error('Erreur lors de la mise à jour des infos PancakeSwap:', error);
        }
    }

    async updateDetailedRewards() {
        try {
            const userAddress = await ethereum.request({ method: 'eth_requestAccounts' }).then(accounts => accounts[0]);
            const template = document.getElementById('rewardItemTemplateV2');
            
            // Récompenses individuelles
            const individualList = document.getElementById('individualRewardsListV2');
            individualList.innerHTML = '';
            
            const savingsCount = await savingsV2Handler.contract.userSavingsCount(userAddress);
            for (let i = 0; i < savingsCount; i++) {
                const savings = await savingsV2Handler.contract.userSavings(userAddress, i);
                if (savings.active) {
                    const rewards = await savingsV2Handler.contract.getPendingRewards(i);
                    const clone = template.content.cloneNode(true);
                    
                    clone.querySelector('.id').textContent = i;
                    clone.querySelector('.startDate').textContent = 
                        new Date(savings.startTime * 1000).toLocaleDateString();
                    clone.querySelector('.amount').textContent = 
                        ethers.utils.formatUnits(rewards, 18);
                    // TODO: Ajouter la valeur USD
                    
                    individualList.appendChild(clone);
                }
            }
            
            // Récompenses de groupe
            const groupList = document.getElementById('groupRewardsListV2');
            groupList.innerHTML = '';
            
            const userGroups = await savingsV2Handler.contract.getUserGroups(userAddress);
            for (const groupId of userGroups) {
                const rewards = await savingsV2Handler.contract.getPendingGroupRewards(groupId);
                const group = await savingsV2Handler.contract.groups(groupId);
                
                const clone = template.content.cloneNode(true);
                clone.querySelector('.id').textContent = groupId;
                clone.querySelector('.startDate').textContent = 
                    new Date(group.startTime * 1000).toLocaleDateString();
                clone.querySelector('.amount').textContent = 
                    ethers.utils.formatUnits(rewards, 18);
                // TODO: Ajouter la valeur USD
                
                groupList.appendChild(clone);
            }
        } catch (error) {
            console.error('Erreur lors de la mise à jour des récompenses détaillées:', error);
        }
    }

    // Fonctions administrateur
    async setMinSavingsAmount() {
        try {
            const amount = document.getElementById('minSavingsAmountV2').value;
            const amountWei = ethers.utils.parseUnits(amount, 18);
            
            await savingsV2Handler.contract.setMinSavingsAmount(amountWei);
            showSuccess('Montant minimum mis à jour');
        } catch (error) {
            console.error('Erreur lors de la mise à jour du montant minimum:', error);
            showError(error.message);
        }
    }

    async setMinGroupSavingsAmount() {
        try {
            const amount = document.getElementById('minGroupSavingsAmountV2').value;
            const amountWei = ethers.utils.parseUnits(amount, 18);
            
            await savingsV2Handler.contract.setMinGroupSavingsAmount(amountWei);
            showSuccess('Montant minimum des groupes mis à jour');
        } catch (error) {
            console.error('Erreur lors de la mise à jour du montant minimum des groupes:', error);
            showError(error.message);
        }
    }

    async pauseContract() {
        try {
            await savingsV2Handler.contract.pause();
            showSuccess('Contrat mis en pause');
            this.updateContractStatus();
        } catch (error) {
            console.error('Erreur lors de la mise en pause:', error);
            showError(error.message);
        }
    }

    async unpauseContract() {
        try {
            await savingsV2Handler.contract.unpause();
            showSuccess('Contrat réactivé');
            this.updateContractStatus();
        } catch (error) {
            console.error('Erreur lors de la réactivation:', error);
            showError(error.message);
        }
    }

    calculateApy(cakePerBlock, poolAlloc, totalAlloc) {
        const BLOCKS_PER_YEAR = 10512000;
        const cakePerYear = cakePerBlock.mul(BLOCKS_PER_YEAR).mul(poolAlloc).div(totalAlloc);
        return parseFloat(ethers.utils.formatUnits(cakePerYear, 18)) * 100;
    }
}

// Initialiser l'UI quand le DOM est chargé
window.addEventListener('DOMContentLoaded', () => {
    window.savingsV2UI = new SavingsV2UI();
});
