<template>
  <c-tree-body>
    <template #header>
      <div class="grid grid-flow-col gap-x-20px">
        <a-input
          v-model:value="treeState.areaName"
          placeholder="搜索地址库"
          @change="methods.searchArea()"
        >
          <template #suffix><c-icon icon="cyber-sousuo" size="16" color="#BDBDBD" /></template>
        </a-input>
        <a-dropdown trigger="click">
          <a-button type="primary" ghost>新建</a-button>
          <template #overlay>
            <a-menu class="w-120px pt-7px pb-7px">
              <a-menu-item @click="methods.showAreaModal({ level: '1' })">新建省（直辖市）</a-menu-item>
              <a-menu-item @click="methods.showAreaModal({ level: '2' })">新建市（区）</a-menu-item>
              <a-menu-item @click="methods.showAreaModal({ level: '3' })">新建区（县）</a-menu-item>
              <a-menu-item @click="methods.showAreaModal({ level: '4' })">新建乡镇（街道）</a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>
      </div>
    </template>
    
    <g-tree
      :fieldNames="{ title: 'name', key: 'id' }"
      v-model:selectedKeys="treeState.selectedKeys"
      v-model:expandedKeys="treeState.expandedKeys"
      :treeLoadedKeys="treeState.treeLoadedKeys"
      :tree-data="treeState.treeData"
      :overlay-menu="treeState.overlayMenu"
      :highlight="treeState.highlight"
      :load-data="methods.onLoadData"
      @select="methods.onSelect"
    >
      <template #title="record">
        <span :title="record.name">{{ record.name }}</span>
      </template>
    </g-tree>

    <ModifyArea ref="modifyAreaRef" @ok="methods.lazyUpdate" />
    <ModifyAddress ref="modifyAddressRef" @ok="methods.lazyUpdate" />
  </c-tree-body>
</template>

<script setup>
import axios from '@/api';
import ModifyArea from './ModifyArea.vue';
import ModifyAddress from './ModifyAddress.vue';
import { initHistoryState, changeHistoryState, Modal } from 'cyber-web-ui';
const modifyAreaRef = ref();
const modifyAddressRef = ref();
const treeState = reactive({
  treeData: [],
  selectedKeys: [],
  expandedKeys: [],
  treeLoadedKeys: [],
  highlight: {},
  areaName: undefined,
  overlayMenu: [
    { label: '编辑', handler: (record) => methods.showAreaModal(record) },
    { label: '删除', handler: (record) => methods.delete(record) },
    {
      label: (record) => record.level == '1' ? '新建市（区）' : record.level == '2' ? '新建区（县）' : '新建乡镇（街道）',
      show: (record) => record.level < 4,
      handler: (record) => methods.showAreaModal({ level: record.level + 1, parentId: record.id }),
    },
    {
      label: '新建地址',
      show: (record) => record.level == 4,
      handler: (record) => methods.showAddressModal({ parentId: record.id }),
    },
  ],
  reverseLoading: false,
});

const queryState = reactive({
  ...initHistoryState({
    parent: undefined,
  }),
});

