<script setup lang="ts">

import Miniature from "../items/Miniature.vue";
</script>

<template>
  <div class="search-preview">
    <div class="search-preview__content">
      <Miniature
          imgSrc="https://i.ytimg.com/vi/CFGLoQIhmow/hqdefault.jpg"
          title="lofi hip hop mix 📚 beats to relax/study to (Part 1)"
          name="LofiGirl"
      />
      <Miniature
          imgSrc="https://i.ytimg.com/vi/CFGLoQIhmow/hqdefault.jpg"
          title="lofi hip hop mix 📚 beats to relax/study to (Part 1)"
          name="LofiGirl"
      />
      <Miniature
          imgSrc="https://i.ytimg.com/vi/CFGLoQIhmow/hqdefault.jpg"
          title="lofi hip hop mix 📚 beats to relax/study to (Part 1)"
          name="LofiGirl"
      />
      <Miniature
          imgSrc="https://i.ytimg.com/vi/CFGLoQIhmow/hqdefault.jpg"
          title="lofi hip hop mix 📚 beats to relax/study to (Part 1)"
          name="LofiGirl"
      />
      <Miniature
          imgSrc="https://i.ytimg.com/vi/CFGLoQIhmow/hqdefault.jpg"
          title="lofi hip hop mix 📚 beats to relax/study to (Part 1)"
          name="LofiGirl"
      />
      <Miniature
          imgSrc="https://i.ytimg.com/vi/CFGLoQIhmow/hqdefault.jpg"
          title="lofi hip hop mix 📚 beats to relax/study to (Part 1)"
          name="LofiGirl"
      />
      <Miniature
          imgSrc="https://i.ytimg.com/vi/CFGLoQIhmow/hqdefault.jpg"
          title="lofi hip hop mix 📚 beats to relax/study to (Part 1)"
          name="LofiGirl"
      />
      <Miniature
          imgSrc="https://i.ytimg.com/vi/CFGLoQIhmow/hqdefault.jpg"
          title="lofi hip hop mix 📚 beats to relax/study to (Part 1)"
          name="LofiGirl"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.search-preview {
  position: relative;
  height: 100%;
  width: 100%;
  flex-shrink: 0;
  border-radius: 25px;
  background: var(--neutral-100);
  overflow: hidden;

  &__content {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(176px, 1fr));
    gap: 20px;
    width: 100%;
    height: 100%;
    padding: 30px;
    box-sizing: border-box;
    overflow: scroll;
    overflow-x: hidden;
  }
}
</style>