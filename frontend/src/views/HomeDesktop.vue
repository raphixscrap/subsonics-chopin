<script setup lang="ts">
import Header from "../components/Header.vue";
import InfoHeader from "../components/InfoHeader.vue";
import Player from "../components/Player.vue";
import SearchPreview from "../components/SearchPreview.vue";
import Playlist from "../components/Playlist.vue";
import LectureList from "../components/LectureList.vue";
import {searchStore} from "../stores/dataStore.ts";

const search = searchStore();
</script>

<template>
  <div class="home">
    <div class="home__left">
      <InfoHeader/>
      <Playlist :popup="false" />
    </div>
    <div class="home__center">
      <Header/>
      <div class="home__center__content">
        <Transition name="slide-up">
          <component :is="search.searchQuery == '' ? Player : SearchPreview"/>
        </Transition>
      </div>
    </div>
    <div class="home__right">
      <LectureList :popup="false" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.home {
  display: flex;
  height: 100%;
  width: 100%;
  gap: 10px;
  overflow: hidden;

  &__left {
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 300px;
    height: 100%;
    overflow: hidden;
  }

  &__right {
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 400px;
    height: 100%;
    overflow: hidden;
  }
  &__center {
    display: flex;
    flex-direction: column;
    gap: 10px;
    flex: 1 0 0;
    min-width: 0;
    height: 100%;
    overflow: hidden;

    &__content {
      position: relative;
      display: flex;
      height: 100%;
      width: 100%;
      flex: 1 0 0;
      box-sizing: border-box;
      overflow: hidden;
    }
  }
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