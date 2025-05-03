<script setup lang="ts">

import MiniatureList from "../items/MiniatureList.vue";
import {defineProps, ref} from "vue";
import {historyListStore, lectureListStore} from "../stores/dataStore.ts";
import InPlayListIcon from "../assets/Icons/InPlayListIcon.vue";
import Trash from "../assets/Icons/Trash.vue";
import SwitchTab from "../items/SwitchTab.vue";

const props = defineProps({
  popup: {
    type: Boolean,
    default: true
  }
});

const nav = ref("lecture");

const switchNav = (tabName: string) => {
  nav.value = tabName;
}

const lecturesList = lectureListStore();
const historyList = historyListStore();
</script>

<template>
  <div :class="props.popup == true ? 'lecture-list--popup' : 'lecture-list'">
    <div class="lecture-list__content">
      <div class="lecture-list__header">
        <div v-if="nav == 'lecture'">
          <button>
            <Trash color="#FF306F"/>
          </button>
          <div>
            <p>{{ lecturesList.lectures.length }}</p>
            <InPlayListIcon/>
          </div>
        </div>
        <SwitchTab
            :selectedTab="nav == 'lecture' ? 1 : 2"
            tab1-label="Liste de lecture"
            :tab1-click="() => {switchNav('lecture')}"
            tab2-label="Historique de lecture"
            :tab2-click="() => {switchNav('history')}"
        />
      </div>
      <MiniatureList
          v-if="nav == 'lecture'"
          v-for="lecture in lecturesList.lectures"
          :thumbnail="lecture.thumbnail"
          :title="lecture.title"
          :name="lecture.name"
      />
      <MiniatureList
          v-if="nav == 'history'"
          v-for="history in historyList.history"
          :thumbnail="history.thumbnail"
          :title="history.title"
          :name="history.name"
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

  &__header {

    div {
      display: flex;
      align-items: center;
      justify-content: end;
      gap: 5px;
    }
  }


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