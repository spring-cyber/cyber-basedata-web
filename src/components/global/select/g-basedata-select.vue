<template>
  <c-select :options="selectState.options" :fieldNames="{ label: 'name', value: 'id' }" />
</template>

<script setup>
import { watchEffect } from "vue";
import axios from '@/api';
const props = defineProps({
  type: [String, Number],
  parentId: String,
});
const selectState = reactive({
  options: [],
});
const methods = {
  async searchQuery(type = '0', parentId = '0') {
    try {
      let res = await axios.request({
        url: '/basedata/basedata/select',
        method: 'get',
        params: {
          type: type,
          parentId: parentId,
        }
      });
      selectState.options = res.data || [];
    } catch {
      selectState.options = [];
    }
  },
}
watchEffect(() => {
  methods.searchQuery(props.type, props.parentId);
});
</script>