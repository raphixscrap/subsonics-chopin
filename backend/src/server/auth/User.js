const { Database } = require('../../utils/Database/Database');
const { __glob } = require('../../utils/GlobalVars');  
const { generateToken } = require('../../utils/TokenManager');  
const { LogType } = require('loguix');
const clog = new LogType("User");
const discordAuth = require('./DiscordAuth');
const e = require('cors');

const UserDB = new Database("Users", __glob.USERFILE, []);
var userList = new Array();
class User {
    auth;
    identity;
    tokens;
    labels;
    guilds; 
    constructor(auth, identity, tokens, labels, guilds) {
        this.auth = auth;
        this.identity = identity;
        this.tokens = tokens;
        this.labels = labels;
        this.guilds = guilds;
    }

    setAdmin() {
        const userInUserList = userList.find(user => user.identity.id === this.identity.id);
        if (!userInUserList) {
            clog.warn(`Utilisateur ${this.identity.username} non trouvé dans la liste des utilisateurs.`);
            return null;
        }
        if (userInUserList.labels.includes("ADMIN")) {
            userInUserList.labels.splice(userInUserList.labels.indexOf("ADMIN"), 1);
            clog.log(`L'utilisateur ${this.identity.username} n'est plus admin.`);
        } else {
            userInUserList.labels.push("ADMIN");
            clog.log(`L'utilisateur ${this.identity.username} est maintenant admin.`);
        }
        saveUsers()
    }

    setBan(guildId) {
        const userInUserList = userList.find(user => user.identity.id === this.identity.id);
        if (!userInUserList) {
            clog.warn(`Utilisateur ${this.identity.username} non trouvé dans la liste des utilisateurs.`);
            return null;
        }
        const banLabel = `BAN_${guildId}`;
        if (userInUserList.labels.includes(banLabel)) {
            userInUserList.labels.splice(userInUserList.labels.indexOf(banLabel), 1);
            clog.log(`L'utilisateur ${this.identity.username} n'est plus banni du serveur ${guildId}.`);
        } else {
            userInUserList.labels.push(banLabel);
            clog.log(`L'utilisateur ${this.identity.username} est maintenant banni du serveur ${guildId}.`);
        }
        saveUsers()
    }

    createToken() {
        const token = generateToken(this.identity.id);
        const userInUserList = userList.find(user => user.identity.id === this.identity.id);
        if (!userInUserList) {
            clog.warn(`Utilisateur ${this.identity.username} non trouvé dans la liste des utilisateurs.`);
            return null;
        }
        userInUserList.tokens.push(token);
        saveUsers();
        clog.log(`Token créé pour l'utilisateur ${this.identity.username}.`);
        return token;
    }

    removeToken(token) {
        const userInUserList = userList.find(user => user.identity.id === this.identity.id);
        if (!userInUserList) {
            clog.warn(`Utilisateur ${this.identity.username} non trouvé dans la liste des utilisateurs.`);
            return null;
        }
        const index = userInUserList.tokens.indexOf(token);
        if (index > -1) {
            userInUserList.tokens.splice(index, 1);
            saveUsers();
            clog.log(`Token supprimé pour l'utilisateur ${this.identity.username}.`);
        } else {
            clog.warn(`Token non trouvé pour l'utilisateur ${this.identity.username}.`);
        }
    }

    clearToken() {
        const userInUserList = userList.find(user => user.identity.id === this.identity.id);
        if (!userInUserList) {
            clog.warn(`Utilisateur ${this.identity.username} non trouvé dans la liste des utilisateurs.`);
            return null;
        }
        userInUserList.tokens = [];
        saveUsers();
        clog.log(`Tous les tokens supprimés pour l'utilisateur ${this.identity.username}.`);
        return userInUserList.tokens;
    }

    clearAuth() {
        const userInUserList = userList.find(user => user.identity.id === this.identity.id);
        if (!userInUserList) {
            clog.warn(`Utilisateur ${this.identity.username} non trouvé dans la liste des utilisateurs.`);
            return null;
        }
        userInUserList.auth = null;
        saveUsers();
        clog.log(`Authentification supprimée pour l'utilisateur ${this.identity.username}.`);
    }

