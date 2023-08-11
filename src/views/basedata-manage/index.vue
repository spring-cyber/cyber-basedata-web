<template>
  <div>
    <c-page-label title="主数据管理" icon="cyber-zhushuju" document-link="#主数据管理">
      <template #tips>主数据是指具有共享性的基础数据,可以在企业内跨越各个业务部门被重复使用。</template>
    </c-page-label>
    
    <div class="flex">
      <BasedataTree @change="methods.onChange"></BasedataTree>
      <div class="w-0 flex-1 ml-20px">
        <c-radio-wrapper :value="baseState.type" @change="methods.onRadioChange">
          <c-radio-button value="0">主数据定义</c-radio-button>
          <c-radio-button value="1">主数据列表</c-radio-button>
          <c-radio-button value="2">变更记录</c-radio-button>
        </c-radio-wrapper>

        <Definition v-if="baseState.type == '0'" :node="baseState.node"></Definition>
        <TableEditor v-if="baseState.type == '1'" :node="baseState.node" :parentNode="baseState.parentNode"></TableEditor>
        <ApprovalLog v-if="baseState.type == '2'" :node="baseState.node" :parentNode="baseState.parentNode"></ApprovalLog>
      </div>
    </div>
  </div>
</template>

<script setup>
import BasedataTree from './modules/BasedataTree.vue';
import TableEditor from './modules/TableEditor.jsx';
import ApprovalLog from './modules/ApprovalLog.vue';
import Definition from './modules/Definition.vue';
import { Modal, changeHistoryState, initHistoryState } from 'cyber-web-ui';
const baseState = reactive({
  ...initHistoryState({
    type: '0',
  }),
  node: {}, // 表格
  parentNode: {}, // 组
  isModify: false,
});

const methods = {
  onChange(node, parentNode) {
    baseState.node = node;
    baseState.parentNode = parentNode;
  },
  async onRadioChange(e) {
    try {
      await methods.interceptAction();
      baseState.type = e.target.value;
      changeHistoryState({ type: baseState.type }, true);
    } catch {}
  },
  interceptAction() {
    if(!baseState.isModify) return Promise.resolve();
    return new Promise((resolve, reject) => {
      Modal.confirm({
        content: h('div', {}, `是否确认取消编辑？确认后之前的操作将不保存！`),
        onOk: () => {
          baseState.isModify = false;
          resolve();
        },
        oncancel: reject,
      })
    });
  },
};

provide('openModify', () => baseState.isModify = true);
provide('closeModify', () => baseState.isModify = false);
provide("isModify", computed(() => baseState.isModify));
provide("interceptAction", methods.interceptAction);
</script>
