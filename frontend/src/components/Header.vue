<script setup lang="ts">

import InputSearch from "../items/InputSearch.vue";
import PlaylistIcon from "../assets/Icons/PlaylistIcon.vue";
import LectureListIcon from "../assets/Icons/LectureListIcon.vue";
import {lectureListIsOpen, lectureListPopUp, playlistPopUp, playlistsIsOpen} from "../stores/globalStore.ts";
import UploadIcon from "../assets/Icons/UploadIcon.vue";

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

const uploadMyFile = () => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".MP4, .MP3, .WAV, .M4A, .AAC, .OGG, .FLAC";
  input.click();
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      const formData = new FormData();
      formData.append("file", file);
      console.log("File uploaded:", file);
    }
  };
};

</script>

<template>
  <header>
    <InputSearch />
    <button @click="uploadMyFile">
      <UploadIcon />
    </button>
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