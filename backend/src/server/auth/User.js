const { Database } = require('../../utils/Database/Database');
const { __glob } = require('../../utils/GlobalVars');  
const { generateToken } = require('../../utils/TokenManager');  
const { LogType } = require('loguix');
const clog = new LogType("User");

const UserDB = new Database("Users", __glob.USERFILE, []);
const userList = new Array();
loadUsers();

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
        if (this.labels.includes("ADMIN")) {
            this.labels.splice(this.labels.indexOf("ADMIN"), 1);
            clog.log(`L'utilisateur ${this.identity.username} n'est plus admin.`);
        } else {
            this.labels.push("ADMIN");
            clog.log(`L'utilisateur ${this.identity.username} est maintenant admin.`);
        }
    }

    setBan(guildId) {
        const banLabel = `BAN_${guildId}`;
        if (this.labels.includes(banLabel)) {
            this.labels.splice(this.labels.indexOf(banLabel), 1);
            clog.log(`L'utilisateur ${this.identity.username} n'est plus banni du serveur ${guildId}.`);
        } else {
            this.labels.push(banLabel);
            clog.log(`L'utilisateur ${this.identity.username} est maintenant banni du serveur ${guildId}.`);
        }
    }

    createToken() {
        const token = generateToken();
        this.tokens.push(token);
        saveUsers();
        clog.log(`Token créé pour l'utilisateur ${this.identity.username}.`);
        return token;
    }

    removeToken(token) {
        const index = this.tokens.indexOf(token);
        if (index > -1) {
            this.tokens.splice(index, 1);
            saveUsers();
            clog.log(`Token supprimé pour l'utilisateur ${this.identity.username}.`);
        } else {
            clog.warn(`Token non trouvé pour l'utilisateur ${this.identity.username}.`);
        }
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
        return this.labels.includes(ownerLabel);
    }


}   

// ADD

function addUser(auth, identity, guilds) {
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
    saveUsers();
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
        user.setBan(guildId);
        saveUsers();
    } else {
        clog.warn(`Utilisateur ${id} non trouvé.`);
    }
}

function setFullBan(id) {
    const user = getUserById(id);
    if (user) {
        user.labels.push("BAN");
        saveUsers();
    } else {
        clog.warn(`Utilisateur ${id} non trouvé.`);
    }
}

function setGuildOwner(id, guildId) {
    const user = getUserById(id);
    if (user) {
        const ownerLabel = `OWNER_${guildId}`;
        if (user.labels.includes(ownerLabel)) {
            user.labels.splice(user.labels.indexOf(ownerLabel), 1);
            clog.log(`L'utilisateur ${user.identity.username} n'est plus propriétaire du serveur ${guildId}.`);
        } else {
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
    userList.length = 0; 
    for (const user in UserDB.data) {
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
module.exports = {addUser, setGuildOwner , setFullBan, removeUser, getUserByToken , getUserById, getUsers, setAdmin, setGuildMod, setGuildBan, addToken, removeToken, getSimpleUsers, getSimpleUser}
