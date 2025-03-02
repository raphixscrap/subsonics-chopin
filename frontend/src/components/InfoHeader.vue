<script setup lang="ts">

import LogoIcon from "../assets/Icons/LogoIcon.vue";
import UserLoginInfo from "../items/UserLoginInfo.vue";
import SetingsIcon from "../assets/Icons/SetingsIcon.vue";
</script>

<template>
  <div class="info-header">
    <div class="info-header__content">
      <div class="info-header__content__logo">
        <LogoIcon />
        <h1>Subsonics</h1>
      </div>
    <UserLoginInfo />
      <button><SetingsIcon /></button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.info-header {
  display: flex;
  padding: 20px;
  flex-direction: column;
  align-items: flex-start;
  gap: 50px;
  align-self: stretch;
  border-radius: 25px;
  background: var(--neutral-100);

  &__content {
    display: flex;
    padding: 0 50px;
    justify-content: center;
    align-items: center;
    gap: 20px;
    align-self: stretch;

    &__logo {
      display: flex;
      align-items: center;
    }
  }
}
</style>