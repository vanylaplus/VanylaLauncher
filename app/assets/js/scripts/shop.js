// VanylaPlus Shop System - Système de Shop Innovant et Ingénieux

// Produits disponibles dans le shop
const SHOP_PRODUCTS = [
    // Jetons (EN PREMIER) - Achetables en EUR via PayPal
    { id: 4, name: 'Bundle de 3500 jetons', category: 'jetons', price: 24.99, rarity: 'economie', image: './assets/images/bundlejetons.png', tokenCost: 0 },
    { id: 5, name: 'Coffre de 8000 jetons', category: 'jetons', price: 14.99, rarity: 'economie', image: './assets/images/jetonsads.png', tokenCost: 0 },
    
    // Cosmétiques - Achetables en jetons
    { id: 1, name: 'Pack Cosmétique Gold', category: 'cosmetics', price: 9.99, rarity: 'rare', image: '✨', tokenCost: 5 },
    { id: 2, name: 'Pack Cosmétique Platinum', category: 'cosmetics', price: 19.99, rarity: 'epic', image: '💎', tokenCost: 7 },
    { id: 3, name: 'Pack Cosmétique Diamond', category: 'cosmetics', price: 49.99, rarity: 'legendary', image: '👑', tokenCost: 8 },
    
    // Capes - Achetables en jetons
    { id: 8, name: 'Cape Feu Éternel', category: 'capes', price: 12.99, rarity: 'rare', image: '🔥', tokenCost: 6 },
    { id: 9, name: 'Cape Glace Mystique', category: 'capes', price: 12.99, rarity: 'rare', image: '❄️', tokenCost: 6 },
    { id: 10, name: 'Cape Néant Infini', category: 'capes', price: 34.99, rarity: 'epic', image: '🌑', tokenCost: 8 },
    { id: 11, name: 'Cape Arc Celeste', category: 'capes', price: 24.99, rarity: 'epic', image: '🌈', tokenCost: 7 },
    
    // Emotes - Achetables en jetons
    { id: 12, name: 'Pet Phoenix', category: 'items', price: 8.99, rarity: 'epic', image: '🦅', tokenCost: 3 },
    { id: 13, name: 'Pet Dragon Mini', category: 'items', price: 18.99, rarity: 'epic', image: '🦎', tokenCost: 7 },
    { id: 14, name: 'Aura Dorée', category: 'items', price: 22.99, rarity: 'epic', image: '⭐', tokenCost: 8 },
    { id: 15, name: 'Particules Magiques', category: 'items', price: 16.99, rarity: 'epic', image: '✨', tokenCost: 5 },
];

// Panier utilisateur
let SHOP_CART = [];

// Inventaire de l'utilisateur (articles achetés)
let SHOP_INVENTORY = [];

// Filtre actif
let SHOP_ACTIVE_FILTER = 'all';

// ============ SYSTÈME D'INVENTAIRE ============

/**
 * Récupère l'inventaire depuis localStorage
 */
/**
 * Récupère l'inventaire depuis localStorage (par joueur)
 */
function loadInventory() {
    try {
        const authUser = ConfigManager.getSelectedAccount();
        if (!authUser) {
            SHOP_INVENTORY = [];
            return;
        }
        const inventoryKey = 'shopInventory_' + authUser.uuid;
        const saved = localStorage.getItem(inventoryKey);
        SHOP_INVENTORY = saved ? JSON.parse(saved) : [];
    } catch (e) {
        console.error('Erreur chargement inventaire:', e);
        SHOP_INVENTORY = [];
    }
}

/**
 * Sauvegarde l'inventaire dans localStorage (par joueur)
 */
function saveInventory() {
    try {
        const authUser = ConfigManager.getSelectedAccount();
        if (!authUser) return;
        const inventoryKey = 'shopInventory_' + authUser.uuid;
        localStorage.setItem(inventoryKey, JSON.stringify(SHOP_INVENTORY));
    } catch (e) {
        console.error('Erreur sauvegarde inventaire:', e);
    }
}

