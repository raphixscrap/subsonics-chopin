<script setup lang="ts">
import Header from "../components/Header.vue";
import InfoHeader from "../components/InfoHeader.vue";
import Player from "../components/Player.vue";
import SearchPreview from "../components/SearchPreview.vue";
import { lectureListIsOpen, playlistsIsOpen } from "../stores/globalStore.ts";
import Playlist from "../components/Playlist.vue";
import LectureList from "../components/LectureList.vue";
import {searchStore} from "../stores/dataStore.ts";

const search = searchStore();
const lectureList = lectureListIsOpen();
const playlists = playlistsIsOpen();
</script>

<template>
  <Header />
  <InfoHeader />
  <div class="content">
  <Transition name="slide-up">
    <component :is="search.searchQuery == '' ? Player : SearchPreview" />
  </Transition>
  </div>

  <Transition name="popups">
    <component :is="playlists.isOpen ? Playlist : ''" />
  </Transition>
  <Transition name="popups">
    <component :is="lectureList.isOpen ? LectureList : ''" />
  </Transition>
</template>

<style scoped>

.content {
  position: relative;
  display: flex;
  height: 100%;
  width: 100%;
  flex: 1 0 0;
  box-sizing: border-box;
  overflow: hidden;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.5s ease-in-out;
}

@keyframes slide-up {
  0% {
    transform: translateX(100%);
  }
  100% {
    transform: translateX(0);
  }
}

.slide-up-enter-from {
  transform: translateX(0);
}
.slide-up-leave-to {
  transform: translateX(-100%);
}

.slide-up-leave-from {
  transform: translateX(0);
}
.slide-up-enter-to {
  transform: translateX(-100%);
}



.popups-enter-active {
  animation: bounce-in 0.5s;
}
.popups-leave-active {
  animation: bounce-in 0.5s reverse;
}
@keyframes bounce-in {
  0% {
    transform: scale(0) translateX(-50%);
    transform-origin: top right;
  }
  50% {
    transform: scale(1.15) translateX(-50%);
    transform-origin: top right;
  }
  100% {
    transform: scale(1) translateX(-50%);
    transform-origin: top right;
  }
}

</style>