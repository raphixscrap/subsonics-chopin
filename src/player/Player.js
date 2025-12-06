const { joinVoiceChannel, getVoiceConnection, VoiceConnectionStatus, createAudioPlayer, AudioPlayerStatus, StreamType, createAudioResource } = require('@discordjs/voice');
const {List} = require('./List')
const {LogType} = require("loguix");
const songCheck = require('./SongCheck')
const ffmpeg = require('fluent-ffmpeg')
const fs = require('fs')
const { PassThrough } = require('stream');
const { Metric } = require('webmetrik')

const plog = new LogType("Player")
const clog = new LogType("Signal")

const media = require('./Method/Media');
const youtube = require('./Method/Youtube');
const soundcloud = require('./Method/Soundcloud');

const AllPlayers = new Map()

class Player {
    connection;
    connected = false;
    player;
    guildId;
    channelId;
    channelName;
    queue;
    currentResource;
    loop = false;
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
        
        this.joinChannel(channel)

        this.player = createAudioPlayer()
        this.generatePlayerEvents()

    }

    isConnected() {
        return this.connected
    }

    joinChannel(channel) {
        this.channelId = channel.id 
        this.channelName = channel.name
        this.connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator,
            selfDeaf: false,
            selfMute: false
        });

        this.connection.on('stateChange', (oldState, newState) => {
            clog.log(`GUILD : ${this.guildId} - [STATE] OLD : "${oldState.status}" NEW : "${newState.status}"`);

            // Si la connection est fermée, on détruit le player

            if(newState.status === VoiceConnectionStatus.Disconnected) {
                this.leave()
            }
        });
        this.connected = true
        AllPlayers.set(this.guildId, this)

        process.emit("PLAYERS_UPDATE")
    }

    generatePlayerEvents() {

        const Activity = require('../discord/Activity');

        this.player.on('error', error => {
            plog.error(`GUILD : ${this.guildId} - Une erreur est survenue dans le player`);
            plog.error(error);
            console.error(error);
            process.emit("PLAYERS_UPDATE")
        });
        
       this.player.on(AudioPlayerStatus.Idle, () => {
        if(this.checkConnection()) return
            // Si la musique est en boucle, on relance la musique
            if(this.loop) {
                this.play(this.queue.current)
                return
            }
            // Si la musique n'est pas en boucle, on passe à la musique suivante
            Activity.idleActivity()
            this.queue.setCurrent(null)
            if(this.queue.next.length > 0) {
                this.play(this.queue.nextSong())
            } 
            process.emit("PLAYERS_UPDATE")
        });

        this.player.on(AudioPlayerStatus.Playing, () => {
            if(this.checkConnection()) return
            plog.log(`GUILD : ${this.guildId} - Le player est en train de jouer le contenu suivant : ${this.queue.current.title}`);
            Activity.setMusicActivity(this.queue.current.title, this.queue.current.author, this.queue.current.thumbnail)
            process.emit("PLAYERS_UPDATE")
            
        });
    }


    checkConnection() {
        if(this.connection === null) {
           // clog.error(`GUILD : ${this.guildId} - La connection n'est pas définie`)
            return true
        }
        if(this.player === null) {
            plog.error(`GUILD : ${this.guildId} - Le player n'est pas défini`)
            return true
        }
    }

    getState() {
        const playerStatus = this.player?.state?.status ?? false;
        const connectionStatus = this.connection?.state?.status ?? false;
        const state = {
            current: this.queue.current,
            next: this.queue.next,
            previous: this.queue.getPrevious(),
            loop: this.loop,
            shuffle: this.queue.shuffle,
            paused: playerStatus === AudioPlayerStatus.Paused,
            playing: playerStatus === AudioPlayerStatus.Playing,
            duration: this.getDuration(),
            playerState: playerStatus,
            connectionState: connectionStatus,
            channelId: this.channelId,
            channelName: this.channelName,
            guildId: this.guildId,
        }
        return state
    }

    async setLoop() {
        if(this.checkConnection()) return
        this.loop = !this.loop
        if(this.loop) {
            plog.log(`GUILD : ${this.guildId} - La musique est en boucle`)
        } else {
            plog.log(`GUILD : ${this.guildId} - La musique n'est plus en boucle`)
        }
        process.emit("PLAYERS_UPDATE")
    }

    async setShuffle() {
        if(this.checkConnection()) return
        this.queue.shuffle = !this.queue.shuffle
        if(this.queue.shuffle) {
            plog.log(`GUILD : ${this.guildId} - La musique est en mode aléatoire`)
        } else {
            plog.log(`GUILD : ${this.guildId} - La musique n'est plus en mode aléatoire`)
        }
        process.emit("PLAYERS_UPDATE")
    }

    async play(song) {

        if(!songCheck.checkSong(song)) return
        if(this.checkConnection()) return
        if(this.queue.current != null) {
            this.player.stop()
        }

        var numberOfMusicPlayedPerServer = new Metric("numberOfMusicPlayed_" + this.guildId, "Nombre de musiques jouées sur le serveur : " + this.guildId)
        numberOfMusicPlayedPerServer.setValue(numberOfMusicPlayedPerServer.getValue() + 1)

        var numberOfSecondsPlayedPerServer = new Metric("numberOfSecondsPlayed_" + this.guildId, "Temps jouée sur le serveur : " + this.guildId)
        numberOfSecondsPlayedPerServer.setValue(numberOfSecondsPlayedPerServer.getValue() + song.duration)

        this.queue.setCurrent(song)
        this.stream = await this.getStream(song)

        if(this.stream === null) {
            plog.error(`GUILD : ${this.guildId} - Impossible de lire la musique : ${song.title} avec le type : ${song.type}`)
            return
        }

        this.playStream(this.stream)

        plog.log(`GUILD : ${this.guildId} - Lecture de la musique : ${song.title} - Type : ${song.type}`)   
    }

    async getStream(song, duration = 0) {
        let stream = null
        if(song.type == "attachment") {
            stream = await media.getStream(song)
        }
        if(song.type == 'youtube') {
            stream = await youtube.getStream(song, duration)
        }
        if(song.type == "soundcloud") {
            stream = await soundcloud.getStream(song)
        }

        return stream
    }

    async add(song) {
        if(this.player?.state?.status == AudioPlayerStatus.Idle && this.queue.current === null && this.queue.next.length === 0) {
            this.play(song)
            return
        } 

        this.queue.addNextSong(song)
        plog.log(`GUILD : ${this.guildId} - La musique a été ajoutée à la liste de lecture : ${song.title}`)
    }

    async readPlaylist(playlist, now) {
        if(this.player?.state?.status == AudioPlayerStatus.Idle && this.queue.current === null && this.queue.next.length === 0) {
            this.play(playlist.songs[0])
            this.queue.addNextPlaylist(playlist, true)
            return
        } 
        if(now) this.play(playlist.songs[0])
         this.queue.addNextPlaylist(playlist, now)
        
        plog.log(`GUILD : ${this.guildId} - La playlist a été ajoutée à la liste de lecture : ${playlist.title}`)
    }

    async pause() {
        if(this.checkConnection()) return "no_music"
        if(this.player.state.status == AudioPlayerStatus.Paused) {
            this.player.unpause()
            plog.log(`GUILD : ${this.guildId} - La musique a été reprise`)
            process.emit("PLAYERS_UPDATE")
            return false
        } else {
            this.player.pause()
            plog.log(`GUILD : ${this.guildId} - La musique a été mise en pause`)
            process.emit("PLAYERS_UPDATE")
            return true
        }
      

    }

    async leave() {
        const Activity = require('../discord/Activity');
        if(this.checkConnection()) return
        if(this.queue.current != null) {
            this.queue.addPreviousSong(this.queue.current)
        }
        // Détruit la connection et le player et l'enlève de la liste des 
        this.connection.destroy()
        this.player.stop()
        this.player = null
        this.connection = null
        this.channelId = null
        this.channelName = null
        this.connected = false
        Activity.idleActivity()
        this.queue.destroy()
        AllPlayers.delete(this.guildId)
        clog.log("Connection détruite avec le guildId : " + this.guildId)
        plog.log("Player détruit avec le guildId : " + this.guildId)
        process.emit("PLAYERS_UPDATE")
    }

    async setDuration(duration) {

        if (this.checkConnection()) return;
        if (this.queue.current == null) return;
        if (this.currentResource == null) return;
    
        const maxDuration = this.queue.current.duration;
        if (duration.time > maxDuration) {
            plog.error(`GUILD : ${this.guildId} - La durée demandée dépasse la durée maximale de la musique.`);
            return;
        }

        this.stream = await this.getStream(this.queue.current, duration.time);
        if (this.stream === null) {
            plog.error(`GUILD : ${this.guildId} - Impossible de lire la musique : ${this.queue.current.title} avec le type : ${this.queue.current.type}`);
            return;
        }

        // Si stream est un lien, ouvrir le stream à partir du lien

        if(typeof this.stream === "string") {  
            this.stream = fs.createReadStream(this.stream)
        }
        this.playStream(this.stream); // Jouer le nouveau flux

        this.currentResource.playbackDuration = duration.time * 1000; // Mettre à jour la durée de lecture du resource
        console.log(this.currentResource.playbackDuration)
        console.log(this.getDuration())
    
        plog.log(`GUILD : ${this.guildId} - Lecture déplacée à ${duration.time}s.`);
        
    }

    playStream(stream) {
        if(this.checkConnection()) return
        if(this.player !== null) this.player.stop();

        this.player = createAudioPlayer()
        this.generatePlayerEvents()
        
        const resource = createAudioResource(stream, { inputType: StreamType.Arbitrary });

        this.setCurrentResource(resource)
        this.player.play(resource);
        this.connection.subscribe(this.player);
        process.emit("PLAYERS_UPDATE")
    }

    getDuration() {
       // Return the duration of player

        if(this.checkConnection()) return
        if(this.queue.current == null) return
        if(this.currentResource == null) return
        return this.currentResource.playbackDuration / 1000

    }

    setCurrentResource(value) {
        this.currentResource = value;
    }

    changeChannel(channel) {
        if(this.checkConnection()) return
        if(this.connection === null) return
        if(this.connection.channelId === channel.id) return

        this.connection.destroy()
        this.joinChannel(channel)

        // Si la musique est en cours de lecture, on la relance avec le bon timecode

        if(this.player) {
            this.connection.subscribe(this.player);
        }
        process.emit("PLAYERS_UPDATE")
    }

    async skip() {
      
        if(this.checkConnection()) return "no_music"
        if(this.queue.next.length === 0) {
            return "no_music"
        }
        const songSkip = this.queue.nextSong()
        this.play(songSkip)
        process.emit("PLAYERS_UPDATE")
        return songSkip
    }

    async previous() {
       
        if(this.checkConnection()) return "no_music"
        if(this.queue.getPrevious().length === 0) {
            return "no_music"
        }
       
        const songPrevious = this.queue.previousSong()
        this.play(songPrevious)
        process.emit("PLAYERS_UPDATE")
        return songPrevious
    }
}

/**
 * 
 * @param {string} guildId 
 * @returns {Player} player
 */
function getPlayer(guildId) {
    if(AllPlayers.has(guildId)) {
        return AllPlayers.get(guildId)
    } else {
        return new Player(guildId)
    }
}

function getAllPlayers() {
    const players = new Array()
    AllPlayers.forEach((player) => {
        players.push(player)
    })
    return players
}

function isPlayer(guildId) {
    return AllPlayers.has(guildId)
}


module.exports = {Player, AllPlayers, getPlayer, isPlayer, getAllPlayers}


/*

You can access created connections elsewhere in your code without having to track the connections yourself. It is best practice to not track the voice connections yourself as you may forget to clean them up once they are destroyed, leading to memory leaks.

const connection = getVoiceConnection(myVoiceChannel.guild.id);

*/