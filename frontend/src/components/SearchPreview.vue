<script setup lang="ts">

import Miniature from "../items/Miniature.vue";
import {searchStore} from "../stores/dataStore.ts";
import Loader from "../items/Loader.vue";

const search = searchStore();
</script>

<template>
  <div class="search-preview">
    <div class="search-preview__content">
      <Miniature
          v-if="search.videos != undefined"
          v-for="video in search.videos"
          :key="video.title"
          :thumbnail="video.thumbnail"
          :title="video.title"
          :name="video.name"
          :duration="video.duration"
      />
      <Loader
          v-else
          class="search-preview__loader"
          />
    </div>
  </div>
</template>

<style scoped lang="scss">
.search-preview {
  position: relative;
  height: 100%;
  width: 100%;
  flex-shrink: 0;
  border-radius: 25px;
  background: var(--neutral-100);
  overflow: hidden;

  &__content {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(176px, 1fr));
    gap: 20px;
    width: 100%;
    padding: 30px;
    box-sizing: border-box;
    overflow: scroll;
    overflow-x: hidden;
  }
}
</style>