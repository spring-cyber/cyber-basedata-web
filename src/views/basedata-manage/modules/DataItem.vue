<template>
  <div class="data-item">
    <div class="data-item-label">{{ label }}：</div>
    <div class="data-item-content">
      <slot>
        <span class="ellipsis" :title="content">{{ content || '-' }}</span>
      </slot>
    </div>
  </div>
</template>

<script setup>
defineProps({
  label: String,
  content: String,
})
</script>

<style lang="less" scoped>
.data-item {
  display: flex;
  align-items: center;
  height: 32px;
  font-weight: normal;
  margin-bottom: 8px;
  .data-item-label {
    width: 80px;
    white-space: nowrap;
    color: #666666;
      
  }
  .data-item-content {
    // .ellipsis();
    width: 0;
    flex: 1;
    color: #2D3D48;
  }
}
</style>