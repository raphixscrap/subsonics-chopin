<script setup lang="ts">
import {defineProps, ref, onMounted, onBeforeUnmount} from 'vue';
import DotsMenu from "../assets/Icons/DotsMenu.vue";
import YoutubePlaylist from "../assets/Icons/YoutubePlaylist.vue";
import Trash from "../assets/Icons/Trash.vue";
import Add from "../assets/Icons/Add.vue";
import Play from "../assets/Icons/Play.vue";
import DefaultPlaylist from "../assets/Icons/DefaultPlaylist.vue";

const props = defineProps<{
  imgSrc: string;
  title: string;
}>();

let dotsMenuActive = ref(false);

const toggleMenu = (event: MouseEvent) => {
  event.stopPropagation();
  dotsMenuActive.value = !dotsMenuActive.value;
};

const closeMenu = () => {
  dotsMenuActive.value = false;
};

onMounted(() => {
  document.addEventListener("click", closeMenu);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", closeMenu);
});

function oppenPlaylist() {
  //todo: ouvrir la playlist
  console.log("Ouvrir la playlist");
}
</script>

<template>
  <div class="play-list">
    <button
        class="play-list__content"
            @click.stop="oppenPlaylist"
    >
      <YoutubePlaylist v-if="imgSrc == 'youtube'"/>
      <DefaultPlaylist v-else/>
      <div class="play-list__info">
        <p class="play-list__info__title" :title="props.title">{{ props.title }}</p>
      </div>
    </button>
    <button @click.stop="toggleMenu">
      <DotsMenu/>
    </button>

    <div v-if="dotsMenuActive" class="overlay" @click="closeMenu"></div>
    <div :class="['play-list__dots-menu', { 'play-list__dots-menu--active': dotsMenuActive }]">
      <button>
        <Add/>
        Ajouter
      </button>
      <button>
        <Play/>
        Lire
      </button>
      <button>
        <Trash/>
        Supprimer
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.play-list {
  position: relative;
  display: flex;
  width: 100%;
  justify-content: center;
  gap: 10px;
  flex-shrink: 0;

  &__content {
    display: flex;
    width: 100%;
    flex: 1 1 auto;
    box-sizing: border-box;
    gap: 10px;
    min-width: 0;
    overflow: hidden;
  }
  &__info {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    gap: 10px;
    flex: 1 1 auto;
    min-width: 0;
    width: 100%;
    box-sizing: border-box;

    &__title {
      text-align: start;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      width: 100%;
      box-sizing: border-box;
    }
  }

  .overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: transparent;
    z-index: 5;
  }

  &__dots-menu {
    position: absolute;
    top: 50%;
    right: 0;
    background-color: rgba(0, 0, 0, 0.8);
    border-radius: 5px;
    padding: 5px;
    gap: 5px;
    flex-direction: column;
    z-index: 10;
    display: none;

    &--active {
      display: flex;
    }

    button {
      display: flex;
      gap: 5px;
      align-items: center;
      color: white;
      font-size: 0.8rem;
      padding: 5px;
      border-radius: 5px;
      transition: background-color 0.3s;

      &:hover {
        background-color: rgba(255, 255, 255, 0.1);
      }
    }
  }
}
</style>
