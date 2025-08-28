const { Database } = require('../utils/Database/Database')
const { __glob } = require('../utils/GlobalVars')
const PreviousDB = new Database("previous", __glob.PREVIOUSFILE, {}) 
const {LogType} = require("loguix")
const clog = new LogType("List")
const { Song } = require('./Song')

const AllLists = new Map()  // Map<guildId, List>

class List {
    next;
    current;
    shuffle;
    guildId;
    constructor(guildId) {
        if(guildId === null) {
            clog.error("Impossible de créer une liste, car guildId est null")
            return
        }
        if(AllLists.has(guildId)) {
            return AllLists.get(guildId)
        }
        // Add PreviousDB.data[this.guildId]
        if(PreviousDB.data[guildId] === undefined) {
            PreviousDB.data[guildId] = new Array()
            savePrevious()
        }
        AllLists.set(guildId, this)
        this.next = new Array();
        this.current = null;
        this.shuffle = false;
        this.guildId = guildId;
    }
    getNext() {
        return this.next;
    }

    getNextSong() {
        if(this.next.length > 0) {
            return this.next[0];
        } else {
            return null;
        }
        
    }

    nextSong() {
        if(this.current != null) {
            this.addPreviousSong(this.current)
        }
        var song = null;
        if(!this.shuffle) {
            song = this.next[0]
            this.next.splice(0, 1)
        } else {
            const randomIndex = Math.floor(Math.random() * this.next.length);
            song = this.next[randomIndex]
            this.next.splice(randomIndex, 1)
           
        }
        this.setCurrent(song)
        process.emit("PLAYERS_UPDATE")
        //TODO: Check History and continuity
        return song
    }


    clearNext() {
        this.next = new Array();
        process.emit("PLAYERS_UPDATE")
    }

    addNextSong(song) {
        this.next.push(song)
        process.emit("PLAYERS_UPDATE")
    }

    firstNext(song) {
        this.next.unshift(song)
        process.emit("PLAYERS_UPDATE")
    }

    removeNextByIndex(index) {
        this.next.splice(index, 1)
        process.emit("PLAYERS_UPDATE")
    }

    moveSongToUpNext(index) {
        const song = this.next[index]
        this.next.splice(index, 1)
        this.next.unshift(song)
        process.emit("PLAYERS_UPDATE")
    }

    getPrevious() {
        const previousList = new Array()

        for(const song of PreviousDB.data[this.guildId]) {
            previousList.push(new Song(song))
        }
        return previousList;

    }

    getPreviousSong() {
        if(PreviousDB.data[this.guildId].length > 0) {
            return new Song(PreviousDB.data[this.guildId][0])
        } else {
            return null;
        }
       
    }

    previousSong() {
        if(this.current != null) {
            this.firstNext(this.current)
        }
        if(PreviousDB.data[this.guildId].length > 0) {
            const song = PreviousDB.data[this.guildId][0]
            // Remove the song from the previous list
            PreviousDB.data[this.guildId].splice(0, 1)
            savePrevious()
            return new Song(song)
        } else {
            return null;
        }
      
    }

    clearPrevious() {
        PreviousDB.data[this.guildId] = new Array();
        savePrevious();
        process.emit("PLAYERS_UPDATE")
    }

    addPreviousSongToNextByIndex(index) {
        const song = PreviousDB.data[this.guildId][index]
        this.next.push(song)
        process.emit("PLAYERS_UPDATE")
    }

    addPreviousSong(song) {
        PreviousDB.data[this.guildId].unshift(song)
        savePrevious()
        process.emit("PLAYERS_UPDATE")
    }

    getCurrent() {
        return this.current;
    }

    setCurrent(value) {
        this.current = value;
        process.emit("PLAYERS_UPDATE")
    }

    destroy() {
        this.clearNext();
        this.current = null
        this.shuffle = false;
        AllLists.delete(this.guildId)
        process.emit("PLAYERS_UPDATE")
    }

    setShuffle() {
        this.shuffle = !this.shuffle;
    }

    isShuffle() {
        return this.shuffle;
    }

    // Play the song with the index in the queue and delete it from the queue
    playByIndex(index, typelist) {

        var index = data[0]
        var list = data[1]

        if(typelist == ListType.NEXT) {

            const song = this.next[index]
            this.next.splice(index, 1)
     
            return song

        } else if(typelist == ListType.PREVIOUS) {
   
            const song = PreviousDB.data[this.guildId][index]
            return song

        }
        process.emit("PLAYERS_UPDATE")
    }

    addNextPlaylist(playlist, firstAlreadyPlayed) {
        if(firstAlreadyPlayed) {
            playlist.songs.shift()
        }
     
        for(const song of playlist.songs) {
            this.addNextSong(song)
        }
        process.emit("PLAYERS_UPDATE")
        
    }

    moveNext(fromIndex, toIndex) {
        // Check if fromIndex and toIndex are valid
        if(fromIndex < 0 || fromIndex >= this.next.length + 1 || toIndex < 0 || toIndex >= this.next.length + 1) {
            clog.error("Impossible de déplacer la musique, car l'index est invalide, GuildId : " + this.guildId)
            return
        }
        if(fromIndex == toIndex) return;
        const song = this.next[fromIndex]
        this.next.splice(fromIndex, 1)
        this.next.splice(toIndex, 0, song)
        process.emit("PLAYERS_UPDATE")
    }


}


const ListType = {
    NEXT: "0",
    PREVIOUS: "1"
}

function savePrevious() {

    for(const guildId in PreviousDB.data) {
        if(PreviousDB.data[guildId].length > 50) {
            PreviousDB.data[guildId].splice(50, PreviousDB.data[guildId].length - 50)
        }
    }
    
    PreviousDB.save();
}

module.exports = { List, ListType }