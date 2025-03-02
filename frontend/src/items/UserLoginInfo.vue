<script setup lang="ts">
import UserIcon from "../assets/Icons/UserIcon.vue";

const userLoginInfo = 2;
</script>

<template>
  <div class="user-login-info">
    <UserIcon />
    <p class="sub-text">{{ userLoginInfo }}</p>
  </div>
</template>

<style scoped>
.user-login-info {
  display: flex;
  padding: 3px 10px;
  align-items: center;
  gap: 5px;
  border-radius: 4px;
  background: var(--primary-600);
  color: var(--neutral-50);
}

</style>