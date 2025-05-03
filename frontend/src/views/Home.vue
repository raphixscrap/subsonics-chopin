<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import HomeMobile from "./HomeMobile.vue";
import HomeTablet from "./HomeTablet.vue";
import HomeDesktop from "./HomeDesktop.vue";
import {lectureListPopUp, playlistPopUp} from "../stores/globalStore.ts";

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
  <div class="home-container">
    <component :is="screenSize === 'mobile' ? HomeMobile : screenSize === 'tablet' ? HomeTablet : HomeDesktop" />
  </div>
</template>

<style scoped>
.home-container {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  gap: 10px;

  flex: 1 0 0;
  height: 100%;
  width: 100%;
  padding: 10px;
  box-sizing: border-box;
}
</style>