    destroyAuth() {
        const userInUserList = userList.find(user => user.identity.id === this.identity.id);
        if (!userInUserList) {
            clog.warn(`Utilisateur ${this.identity.username} non trouvé dans la liste des utilisateurs.`);
            return null;
        }
        userInUserList.auth = null;
        userInUserList.tokens = [];
        saveUsers();
        clog.log(`Authentification et tokens supprimés pour l'utilisateur ${this.identity.username}.`);    
    
    }

    setFullBan() {
        const userInUserList = userList.find(user => user.identity.id === this.identity.id);
        if (!userInUserList) {
            clog.warn(`Utilisateur ${this.identity.username} non trouvé dans la liste des utilisateurs.`);
            return null;
        }
        if (userInUserList.labels.find(label => label == "BAN")) {
            userInUserList.labels.splice(userInUserList.labels.indexOf("BAN"), 1);
            clog.log(`L'utilisateur ${this.identity.username} n'est plus banni.`);
        } else {
            userInUserList.labels.push("BAN");
            clog.log(`L'utilisateur ${this.identity.username} est maintenant banni.`);
        }
        saveUsers()
    }

    isBanned(guildId) {
        const banLabel = `BAN_${guildId}`;
        return this.labels.includes(banLabel);
    }
    isFullBanned() {
        return this.labels.includes("BAN");
    }
    isAdmin() {
        return this.labels.includes("ADMIN");
    }
    isMod(guildId) {
        if(this.isOwner(guildId)) return true;
        const modLabel = `MOD_${guildId}`;
        return this.labels.includes(modLabel);
    }

    isOwner(guildId) {
        const ownerLabel = `OWNER_${guildId}`;
        if(this.isAdmin()) return true;
        return this.labels.includes(ownerLabel);
    }

   


} 

//REFRESH USER

async function refreshAllUserInformation() {
    await loadUsers();
    clog.log("Récupération des informations de tous les utilisateurs...");
    for (const user of userList) {
        await updateCredientials(user.identity.id);
    }
    saveUsers();
}

async function updateCredientials(id) {
    const user = getUserById(id);
    if (!user) {
        clog.warn(`Utilisateur ${id} non trouvé.`);
        return null;
    }
    clog.log(`Mise à jour des informations d'authentification Discord de l'utilisateur ${user.identity.username} (${user.identity.id})...`);
    if (user.auth) {
        // Check if the token is expired
        const auth = await discordAuth.refreshToken(user.auth.refresh_token);
        if (auth) {
            // Check Rate limit by checking if auth.message exists
            if(typeof auth.message !== "undefined") {
                clog.warn(`Erreur lors de la mise à jour des informations d'authentification de l'utilisateur ${user.identity.username} (${user.identity.id}) : ${auth.message}`);
                return null;
            }
            user.auth = auth;
            clog.log(`Mise à jour réussie des informations d'authentification de l'utilisateur ${user.identity.username} (${user.identity.id})`);
        } else {
            clog.warn(`Erreur lors de la mise à jour des informations d'authentification de l'utilisateur ${user.identity.username} (${user.identity.id})`);
        }
        // Update the user in the list
        const userInUserList = userList.find(u => u.identity.id === user.identity.id);
        if (userInUserList) {
            userInUserList.auth = user.auth;
        }
    }
    else {
        clog.warn(`Aucune authentification trouvée pour l'utilisateur ${user.identity.username} (${user.identity.id})`);
    }
    saveUsers();
    return user.auth;
}


async function updateGuilds(id) {
    const user = getUserById(id);
    if (!user) {
        clog.warn(`Utilisateur ${id} non trouvé.`);
        return null;
    }
    clog.log(`Mise à jour des guildes de l'utilisateur ${user.identity.username} (${user.identity.id})...`);
    if (user.auth) {
            const guilds = await discordAuth.getUserGuilds(user.auth);
            if(guilds) {
                if(typeof guilds.message !== "undefined") {
                    clog.warn(`Erreur lors de la mise à jour des guildes de l'utilisateur ${user.identity.username} (${user.identity.id}) : ${guilds.message}`);
                    return null;
                }
                user.guilds = guilds;
                clog.log(`Mise à jour réussie des guildes de l'utilisateur ${user.identity.username} (${user.identity.id})`);
            }
            else {
                clog.warn(`Erreur lors de la mise à jour des guildes de l'utilisateur ${user.identity.username} (${user.identity.id})`);
                return null;
            }
            // Update the user in the list
            const userInUserList = userList.find(u => u.identity.id === user.identity.id);
            if (userInUserList) {
                userInUserList.auth = user.auth;
                userInUserList.guilds = user.guilds;
            }
    } else {
        clog.warn(`Aucune authentification trouvée pour l'utilisateur ${user.identity.username} (${user.identity.id})`);
        return null;    
    }
    saveUsers();
    return user.guilds;
}

