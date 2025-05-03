<script setup lang="ts">

import {defineProps} from "vue";

const props = defineProps<{
  selectedTab?: 1 | 2;
  tab1Click?: (event: MouseEvent) => void;
  tab1Label?: string;
  tab2Click?: (event: MouseEvent) => void;
  tab2Label?: string;
  tab1Lecture?: number;
}>();

</script>

<template>
  <div class="tab-container">
    <button v-on:click="props.tab1Click" class="tab tab--1">{{ props.tab1Label }}</button>
    <button v-on:click="props.tab2Click" class="tab tab--2">{{ props.tab2Label }}</button>
    <div class="indicator" :class="props.selectedTab == 1 ? 'indicator-left' : 'indicator-right'" ></div>
  </div>
</template>

<style scoped>
.tab-container {
  width: 79%;
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  position: relative;
  padding: 2px;
  background-color: var(--neutral-50);
  border-radius: 9px;
  margin-right: 5px;
}

.indicator {
  content: "";
  width: 50%;
  height: 85%;
  background: var(--neutral-100);
  position: absolute;
  top: 2px;
  z-index: 9;
  border: 0.5px solid rgba(0, 0, 0, 0.04);
  border-radius: 7px;
  transition: left 0.2s ease-out;
}
.indicator-left {
  left: 2px;
}
.indicator-right {
  left: calc(50% - 2px);
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