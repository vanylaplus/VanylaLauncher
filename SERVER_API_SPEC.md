# VanylaPlus Balance System - Spécifications Serveur

## 📋 Documentation de l'API Requise

Le launcher attend une API REST simple sur le serveur pour synchroniser la monnaie du joueur en temps réel.

---

## 🔌 Endpoint API Requis

### **GET** `/api/player/{uuid}/balance`

**Description :** Récupère le solde de Jetons d'un joueur

**Paramètres :**
- `uuid` (string, path) : UUID du joueur (format Minecraft standard)

**Réponse (200 OK) :**
```json
{
  "uuid": "12345678-1234-5678-1234-567812345678",
  "username": "PlayerName",
  "balance": 1250,
  "currency": "Jetons",
  "lastUpdated": "2026-01-05T10:30:45Z"
}
```

**Erreurs possibles :**
- `404 Not Found` : Joueur introuvable
- `400 Bad Request` : UUID invalide
- `500 Internal Server Error` : Erreur serveur

---

## ⚙️ Configuration Côté Launcher

Le launcher est configuré pour se connecter à : `http://localhost:8080/api`

**À modifier dans** `app/assets/js/balancemanager.js` (ligne ~125) :
```javascript
window.balanceManager = new BalanceManager({
    apiBaseUrl: 'http://YOUR_SERVER_IP:PORT/api',
    pollingInterval: 30000, // 30 secondes
    cacheExpiry: 60000 // 1 minute
});
```

---

## 🎯 Intégration Côté Launcher

### **Auto-détection du UUID**
Le launcher déclenche l'événement `userProfileLoaded` quand l'UUID du joueur est chargé :

```javascript
// Dans le code d'authentification du launcher
window.dispatchEvent(new CustomEvent('userProfileLoaded', {
    detail: { uuid: playerUUID }
}));
```

### **Polling Automatique**
- ✅ Actualisation automatique toutes les 30 secondes
- ✅ Cache local avec expiration 1 minute
- ✅ Retry automatique (3 tentatives)
- ✅ Bouton de rafraîchissement manuel dans le header
- ✅ Notification visuelle de mise à jour

---

## 🛠️ À Implémenter Côté Serveur (Forge 1.20.1)

### **Option 1 : Via un Plugin/Mod Web (Recommandé)**

Créer un endpoint HTTP simple qui :
1. Reçoit l'UUID du joueur
2. Récupère le solde de la variable de joueur
3. Retourne le JSON

**Exemple avec un simple HTTP Handler :**

```java
// Pseudo-code pour Forge 1.20.1
public class BalanceHandler extends SimpleChannelInboundHandler<HttpRequest> {
    
    @Override
    protected void channelRead0(ChannelHandlerContext ctx, HttpRequest msg) {
        String uri = msg.uri();
        
        if (uri.startsWith("/api/player/")) {
            String uuid = uri.substring("/api/player/".length(), "/api/player/".length() + 36);
            Player player = server.getPlayerByUUID(UUID.fromString(uuid));
            
            int balance = player.getCustomDataTag().getInt("jetons");
            
            String response = "{\"uuid\":\"" + uuid + "\",\"balance\":" + balance + "}";
            ctx.writeAndFlush(response);
        }
    }
}
```

### **Option 2 : Via une base de données**

Si tu utilises une base de données pour stocker les Jetons :
1. Créer une table `player_balance`
2. L'endpoint requête cette table
3. Plus rapide et scalable

---

## 📊 Variables Nécessaires sur le Joueur

Le serveur doit tracker pour chaque joueur :
- `uuid` : UUID unique Minecraft
- `jetons` : Entier (nombre de Jetons)
- `lastUpdated` : Timestamp de la dernière mise à jour (optionnel)

**Exemple de stockage (NBT pour Forge) :**
```
Player.getCustomDataTag().putInt("jetons", montant);
```

---

## 🔐 Sécurité (Optional mais Recommandé)

Pour éviter que n'importe qui ne puisse requêter les soldes :

1. **Token d'authentification :**
```
GET /api/player/{uuid}/balance?token=SECRET_TOKEN
```

2. **Rate limiting :** Limiter à 10 requêtes/minute par IP

3. **Validation :** Vérifier que l'UUID correspond au joueur qui demande (via token)

---

## 🚀 Checklist d'Implémentation

- [ ] Créer l'endpoint `/api/player/{uuid}/balance`
- [ ] Tester avec curl : `curl http://localhost:8080/api/player/UUID/balance`
- [ ] Configurer le launcher avec le bon URL/port
- [ ] Vérifier que le polling fonctionne
- [ ] (Optionnel) Ajouter la sécurité (tokens, rate limiting)

---

## 📝 Notes

- Le launcher sauvegarde le solde en cache local
- En cas de perte de connexion, il affiche la dernière valeur connue
- Retry automatique avec backoff exponentiel
- Pas de limite de taille (jusqu'à 2 milliards de Jetons)

Quand tu ouvriras le dossier du serveur, j'implémenterai la partie Forge complètement ! 🚀