async function updateIdentity(id) {
    const user = getUserById(id);
    if (!user) {
        clog.warn(`Utilisateur ${id} non trouvé.`);
        return null;
    }
    clog.log(`Mise à jour de l'identité de l'utilisateur ${user.identity.username} (${user.identity.id})...`);
    if (user.auth) {
        const identity = await discordAuth.getUserIdentity(user.auth);
        if(identity) {
            // Check Rate limit by checking if identity.message exists
            if(typeof identity.message !== "undefined") {
                clog.warn(`Erreur lors de la mise à jour de l'identité de l'utilisateur ${user.identity.username} (${user.identity.id}) : ${identity.message}`);
                return null;
            }
            user.identity = identity;
            clog.log(`Mise à jour réussie de l'identité de l'utilisateur ${user.identity.username} (${user.identity.id})`);
        }
        else {
            clog.warn(`Erreur lors de la mise à jour de l'identité de l'utilisateur ${user.identity.username} (${user.identity.id})`);
            return null
        }
        // Update the user in the list
        const userInUserList = userList.find(u => u.identity.id === user.identity.id);
        if (userInUserList) {
            userInUserList.auth = user.auth;
            userInUserList.identity = user.identity;
        }
    } else {
        clog.warn(`Aucune authentification trouvée pour l'utilisateur ${user.identity.username} (${user.identity.id})`);
        return null;
    }
    saveUsers();
    return user.identity;
}

// EDIT USER

/**
 * 
 * @param {*} auth 
 * @param {*} identity 
 * @param {*} guilds 
 * @returns {User} user
 */
async function addUser(auth, identity, guilds) {
    // Check if the user already exists
    const existingUser = userList.find(user => user.identity.id === identity.id);
    if (existingUser) {
        clog.warn(`L'utilisateur ${identity.username} existe déjà.`);
        // Update the existing user with new information
        existingUser.auth = auth;
        existingUser.identity = identity;
        existingUser.guilds = guilds;
        existingUser.tokens = existingUser.tokens || []; // Ensure tokens array exists
        existingUser.labels = existingUser.labels || []; // Ensure labels array exists
        saveUsers();
        clog.log(`Utilisateur ${identity.username} mis à jour.`);
        return existingUser;
    }

    const newUser = new User(auth, identity, [], [], guilds);

    userList.push(newUser);
    await saveUsers();
    return newUser;
}

function removeUser(id) {
    const index = userList.findIndex(user => user.identity.id === id);
    if (index > -1) {
        userList.splice(index, 1);
        saveUsers();
        clog.log(`Utilisateur ${id} supprimé.`);
    } else {
        clog.warn(`Utilisateur ${id} non trouvé.`);
    }
}

function removeToken(token) {
    const user = getUserByToken(token);
    if (user) {
        const index = user.tokens.indexOf(token);
        if (index > -1) {
            user.tokens.splice(index, 1);
            saveUsers();
            clog.log(`Token ${token} supprimé pour l'utilisateur ${user.identity.username}.`);
        } else {
            clog.warn(`Token ${token} non trouvé pour l'utilisateur ${user.identity.username}.`);
        }
    } else {
        clog.warn(`Utilisateur avec le token "${token}" non trouvé.`);
    }
    return user;
}

function addToken(id) {
    const user = getUserById(id);
    if (user) {
        const token = generateToken();
        user.tokens.push(token);
        saveUsers();
        clog.log(`Token "${token}" ajouté pour l'utilisateur ${user.identity.username}.`);
        return token;
    } else {
        clog.warn(`Utilisateur ${id} non trouvé.`);
        return null;
    }
   
}

// GET

/**
 * @param {string} id 
 * @returns {User} user
 */
