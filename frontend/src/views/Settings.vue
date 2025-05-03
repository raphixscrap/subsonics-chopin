<script setup lang="ts">

import SettingsHeader from "../components/SettingsHeader.vue";
</script>

<template>
  <div class="settings">
    <SettingsHeader />
  </div>
</template>

<style scoped>
.settings {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  gap: 10px;

  flex: 1 0 0;
  height: 100%;
  width: 100%;
  padding: 10px;
  box-sizing: border-box;
}
</style>