<script setup lang="ts">
import {defineProps} from "vue";

const props = defineProps<{
  type: 'primary' | 'secondary' | 'tertiary';
  disabled: boolean;
  onClick: () => void;
}>();
</script>

<template>
  <button
      :class="['button', `button--${props.type}`]"
      :disabled="props.disabled"
      @click="props.onClick"
  >
    <slot />
  </button>
</template>

<style scoped lang="scss">
  .button {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 10px 20px;
    border-radius: 25px;
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.3s ease;

    &--primary {
      background-color: var(--primary-500);
      color: white;

      &:hover {
        background-color: var(--primary-600);
      }
    }

    &--secondary {
      background-color: transparent;
      color: var(--neutral-50);
      border: 1px solid var(--neutral-950);

      &:hover {
        background-color: var(--neutral-950);
      }
    }

    &--tertiary {
      background-color: transparent;
      color: var(--neutral-700);

      &:hover {
        background-color: var(--neutral-100);
      }
    }

    &:disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }
  }

</style>