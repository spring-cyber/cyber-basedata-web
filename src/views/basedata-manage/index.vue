<template>
  <div>
    <c-page-label title="主数据管理" icon="cyber-zhushuju" document-link="javascript:;">
      <template #tips>主数据是指具有共享性的基础数据,可以在企业内跨越各个业务部门被重复使用。</template>
    </c-page-label>
    
    <div class="flex">
      <Tree></Tree>
      <div class="w-0 flex-1 ml-20px">
        <c-radio-wrapper v-model:value="queryState.type">
          <c-radio-button value="0">主数据定义</c-radio-button>
          <c-radio-button value="1">主数据列表</c-radio-button>
          <c-radio-button value="2">变更记录</c-radio-button>
        </c-radio-wrapper>

        <Definition v-if="queryState.type == '0'"></Definition>
        <List v-if="queryState.type == '1'"></List>
        <ChangeLog v-if="queryState.type == '2'"></ChangeLog>
      </div>
    </div>
  </div>
</template>

<script setup>
import Tree from './modules/Tree.vue';
import List from './modules/List.vue';
import ChangeLog from './modules/ChangeLog.vue';
import Definition from './modules/Definition.vue';

const queryState = reactive({
  type: '0',
});

</script>