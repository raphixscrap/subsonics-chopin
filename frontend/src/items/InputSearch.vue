<script setup lang="ts">
import {lectureListIsOpen, playlistsIsOpen} from '../stores/globalStore.ts'
import {searchStore} from '../stores/dataStore.ts'
import SearchIcon from "../assets/Icons/SearchIcon.vue";

const search = searchStore();

const lectureList = lectureListIsOpen();
const playlists = playlistsIsOpen();

const updateSearch = (event: Event) => {
  lectureList.closeLectureList();
  playlists.closePlaylists();
  search.updateSearch((event.target as HTMLInputElement).value);
};
</script>

<template>
  <div class="group">
    <SearchIcon />
    <input placeholder="Search" type="search" class="input" @input="updateSearch">
  </div>
</template>

<style scoped>
.group {
  display: flex;
  line-height: 28px;
  align-items: center;
  position: relative;
  width: 100%;
}

.input {
  width: 100%;
  height: 40px;
  line-height: 28px;
  padding: 0 1rem;
  padding-left: 2.5rem;
  border: 2px solid transparent;
  border-radius: 9px;
  outline: none;
  background-color: var(--neutral-50);
  color: var(--neutral-950);
  transition: .3s ease;
}

.input::placeholder {
  color: var(--neutral-500);
}

.input:focus, input:hover {
  outline: none;
  border-color: var(--primary-800);
  background-color: var(--neutral-100);
  box-shadow: 0 0 0 4px rgb(234 76 137 / 10%);
}

.icon {
  position: absolute;
  left: 1rem;
  fill: #9e9ea7;
  width: 1rem;
  height: 1rem;
}
</style>