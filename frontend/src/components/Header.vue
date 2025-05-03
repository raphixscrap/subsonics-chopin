<script setup lang="ts">

import InputSearch from "../items/InputSearch.vue";
import PlaylistIcon from "../assets/Icons/PlaylistIcon.vue";
import LectureListIcon from "../assets/Icons/LectureListIcon.vue";
import {lectureListIsOpen, lectureListPopUp, playlistPopUp, playlistsIsOpen} from "../stores/globalStore.ts";

const lectureList = lectureListIsOpen();
const playlists = playlistsIsOpen();

const toggleLectureList = () => {
  playlists.closePlaylists();
  lectureList.toggleLectureList();
};

const togglePlaylists = () => {
  lectureList.closeLectureList();
  playlists.togglePlaylists();
};

</script>

<template>
  <header>
    <InputSearch />
    <button @click="togglePlaylists" v-if="playlistPopUp().popUp">
      <PlaylistIcon />
    </button>
    <button @click="toggleLectureList" v-if="lectureListPopUp().popUp">
      <LectureListIcon />
    </button>
  </header>
</template>

<style scoped>
header {
  display: flex;
  padding: 8px 10px;
  align-items: center;
  gap: 10px;
  align-self: stretch;
  background-color: var(--primary-500);
  border-radius: 15px;
}

</style>