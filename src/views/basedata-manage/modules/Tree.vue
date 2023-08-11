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
              <a-menu-item @click="methods.showModal({ type: 'enterprise' })">新建分组</a-menu-item>
              <a-menu-item @click="methods.showModal({ type: 'dept' })">新建字典</a-menu-item>
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
          <span
            :class="[
              { 'dictionary-tree-node-highlight': treeState.highlight[record.id] },
              { 'dictionary-tree-node-disuse': record.status == '1' }
            ]"
            :title="record.name"
          >{{ record.name }}</span>
          <a-dropdown v-if="treeState.selectedKeys?.[0] == record.id" trigger="click">
            <c-icon icon="cyber-caozuo" size="16px" @click.stop></c-icon>
            <template #overlay>
              <a-menu class="w-120px pt-7px pb-7px">
                <a-menu-item @click="methods.showModal(record)">编辑</a-menu-item>
                <a-menu-item @click="methods.delete(record)">删除</a-menu-item>
                <a-menu-item >新建字典</a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </div>
      </template>
    </a-tree>
  </c-tree-body>
</template>

<script setup>
import axios, { deleteConfrim } from '@/api';
const props = defineProps({
  value: String,
});
const treeState = reactive({
  treeData: [],
  selectedKeys: [],
  expandedKeys: [],
  highlight: {},
  dictionary: undefined,
});

const $emit = defineEmits(['update:value', 'change']);
const methods = {
  async searchQuery() {
    try {
      let res = await axios.request({
        url: '/auth/enterprise/user/tree',
        method: 'get',
      });
      treeState.treeData = methods.initTreeData(res.data || []);
    } catch(e) {
      treeState.treeData = [];
      throw Error(e);
    }
    if(!treeState.treeData?.length) return;
    
    treeState.selectedKeys = [target.id];
    $emit('change', treeState.type);
  },
  // 初始化树数据
  initTreeData(list, parent) {
    return list.map(item => {
      if(parent?.status == '1') {
        item.status = '1';
      }
      methods.initTreeData(item.children || [], item);
      return item;
    });
  },
  // 初始化展开项
  initTreeExpanded(list, key, value, options = { node: undefined, expanded: [], }) {
    list.some(item => {
      if(item[key] == value) {
        options.node = item;
        options.expanded.push(item);
        return true;
      }
      if(!item.children?.length) return false;
      if(!JSON.stringify(item).includes(`"${key}":"${value}"`)) return false;
      options.expanded.push(item);
      methods.initTreeExpanded(item.children, key, value, options);
      return true;
    });
    return options;
  },
  onSelect(selectedKeys, {selected, selectedNodes, node, event}) {
    // console.log('node', node);
    if(!selected) {
      treeState.selectedKeys = [queryState[treeState.type]];
      return;
    }
    treeState.type = node.type;
    selectedKeys = selectedKeys[0];
    
    $emit('change', treeState.type)
  },
  onExpand(expandedKeys, {expanded: bool, node}) {
    treeState.expandedKeys = expandedKeys;
  },
  // 搜索字典
  searchDictionary() {
    treeState.highlight = {};
    treeState.expandedKeys = [];
    if(!treeState.dictionary) {
      treeState.highlight = [];
      return;
    }
    let expanded = methods.getSearchExpandedTree(treeState.treeData, treeState.dictionary);
    treeState.expandedKeys = expanded.filter(item => {
      if(item.type == 'user') {
        treeState.highlight[item.id] = true;
      }
      return item.type != 'user';
    }).map(item => item.id);
  },
  // 获取搜索展开树
  getSearchExpandedTree(list, dictionary, expanded = []) {
    // list.forEach(item => {
    //   if(item.type != 'user') {
    //     if(!item.children?.length) return;
    //     let str = JSON.stringify(item);
    //     if(!str.includes('"type":"user"') || !new RegExp(`"name":"([^"])*${dictionary}([^"])*"`).test(str)) return;
    //     if(methods.getSearchExpandedTree(item.children, dictionary, expanded)) {
    //       expanded.push(item);
    //     }
    //     return;
    //   }
    //   if(item.name.includes(dictionary)) {
    //     expanded.push(item);
    //   }
    // });
    return expanded || [];
  },
  async showModal(record) {
    
  },
  delete(record) {
    deleteConfrim({
      content: `是否确认删除“${record.name}”的${
        record.type == 'dept' ? '部门' : '企业'
      }及其相关数据？`,
      value: record.name,
    }, {
      url: `/auth/${record.type}`,
      method: 'delete',
      params: {
        id: record.id,
      }
    }).then(() => {
      methods.searchQuery();
    });
  },
};

// methods.searchQuery();

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
}
</style>
