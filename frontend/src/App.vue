<script setup lang="ts">
import {onMounted} from "vue";

onMounted(() => {
  const savedTheme = localStorage.getItem("theme");
  document.documentElement.setAttribute("data-theme", savedTheme || "dark");
});
</script>

<template>
  <router-view />
</template>

<style scoped>
</style>
