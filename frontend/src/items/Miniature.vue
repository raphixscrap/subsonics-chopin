<script setup lang="ts">
import { defineProps } from 'vue';
import Add from "../assets/Icons/Add.vue";
import Play from "../assets/Icons/Play.vue";
import SaveIcon from "../assets/Icons/SaveIcon.vue";

const props = defineProps<{
  thumbnail: string;
  title: string;
  name: string;
  duration: string;
}>();
</script>

<template>
  <div class="miniature">
    <div class="miniature__img">
      <img :src="props.thumbnail" alt="Video Thumbnail" />
      <p class="miniature__img__duration" >{{duration}}</p>
      <div class="miniature__img__overlay">
        <button
          title="Ajouter à la liste de lecture"
        >
          <Add />
        </button>
        <button
          title="Jouer le song maintenant"
        >
          <Play />
        </button>
        <button
          title="Ajouter à la playlist"
        >
          <SaveIcon />
        </button>
      </div>
    </div>
    <div class="miniature__info">
      <p class="miniature__info__title" :title="props.title">{{ props.title }}</p>
      <p class="miniature__info__name" :title="props.name">{{ props.name }}</p>
    </div>
  </div>
</template>

<style scoped lang="scss">
.miniature {
  display: flex;
  width: 100%;
  height: 200px;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  gap: 10px;
  flex-shrink: 0;

  &__img {
    position: relative;
    flex: 1 0 0;
    align-self: stretch;
    border-radius: 15px;
    overflow: hidden;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    &__duration {
      position: absolute;
      bottom: 10px;
      right: 10px;
      background-color: rgba(0, 0, 0, 0.5);
      color: white;
      padding: 5px;
      border-radius: 5px;
      font-size: 12px;
    }

    &:hover .miniature__img__overlay {
      opacity: 1;
    }

    &__overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 10px;
      background-color: rgba(0, 0, 0, 0.5);
      opacity: 0;
      transition: opacity 0.3s;
      z-index: 2;

      button {
        background-color: transparent;
        border: none;
        cursor: pointer;
        padding: 10px;
        border-radius: 50%;
        transition: background-color 0.3s;

        &:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }
      }
    }
  }

  &__info {
    display: flex;
    flex-direction: column;
    gap: 5px;
    flex-shrink: 0;
    width: 100%;

    &__title {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    &__name {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: var(--neutral-500);
      font-size: 12px;
    }
  }
}
</style>