<script setup lang="ts">
import {defineProps, onBeforeUnmount, onMounted, ref} from 'vue';
import DotsMenu from "../assets/Icons/DotsMenu.vue";
import Trash from "../assets/Icons/Trash.vue";
import Play from "../assets/Icons/Play.vue";
import Add from "../assets/Icons/Add.vue";
import Top from "../assets/Icons/Top.vue";

const props = defineProps<{
  thumbnail: string;
  title: string;
  name: string;
}>();

let dotsMenuActive = ref(false);

// Fonction pour afficher / masquer le menu
const toggleMenu = (event: MouseEvent) => {
  event.stopPropagation();
  dotsMenuActive.value = !dotsMenuActive.value;
};

// Fermer le menu si on clique en dehors
const closeMenu = () => {
  dotsMenuActive.value = false;
};

// Ajoute l'écouteur pour fermer au clic global
onMounted(() => {
  document.addEventListener("click", closeMenu);
});

// Supprime l'écouteur quand le composant est démonté
onBeforeUnmount(() => {
  document.removeEventListener("click", closeMenu);
});
</script>

<template>
  <div class="miniature-list">
    <div class="miniature-list__img">
      <img :src="props.thumbnail" alt="Video Thumbnail"/>
    </div>
    <div class="miniature-list__info">
      <p class="miniature-list__info__title" :title="props.title">{{ props.title }}</p>
      <p class="miniature-list__info__name" :title="props.name">{{ props.name }}</p>
    </div>
    <button @click.stop="toggleMenu">
      <DotsMenu/>
    </button>

    <div v-if="dotsMenuActive" class="overlay" @click="closeMenu"></div>
    <div :class="['miniature-list__dots-menu', { 'miniature-list__dots-menu--active': dotsMenuActive }]">
      <button>
        <Top/>
        Placer au dessus
      </button>
      <button>
        <Play/>
        Lire
      </button>
      <button>
        <Add/>
        Ajouter à une playlist
      </button>
      <button>
        <Trash/>
        Supprimer
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">

.miniature-list {
  position: relative;
  display: flex;
  width: 100%;
  justify-content: center;
  gap: 10px;
  flex-shrink: 0;

  &__img {
    width: 150px;
    height: 100px;
    align-self: stretch;
    border-radius: 15px;
    overflow: hidden;


    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &__info {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    gap: 10px;
    flex: 1 1 auto;
    min-width: 0;

    &__title, &__name {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      width: 100%;
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