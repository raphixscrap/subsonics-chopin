<script setup lang="ts">

import RepeatIcon from "../assets/Icons/RepeatIcon.vue";
import ShuffleIcon from "../assets/Icons/ShuffleIcon.vue";
import HandIcon from "../assets/Icons/HandIcon.vue";
import LeaveIcon from "../assets/Icons/LeaveIcon.vue";
import PrevIcon from "../assets/Icons/PrevIcon.vue";
import NextIcon from "../assets/Icons/NextIcon.vue";
import PlayIcon from "../assets/Icons/PlayIcon.vue";
import PauseIcon from "../assets/Icons/PauseIcon.vue";
import {ref} from "vue";

const isPlaying = ref(true);

function togglePlay() {
  isPlaying.value = !isPlaying.value;
}

const progress = ref(0);

function handleTimebarClick(event: MouseEvent) {
  const target = event.currentTarget as HTMLElement;
  const rect = target.getBoundingClientRect();
  const clickX = event.clientX - rect.left;
  const width = rect.width;
  progress.value = Math.min(Math.max((clickX / width) * 100, 0), 100);
}
</script>

<template>
  <div class="player">
    <div class="player__video_content">
      <div class="player__video_content__img">
        <img src="https://i.ytimg.com/vi/CFGLoQIhmow/hqdefault.jpg" alt="Video Thumbnail" />
      </div>
      <p>lofi hip hop mix 📚 beats to relax/study to (Part 1)</p>
    </div>
    <div class="player__timebar" @click="handleTimebarClick">
      <div
          class="player__timebar__progress"
          :style="{ width: progress + '%' }"
      ></div>
    </div>
    <div class="player__timebar__time">
      <p>2:10</p>
      <p>4:20</p>
    </div>
    <div class="player__controls">
      <button><PrevIcon /></button>
      <button
          class="play_button"
          @click="togglePlay"
      >
        <PauseIcon v-if="isPlaying"/>
        <PlayIcon v-else />
      </button>
      <button><NextIcon /></button>
    </div>
    <div class="player__actions">
      <button
          title="Jouer le song en boucle"
      >
        <RepeatIcon />
      </button>
      <button
          title="Joyer les songs aléatoirement"
      >
        <ShuffleIcon />
      </button>
      <button
        title="Rammener le bot dans le channel"
      >
        <HandIcon />
      </button>
      <button
        title="Faire partir le bot"
      >
        <LeaveIcon />
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.player {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 30px;
  align-items: center;
  gap: 5px;
  height: 100%;
  width: 100%;
  flex-shrink: 0;
  align-self: stretch;
  border-radius: 25px;
  background: var(--neutral-100);
  box-sizing: border-box;

  &__video_content {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    gap: 20px;
    flex: 1 0 0;
    align-self: stretch;
    margin-bottom: 20px;

    &__img {
      flex: 1 0 0;
      align-self: stretch;
      border-radius: 10px;
      max-height: 100%;
      max-width: 100%;
      overflow: hidden;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 10px;
      }
    }
  }

  &__timebar {
    width: 100%;
    height: 8px;
    background: var(--neutral-300);
    border-radius: 900px;
    position: relative;
    transition: height 0.2s ease;

    &:hover {
      cursor: pointer;
    }

    &__progress {
      height: 100%;
      background: var(--primary-500);
      border-radius: 900px;
      transition: width 0.2s ease;
    }

    &__time {
      display: flex;
      justify-content: space-between;
      width: 100%;
      font-size: 12px;
      color: var(--neutral-500);
    }
  }

  &__controls {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 20px;
  }

  &__actions {
    display: flex;
    padding: 20px;
    justify-content: center;
    align-items: center;
    gap: 20px;
  }
}

.play_button {
  background: var(--primary-500);
  display: flex;
  padding: 16px 15px;
  align-items: center;
  gap: 10px;
  border-radius: 900px;
}
</style>