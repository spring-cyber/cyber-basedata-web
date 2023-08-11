<template>
  <c-tree-body>
    <template #header>
      <div class="grid grid-flow-col gap-x-20px">
        <a-input
          v-model:value="treeState.dictionary"
          placeholder="搜索字典"
          @change="methods.searchDictionary()"
        >
          <template #suffix><c-icon icon="cyber-sousuo" size="16" color="#BDBDBD" /></template>
        </a-input>
        <a-dropdown trigger="click">
          <a-button type="primary" ghost>新建</a-button>
          <template #overlay>
            <a-menu class="w-120px pt-7px pb-7px">
              <a-menu-item @click="methods.showModal({ type: '0' })">新建分组</a-menu-item>
              <a-menu-item @click="methods.showModal({ type: '1' })">新建字典</a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>
      </div>
    </template>
    
    <g-tree
      :fieldNames="{ title: 'name', key: 'id' }"
      v-model:selectedKeys="treeState.selectedKeys"
      v-model:expandedKeys="treeState.expandedKeys"
      :tree-data="treeState.treeData"
      :overlay-menu="treeState.overlayMenu"
      :highlight="treeState.highlight"
      @select="methods.onSelect"
    >
      <template #title="record">
        <span v-if="record.type == '0'" :title="`${record.name} ${record.code}`">{{ record.name }} {{ record.code }}</span>
        <div  v-else class="dict-classify-body" :title="`${record.name} ${record.code}`">
          <div>{{ record.name }} {{ record.code }}</div>
          <div class="text-[#666666]">{{ record.description || '-' }}</div>
        </div>
      </template>
    </g-tree>
  </c-tree-body>

  <ModifyDictionary ref="dictRef" @ok="methods.searchQuery"></ModifyDictionary>
  <ModifyDictionaryGroup ref="dictGroupRef" @ok="methods.searchQuery"></ModifyDictionaryGroup>
</template>

<script setup>
import axios from '@/api';
import ModifyDictionary from './ModifyDictionary.vue';
import ModifyDictionaryGroup from './ModifyDictionaryGroup.vue';
import { initHistoryState, changeHistoryState, Modal } from 'cyber-web-ui';

const dictRef = ref();
const dictGroupRef = ref();
const treeState = reactive({
  treeData: [],
  selectedKeys: [],
  expandedKeys: [],
  highlight: {},
  dictionary: undefined,
  overlayMenu: [
    { label: '编辑', handler: (record) => methods.showModal(record) },
    { label: '删除', handler: (record) => methods.delete(record) },
    {
      label: '新建字典',
      show: (record) => record.type == '0',
      handler: (record) => methods.showModal({ type: '1' }, record.id),
    },
  ]
});

const queryState = reactive({
  ...initHistoryState({
    dict: undefined,
  }),
});

const interceptAction = inject('interceptAction');
const $emit = defineEmits(['change']);
const methods = {
  async searchQuery() {
    try {
      let res = await axios.request({
        url: '/basedata/dict/tree',
        method: 'get',
      });
      treeState.treeData = (res.data || []).map(item => {
        return { ...item, selectable: false, };
      });
    } catch(e) {
      treeState.treeData = [];
      throw Error(e);
    }
    if(!treeState.treeData?.length) return;
    let parent = undefined;
    let node = undefined;
    let dict = queryState.dict;
    if(queryState.dict) {
      parent = treeState.treeData.find(item => new RegExp(`"id":"${dict}"`).test(JSON.stringify(item.children || [])));
    }
    if(parent) {
      node = parent.children.find(item => item.id == dict);
    } else {
      parent = treeState.treeData.find(item => item.children.length > 0);
      node = parent.children[0];
    }
    $emit('change', node, parent);
    treeState.selectedKeys = [node.id];
    treeState.expandedKeys = [parent.id];
  },
  async onSelect(selectedKeys, {selected, selectedNodes, node, event}) {
    treeState.selectedKeys = [queryState.dict];
    if(!selected) return;
    try {
      await interceptAction();
    } catch {
      return;
    }
    queryState.dict = node.id;
    treeState.selectedKeys = [node.id];
    $emit('change', node, node.parent.node);
    changeHistoryState(queryState);
  },
  // 搜索字典
  searchDictionary() {
    let { dictionary } = treeState;
    treeState.highlight = {};
    treeState.expandedKeys = [];
    if(!dictionary) return;
    let highlight = {};
    treeState.treeData.forEach(item => {
      if(item.name.includes(dictionary) || item.code.includes(dictionary)) highlight[item.id] = '1';
      (item.children || []).forEach(citem => {
        if(citem.name.includes(dictionary) || citem.code.includes(dictionary)) {
          highlight[item.id] = '3';
          highlight[citem.id] = '2';
        }
      });
    });
    treeState.expandedKeys = Object.keys(highlight).filter(key => {
      let value = highlight[key];
      if(value == '3') delete highlight[key];
      return /3/.test(value);
    });
    treeState.highlight = highlight;
  },
  async showModal(record, parentId) {
    try {
      await interceptAction();
    } catch {
      return;
    }
    if(record.type == '0') unref(dictGroupRef).showModal(record);
    else if(record.type == '1') unref(dictRef).showModal(record, parentId);
  },
  async delete(record) {
    try {
      await interceptAction();
    } catch {
      return;
    }
    Modal.verify({
      content: `是否确认删除“${record.code}”字典？`,
      value: record.code,
      params: {
        url: `/basedata/dict`,
        method: 'delete',
        params: {
          id: record.id,
        }
      },
    }).then(() => {
      methods.searchQuery();
    });
  },
};

methods.searchQuery();

defineExpose({
  searchQuery: methods.searchQuery,
});
</script>

<style lang="less" scoped>

.dict-classify-body {
  .ellipsis();
  width: 100%;
  line-height: initial;
  height: 56px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  & > div {
    .ellipsis();
  }
  & > div:first-child {
    margin-bottom: 8px;
  }
}
</style>
