/**
 * WheelManager - Gestion du cooldown de 24h de la roue de fortune
 * Utilise UUID pour éviter les triques (anti-bypass par IP/cookies)
 */

class WheelManager {
    constructor() {
        this.STORAGE_PREFIX = 'wheel_spin_';
        this.COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 heures en millisecondes
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
     * Enregistre un spin pour le joueur (stocke l'heure actuelle)
     * @param {string} uuid - UUID du joueur
     */
    recordSpin(uuid) {
        if (!uuid) return;
        // Stocke le timestamp exact du moment du spin
        localStorage.setItem(this.STORAGE_PREFIX + uuid, Date.now().toString());
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
        
        const now = Date.now();
        const timeSinceLastSpin = now - lastSpinTime;
        
        // Peut tourner si 24h se sont écoulées depuis le dernier spin
        return timeSinceLastSpin >= this.COOLDOWN_MS;
    }

    /**
     * Calcule le temps restant avant le prochain spin (24h après le dernier spin)
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
        const nextSpinTime = lastSpinTime + this.COOLDOWN_MS;
        
        const now = Date.now();
        const timeDiff = nextSpinTime - now;
        
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
