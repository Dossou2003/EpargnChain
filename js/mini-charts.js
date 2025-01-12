class MiniChartsService {
    constructor() {
        this.charts = {
            bnb: null,
            vass: null,
            savings: null,
            rewards: null
        };
        this.updateInterval = null;
    }

    initialize() {
        // Configuration de base pour tous les mini graphiques
        this.chartConfig = {
            type: 'line',
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        display: false,
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        display: false,
                        grid: {
                            display: false
                        }
                    }
                },
                elements: {
                    point: {
                        radius: 0
                    },
                    line: {
                        tension: 0.4,
                        borderWidth: 2
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                animation: {
                    duration: 1000
                }
            }
        };

        // Initialiser chaque graphique
        this.initializeChart('bnb', '#FFB237');
        this.initializeChart('vass', '#14B8A6');
        this.initializeChart('savings', '#22C55E');
        this.initializeChart('rewards', '#A855F7');

        // Mettre à jour les données toutes les 30 secondes
        this.startAutoUpdate();
    }

    initializeChart(type, color) {
        const canvas = document.getElementById(`${type}MiniChart`);
        if (!canvas) {
            console.error(`Canvas not found for ${type}MiniChart`);
            return;
        }

        const ctx = canvas.getContext('2d');
        const gradient = ctx.createLinearGradient(0, 0, 0, 60);
        gradient.addColorStop(0, `${color}30`);
        gradient.addColorStop(1, `${color}00`);

        this.charts[type] = new Chart(ctx, {
            ...this.chartConfig,
            data: {
                labels: Array(10).fill(''),
                datasets: [{
                    data: this.generateDummyData(),
                    borderColor: color,
                    backgroundColor: gradient,
                    fill: true
                }]
            }
        });
    }

    generateDummyData() {
        const data = [];
        let lastValue = Math.random() * 100;
        for (let i = 0; i < 10; i++) {
            lastValue = lastValue + (Math.random() - 0.5) * 20;
            lastValue = Math.max(0, lastValue);
            data.push(lastValue);
        }
        return data;
    }

    updateChartData(type) {
        if (this.charts[type]) {
            const newData = this.generateDummyData();
            this.charts[type].data.datasets[0].data = newData;
            this.charts[type].update('none');
        }
    }

    startAutoUpdate() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }

        this.updateInterval = setInterval(() => {
            Object.keys(this.charts).forEach(type => {
                this.updateChartData(type);
            });
        }, 30000);
    }

    stopAutoUpdate() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    destroy() {
        this.stopAutoUpdate();
        Object.values(this.charts).forEach(chart => {
            if (chart) {
                chart.destroy();
            }
        });
        this.charts = {
            bnb: null,
            vass: null,
            savings: null,
            rewards: null
        };
    }
}

// Rendre le service disponible globalement
window.MiniChartsService = MiniChartsService;