/**
 * Ajoute un article à l'inventaire
 * @param {number} productId - ID du produit
 */
function addToInventory(productId) {
    const product = SHOP_PRODUCTS.find(p => p.id === productId);
    if (!product) return;

    const inventoryItem = {
        id: productId,
        name: product.name,
        category: product.category,
        rarity: product.rarity,
        image: product.image,
        purchaseDate: new Date().toLocaleString('fr-FR'),
        uniqueId: Date.now() + Math.random()
    };

    SHOP_INVENTORY.push(inventoryItem);
    saveInventory();
}

/**
 * Affiche l'inventaire dans la modale
 */
function displayInventory() {
    const modal = document.getElementById('shopInventoryModal');
    const content = document.getElementById('shopInventoryContent');

    if (!SHOP_INVENTORY || SHOP_INVENTORY.length === 0) {
        content.innerHTML = '<div style="text-align: center; color: rgba(255, 255, 255, 0.6); padding: 40px;"><p style="font-size: 1.1em;">Vous n\'avez pas encore d\'articles</p></div>';
        modal.style.display = 'flex';
        return;
    }

    const itemsHTML = SHOP_INVENTORY.map(item => `
        <div style="
            background: linear-gradient(135deg, rgba(80, 80, 80, 0.5) 0%, rgba(100, 100, 100, 0.3) 100%);
            border: 1px solid rgba(144, 238, 144, 0.2);
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 12px;
            display: flex;
            gap: 16px;
            align-items: center;
            transition: all 0.3s ease;
        " onmouseover="this.style.background='linear-gradient(135deg, rgba(100, 100, 100, 0.6) 0%, rgba(120, 120, 120, 0.4) 100%)'; this.style.borderColor='rgba(144, 238, 144, 0.4)';" onmouseout="this.style.background='linear-gradient(135deg, rgba(80, 80, 80, 0.5) 0%, rgba(100, 100, 100, 0.3) 100%)'; this.style.borderColor='rgba(144, 238, 144, 0.2)';">
            <!-- Image/Emoji -->
            <div style="
                width: 60px;
                height: 60px;
                background: rgba(0, 0, 0, 0.3);
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
                font-size: 1.8em;
            ">
                ${item.image.startsWith('./') || item.image.startsWith('/') ? `<img src="${item.image}" alt="${item.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">` : item.image}
            </div>

            <!-- Informations -->
            <div style="flex: 1; min-width: 0;">
                <h3 style="margin: 0 0 8px 0; color: #fff; font-size: 1em; font-weight: 600;">${item.name}</h3>
                <p style="margin: 0 0 4px 0; color: rgba(255, 255, 255, 0.7); font-size: 0.85em;">Catégorie: ${item.category}</p>
                <p style="margin: 0; color: rgba(144, 238, 144, 0.8); font-size: 0.8em;">${item.purchaseDate}</p>
            </div>

            <!-- Badge Rareté -->
            <div style="
                padding: 6px 12px;
                border-radius: 6px;
                font-size: 0.75em;
                font-weight: 600;
                text-transform: uppercase;
                flex-shrink: 0;
                ${getRarityColor(item.rarity)}
            ">${getRarityLabel(item.rarity)}</div>
        </div>
    `).join('');

    content.innerHTML = `
        <div style="display: grid; gap: 12px;">
            <p style="color: rgba(144, 238, 144, 0.9); font-size: 0.95em; margin: 0 0 8px 0;">
                <strong>${SHOP_INVENTORY.length}</strong> article(s) dans votre inventaire
            </p>
            ${itemsHTML}
        </div>
    `;

    modal.style.display = 'flex';
}

/**
 * Ouvre la modale d'inventaire
 */
function openShopInventory() {
    loadInventory();
    displayInventory();
}

