# Documentation des Requêtes `socket.io`

Les requêtes sont du point de vue du serveur.

Le Client doit être initialisé comme ceci :

```js
const socket = io("subsonics.raphix.fr:5000", {
  auth: {
    token: "TOKEN_HERE",
    auth_code: "AUTH_FROM_DISCORD_HERE",
    session: "SESSION_ID_HERE"
  }
});
```

REDIRECT_CALLBACK = `/callback`

---

## Requêtes Envoyées

### Événement : `NEW_SESSION`

- **Description** : `/login` et `/` : Envoie un jeton de session utile pour la traçabilité de la connexion par Discord. Dès réception, le client le stocke dans les cookies sous le nom `session`. Si l'utilisateur n'est pas sur `/login`, il doit y être redirigé. Supprime également le cookie `token` s’il existe.
- **Données envoyées** :
```json
"SESSION_ID"
```

### Événement : `NEW_TOKEN`

- **Description** : `/callback` : Lors de la redirection depuis Discord, ce jeton est généré après vérification du code d'autorisation. Il est envoyé au client qui est ensuite redirigé vers `/`.
- **Données envoyées** :
```json
"TOKEN_ID"
```

### Événement : `BANNED`

- **Description** : `/callback` et `/` : Si reçu, le client est redirigé vers la page de connexion avec l'erreur "BANNI".

### Événement : `AUTH_ERROR`

- **Description** : `/callback` et `/` : Erreur lors de l’authentification (ex. code Discord invalide ou accès refusé).

---

## Requêtes Reçues

> Toutes les requêtes commencent par l’événement `socket.on("EVENT_NAME", callback)` côté client, et sont traitées côté serveur par `IORequest("EVENT_NAME", callback)`.

### Utilisateur

#### `/USER/INFO`

- **Description** : Renvoie l’identité Discord, les guildes et les labels de l'utilisateur connecté.
- **Données envoyées** :
```json
{}
```
- **Réponse** :
```json
{
  "identity": { ... },
  "guilds": [ ... ],
  "labels": [ "admin", ... ]
}
```

#### `/USERS/LIST`

- **Description** : Renvoie la liste des utilisateurs connectés à une guilde.
- **Données envoyées** :
```json
"GUILD_ID"
```
- **Réponse** :
```json
[ { "id": "...", "username": "...", ... }, ... ]
```

### Player (Musique)

#### `/PLAYER/STATE`

- **Description** : Récupère l'état actuel du player pour une guilde.
- **Données envoyées** :
```json
"GUILD_ID"
```

#### `/PLAYER/JOIN` / `/PLAYER/LEAVE`

- **Description** : Rejoint ou quitte l’écoute du player pour une guilde.
- **Données envoyées** :
```json
"GUILD_ID"
```

#### `/PLAYER/PAUSE`, `/PLAYER/BACKWARD`, `/PLAYER/FORWARD`, `/PLAYER/LOOP`, `/PLAYER/SHUFFLE`, `/PLAYER/DISCONNECT`

- **Description** : Contrôle du player (pause, chanson précédente/suivante, boucle, aléatoire, déconnexion).
- **Données envoyées** :
```json
"GUILD_ID"
```

#### `/PLAYER/CHANNEL/CHANGE`

- **Description** : Change le salon vocal du player vers celui de l’utilisateur.
- **Données envoyées** :
```json
"GUILD_ID"
```

#### `/PLAYER/SEEK`

- **Description** : Change la position de la lecture.
- **Données envoyées** :
```json
["GUILD_ID", TEMPS_EN_SECONDES]
```

### Queue

#### `/QUEUE/PLAY/NOW`

- **Description** : Joue une chanson de la queue immédiatement.
- **Données envoyées** :
```json
["GUILD_ID", "previous"|"next", INDEX]
```

#### `/QUEUE/NEXT/DELETE`, `/QUEUE/NEXT/DELETEALL`, `/QUEUE/NEXT/MOVE`

- **Description** : Supprime ou déplace une chanson dans la file d’attente.
- **Données envoyées** :
```json
["GUILD_ID", INDEX (ou NEW_INDEX)]
```

### Recherche

#### `/SEARCH`

- **Description** : Effectue une recherche de musique.
- **Données envoyées** :
```json
"QUERY"
```

#### `/SEARCH/PLAY`

- **Description** : Joue un morceau directement ou l'ajoute à la queue.
- **Données envoyées** :
```json
["GUILD_ID", SONG, now (bool)]
```

### Playlists

#### `/PLAYLISTS/CREATE`, `/DELETE`, `/RENAME`, `/ADD_SONG`, `/REMOVE_SONG`, `/SEND`, `/PLAY`

- **Description** : Gère les playlists (création, suppression, renommage, ajout, lecture, envoi à un autre utilisateur).
- **Données envoyées** : Variable selon l'action, ex :
```json
["PLAYLIST_NAME", SONG]
```

#### `/PLAYLISTS/LIST`

- **Description** : Renvoie la liste des playlists de l'utilisateur.
- **Données envoyées** :
```json
{}
```

### Admin

> Nécessite le label `"admin"` dans `socketUser.labels`.

#### `/ADMIN/LOGS`

- **Description** : Renvoie les logs du serveur.

#### `/ADMIN/MAINTENANCE/RESTART`

- **Description** : Redémarre le serveur avec une raison.
- **Données envoyées** :
```json
"RAISON"
```

#### `/ADMIN/USERS/SWITCH_ADMIN`, `/FULL_BAN`, `/DELETE`

- **Description** : Gère les utilisateurs (promotion admin, ban complet, suppression).
- **Données envoyées** :
```json
"USER_ID"
```

#### `/ADMIN/PLAYER/GETALLSTATE`

- **Description** : Renvoie l’état de tous les players.

### Owner / Modérateur

#### `/OWNER/USERS/SWITCH_MOD`

- **Description** : Nomme ou enlève un modérateur.
- **Données envoyées** :
```json
["USER_ID", "GUILD_ID"]
```

#### `/MOD/USERS/BAN`

- **Description** : Bannit un utilisateur d’une guilde.
- **Données envoyées** :
```json
["USER_ID", "GUILD_ID"]
```

### Utilitaires

#### `/REPORT`

- **Description** : Envoie un rapport avec un niveau et une description.
- **Données envoyées** :
```json
["LEVEL", "DESCRIPTION"]
```

