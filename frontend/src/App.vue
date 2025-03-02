<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import Home from "./views/Home.vue";
import HomeTablet from "./views/HomeTablet.vue";
import HomeDesktop from "./views/HomeDesktop.vue";
import {playlistPopUp, lectureListPopUp} from "./stores/globalStore.ts";

const screenSize = ref("mobile");

const playlist = playlistPopUp();
const lectureList = lectureListPopUp();

const updateScreenSize = () => {
  const width = window.innerWidth;

  if (width < 768) {
    screenSize.value = "mobile";
    playlist.playlistPopUp()
    lectureList.lectureListPopUp()
  } else if (width >= 768 && width < 1200) {
    screenSize.value = "tablet";
    playlist.playlistNoPopUp()
    lectureList.lectureListPopUp()

  } else {
    screenSize.value = "desktop";
    playlist.playlistNoPopUp()
    lectureList.lectureListNoPopUp()
  }
};

onMounted(() => {
  updateScreenSize();
  window.addEventListener("resize", updateScreenSize);
});

onUnmounted(() => {
  window.removeEventListener("resize", updateScreenSize);
});
</script>

<template>
  <component :is="screenSize === 'mobile' ? Home : screenSize === 'tablet' ? HomeTablet : HomeDesktop" />
</template>

<style scoped>
</style>
