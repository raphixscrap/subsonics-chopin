<script setup lang="ts">

import RepeatIcon from "../assets/Icons/RepeatIcon.vue";
import ShuffleIcon from "../assets/Icons/ShuffleIcon.vue";
import SoundIcon from "../assets/Icons/SoundIcon.vue";
import HandIcon from "../assets/Icons/HandIcon.vue";
import LeaveIcon from "../assets/Icons/LeaveIcon.vue";
import PrevIcon from "../assets/Icons/PrevIcon.vue";
import NextIcon from "../assets/Icons/NextIcon.vue";
import PlayIcon from "../assets/Icons/PlayIcon.vue";
</script>

<template>
  <div class="player">
    <div class="player__video_content">
      <div class="player__video_content__img">
        <img src="https://i.ytimg.com/vi/CFGLoQIhmow/hqdefault.jpg" alt="Video Thumbnail" />
      </div>
      <p>lofi hip hop mix 📚 beats to relax/study to (Part 1)</p>
    </div>
    <div class="player__timebar">
    </div>
    <div class="player__controls">
      <button><PrevIcon /></button>
      <button class="play_button"><PlayIcon /></button>
      <button><NextIcon /></button>
    </div>
    <div class="player__actions">
      <button><RepeatIcon /></button>
      <button><ShuffleIcon /></button>
      <button><SoundIcon /></button>
      <button><HandIcon /></button>
      <button><LeaveIcon /></button>
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
  gap: 20px;
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
    height: 5px;
    background: var(--primary-600);
    border-radius: 900px;
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
  background: var(--primary-600);
  display: flex;
  padding: 16px 15px;
  align-items: center;
  gap: 10px;
  border-radius: 900px;
}
</style>