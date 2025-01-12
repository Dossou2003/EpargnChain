if (typeof NotificationCenter === 'undefined') {
    class NotificationCenter {
        constructor() {
            this.notyf = new Notyf({
                duration: 3000,
                position: { x: 'right', y: 'top' },
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

        success(message) {
            this.notyf.success(message);
        }

        error(message) {
            this.notyf.error(message);
        }

        info(message) {
            this.notyf.open({
                type: 'info',
                message: message,
                background: '#3B82F6'
            });
        }

        warning(message) {
            this.notyf.open({
                type: 'warning',
                message: message,
                background: '#F59E0B'
            });
        }
    }

    // Export dans le scope global
    window.NotificationCenter = NotificationCenter;

    // Fonction globale pour afficher les notifications
    window.showNotification = function(message, type = 'info') {
        if (window.notificationCenter) {
            if (type === 'success') {
                window.notificationCenter.success(message);
            } else if (type === 'error') {
                window.notificationCenter.error(message);
            } else if (type === 'info') {
                window.notificationCenter.info(message);
            } else if (type === 'warning') {
                window.notificationCenter.warning(message);
            }
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    };

    // Initialisation
    document.addEventListener('DOMContentLoaded', () => {
        if (!window.notificationCenter) {
            window.notificationCenter = new NotificationCenter();
        }
    });
}
