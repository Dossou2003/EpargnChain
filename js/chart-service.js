class ChartService {
    constructor() {
        this.apyChart = null;
        this.currentPeriod = '7d';
        this.initialize();
    }

    initialize() {
        const ctx = document.getElementById('apyChart').getContext('2d');
        
        this.apyChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'APY %',
                    data: [],
                    borderColor: '#FFB237',
                    backgroundColor: 'rgba(255, 178, 55, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                return `APY: ${context.parsed.y.toFixed(2)}%`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#9CA3AF'
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(156, 163, 175, 0.1)'
                        },
                        ticks: {
                            color: '#9CA3AF',
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });

        // Ajouter les écouteurs d'événements pour les boutons de période
        document.querySelectorAll('[id^="period-"]').forEach(button => {
            button.addEventListener('click', (e) => {
                const period = e.target.id.split('-')[1];
                this.updatePeriod(period);
            });
        });

        // Charger les données initiales
        this.updatePeriod('7d');
    }

    async updatePeriod(period) {
        // Mettre à jour le bouton actif
        document.querySelectorAll('[id^="period-"]').forEach(btn => {
            btn.classList.remove('active');
        });
        document.getElementById(`period-${period}`).classList.add('active');

        // Mettre à jour la période actuelle
        this.currentPeriod = period;

        // Simuler des données pour la démonstration
        // Dans un cas réel, ces données viendraient du smart contract
        const data = await this.getApyData(period);
        this.updateChart(data);
    }

    async getApyData(period) {
        try {
            // Obtenir les données APY du contrat
            const days = period === '7d' ? 7 : period === '30d' ? 30 : 365;
            const data = [];
            const labels = [];
            
            // Simuler des données historiques pour la démonstration
            const baseAPY = await window.balanceService.vassContract.getAPY();
            const baseAPYValue = parseFloat(baseAPY) / 100;
            
            for(let i = days; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                labels.push(date.toLocaleDateString());
                
                // Ajouter une variation aléatoire à l'APY de base
                const variation = (Math.random() - 0.5) * 2; // Variation de ±1%
                data.push(baseAPYValue + variation);
            }
            
            return {
                labels: labels,
                data: data
            };
        } catch (error) {
            console.error("Error fetching APY data:", error);
            return {
                labels: [],
                data: []
            };
        }
    }

    async updateChart(data) {
        if (this.apyChart) {
            this.apyChart.data.labels = data.labels;
            this.apyChart.data.datasets[0].data = data.data;
            this.apyChart.update();
        }
    }
}

// Export
window.chartService = new ChartService();
