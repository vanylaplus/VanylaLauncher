/**
 * WheelManager - Gestion du cooldown quotidien de la roue de fortune
 * Utilise UUID pour éviter les triques (anti-bypass par IP/cookies)
 */

class WheelManager {
    constructor() {
        this.STORAGE_PREFIX = 'wheel_spin_';
        this.SPIN_LIMIT = 1; // 1 spin par jour
    }

    /**
     * Obtient le timestamp du dernier spin d'un joueur
     * @param {string} uuid - UUID du joueur
     * @returns {number} Timestamp en millisecondes (0 si jamais tourné)
     */
    getLastSpinTime(uuid) {
        if (!uuid) return 0;
        const timestamp = localStorage.getItem(this.STORAGE_PREFIX + uuid);
        return timestamp ? parseInt(timestamp, 10) : 0;
    }

    /**
     * Enregistre un spin pour le joueur (stocke la date d'aujourd'hui)
     * @param {string} uuid - UUID du joueur
     */
    recordSpin(uuid) {
        if (!uuid) return;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        localStorage.setItem(this.STORAGE_PREFIX + uuid, today.getTime().toString());
    }

    /**
     * Vérifie si le joueur peut tourner la roue
     * @param {string} uuid - UUID du joueur
     * @returns {boolean} true si peut tourner, false sinon
     */
    canSpin(uuid) {
        if (!uuid) return false;
        
        const lastSpinTime = this.getLastSpinTime(uuid);
        if (lastSpinTime === 0) return true; // Jamais tourné
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const lastSpinDate = new Date(lastSpinTime);
        lastSpinDate.setHours(0, 0, 0, 0);
        
        // Peut tourner si la date du dernier spin est différente d'aujourd'hui
        return today.getTime() !== lastSpinDate.getTime();
    }

    /**
     * Calcule le temps restant avant le prochain spin
     * @param {string} uuid - UUID du joueur
     * @returns {Object} {canSpin, hours, minutes, seconds, timeString}
     */
    getTimeRemaining(uuid) {
        if (!uuid) {
            return {
                canSpin: false,
                hours: 0,
                minutes: 0,
                seconds: 0,
                timeString: "Impossible"
            };
        }
        
        if (this.canSpin(uuid)) {
            return {
                canSpin: true,
                hours: 0,
                minutes: 0,
                seconds: 0,
                timeString: ""
            };
        }
        
        const lastSpinTime = this.getLastSpinTime(uuid);
        const lastSpinDate = new Date(lastSpinTime);
        
        // Prochain spin = demain à 00:00
        const nextSpinDate = new Date(lastSpinDate);
        nextSpinDate.setDate(nextSpinDate.getDate() + 1);
        nextSpinDate.setHours(0, 0, 0, 0);
        
        const now = new Date();
        const timeDiff = nextSpinDate.getTime() - now.getTime();
        
        if (timeDiff <= 0) {
            return {
                canSpin: true,
                hours: 0,
                minutes: 0,
                seconds: 0,
                timeString: ""
            };
        }
        
        const hours = Math.floor(timeDiff / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
        
        const timeString = `${hours}h ${minutes}m ${seconds}s`;
        
        return {
            canSpin: false,
            hours,
            minutes,
            seconds,
            timeString
        };
    }

    /**
     * Réinitialise le cooldown d'un joueur (admin only)
     * @param {string} uuid - UUID du joueur
     */
    resetCooldown(uuid) {
        if (!uuid) return;
        localStorage.removeItem(this.STORAGE_PREFIX + uuid);
    }

    /**
     * Efface tous les cooldowns (admin/debug)
     */
    clearAllCooldowns() {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith(this.STORAGE_PREFIX)) {
                localStorage.removeItem(key);
            }
        });
    }

    /**
     * Obtient tous les cooldowns (pour debug/admin)
     */
    getAllCooldowns() {
        const result = {};
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith(this.STORAGE_PREFIX)) {
                const uuid = key.substring(this.STORAGE_PREFIX.length);
                const timestamp = parseInt(localStorage.getItem(key), 10);
                result[uuid] = {
                    lastSpinTime: timestamp,
                    canSpin: this.canSpin(uuid),
                    timeRemaining: this.getTimeRemaining(uuid)
                };
            }
        });
        return result;
    }
}

// Instance globale
const WheelManager_Instance = new WheelManager();
