<script setup lang="ts">

import {defineProps} from "vue";

const props = defineProps<{
  tab1Click?: (event: MouseEvent) => void;
  tab1Label?: string;
  tab2Click?: (event: MouseEvent) => void;
  tab2Label?: string;
}>();

</script>

<template>
  <div class="tab-container">
    <button v-on:click="props.tab1Click" class="tab tab--1">{{ props.tab1Label }}</button>
    <button v-on:click="props.tab2Click" class="tab tab--2">{{ props.tab2Label }}</button>
    <div class="indicator"></div>
  </div>
</template>

<style scoped>
.tab-container {
  width: 100%;
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  position: relative;
  padding: 2px;
  background-color: var(--neutral-50);
  border-radius: 9px;
  margin: 10px 20px 0px 20px;
}

.indicator {
  content: "";
  width: 50%;
  height: 85%;
  background: var(--neutral-100);
  position: absolute;
  top: 2px;
  left: 2px;
  z-index: 9;
  border: 0.5px solid rgba(0, 0, 0, 0.04);
  border-radius: 7px;
  transition: all 0.2s ease-out;
}

.tab {
  width: 50%;
  height: 28px;
  position: relative;
  z-index: 99;
  background-color: transparent;
  border: 0;
  outline: none;
  flex: none;
  align-self: stretch;
  flex-grow: 1;
  cursor: pointer;
  font-weight: 500;
}

.tab--1:hover ~ .indicator {
  left: 2px;
}

.tab--2:hover ~ .indicator {
  left: calc(50% - 2px);
}
</style>