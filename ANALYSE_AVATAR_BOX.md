# 📊 Analyse de la Box Avatar - VanylaLauncher 2.0.1

## 🎯 État Actuel de la Box Avatar

### Localisation
- **Template EJS**: [app/settings.ejs](app/settings.ejs#L79)
- **Rendu HTML**: [app/assets/js/scripts/settings.js](app/assets/js/scripts/settings.js#L642-L670)
- **Styles CSS**: [app/assets/css/launcher.css](app/assets/css/launcher.css#L1588-L1680)

### Ce qui est actuellement affiché

```html
<div class="settingsAuthAccount" uuid="${acc.uuid}">
    <div class="settingsAuthAccountLeft">
        <img class="settingsAuthAccountImage" 
             alt="${acc.displayName}" 
             src="https://mc-heads.net/body/${acc.uuid}/60">
    </div>
    <div class="settingsAuthAccountRight">
        <div class="settingsAuthAccountDetails">
            <!-- Pseudo du joueur -->
            <div class="settingsAuthAccountDetailPane">
                <div class="settingsAuthAccountDetailTitle">Username</div>
                <div class="settingsAuthAccountDetailValue">${acc.displayName}</div>
            </div>
            <!-- UUID -->
            <div class="settingsAuthAccountDetailPane">
                <div class="settingsAuthAccountDetailTitle">UUID</div>
                <div class="settingsAuthAccountDetailValue">${acc.uuid}</div>
            </div>
        </div>
        <!-- Boutons (Select/Logout) -->
        <div class="settingsAuthAccountActions">
            <!-- ... -->
        </div>
    </div>
</div>
```

---

## 🔍 Données Disponibles dans l'Objet Compte

### Pour les Comptes Microsoft
**Structure stockée dans `ConfigManager.authenticationDatabase[uuid]`:**

```javascript
{
    type: 'microsoft',
    
    // ✅ Actuellement affiché
    displayName: 'PlayerName',          // Pseudo en jeu
    uuid: '12345678-1234-5678...',      // UUID unique Minecraft
    
    // ✅ Disponible mais non affiché
    accessToken: '...',                  // Token d'accès Minecraft
    username: 'player@email.com',        // Email/compte Microsoft (optionnel)
    expiresAt: 1234567890,              // Date d'expiration du token MC
    
    // ✅ Données Microsoft cachées
    microsoft: {
        access_token: '...',             // Token Microsoft
        refresh_token: '...',            // Pour renouveler le token
        expires_at: 1234567890           // Expiration token Microsoft
    }
}
```

### Pour les Comptes Mojang (Legacy)
```javascript
{
    type: 'mojang',
    displayName: 'PlayerName',
    uuid: '...',
    accessToken: '...',
    username: 'email@example.com'
}
```

---

## 💡 Informations Qu'on Pourrait Ajouter

### 1️⃣ **Type de Compte** (Compte Microsoft vs Mojang Legacy)
- **Source**: `acc.type` ('microsoft' ou 'mojang')
- **Bénéfice**: Voir en un coup d'œil quel type de compte c'est
- **Icône**: Logo Microsoft ou Mojang
```javascript
// Exemple: Ajouter une petite icône côté pseudo
<span class="accountType">${acc.type === 'microsoft' ? '🔷 Microsoft' : '🔴 Mojang'}</span>
```

### 2️⃣ **État du Token** (Actif/Expirant/Expiré)
- **Source**: `acc.expiresAt` (pour Microsoft) ou calculé
- **Bénéfice**: Savoir si le compte a besoin d'être reconnecté bientôt
- **Logique**:
  ```javascript
  const expiresIn = acc.expiresAt - Date.now();
  const status = 
      expiresIn < 0 ? '❌ Expiré' :
      expiresIn < 24*60*60*1000 ? '⚠️ Expire bientôt' :
      '✅ Valide';
  ```

### 3️⃣ **Solde de Jetons / Balance du Joueur**
- **Source**: Via API `/api/player/{uuid}/balance` (déjà implémentée!)
- **Bénéfice**: Afficher les jetons du joueur directement sur la card
- **Code déjà existant**: [BalanceManager](app/assets/js/balancemanager.js)
```javascript
const balance = await window.balanceManager.getBalance(acc.uuid);
// Afficher: "💰 Jetons: 1250"
```

### 4️⃣ **Dernière Connexion** (Temps réel)
- **Source**: À ajouter lors de l'authentification
- **Bénéfice**: Voir quand le joueur s'est connecté pour la dernière fois
- **Implémentation**: Stocker `lastLogin: new Date().getTime()` lors de chaque connexion

### 5️⃣ **Nombre de Jours depuis Achat** (Si disponible)
- **Source**: Profil Microsoft ou données Minecraft
- **Bénéfice**: Identifier les nouveaux joueurs vs vétérans
- **Limitation**: Pas directement disponible dans l'API Mojang standard

### 6️⃣ **Email/Compte Microsoft** (Pour comptes Microsoft)
- **Source**: `acc.username` (si disponible)
- **Bénéfice**: Voir quel compte email est lié
- **Sécurité**: À masquer partiellement (ex: `player****@gmail.com`)

### 7️⃣ **Skin/Cape Status**
- **Source**: Endpoint Mojang optionnel
- **Bénéfice**: Voir si le joueur a un skin custom ou une cape
- **Icône**: Badge ou petit indicateur visuel

### 8️⃣ **Profil Complet (More Info)**
- **Source**: Données potentiellement disponibles via Microsoft Graph
- **Contenu possible**:
  - Niveau Xbox Live
  - Gamerscore
  - Date de création du compte Microsoft

---

## 🎨 Recommandations d'Amélioration UX

### Design Proposé

```
┌─────────────────────────────────────────────────┐
│ [AVATAR 115px]  │ PlayerName [🔷 Microsoft]    │
│                 │ UUID: 1234-5678-...           │
│                 │ 💰 Jetons: 1250 | ✅ Valide  │
│                 │ Connecté il y a 2h ago        │
│                 │                               │
│                 │  [Sélectionner] [Déconnexion]│
└─────────────────────────────────────────────────┘
```

### Priorités d'Ajout

**Phase 1 (Rapide)**:
1. ✅ Afficher le type de compte (Microsoft/Mojang)
2. ✅ Statut du token (Valide/Expirant/Expiré)
3. ✅ Intégrer le solde de jetons (déjà implémenté!)

**Phase 2 (Moyen)**:
4. Dernière connexion
5. Email du compte (masqué)
6. Styling amélioré

**Phase 3 (Avancé)**:
7. Données Xbox Live
8. Historique de connexion

---

## 📝 Code de Référence

### Où les données sont récupérées
- **Microsoft Auth**: [authmanager.js](app/assets/js/authmanager.js#L200-L220)
  - `mcProfile` = Données Minecraft du joueur
  - Contient: `id` (UUID), `name` (pseudo), `skins[]`, `capes[]`

### Où les données sont stockées
- **Configuration**: [configmanager.js](app/assets/js/configmanager.js#L340-L400)
  - `addMicrosoftAuthAccount()` = Ajouter un compte Microsoft
  - `addMojangAuthAccount()` = Ajouter un compte Mojang

### Où les données sont affichées
- **Rendu**: [settings.js](app/assets/js/scripts/settings.js#L622-L674)
  - Boucle sur `ConfigManager.getAuthAccounts()`
  - Génère le HTML pour chaque compte

---

## 🔗 API Disponibles

### 1. **Minecraft Heads API** (déjà utilisée)
```
https://mc-heads.net/body/{uuid}/{size}
https://mc-heads.net/avatar/{uuid}/{size}
https://mc-heads.net/head/{uuid}/{size}
```

### 2. **VanylaPlus Balance Manager** (intégré)
```javascript
window.balanceManager.getBalance(uuid)
// Retourne: Promise<number> (solde en jetons)
```

### 3. **Mojang API Profile Endpoint** (voir authmanager.js)
```
GET https://api.minecraftservices.com/minecraft/profile
Headers: Authorization: Bearer {token}

Retourne:
{
  id: '...',
  name: '...',
  skins: [...],
  capes: [...]
}
```

---

## ✨ Conclusion

**Données facilement implémentables** (5-15 min chacune):
- ✅ Type de compte (Microsoft/Mojang)
- ✅ Statut du token
- ✅ Solde de jetons
- ✅ Dernière connexion

**À investiguer** (requiert API calls):
- 🔍 Données Xbox Live
- 🔍 Skins/Capes custom
- 🔍 Historique complet

**À implémenter** (requiert refactoring):
- 🔴 Profil complet Microsoft Graph
- 🔴 Analytics de connexion

---

**Recommandation prioritaire**: Ajouter **Solde de Jetons + Statut du Token** pour avoir une box d'infos plus utile sans surcharger l'UI! 💡
