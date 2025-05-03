<script setup lang="ts">

import LogoIcon from "../assets/Icons/LogoIcon.vue";
import router from "../router.ts";

function navigateToHome() {
  router.push("/");
}
</script>

<template>
<header>
  <button
      @click="navigateToHome"
      class="logo">
    <LogoIcon/>
    <h1>Subsonics</h1>
  </button>
</header>
</template>

<style scoped>
header {
  display: flex;
  padding: 20px;
  border-radius: 25px;
  background-color: var(--neutral-100);
  width: 100%;
  box-sizing: border-box;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}
</style>