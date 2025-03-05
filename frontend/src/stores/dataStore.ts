import {defineStore} from 'pinia';

export const userOnlineStore = defineStore('userOnline', {
    state: () => ({
        nbUser: 1
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
        videos: [
            {
                name: 'LofiGirl',
                title: 'lofi hip hop mix 📚 beats to relax/study to (Part 1)',
                thumbnail: 'https://i.ytimg.com/vi/CFGLoQIhmow/hqdefault.jpg',
            },
            {
                name: 'LofiGirl',
                title: 'lofi hip hop mix 📚 beats to relax/study to (Part 2)',
                thumbnail: 'https://i.ytimg.com/vi/CFGLoQIhmow/hqdefault.jpg',
            },
            {
                name: 'LofiGirl',
                title: 'lofi hip hop mix 📚 beats to relax/study to (Part 3)',
                thumbnail: 'https://i.ytimg.com/vi/CFGLoQIhmow/hqdefault.jpg',
            },
            {
                name: 'LofiGirl',
                title: 'lofi hip hop mix 📚 beats to relax/study to (Part 4)',
                thumbnail: 'https://i.ytimg.com/vi/CFGLoQIhmow/hqdefault.jpg',
            },
        ]
    }),

    actions: {
        updateSearch(query: string) {
            this.searchQuery = query;
        },

        updateVideosSearch(videoList: { name: string; title: string; thumbnail: string }[]) {
            this.videos = videoList;
        },

        clearVideosSearch() {
            this.videos = [];
        }
    }
});


export const playlistsListStore = defineStore('playlist', {
    state: () => ({
        playlists: [
            {
                name: 'Le japon ça pleure beaucoup',
                origin: 'YouTube',
            },
            {
                name: 'Le japon ça bouge vraiment beaucoup',
                origin: 'YouTube',
            },
            {
                name: 'Cofee time',
                origin: 'YouTube',
            },
            {
                name: 'Pop 20',
                origin: 'YouTube',
            },
        ]
    }),

    actions: {
        updatePlaylistsList(playlist: { name: string; origin: 'YouTube' }[]) {
            this.playlists = playlist;
        },

        clearPlaylistsList() {
            this.playlists = [];
        }
    }
});

export const playlist = defineStore('playlist', {
    state: () => ({
        playlist: [
            {
                name: 'LofiGirl',
                title: 'lofi hip hop mix 📚 beats to relax/study to (Part 1)',
                thumbnail: 'https://i.ytimg.com/vi/CFGLoQIhmow/hqdefault.jpg',
            },
            {
                name: 'LofiGirl',
                title: 'lofi hip hop mix 📚 beats to relax/study to (Part 2)',
                thumbnail: 'https://i.ytimg.com/vi/CFGLoQIhmow/hqdefault.jpg',
            },
            {
                name: 'LofiGirl',
                title: 'lofi hip hop mix 📚 beats to relax/study to (Part 3)',
                thumbnail: 'https://i.ytimg.com/vi/CFGLoQIhmow/hqdefault.jpg',
            },
            {
                name: 'LofiGirl',
                title: 'lofi hip hop mix 📚 beats to relax/study to (Part 4)',
                thumbnail: 'https://i.ytimg.com/vi/CFGLoQIhmow/hqdefault.jpg',
            },
        ]
    }),

    actions: {
        updatePlaylist(videoList: { name: string; title: string; thumbnail: string }[]) {
            this.playlist = videoList;
        },
        clearPlaylist() {
            this.playlist = [];
        }
    }
})

export const lectureListStore = defineStore('lecture', {
    state: () => ({
        lectures: [
            {
                name: 'LofiGirl',
                title: 'lofi hip hop mix 📚 beats to relax/study to (Part 1)',
                thumbnail: 'https://i.ytimg.com/vi/CFGLoQIhmow/hqdefault.jpg',
            },
            {
                name: 'LofiGirl',
                title: 'lofi hip hop mix 📚 beats to relax/study to (Part 2)',
                thumbnail: 'https://i.ytimg.com/vi/CFGLoQIhmow/hqdefault.jpg',
            },
            {
                name: 'LofiGirl',
                title: 'lofi hip hop mix 📚 beats to relax/study to (Part 3)',
                thumbnail: 'https://i.ytimg.com/vi/CFGLoQIhmow/hqdefault.jpg',
            },
            {
                name: 'LofiGirl',
                title: 'lofi hip hop mix 📚 beats to relax/study to (Part 4)',
                thumbnail: 'https://i.ytimg.com/vi/CFGLoQIhmow/hqdefault.jpg',
            },
        ]
    }),

    actions: {
        updateLectureList(lecture: { name: string; title: string; thumbnail: string }[]) {
            this.lectures = lecture;
        },

        clearLectureList() {
            this.lectures = [];
        }
    }
});