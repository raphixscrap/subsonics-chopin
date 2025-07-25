const fs = require('fs');
const path = require('path');
const { LogType } = require('loguix');
const { __glob } = require("../GlobalVars")

const AllDatabases = {}

const clog = new LogType("DataBase")

function getDatabase(name) {
    return AllDatabases[name]
}

class Database {
    data;
    path;
    name;
    empty;
    constructor(name, path, empty) {
        if(name == undefined || path == undefined) throw clog.error("Impossible de créer une base de données sans nom ou sans chemin")

        clog.log(`Enregistrement de la base de données '${name}' contenu dans ${path}`)
        this.name = name;
        this.path = path;
        this.data = {};
        if(empty) this.empty = empty; else this.empty = {}
        this.load()
        AllDatabases[name] = this
    }

    load() {
        clog.log(`Chargement de la base de données '${this.name}'`)
        try {
            this.create()
            this.update()
        } catch(e) {
            clog.error(`Erreur lors du chargement de la base de données '${this.name}'`)
            clog.error(e)
        }
                
    }

    create() {
        try {
            if(!fs.existsSync(this.path)) {
                clog.warn(`Le fichier de la base de données '${this.name}' n'existe pas, création du fichier`)
                fs.writeFileSync(this.path, JSON.stringify(this.empty, null, 2))
            }
        } catch(e) {
            clog.error(`Erreur lors de la création de la base de données '${this.name}'`)
            clog.error(e)
        }
    }

    save() {
        try {
            clog.log(`Sauvegarde de la base de données '${this.name}'`)
            fs.writeFileSync(this.path, JSON.stringify(this.data, null, 2))

        } catch(e) {
            clog.error(`Erreur lors de la sauvegarde de la base de données '${this.name}'`)
            clog.error(e)
        }

        // Assure that the database is up to date and reloaded
        this.update()
        
    }

    update() {
        try{
            clog.log(`Mise à jour de la base de données '${this.name}'`)
            let rawdata = fs.readFileSync(this.path);
            this.data = JSON.parse(rawdata);
            clog.log(`Base de donnée '${this.name}' chargée avec succès`)
            
        } catch(e) {
            clog.error(`Erreur lors de la mise à jour de la base de données '${this.name}'`)
            clog.error(e)
            
        }
        

    }

    getData() {
        return this.data
    }

}



module.exports = {Database, getDatabase}