/**
 * Ferme la modale d'inventaire
 */
function closeShopInventory() {
    const modal = document.getElementById('shopInventoryModal');
    if (modal) modal.style.display = 'none';
}

// Attacher l'événement au bouton
document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('shopInventoryBtn');
    if (btn) {
        btn.addEventListener('click', openShopInventory);
    }

    const closeBtn = document.getElementById('shopInventoryCloseBtn');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeShopInventory);
    }

    // Fermer la modale en cliquant dehors
    const modal = document.getElementById('shopInventoryModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeShopInventory();
        });
    }
    
    // Attacher les événements de la modal de confirmation d'achat
    const confirmModal = document.getElementById('shopPurchaseConfirmModal');
    if (confirmModal) {
        confirmModal.addEventListener('click', (e) => {
            if (e.target === confirmModal) closePurchaseConfirmation();
        });
    }
    
    const confirmCloseBtn = document.getElementById('shopPurchaseConfirmCloseBtn');
    if (confirmCloseBtn) {
        confirmCloseBtn.addEventListener('click', closePurchaseConfirmation);
    }
    
    const confirmYesBtn = document.getElementById('shopPurchaseConfirmYes');
    if (confirmYesBtn) {
        confirmYesBtn.addEventListener('click', confirmPurchase);
    }
    
    const confirmNoBtn = document.getElementById('shopPurchaseConfirmNo');
    if (confirmNoBtn) {
        confirmNoBtn.addEventListener('click', closePurchaseConfirmation);
    }
});

// Initialiser le shop
function initializeShop() {
    // Vérifier que les éléments existent
    const grid = document.getElementById('shopProductsGrid');
    if (!grid) {
        console.log('Shop elements not found on this page');
        return;
    }
    
    // Charger l'inventaire depuis localStorage
    loadInventory();
    
    // Charger le panier depuis localStorage
    const savedCart = localStorage.getItem('vanylaShopCart');
    if (savedCart) {
        try {
            SHOP_CART = JSON.parse(savedCart);
        } catch (e) {
            SHOP_CART = [];
        }
    }
    
    // Rendre les produits
    renderShopProducts();
    
    // Attacher les événements des filtres
    attachFilterEvents();
    
    // Attacher l'événement de recherche
    attachSearchEvent();
    
    console.log('Shop initialized with', SHOP_PRODUCTS.length, 'products');
}

