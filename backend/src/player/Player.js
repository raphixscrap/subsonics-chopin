const { joinVoiceChannel, getVoiceConnection, entersState, VoiceConnectionStatus, createAudioPlayer, AudioPlayerStatus } = require('@discordjs/voice');
const {List} = require('./List')
const {LogType} = require("loguix");

const plog = new LogType("Player")
const clog = new LogType("Signal")

const media = require('./Method/Media');
const Activity = require('../discord/Activity');

const AllPlayers = new Map()

class Player {
    connection;
    player;
    guildId;
    queue;
    constructor(guildId) {
        if(this.guildId === null) {
            clog.error("Impossible de créer un Player, car guildId est null")
            return
        }
        if(AllPlayers.has(guildId)) {
            return AllPlayers.get(guildId)
        }
        this.connection = null
        this.player = null
        this.guildId = guildId
        this.queue = new List(guildId)
        AllPlayers.set(guildId, this)
    }

    async join(channel) {

        if(getVoiceConnection(channel.guild.id)) {
            clog.log(`GUILD : ${this.guildId} - Une connexion existe déjà pour ce serveur`)
            return
        }
        this.connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator,
            selfDeaf: false,
            selfMute: false
        });

        this.player = createAudioPlayer()
        this.generatePlayerEvents()
    
        this.connection.on('stateChange', (oldState, newState) => {
            clog.log(`GUILD : ${this.guildId} - [STATE] OLD : "${oldState.status}" NEW : "${newState.status}"`);

            // Si la connection est fermée, on détruit le player

            if(newState.status === VoiceConnectionStatus.Disconnected) {
                this.leave()
            }
        });

    }

    generatePlayerEvents() {

        this.player.on('error', error => {
            plog.error(`GUILD : ${this.guildId} - Une erreur est survenue dans le player`);
            plog.error(error);
        });
        
       this.player.on(AudioPlayerStatus.Idle, () => {
            Activity.idleActivity()
            this.queue.setCurrent(null)
            if(this.queue.next.length > 0) {
                this.play(this.queue.nextSong())
            } 
        });

        this.player.on(AudioPlayerStatus.Playing, () => {
            plog.log(`GUILD : ${this.guildId} - Le player est en train de jouer le contenu suivant : ${this.queue.current.title}`);
            Activity.setMusicActivity(this.queue.current.title, this.queue.current.author, this.queue.current.thumbnail)
            
        });
    }


    checkConnection() {
        if(this.connection === null) {
            clog.error(`GUILD : ${this.guildId} - La connection n'est pas définie`)
            return true
        }
        if(this.player === null) {
            plog.error(`GUILD : ${this.guildId} - Le player n'est pas défini`)
            return true
        }
    }

    async play(song) {
        if(this.checkConnection()) return
        if(this.queue.current != null) {
            this.player.stop()
        }
        this.queue.setCurrent(song)

       if(song.type = "attachment") {
            media.play(this, song)
       }
    }

    async add(song) {
        if(this.player.state.status == AudioPlayerStatus.Idle && this.queue.current === null && this.queue.next.length === 0) {
            this.play(song)
            return
        } 

        this.queue.addNextSong(song)
        plog.log(`GUILD : ${this.guildId} - La musique a été ajoutée à la liste de lecture : ${song.title}`)
    }

    async pause() {
        if(this.checkConnection()) return "no_music"
        if(this.player.state.status == AudioPlayerStatus.Paused) {
            this.player.unpause()
            plog.log(`GUILD : ${this.guildId} - La musique a été reprise`)
            return false
        } else {
            this.player.pause()
            plog.log(`GUILD : ${this.guildId} - La musique a été mise en pause`)
            return true
        }
    }

    async leave() {
        if(this.checkConnection()) return
        if(this.queue.current != null) {
            this.queue.addPreviousSong(this.queue.current)
        }
        // Détruit la connection et le player et l'enlève de la liste des 
        this.connection.destroy()
        this.player.stop()
        Activity.idleActivity()
        this.queue.destroy()
        AllPlayers.delete(this.guildId)
        clog.log("Connection détruite avec le guildId : " + this.guildId)
        plog.log("Player détruit avec le guildId : " + this.guildId)
        
    }

    async skip() {
      
        if(this.checkConnection()) return "no_music"
        if(this.queue.next.length === 0) {
            return "no_music"
        }
        const songSkip = this.queue.nextSong()
        this.play(songSkip)
        return songSkip
    }

    async previous() {
       
        if(this.checkConnection()) return "no_music"
        if(this.queue.getPrevious().length === 0) {
            return "no_music"
        }
       
        const songPrevious = this.queue.previousSong()
        this.play(songPrevious)
        return songPrevious
    }
}

module.exports = {Player, AllPlayers}


/*

You can access created connections elsewhere in your code without having to track the connections yourself. It is best practice to not track the voice connections yourself as you may forget to clean them up once they are destroyed, leading to memory leaks.

const connection = getVoiceConnection(myVoiceChannel.guild.id);

*/