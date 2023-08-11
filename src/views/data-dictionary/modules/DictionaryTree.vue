<template>
  <c-tree-body>
    <template #header>
      <div class="grid grid-flow-col gap-x-40px">
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
    
    <a-tree
      block-node
      :height="650"
      :fieldNames="{ title: 'name', key: 'id' }"
      v-model:selectedKeys="treeState.selectedKeys"
      v-model:expandedKeys="treeState.expandedKeys"
      :tree-data="treeState.treeData"
      class="dictionary-tree"
      @select="methods.onSelect"
      @expand="methods.onExpand"
    >
      <template #title="record">
        <div class="dictionary-tree-node">
          <div
            :class="[
              'w-0 flex-1 ellipsis',
              { 'dictionary-tree-node-highlight': treeState.highlight[record.id] },
              { 'dictionary-tree-node-disuse': record.status == '1' }
            ]"
            :title="`${record.name} ${record.code}`"
            @mouseenter="() => treeState.hoverId = record.id"
            @mouseleave="() => treeState.hoverId = undefined"
          >
            <template v-if="record.type == '0'">{{ record.name }} {{ record.code }}</template>
            <div  v-else class="dict-classify-body">
              <div>{{ record.name }} {{ record.code }}</div>
              <div class="color-[#666666]">{{ record.description || '-' }}</div>
            </div>
          </div>
          <a-dropdown
            v-if="treeState.hoverId == record.id"
            trigger="click"
            @mouseenter="() => treeState.hoverId = record.id"
          >
            <c-icon icon="cyber-caozuo" size="16px" @click.stop></c-icon>
            <template #overlay>
              <a-menu class="w-120px pt-7px pb-7px">
                <a-menu-item @click="methods.showModal(record)">编辑</a-menu-item>
                <a-menu-item @click="methods.delete(record)">删除</a-menu-item>
                <a-menu-item v-if="record.type == '0'" @click="methods.showModal({ type: '1' }, record.id)">新建字典</a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </div>
      </template>
    </a-tree>
  </c-tree-body>

  <ModifyDictionary ref="dictRef" @ok="methods.searchQuery"></ModifyDictionary>
  <ModifyDictionaryGroup ref="dictGroupRef" @ok="methods.searchQuery"></ModifyDictionaryGroup>
</template>

<script setup>
import axios, { deleteConfrim } from '@/api';
import ModifyDictionary from './ModifyDictionary.vue';
import ModifyDictionaryGroup from './ModifyDictionaryGroup.vue';
import { initHistoryState, changeHistoryState } from 'cyber-web-ui';
import { onUnmounted } from 'vue';

const dictRef = ref();
const dictGroupRef = ref();
const treeState = reactive({
  treeData: [],
  selectedKeys: [],
  expandedKeys: [],
  highlight: {},
  dictionary: undefined,
  hoverId: undefined,
});

const queryState = reactive({
  ...initHistoryState({
    dict: undefined,
  }),
});

const $emit = defineEmits(['change']);
const methods = {
  async searchQuery() {
    try {
      let res = await axios.request({
        url: '/basedata/dict/tree',
        method: 'get',
      });
      treeState.treeData = res.data || [];
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
  onSelect(selectedKeys, {selected, selectedNodes, node, event}) {
    if(!selected || node.type == '0') {
      treeState.selectedKeys = [queryState.dict];
      return;
    }
    queryState.dict = node.id;
    selectedKeys = selectedKeys[0];
    $emit('change', node, node.parent.node);
    changeHistoryState(queryState);
  },
  onExpand(expandedKeys, {expanded: bool, node}) {
    treeState.expandedKeys = expandedKeys;
  },
  // 搜索字典
  searchDictionary() {
    let dictionary = treeState.dictionary;
    treeState.highlight = {};
    treeState.expandedKeys = [];
    if(!dictionary) {
      treeState.highlight = {};
      return;
    }
    let reg = new RegExp(`"(name|code)":"([^"])*${dictionary}([^"])*"`);
    treeState.treeData.forEach(item => {
      if(item.name.includes(dictionary) || item.code.includes(dictionary)) treeState.highlight[item.id] = true;
      if(item.children && reg.test(JSON.stringify(item.children))) {
        item.children.forEach(citem => {
          if(citem.name.includes(dictionary) || citem.code.includes(dictionary)) treeState.highlight[citem.id] = true;
        });
      }
    });
    treeState.expandedKeys = Object.keys(treeState.highlight);
  },
  async showModal(record, parentId) {
    if(record.type == '0') unref(dictGroupRef).showModal(record);
    else if(record.type == '1') unref(dictRef).showModal(record, parentId);
  },
  delete(record) {
    deleteConfrim({
      content: `是否确认删除“${record.code}”字典？`,
      value: record.code,
    }, {
      url: `/basedata/dict`,
      method: 'delete',
      params: {
        id: record.id,
      }
    }).then(() => {
      methods.searchQuery();
    });
  },
  clickHandler() {
    treeState.hoverId = undefined;
  },
};

methods.searchQuery();

document.addEventListener('click', methods.clickHandler)
onUnmounted(() => {
  document.removeEventListener('click', methods.clickHandler)
});

defineExpose({
  searchQuery: methods.searchQuery,
});
</script>

<style lang="less" scoped>
.dictionary-tree {
  .dictionary-tree-node {
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: relative;
  }
  .ant-tree-treenode {
    .dictionary-tree-node-disuse {
      color: #BDBDBD;
    }
    &.ant-tree-treenode-selected {
      .dictionary-tree-node-disuse {
        color: hardlight(@primary-color, #FFFFFF33);
      }
    }
    .dictionary-tree-node-highlight {
      color: @primary-color;
      &.dictionary-tree-node-disuse {
        color: hardlight(@primary-color, #FFFFFF33);
      }
    }
  }
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
}
</style>