// Rendre les produits du shop
function renderShopProducts() {
    const grid = document.getElementById('shopProductsGrid');
    const emptyState = document.getElementById('shopEmptyState');
    
    if (!grid) return;
    
    // Filtrer les produits
    let filteredProducts = SHOP_PRODUCTS;
    
    if (SHOP_ACTIVE_FILTER !== 'all') {
        filteredProducts = SHOP_PRODUCTS.filter(p => p.category === SHOP_ACTIVE_FILTER);
    }
    
    // Filtrer par recherche
    const searchInput = document.getElementById('shopSearchInput');
    if (searchInput && searchInput.value.trim()) {
        const searchTerm = searchInput.value.toLowerCase();
        filteredProducts = filteredProducts.filter(p => 
            p.name.toLowerCase().includes(searchTerm)
        );
    }
    
    // Afficher/masquer l'état vide
    if (filteredProducts.length === 0) {
        grid.innerHTML = '';
        if (emptyState) emptyState.style.display = 'block';
        return;
    }
    
    if (emptyState) emptyState.style.display = 'none';
    
    // Rendre les cartes de produits
    grid.innerHTML = filteredProducts.map((product, index) => `
        <div class="shop-product-card" data-product-id="${product.id}" style="
            background: linear-gradient(135deg, rgba(80, 80, 80, 0.15) 0%, rgba(100, 100, 100, 0.08) 100%);
            border: 1px solid rgba(120, 120, 120, 0.25);
            border-radius: 12px;
            padding: 20px;
            display: flex;
            flex-direction: column;
            gap: 16px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            cursor: pointer;
            backdrop-filter: blur(10px);
            position: relative;
            overflow: hidden;
            animation: shopCardFadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
            animation-delay: ${index * 30}ms;
            opacity: 0;
        " onmouseover="
            this.style.background = 'linear-gradient(135deg, rgba(0, 144, 255, 0.15) 0%, rgba(100, 150, 200, 0.08) 100%)';
            this.style.borderColor = 'rgba(0, 144, 255, 0.4)';
            this.style.transform = 'translateY(-8px)';
            this.style.boxShadow = '0 12px 24px rgba(0, 144, 255, 0.2)';
            const image = this.querySelector('.shop-product-image');
            if (image) image.style.transform = 'scale(1.1) rotate(5deg)';
        " onmouseout="
            this.style.background = 'linear-gradient(135deg, rgba(80, 80, 80, 0.15) 0%, rgba(100, 100, 100, 0.08) 100%)';
            this.style.borderColor = 'rgba(120, 120, 120, 0.25)';
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = 'none';
            const image = this.querySelector('.shop-product-image');
            if (image) image.style.transform = 'scale(1) rotate(0deg)';
        ">
            <!-- Badge Rareté -->
            <div style="
                position: absolute;
                top: 12px;
                right: 12px;
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 0.75em;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                z-index: 10;
                ${getRarityColor(product.rarity)}
            ">${getRarityLabel(product.rarity)}</div>
            
            <!-- Image/Emoji -->
            <div class="shop-product-image" style="
                font-size: 3em;
                text-align: center;
                height: 220px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: rgba(0, 0, 0, 0.2);
                border-radius: 8px;
                transition: all 0.3s ease;
                overflow: hidden;
                padding: 8px;
            ">
                ${product.image.startsWith('./') || product.image.startsWith('/') ? `<img src="${product.image}" alt="${product.name}" style="width: 100%; height: 100%; object-fit: cover; object-position: center;">` : product.image}
            </div>
            
            <!-- Nom du produit -->
            <div style="
                color: #fff;
                font-weight: 600;
                font-size: 0.95em;
                text-align: center;
                line-height: 1.4;
            ">
                ${product.name}
            </div>
            
            <!-- Prix -->
            <div style="
                color: #0090ff;
                font-weight: 700;
                font-size: 1.3em;
                text-align: center;
            ">
                ${product.rarity === 'economie' ? `${product.price.toFixed(2)}€` : `${product.tokenCost} 🪙`}
            </div>
            
            <!-- Bouton conditionnel selon la rareté -->
            ${product.rarity === 'economie' ? `
            <a href="https://www.paypal.com" style="
                width: 100%;
                padding: 12px 16px;
                background: linear-gradient(135deg, #0070ba 0%, #003087 100%);
                border: none;
                border-radius: 8px;
                color: #fff;
                font-weight: 600;
                cursor: pointer;
                font-size: 0.9em;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                text-decoration: none;
                box-sizing: border-box;
            " style="
                width: 100%;
                padding: 12px 16px;
                background: linear-gradient(135deg, #0070ba 0%, #003087 100%);
                border: none;
                border-radius: 8px;
                color: #fff;
                font-weight: 600;
                cursor: pointer;
                font-size: 0.9em;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                text-decoration: none;
                box-sizing: border-box;
            ">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="display: inline-block;">
                    <path d="M9.5 4c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                </svg>
                PayPal
            </a>
            ` : `
            <button class="shop-add-to-cart-btn" data-product-id="${product.id}" style="
                width: 100%;
                padding: 12px 16px;
                background: linear-gradient(135deg, #0090ff 0%, #0070cc 100%);
                border: none;
                border-radius: 8px;
                color: #fff;
                font-weight: 600;
                cursor: pointer;
                font-size: 0.9em;
                transition: all 0.3s ease;
            ">
                Acheter 🪙
            </button>
            `}
        </div>
    `).join('');
    
    // Attacher les event listeners pour les boutons d'achat
    setTimeout(attachShopButtonEvents, 0);
}

// Attacher les événements aux boutons du shop
function attachShopButtonEvents() {
    const buyButtons = document.querySelectorAll('.shop-add-to-cart-btn');
    
    buyButtons.forEach(btn => {
        // Retirer les anciens listeners
        const clone = btn.cloneNode(true);
        btn.parentNode.replaceChild(clone, btn);
    });
    
    // Ré-sélectionner après replacement
    const buttons = document.querySelectorAll('.shop-add-to-cart-btn');
    buttons.forEach(btn => {
        // Click event
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const productId = parseInt(this.getAttribute('data-product-id'), 10);
            addToCart(productId);
        });
        
        // Hover effect
        btn.addEventListener('mouseover', function() {
            this.style.boxShadow = '0 8px 16px rgba(0, 144, 255, 0.4)';
            this.style.transform = 'scale(1.05)';
        });
        
        btn.addEventListener('mouseout', function() {
            this.style.boxShadow = 'none';
            this.style.transform = 'scale(1)';
        });
    });
}

// Obtenir la couleur selon la rareté
function getRarityColor(rarity) {
    const colors = {
        'common': 'background: rgba(100, 100, 100, 0.8); color: rgba(255, 255, 255, 0.8);',
        'rare': 'background: rgba(30, 144, 255, 0.8); color: #fff;',
        'epic': 'background: rgba(138, 43, 226, 0.8); color: #fff;',
        'legendary': 'background: rgba(255, 165, 0, 0.8); color: #fff;',
        'economie': 'background: rgba(34, 177, 76, 0.8); color: #fff;'
    };
    return colors[rarity] || colors['common'];
}

// Obtenir le label selon la rareté
function getRarityLabel(rarity) {
    const labels = {
        'common': 'Commun',
        'rare': 'Rare',
        'epic': 'Épique',
        'legendary': 'Légendaire',
        'economie': 'Économie'
    };
    return labels[rarity] || 'Inconnu';
}

// Fonction de paiement avec vérification de solde
function processPayment(productId) {
    const product = SHOP_PRODUCTS.find(p => p.id === productId);
    if (!product) return false;

    // Obtenir l'UUID du joueur actuel
    const authUser = ConfigManager.getSelectedAccount();
    if (!authUser) {
        showErrorNotification('Veuillez sélectionner un compte');
        return false;
    }

    const playerUUID = authUser.uuid;

    // Vérifier si l'item est déjà dans l'inventaire
    const itemExists = SHOP_INVENTORY.some(item => item.id === productId);
    if (itemExists) {
        showWarningNotification('Item déjà présent dans l\'inventaire');
        return false;
    }

    // Récupérer le coût en jetons du produit
    const costInTokens = product.tokenCost || 0;

    // Vérifier le solde (si un coût)
    const currentBalance = TokenManager_Instance.getBalance(playerUUID);
    
    if (costInTokens > 0 && currentBalance < costInTokens) {
        showErrorNotification('Vous n\'avez pas assez de jetons');
        return false;
    }

    // Déduire les jetons
    if (costInTokens > 0) {
        const newBalance = TokenManager_Instance.removeTokens(playerUUID, costInTokens);
        
        // Mettre à jour l'affichage des jetons
        const balanceElements = document.querySelectorAll('.tokens-balance');
        balanceElements.forEach(elem => {
            elem.textContent = newBalance;
        });
    }

    // Ajouter à l'inventaire
    addToInventory(productId);

    // Afficher la notification de succès
    showNotification(`${product.name} acheté avec succès!`);
    return true;
}

// Variable pour stocker le produit actuellement en attente de confirmation
let SHOP_PENDING_PURCHASE = null;

// Ajouter au panier
function addToCart(productId) {
    const product = SHOP_PRODUCTS.find(p => p.id === productId);
    if (!product) return;
    
    // Vérifier si l'item est déjà dans l'inventaire
    const itemExists = SHOP_INVENTORY.some(item => item.id === productId);
    if (itemExists) {
        showWarningNotification('Item déjà présent dans l\'inventaire');
        return;
    }
    
    // Afficher la modal de confirmation d'achat
    SHOP_PENDING_PURCHASE = productId;
    showPurchaseConfirmation(product);
}

/**
 * Affiche la modal de confirmation d'achat
 */
function showPurchaseConfirmation(product) {
    const modal = document.getElementById('shopPurchaseConfirmModal');
    const message = document.getElementById('shopPurchaseConfirmMessage');
    
    if (!modal || !message) return;
    
    const costText = product.tokenCost ? `${product.tokenCost} 🪙` : 'PayPal';
    message.innerHTML = `
        <div style="margin-bottom: 16px;">
            <strong>${product.name}</strong>
        </div>
        <div style="font-size: 1.4em; margin-bottom: 24px; color: #0090ff;">
            ${costText}
        </div>
        <div>Êtes-vous sûr de vouloir acheter cet article ?</div>
    `;
    
    modal.style.display = 'flex';
}

/**
 * Ferme la modal de confirmation
 */
function closePurchaseConfirmation() {
    const modal = document.getElementById('shopPurchaseConfirmModal');
    if (modal) modal.style.display = 'none';
    SHOP_PENDING_PURCHASE = null;
}

/**
 * Confirme l'achat et traite le paiement
 */
function confirmPurchase() {
    if (!SHOP_PENDING_PURCHASE) {
        closePurchaseConfirmation();
        return;
    }
    
    const product = SHOP_PRODUCTS.find(p => p.id === SHOP_PENDING_PURCHASE);
    if (!product) {
        closePurchaseConfirmation();
        return;
    }
    
    // Traiter le paiement
    const paymentSuccess = processPayment(SHOP_PENDING_PURCHASE);
    
    closePurchaseConfirmation();
    
    if (paymentSuccess) {
        // Le panier est mis à jour par processPayment
        const cartItem = SHOP_CART.find(item => item.id === SHOP_PENDING_PURCHASE);
        if (!cartItem) {
            SHOP_CART.push({
                id: product.id,
                name: product.name,
                price: product.price,
                quantity: 1,
                image: product.image
            });
        }
        localStorage.setItem('vanylaShopCart', JSON.stringify(SHOP_CART));
    }
}

// Afficher une notification d'avertissement élégante (style moderne)
function showWarningNotification(message) {
    const notification = document.createElement('div');
    
    // Add styles if not exists
    if (!document.getElementById('shopNotifStyles')) {
        const style = document.createElement('style');
        style.id = 'shopNotifStyles';
        style.textContent = `
            @keyframes shopNotifIn {
                from { opacity: 0; transform: translate(0, 30px) scale(0.8); }
                to { opacity: 1; transform: translate(0, 0) scale(1); }
            }
            @keyframes shopNotifOut {
                from { opacity: 1; transform: translate(0, 0) scale(1); }
                to { opacity: 0; transform: translate(0, 30px) scale(0.8); }
            }
            @keyframes shopNotifIconSpin {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.2); }
            }
        `;
        document.head.appendChild(style);
    }
    
    notification.innerHTML = `
        <div style="display:flex;align-items:center;gap:20px;padding:8px;">
            <div style="font-size:2.8em;line-height:1;animation:shopNotifIconSpin 1.5s ease-in-out;">⚠️</div>
            <div style="flex:1;">
                <div style="font-size:0.95em;color:#FFD700;font-weight:700;letter-spacing:0.5px;">${message}</div>
            </div>
        </div>
    `;
    notification.style.cssText = `
        position:fixed;bottom:30px;right:30px;
        background:linear-gradient(135deg,rgba(20,20,20,0.95) 0%,rgba(40,40,40,0.95) 100%);
        border:2px solid rgba(255,215,0,0.5);
        border-radius:14px;
        padding:12px 28px;
        z-index:10000;
        box-shadow:0 14px 42px rgba(255,215,0,0.2),0 0 20px rgba(255,215,0,0.1),inset 0 1px 2px rgba(255,255,255,0.08);
        backdrop-filter:blur(12px);
        animation:shopNotifIn 0.5s cubic-bezier(0.34,1.56,0.64,1);
        min-width:300px;
        max-width:360px;
    `;
    document.body.appendChild(notification);

    // Auto-remove after 3.5 secondes
    setTimeout(() => {
        notification.style.animation = 'shopNotifOut 0.5s cubic-bezier(0.34,1.56,0.64,1)';
        setTimeout(() => {
            notification.remove();
        }, 500);
    }, 3500);
}

// Afficher une notification d'erreur élégante
function showErrorNotification(message) {
    const notification = document.createElement('div');
    
    // Add styles if not exists
    if (!document.getElementById('shopNotifErrorStyles')) {
        const style = document.createElement('style');
        style.id = 'shopNotifErrorStyles';
        style.textContent = `
            @keyframes errorNotifIn {
                from { opacity: 0; transform: translate(0, 30px) scale(0.8); }
                to { opacity: 1; transform: translate(0, 0) scale(1); }
            }
            @keyframes errorNotifOut {
                from { opacity: 1; transform: translate(0, 0) scale(1); }
                to { opacity: 0; transform: translate(0, 30px) scale(0.8); }
            }
            @keyframes errorIconShake {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.15); }
            }
        `;
        document.head.appendChild(style);
    }
    
    notification.innerHTML = `
        <div style="display:flex;align-items:center;gap:20px;padding:8px;">
            <div style="font-size:2.8em;line-height:1;animation:errorIconShake 1.5s ease-in-out;">❌</div>
            <div style="flex:1;">
                <div style="font-size:0.95em;color:#FF6B6B;font-weight:700;letter-spacing:0.5px;">${message}</div>
            </div>
        </div>
    `;
    notification.style.cssText = `
        position:fixed;bottom:30px;right:30px;
        background:linear-gradient(135deg,rgba(20,20,20,0.95) 0%,rgba(40,40,40,0.95) 100%);
        border:2px solid rgba(255,107,107,0.5);
        border-radius:14px;
        padding:12px 28px;
        z-index:10001;
        box-shadow:0 14px 42px rgba(255,107,107,0.2),0 0 20px rgba(255,107,107,0.1),inset 0 1px 2px rgba(255,255,255,0.08);
        backdrop-filter:blur(12px);
        animation:errorNotifIn 0.5s cubic-bezier(0.34,1.56,0.64,1);
        min-width:300px;
        max-width:360px;
    `;
    document.body.appendChild(notification);

    // Auto-remove after 3.5 secondes
    setTimeout(() => {
        notification.style.animation = 'errorNotifOut 0.5s cubic-bezier(0.34,1.56,0.64,1)';
        setTimeout(() => notification.remove(), 500);
    }, 3500);
}

// Afficher une notification de succès élégante
function showNotification(message) {
    const notification = document.createElement('div');
    
    // Add styles if not exists
    if (!document.getElementById('shopNotifSuccessStyles')) {
        const style = document.createElement('style');
        style.id = 'shopNotifSuccessStyles';
        style.textContent = `
            @keyframes successNotifIn {
                from { opacity: 0; transform: translate(0, 30px) scale(0.8); }
                to { opacity: 1; transform: translate(0, 0) scale(1); }
            }
            @keyframes successNotifOut {
                from { opacity: 1; transform: translate(0, 0) scale(1); }
                to { opacity: 0; transform: translate(0, 30px) scale(0.8); }
            }
            @keyframes successIconPulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.2); }
            }
        `;
        document.head.appendChild(style);
    }
    
    notification.innerHTML = `
        <div style="display:flex;align-items:center;gap:20px;padding:8px;">
            <div style="font-size:2.8em;line-height:1;animation:successIconPulse 1.5s ease-in-out;">✓</div>
            <div style="flex:1;">
                <div style="font-size:0.95em;color:#4CAF50;font-weight:700;letter-spacing:0.5px;">${message}</div>
            </div>
        </div>
    `;
    notification.style.cssText = `
        position:fixed;bottom:30px;right:30px;
        background:linear-gradient(135deg,rgba(20,20,20,0.95) 0%,rgba(40,40,40,0.95) 100%);
        border:2px solid rgba(76,175,80,0.5);
        border-radius:14px;
        padding:12px 28px;
        z-index:10000;
        box-shadow:0 14px 42px rgba(76,175,80,0.2),0 0 20px rgba(76,175,80,0.1),inset 0 1px 2px rgba(255,255,255,0.08);
        backdrop-filter:blur(12px);
        animation:successNotifIn 0.5s cubic-bezier(0.34,1.56,0.64,1);
        min-width:300px;
        max-width:360px;
    `;
    document.body.appendChild(notification);

    // Auto-remove after 3.5 secondes
    setTimeout(() => {
        notification.style.animation = 'successNotifOut 0.5s cubic-bezier(0.34,1.56,0.64,1)';
        setTimeout(() => notification.remove(), 500);
    }, 3500);
}

// Attacher les événements de filtrage
function attachFilterEvents() {
    const filterButtons = document.querySelectorAll('.shop-filter-btn');
    
    filterButtons.forEach(btn => {
        // Retirer les anciens listeners pour éviter les doublons
        const clone = btn.cloneNode(true);
        btn.parentNode.replaceChild(clone, btn);
    });
    
    // Ré-sélectionner après replacement
    const buttons = document.querySelectorAll('.shop-filter-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Mettre à jour le filtre actif
            const filter = this.getAttribute('data-filter');
            SHOP_ACTIVE_FILTER = filter;
            
            // Mettre à jour le style des boutons
            buttons.forEach(b => {
                const filter = b.getAttribute('data-filter');
                
                if (filter === SHOP_ACTIVE_FILTER) {
                    // Le bouton actif est toujours bleu
                    b.style.background = 'rgba(0, 144, 255, 0.9)';
                    b.style.borderColor = 'rgba(0, 144, 255, 0.9)';
                } else if (filter === 'jetons') {
                    // Le bouton Jetons inactif garde sa couleur verte
                    b.style.background = 'rgba(144, 238, 144, 0.18)';
                    b.style.borderColor = 'rgba(144, 238, 144, 0.4)';
                } else {
                    b.style.background = 'rgba(120, 120, 120, 0.3)';
                    b.style.borderColor = 'rgba(120, 120, 120, 0.4)';
                }
            });
            
            // Re-rendre les produits
            renderShopProducts();
        });
    });
}

// Attacher l'événement de recherche
function attachSearchEvent() {
    const searchInput = document.getElementById('shopSearchInput');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', () => {
        renderShopProducts();
    });
}

// Initialiser quand le DOM est prêt
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeShop);
} else {
    initializeShop();
}

// Animation CSS à injecter
if (!document.getElementById('shopStyles')) {
    const shopStyles = document.createElement('style');
    shopStyles.id = 'shopStyles';
    shopStyles.textContent = `
        @keyframes shopCardFadeIn {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        @keyframes shopSlideInRight {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes shopSlideOutRight {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(400px);
                opacity: 0;
            }
        }
        
        .shop-product-card {
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        
        .shop-add-to-cart-btn:active {
            transform: scale(0.95) !important;
        }
    `;
    
    if (document.head) {
        document.head.appendChild(shopStyles);
    }
}
