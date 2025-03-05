<script setup lang="ts">

import MiniatureList from "../items/MiniatureList.vue";
import {defineProps} from "vue";
import {lectureListStore} from "../stores/dataStore.ts";

const props = defineProps({
  popup: {
    type: Boolean,
    default: true
  }
});

const lecturesList = lectureListStore();
</script>

<template>
  <div :class="props.popup == true ? 'lecture-list--popup' : 'lecture-list'">
    <div class="lecture-list__content">
      <MiniatureList
          v-for="lecture in lecturesList.lectures"
          :thumbnail="lecture.thumbnail"
          :title="lecture.title"
          :name="lecture.name"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.lecture-list--popup {
  position: absolute;
  height: 90vh;
  width: 90vw;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  box-shadow: 0 4px 10px 0 rgba(0, 0, 0, 0.25);
  flex-shrink: 0;
}

.lecture-list {
  width: 100%;
  height: 100%;
}

.lecture-list--popup, .lecture-list {
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