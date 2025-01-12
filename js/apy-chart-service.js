class APYChartService {
    constructor() {
        this.chart = null;
        this.currentPeriod = '7d';
        this.initialize();
    }

    initialize() {
        const ctx = document.getElementById('apyChart');
        if (!ctx) return;

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'APY %',
                    data: [],
                    borderColor: '#4F46E5',
                    backgroundColor: 'rgba(79, 70, 229, 0.1)',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6
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
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        titleColor: '#1F2937',
                        bodyColor: '#1F2937',
                        borderColor: '#E5E7EB',
                        borderWidth: 1,
                        padding: 10,
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
                            font: {
                                size: 12
                            },
                            color: '#6B7280'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)',
                            drawBorder: false
                        },
                        ticks: {
                            font: {
                                size: 12
                            },
                            color: '#6B7280',
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                animations: {
                    tension: {
                        duration: 1000,
                        easing: 'linear'
                    }
                }
            }
        });

        // Initialiser avec 7 jours par défaut
        this.updateData('7d');
    }

    async updateData(period) {
        this.currentPeriod = period;
        const data = await this.fetchAPYData(period);
        this.updateChart(data);
    }

    async fetchAPYData(period) {
        const days = {
            '7d': 7,
            '14d': 14,
            '30d': 30,
            '90d': 90
        }[period] || 7;

        const data = [];
        const labels = [];
        const baseAPY = 5; // APY de base
        const now = new Date();

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            
            // Format de date plus court
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            labels.push(`${day}/${month}`);

            // Générer un APY plus réaliste
            const variation = Math.sin(i * 0.5) + (Math.random() - 0.5);
            const apy = baseAPY + variation;
            data.push(Math.max(0, apy.toFixed(2))); // Éviter les valeurs négatives
        }

        return { labels, data };
    }

    updateChart(data) {
        if (!this.chart) return;

        this.chart.data.labels = data.labels;
        this.chart.data.datasets[0].data = data.data;
        this.chart.update('active'); // Animation plus fluide
    }
}

// Fonction globale pour mettre à jour le graphique
window.updateAPYChart = function(period) {
    if (window.apyChartService) {
        window.apyChartService.updateData(period);
    }
};

// Créer l'instance et la rendre disponible globalement
window.apyChartService = new APYChartService();