const $emit = defineEmits(['change']);
const methods = {
  queryArea(level = '1', parentId = '0') {
    return new Promise(async (resolve) => {
      try {
        let res = await axios.request({
          url: '/basedata/area/select',
          method: 'get',
          params: {
            level: level,
            parentId: parentId,
            sortBy: 'per_pin_yin',
            sortType: 'asc',
          }
        });
        let result = (res.data || []).map(item => {
          return { ...item, isLeaf: item.level == 4, selectable: item.level == 4 }
        });
        
        resolve(result);
      } catch(error) {
        resolve([]);
        throw Error(error);
      }
    });
  },
  async searchQuery() {
    treeState.treeLoadedKeys = [];
    treeState.expandedKeys = [];
    treeState.selectedKeys = [];
    let list = [];
    try {
      list = await methods.queryArea();
    } catch(e) {
      treeState.treeData = [];
      throw Error(e);
    }
    if(!queryState.parent) {
      treeState.treeData = list;
      $emit('change', undefined);
      return;
    }
    treeState.reverseLoading = true;
    const { node, treeData, expandedKeys } = await methods.reverseLoading(5, queryState.parent, list);
    if(!node) {
      treeState.selectedKeys = [];
    } else {
      treeState.selectedKeys = [queryState.parent];
    }
    treeState.treeData = treeData || [];
    treeState.expandedKeys = expandedKeys || [];
    nextTick(() => {
      treeState.reverseLoading = false;
    });
    $emit('change', node);
  },
  async reverseLoading(level, value, treeData) {
    let reg = new RegExp(`"id":"${value}"`);
    if(!value || reg.test(JSON.stringify(treeData))) return {};
    let expandedKeys = [];
    let children = [];
    let nodeInfo = undefined;
    while(level > 2) {
      try {
        let { data: result = {} } = await axios.request({
          url: '/basedata/area',
          method: 'get',
          params: { id: value },
        });
        if(queryState.parent == result.id) nodeInfo = result;
        if(!result.id) level = 0;
        let list = await methods.queryArea(result.level, result.parentId);
        if(!list.length) level = 0;
        expandedKeys.push(result.id);
        level--;
        value = result.parentId == '0' ? result.id : result.parentId;
        list.some((item, index) => {
          if(item.id == result.id) list[index].children = children;
        });
        children = list;
      } catch {
        level = 0;
      }
    }
    if(level = 0) return {};
    treeData.forEach((item) => {
      if(item.id == value) {
        item.children = children;
        expandedKeys.push(item.id);
      }
    });
    return {
      node: nodeInfo,
      treeData: treeData,
      expandedKeys: expandedKeys,
    };
  },
  onSelect(selectedKeys, {selected, selectedNodes, node, event}) {
    if(!selected) {
      treeState.selectedKeys = [node.id];
      return;
    }
    queryState.parent = node.id;
    changeHistoryState(queryState);
    $emit('change', node);
  },
  onLoadData(treeNode) {
    return new Promise(async (resolve, reject) => {
      if (!!treeNode?.dataRef?.children?.length || treeState.reverseLoading) {
        resolve();
        return;
      }
      try {
        let children = await methods.queryArea(treeNode.level + 1, treeNode.id);
        if(treeNode?.dataRef) {
          treeNode.dataRef.children = children;
        } else {
          treeNode.children = children;
        }
        treeState.treeData = [...treeState.treeData];
        resolve();
      } catch(e) {
        reject();
        if(e) {
          throw Error(e?.error || e?.message || e);
        }
      }
    });
  },
  // 搜索地址库
  searchArea() {
    let areaName = treeState.areaName;
    treeState.highlight = {};
    treeState.expandedKeys = [];
    if(!areaName) {
      treeState.highlight = {};
      return;
    }
    treeState.highlight = methods.highlightArea(areaName, treeState.treeData);
    treeState.expandedKeys = Object.keys(treeState.highlight).filter((key) => {
      if(treeState.highlight[key] == 2) delete treeState.highlight[key];
      return !treeState.highlight[key] || treeState.highlight[key] != 3;
    });
  },
  highlightArea(areaName, list, highlight = {}) {
    let reg = new RegExp(`"(name)":"([^"])*${areaName}([^"])*"`);
    list.forEach(item => {
      if(item.name.includes(areaName)) highlight[item.id] = 1;
      if(item.children && reg.test(JSON.stringify(item.children))) {
        if(!highlight[item.id]) highlight[item.id] = 2
        methods.highlightArea(areaName, item.children, highlight);
      } else if(highlight[item.id]) {
        highlight[item.id] = 3;
      }
    });
    return highlight;
  },
  async showAreaModal(record) {
    unref(modifyAreaRef).showModal(record);
  },
  async showAddressModal(record) {
    unref(modifyAddressRef).showModal(record);
  },
  // 删除
  delete(record) {
    Modal.verify({
      content: `是否确认删除“${record.name}”地址？`,
      value: record.name,
      params: {
        url: '/basedata/area',
        method: 'delete',
        params: {
          id: record.id,
        }
      },
    }).then((res) => {
      methods.lazyUpdate(record);
    });
  },
  async lazyUpdate({ id, parentId, level }) {
    let list = await methods.queryArea(level, parentId);
    if(level == '1') {
      let obj = {};
      (treeState.treeData || []).forEach(item => {
        obj[item.id] = item;
      });
      treeState.treeData = list.map((item) => ({ ...item, children: obj?.[item.id]?.children }));
    } else {
      if(!JSON.stringify(treeState.treeData).includes(`"${parentId}"`)) return;
      methods.lazyUpdateTree(parentId, treeState.treeData, list);
    }
    treeState.treeData = [...treeState.treeData];
    
  },
  lazyUpdateTree(parentId, treeData, list) {
    return treeData.some((item) => {
      if(item.id == parentId) {
        let obj = {};
        (item.children || []).forEach(item => {
          obj[item.id] = item;
        });
        item.children = list.map(item => ({ ...item, children: obj?.[item.id]?.children }));
        return true;
      }
      if(item.children?.length) {
        methods.lazyUpdateTree(parentId, item.children, list);
      } 
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
