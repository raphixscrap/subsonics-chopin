<script setup lang="ts">
import { defineProps } from 'vue';
import PlaylistItem from "../items/PlaylistItem.vue";
import {playlistsListStore} from "../stores/dataStore.ts";
import Button from "../items/Button.vue";

const props = defineProps({
  popup: {
    type: Boolean,
    default: true
  }
});

const playlists = playlistsListStore();
</script>
<template>
  <div :class="props.popup == true ? 'playlist--popup' : 'playlist'">
    <div class="playlist__content">
      <PlaylistItem
          v-for="playlist in playlists.playlists"
          :key="playlist.name"
          :title="playlist.name"
          :imgSrc="playlist.origin"
      />
    </div>
    <Button
        type="primary"
        label="Créer une playlist"
        :on-click="() => {}"
        :disabled="false"
    />
  </div>
</template>

<style scoped lang="scss">
.playlist--popup {
  position: absolute;
  height: 90vh;
  width: 90vw;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  box-shadow: 0 4px 10px 0 rgba(0, 0, 0, 0.25);
  flex-shrink: 0;
}

.playlist {
  width: 100%;
  height: 100%;
}

.playlist--popup, .playlist {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border-radius: 25px;
  background: var(--neutral-100);
  overflow: hidden;
  box-sizing: border-box;
  padding: 30px;

  &__content {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    overflow: scroll;
    overflow-x: hidden;
  }
}
</style>