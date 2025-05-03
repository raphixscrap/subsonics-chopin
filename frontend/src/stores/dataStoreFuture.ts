import { defineStore } from 'pinia';

export const userOnlineStore = defineStore('userOnline', {
    state: () => ({
        nbUser: null as number | null
    }),
    actions: {
        updateUserOnline(nbUser: number) {
            this.nbUser = nbUser;
        }
    }
});

export const searchStore = defineStore('search', {
    state: () => ({
        searchQuery: '',
        videos: null as {
            name: string;
            title: string;
            thumbnail: string;
            duration: string;
        }[] | null
    }),

    actions: {
        updateSearch(query: string) {
            this.searchQuery = query;
        },
        updateVideosSearch(videoList: {
            name: string;
            title: string;
            thumbnail: string;
            duration: string;
        }[]) {
            this.videos = videoList;
        },
        clearVideosSearch() {
            this.videos = [];
        }
    }
});

export const playlistsListStore = defineStore('playlistsList', {
    state: () => ({
        playlists: null as {
            name: string;
            origin: 'Default' | 'YouTube' | 'Spotify' | 'SoundCloud';
        }[] | null
    }),

    actions: {
        updatePlaylistsList(playlists: {
            name: string;
            origin: 'Default' | 'YouTube' | 'Spotify' | 'SoundCloud';
        }[]) {
            this.playlists = playlists;
        },
        clearPlaylistsList() {
            this.playlists = [];
        }
    }
});

export const playlistStore = defineStore('playlist', {
    state: () => ({
        playlist: null as {
            name: string;
            title: string;
            thumbnail: string;
        }[] | null
    }),

    actions: {
        updatePlaylist(videos: {
            name: string;
            title: string;
            thumbnail: string;
        }[]) {
            this.playlist = videos;
        },
        clearPlaylist() {
            this.playlist = [];
        }
    }
});

export const lectureListStore = defineStore('lecture', {
    state: () => ({
        lectures: null as {
            name: string;
            title: string;
            thumbnail: string;
        }[] | null
    }),

    actions: {
        updateLectureList(lectures: {
            name: string;
            title: string;
            thumbnail: string;
        }[]) {
            this.lectures = lectures;
        },
        clearLectureList() {
            this.lectures = [];
        }
    }
});

export const historyListStore = defineStore('history', {
    state: () => ({
        history: null as {
            name: string;
            title: string;
            thumbnail: string;
        }[] | null
    }),

    actions: {
        updateHistoryList(lectures: {
            name: string;
            title: string;
            thumbnail: string;
        }[]) {
            this.history = lectures;
        },
        clearHistoryList() {
            this.history = [];
        }
    }
});
