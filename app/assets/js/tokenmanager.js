/**
 * TokenManager - Gestion centralisée du système de jetons
 * Stockage persistant par joueur (UUID) avec localStorage
 */

class TokenManager {
    constructor() {
        this.STORAGE_PREFIX = 'tokens_';
        this.SYNC_EVENT = 'tokensUpdated';
    }

    /**
     * Obtient le solde de jetons d'un joueur
     * @param {string} uuid - UUID du joueur
     * @returns {number} Solde en jetons
     */
    getBalance(uuid) {
        if (!uuid) return 0;
        const balance = localStorage.getItem(this.STORAGE_PREFIX + uuid);
        return balance ? parseInt(balance, 10) : 0;
    }

    /**
     * Définit le solde de jetons d'un joueur
     * @param {string} uuid - UUID du joueur
     * @param {number} amount - Montant en jetons
     * @returns {number} Nouveau solde
     */
    setBalance(uuid, amount) {
        if (!uuid) return 0;
        const validAmount = Math.max(0, parseInt(amount, 10) || 0);
        localStorage.setItem(this.STORAGE_PREFIX + uuid, validAmount.toString());
        this._notifyUpdate(uuid, validAmount);
        return validAmount;
    }

    /**
     * Ajoute des jetons au solde d'un joueur
     * @param {string} uuid - UUID du joueur
     * @param {number} amount - Montant à ajouter
     * @returns {number} Nouveau solde
     */
    addTokens(uuid, amount) {
        if (!uuid) return 0;
        const current = this.getBalance(uuid);
        const addAmount = parseInt(amount, 10) || 0;
        const newBalance = current + addAmount;
        return this.setBalance(uuid, newBalance);
    }

    /**
     * Retire des jetons du solde d'un joueur
     * @param {string} uuid - UUID du joueur
     * @param {number} amount - Montant à retirer
     * @returns {number} Nouveau solde (min 0)
     */
    removeTokens(uuid, amount) {
        if (!uuid) return 0;
        const current = this.getBalance(uuid);
        const removeAmount = parseInt(amount, 10) || 0;
        const newBalance = Math.max(0, current - removeAmount);
        return this.setBalance(uuid, newBalance);
    }

    /**
     * Notifie tous les listeners qu'un solde a été mis à jour
     * @private
     */
    _notifyUpdate(uuid, newBalance) {
        // Créer et dispatcher un événement personnalisé
        const event = new CustomEvent(this.SYNC_EVENT, {
            detail: { uuid, balance: newBalance }
        });
        document.dispatchEvent(event);
    }

    /**
     * Écoute les mises à jour de jetons
     * @param {Function} callback - Fonction appelée avec {uuid, balance}
     */
    onUpdate(callback) {
        document.addEventListener(this.SYNC_EVENT, (event) => {
            callback(event.detail);
        });
    }

    /**
     * Réinitialise le solde d'un joueur à 0
     * @param {string} uuid - UUID du joueur
     */
    reset(uuid) {
        return this.setBalance(uuid, 0);
    }

    /**
     * Efface tous les tokens (attention: destructif)
     */
    clearAll() {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith(this.STORAGE_PREFIX)) {
                localStorage.removeItem(key);
            }
        });
    }

    /**
     * Obtient tous les soldes (pour debug/admin)
     * @returns {Object} {uuid: balance, ...}
     */
    getAllBalances() {
        const result = {};
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith(this.STORAGE_PREFIX)) {
                const uuid = key.substring(this.STORAGE_PREFIX.length);
                result[uuid] = parseInt(localStorage.getItem(key), 10);
            }
        });
        return result;
    }
}

// Instance globale
const TokenManager_Instance = new TokenManager();
