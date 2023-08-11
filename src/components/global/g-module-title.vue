<template>
  <div :class="['g-module-title', { 'g-module-inside-title' : inside }]">
    <slot></slot>
  </div>
</template>

<script setup>
const props = defineProps({
  inside: {
    type: Boolean,
    default: false,
  }
});
</script>

<style lang="less" scoped>
.g-module-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  position: relative;
  color: #2D3D48;
  &::before {
    content: '';
    display: inline-block;
    width: 4px;
    height: 22px;
    background-color: @primary-color;
    position: absolute;
    left: -16px;
  }
  &.g-module-inside-title {
    &::before {
      position: initial;
      left: 0;
      margin-right: 12px;
    }
  }
}
</style>
