<script setup lang="ts">

import LogoIcon from "../assets/Icons/LogoIcon.vue";
import UserLoginInfo from "../items/UserLoginInfo.vue";
import SetingsIcon from "../assets/Icons/SetingsIcon.vue";
import DarkModeIcone from "../assets/Icons/DarkModeIcone.vue";
import LightModeIcone from "../assets/Icons/LightModeIcone.vue";
import {onMounted, ref} from "vue";
import router from "../router.ts";


const themeIs = ref("dark");

function switchThemeMode() {
  const currentTheme = themeIs.value;
  const newTheme = currentTheme === "dark" ? "light" : "dark";
  localStorage.setItem("theme", newTheme);
  document.documentElement.setAttribute("data-theme", newTheme);
  themeIs.value = newTheme;
}

onMounted(() => {
  const storedTheme = localStorage.getItem("theme");
    themeIs.value = storedTheme || "dark";
    document.documentElement.setAttribute("data-theme", storedTheme || "dark");
});

function navigateToSettings() {
  router.push("/settings");
}
</script>

<template>
  <div class="info-header">
    <div class="info-header__content">
      <div class="info-header__content__logo">
        <LogoIcon />
        <h1>Subsonics</h1>
      </div>
      <UserLoginInfo />
      <button
        class="dark-mode-toggle"
        @click="switchThemeMode"
        :class="themeIs == 'dark' ? 'dark-mode' : 'light-mode'"
        :aria-label="themeIs == 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
        >
        <DarkModeIcone v-if="themeIs == 'dark'" />
        <LightModeIcone v-if="themeIs == 'light'" />
      </button>
      <button
        @click="navigateToSettings"
      >
        <SetingsIcon />
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.info-header {
  display: flex;
  padding: 20px;
  flex-direction: column;
  align-items: flex-start;
  gap: 20px;
  align-self: stretch;
  border-radius: 25px;
  background: var(--neutral-100);

  &__content {
    display: flex;
    padding: 0 0px;
    justify-content: center;
    align-items: center;
    gap: 3px;
    align-self: stretch;

    &__logo {
      display: flex;
      align-items: center;
    }
  }
}
</style>