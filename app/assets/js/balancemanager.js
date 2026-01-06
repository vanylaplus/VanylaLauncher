// VanylaPlus Balance Manager - Gestion robuste et optimisée de la monnaie du serveur
// Synchronisation en temps réel avec système de caching et polling

class BalanceManager {
    constructor(config = {}) {
        this.config = {
            apiBaseUrl: config.apiBaseUrl || 'http://localhost:8080/api',
            pollingInterval: config.pollingInterval || 30000, // 30 secondes
            cacheExpiry: config.cacheExpiry || 60000, // 1 minute
            maxRetries: config.maxRetries || 3,
            retryDelay: config.retryDelay || 2000,
            ...config
        };

        this.cache = new Map();
        this.pollingTimers = new Map();
        this.retryCount = new Map();
        this.listeners = new Map();
    }

    /**
     * Récupère le solde d'un joueur depuis le serveur
     * @param {string} uuid - UUID du joueur
     * @param {boolean} forceRefresh - Forcer l'actualisation du cache
     * @returns {Promise<number>} Le solde en Jetons
     */
    async getBalance(uuid, forceRefresh = false) {
        // Vérifier le cache
        if (!forceRefresh && this.cache.has(uuid)) {
            const cached = this.cache.get(uuid);
            if (Date.now() - cached.timestamp < this.config.cacheExpiry) {
                return cached.balance;
            }
        }

        try {
            const response = await fetch(`${this.config.apiBaseUrl}/player/${uuid}/balance`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'VanylaLauncher/2.0'
                },
                timeout: 5000
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            const balance = parseInt(data.balance || 0);

            // Mettre en cache et réinitialiser les retries
            this.cache.set(uuid, {
                balance: balance,
                timestamp: Date.now()
            });
            this.retryCount.set(uuid, 0);

            // Notifier les listeners
            this.notifyListeners(uuid, balance);

            return balance;
        } catch (error) {
            console.error(`[BalanceManager] Erreur lors du chargement du solde pour ${uuid}:`, error);
            
            // Retry logic
            const retries = this.retryCount.get(uuid) || 0;
            if (retries < this.config.maxRetries) {
                this.retryCount.set(uuid, retries + 1);
                await this.delay(this.config.retryDelay * (retries + 1));
                return this.getBalance(uuid, forceRefresh);
            }

            // Retourner la valeur en cache ou 0
            if (this.cache.has(uuid)) {
                return this.cache.get(uuid).balance;
            }
            return 0;
        }
    }

    /**
     * Démarre le polling automatique pour un joueur
     * @param {string} uuid - UUID du joueur
     * @param {function} onUpdate - Callback appelé lors de la mise à jour
     */
    startPolling(uuid, onUpdate) {
        // Arrêter le polling existant
        this.stopPolling(uuid);

        // Enregistrer le listener
        this.listeners.set(uuid, onUpdate);

        // Premier chargement immédiat
        this.getBalance(uuid, true).then(balance => {
            onUpdate(balance);
        });

        // Polling récurrent
        const timer = setInterval(async () => {
            try {
                const balance = await this.getBalance(uuid, false);
                onUpdate(balance);
            } catch (error) {
                console.error(`[BalanceManager] Erreur lors du polling pour ${uuid}:`, error);
            }
        }, this.config.pollingInterval);

        this.pollingTimers.set(uuid, timer);
    }

    /**
     * Arrête le polling pour un joueur
     * @param {string} uuid - UUID du joueur
     */
    stopPolling(uuid) {
        if (this.pollingTimers.has(uuid)) {
            clearInterval(this.pollingTimers.get(uuid));
            this.pollingTimers.delete(uuid);
        }
    }

    /**
     * Notifie tous les listeners d'une mise à jour
     * @param {string} uuid - UUID du joueur
     * @param {number} balance - Nouveau solde
     */
    notifyListeners(uuid, balance) {
        if (this.listeners.has(uuid)) {
            try {
                this.listeners.get(uuid)(balance);
            } catch (error) {
                console.error(`[BalanceManager] Erreur lors de l'appel du listener pour ${uuid}:`, error);
            }
        }
    }

    /**
     * Forcer une actualisation immédiate
     * @param {string} uuid - UUID du joueur
     */
    async refresh(uuid) {
        return this.getBalance(uuid, true);
    }

    /**
     * Vider le cache
     */
    clearCache() {
        this.cache.clear();
        this.retryCount.clear();
    }

    /**
     * Arrêter tous les pollings
     */
    stopAll() {
        this.pollingTimers.forEach((timer, uuid) => {
            clearInterval(timer);
        });
        this.pollingTimers.clear();
        this.listeners.clear();
    }

    /**
     * Utilitaire pour délai
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Instance globale
window.balanceManager = new BalanceManager({
    apiBaseUrl: 'http://localhost:8080/api', // À configurer selon votre serveur
    pollingInterval: 30000, // 30 secondes
    cacheExpiry: 60000 // 1 minute
});

// Initialiser le système au chargement
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBalanceDisplay);
} else {
    initBalanceDisplay();
}

/**
 * Initialise l'affichage du solde
 */
function initBalanceDisplay() {
    const balanceElement = document.getElementById('user_balance');
    const refreshBtn = document.getElementById('refreshBalanceBtn');

    if (!balanceElement) return;

    // Écouter les mises à jour du profil
    if (window.addEventListener) {
        window.addEventListener('userProfileLoaded', (event) => {
            const playerUUID = event.detail?.uuid;
            if (playerUUID) {
                startBalancePolling(playerUUID, balanceElement, refreshBtn);
            }
        });
    }

    // Bouton de rafraîchissement manuel
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            refreshBtn.style.animation = 'spin 0.6s linear';
            
            const playerUUID = window.currentPlayerUUID;
            if (playerUUID) {
                const balance = await window.balanceManager.refresh(playerUUID);
                updateBalanceDisplay(balanceElement, balance);
            }
            
            setTimeout(() => {
                refreshBtn.style.animation = '';
            }, 600);
        });
    }
}

/**
 * Démarre le polling pour un joueur
 * @param {string} uuid - UUID du joueur
 * @param {Element} balanceElement - Élément DOM à mettre à jour
 * @param {Element} refreshBtn - Bouton de rafraîchissement
 */
function startBalancePolling(uuid, balanceElement, refreshBtn) {
    window.currentPlayerUUID = uuid;
    
    window.balanceManager.startPolling(uuid, (balance) => {
        updateBalanceDisplay(balanceElement, balance);
    });
}

/**
 * Met à jour l'affichage du solde
 * @param {Element} element - Élément DOM
 * @param {number} balance - Nouveau solde
 */
function updateBalanceDisplay(element, balance) {
    if (!element) return;
    
    const formattedBalance = new Intl.NumberFormat('fr-FR').format(balance);
    element.textContent = formattedBalance;
    
    // Animation de mise à jour
    element.style.opacity = '0.6';
    element.style.transform = 'scale(1.1)';
    setTimeout(() => {
        element.style.opacity = '1';
        element.style.transform = 'scale(1)';
    }, 150);
}

// Ajouter l'animation CSS pour le bouton de rafraîchissement
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
    
    #refreshBalanceBtn:hover {
        background: rgba(0, 144, 255, 0.3) !important;
        border-color: rgba(0, 144, 255, 0.5) !important;
    }
    
    #user_balance {
        transition: all 0.15s ease;
    }
`;
document.head.appendChild(style);

// Exporter pour utilisation externe
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BalanceManager;
}
