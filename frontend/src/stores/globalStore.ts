import { defineStore } from 'pinia';

export const useSearchStore = defineStore('search', {
    state: () => ({
        searchQuery: ''
    }),
    actions: {
        updateSearch(query: string) {
            this.searchQuery = query;
        }
    }
});

export const playlistsIsOpen = defineStore('playlistsIsOpen', {
    state: () => ({
        isOpen: false
    }),
    actions: {
        togglePlaylists() {
            this.isOpen = !this.isOpen;
        },
        closePlaylists() {
            this.isOpen = false;
        }
    }
});

export const playlistPopUp = defineStore('PlaylistNoPopUp', {
    state: () => ({
        popUp: false
    }),
    actions: {
        playlistNoPopUp() {
            this.popUp = false;
        },
        playlistPopUp() {
            this.popUp = true;
        }
    }
});

export const lectureListIsOpen = defineStore('lectureListIsOpen', {
    state: () => ({
        isOpen: false
    }),
    actions: {
        toggleLectureList() {
            this.isOpen = !this.isOpen;
        },
        closeLectureList() {
            this.isOpen = false;
        }
    }
});

export const lectureListPopUp = defineStore('lectureListNoPopUp', {
    state: () => ({
        popUp: false
    }),
    actions: {
        lectureListNoPopUp() {
            this.popUp = false;
        },
        lectureListPopUp() {
            this.popUp = true;
        }
    }
});

