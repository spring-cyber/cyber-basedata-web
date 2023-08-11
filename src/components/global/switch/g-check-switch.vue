<template>
  <label :class="['g-check-switch', { 'g-check-switch-disabled': disabled }]" @click="onClick">
    <c-icon :icon="icon" size="16" isSvg class="mr-8px"></c-icon>
    <slot></slot>
  </label>
</template>

<script setup>
const props = defineProps({
  // 是否选中
  checked: {
    type: [Boolean, String, Number],
    default: 0,
  },
  // 是否禁用
  disabled: {
    type: Boolean,
    default: false,
  },
  // 选中时的值
  checkedValue: {
    type: [Boolean, String, Number],
    default: 1,
  },
  // 未选中时的值
  unCheckedValue: {
    type: [Boolean, String, Number],
    default: 0,
  },
  // 图标类型
  type: {
    type: String,
    default: 'radio',
    validator: (value) => ['radio', 'checkbox'].includes(value),
  }
});
const checked = ref();
const checkedStatus = computed(() => checked.value == props.checkedValue);
const icon = computed(() => {
  if(props.type == 'radio') {
    return checkedStatus.value
      ? 'cyber-xuanzhong'
      : props.disabled
        ? 'cyber-weixuan'
        : 'cyber-daixuan';
  }
  return checkedStatus.value
    ? 'cyber-xuanzhong2'
    : props.disabled
      ? 'cyber-weixuan2'
      : 'cyber-daixuan2';
})
const $emit = defineEmits(['update:checked', 'change']);
function onClick() {
  if(props.disabled) return;
  checked.value = checkedStatus.value ? props.unCheckedValue : props.checkedValue;
  $emit('update:checked', checked.value);
  $emit('change', checked.value);
}

watch(() => props.checked, (value) => {
  checked.value = value;
}, { immediate: true });
</script>

<style lang="less" scoped>
.g-check-switch {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  &-disabled {
    cursor: not-allowed;
    color: #666666;
  }
}
</style>
