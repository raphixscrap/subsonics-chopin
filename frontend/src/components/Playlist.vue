<script setup lang="ts">
import { defineProps } from 'vue';
import PlaylistItem from "../items/PlaylistItem.vue";

const props = defineProps({
  popup: {
    type: Boolean,
    default: true
  }
});
</script>
<template>
  <div :class="props.popup == true ? 'playlist--popup' : 'playlist'">
    <div class="playlist__content">
      <PlaylistItem
          title="Le japon sa bouge vraiment beaucoup"
          img-src="youtube"
      />
      <PlaylistItem
          title="Le japon sa bouge vraiment beaucoup"
          img-src="youtube"
      />
      <PlaylistItem
          title="Le japon sa bouge vraiment beaucoup"
          img-src="youtube"
      />
      <PlaylistItem
          title="Le japon sa bouge vraiment beaucoup"
          img-src="youtube"
      />
      <PlaylistItem
          title="Le japon sa bouge vraiment beaucoup"
          img-src="youtube"
      />
      <PlaylistItem
          title="Le japon sa bouge vraiment beaucoup"
          img-src="youtube"
      />
      <PlaylistItem
          title="Le japon sa bouge vraiment beaucoup"
          img-src="youtube"
      />
      <PlaylistItem
          title="Le japon sa bouge vraiment beaucoup"
          img-src="youtube"
      />
      <PlaylistItem
          title="Le japon sa bouge vraiment beaucoup"
          img-src="youtube"
      />
      <PlaylistItem
          title="Le japon sa bouge vraiment beaucoup"
          img-src="youtube"
      />
    </div>
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
  border-radius: 25px;
  background: var(--neutral-100);
  overflow: hidden;

  &__content {
    display: flex;
    flex-direction: column;
    gap: 20px;
    width: 100%;
    height: 100%;
    padding: 30px;
    box-sizing: border-box;
    overflow: scroll;
    overflow-x: hidden;
  }
}
</style>