function getUserById(id) {
    return userList.find(user => user.identity.id === id) || null;
}

/**
 * 
 * @param {string} token 
 * @returns {User} user
 */
function getUserByToken(token) {
    return userList.find(user => user.tokens.includes(token)) || null;
}   

function getUsers() {
    return userList;
}

function getSimpleUsers() {
    return userList.map(user => {
        return {
            identity: user.identity,
            labels: user.labels,
            guilds: user.guilds
        };
    });

}

function getSimpleUser(id) {
    const user = getUserById(id);
    if(user) {
        return {
            identity: user.identity,
            labels: user.labels,
            guilds: user.guilds
        };
    } else {
        return null;
    }
}

// SET LABELS

function setAdmin(id) {
    const user = getUserById(id);
    if (user) {
        user.setAdmin();
        saveUsers();
    } else {
        clog.warn(`Utilisateur ${id} non trouvé.`);
    }
}

function setGuildMod(id, guildId) {
    const user = getUserById(id);
    if (user) {
        const modLabel = `MOD_${guildId}`;
        if (user.labels.includes(modLabel)) {
            user.labels.splice(user.labels.indexOf(modLabel), 1);
            clog.log(`L'utilisateur ${user.identity.username} n'est plus modérateur du serveur ${guildId}.`);
        } else {
            user.labels.push(modLabel);
            clog.log(`L'utilisateur ${user.identity.username} est maintenant modérateur du serveur ${guildId}.`);
        }
        saveUsers();
    } else {
        clog.warn(`Utilisateur ${id} non trouvé.`);
    }
}

function setGuildBan(id, guildId) {
    const user = getUserById(id);
    if (user) {
        if(user.isAdmin()) {
            clog.warn(`L'utilisateur ${user.identity.username} est admin, il ne peut pas être banni.`);
            return;
        }
        user.setBan(guildId);
        saveUsers();
    } else {
        clog.warn(`Utilisateur ${id} non trouvé.`);
    }
}

function setFullBan(id) {
    const user = getUserById(id);
    if (user) {
        if(user.isAdmin()) {
            clog.warn(`L'utilisateur ${user.identity.username} est admin, il ne peut pas être banni.`);
            return;
        }
        user.setFullBan();
        saveUsers();
    } else {
        clog.warn(`Utilisateur ${id} non trouvé.`);
    }
}

function setGuildOwner(id, guildId, force) {
    const user = getUserById(id);
    if (user) {
        const ownerLabel = `OWNER_${guildId}`;
        if (user.labels.includes(ownerLabel) && !force) {
            user.labels.splice(user.labels.indexOf(ownerLabel), 1);
            clog.log(`L'utilisateur ${user.identity.username} n'est plus propriétaire du serveur ${guildId}.`);
        } else {
            if(force && user.labels.includes(ownerLabel)) {
                return;
            }
            user.labels.push(ownerLabel);
            clog.log(`L'utilisateur ${user.identity.username} est maintenant propriétaire du serveur ${guildId}.`);
        }
        saveUsers();
    } else {
        clog.warn(`Utilisateur ${id} non trouvé.`);
    }
}


// USERS DB

function loadUsers() {
    UserDB.load()
    userList = new Array();
    for (const user of UserDB.getData()) {
        userList.push(new User(user.auth, user.identity, user.tokens, user.labels, user.guilds));
    }
    clog.log(`Chargement de ${userList.length} utilisateurs.`);
    return userList;
}

function saveUsers() {
    UserDB.data = userList.map(user => {
        return {
            auth: user.auth,
            identity: user.identity,
            tokens: user.tokens,
            labels: user.labels,
            guilds: user.guilds
        };
    });
    UserDB.save()
    clog.log(`Sauvegarde de ${userList.length} utilisateurs.`);
    
    return loadUsers();    
}


module.exports = {User}   
module.exports = {
    addUser, 
    setGuildOwner, 
    setFullBan, 
    removeUser, 
    getUserByToken, 
    getUserById, 
    getUsers, 
    setAdmin, 
    setGuildMod, 
    setGuildBan, 
    addToken, 
    removeToken, 
    getSimpleUsers, 
    getSimpleUser,
    updateCredientials,
    refreshAllUserInformation,
    updateGuilds,
    updateIdentity
};
