<template>
  <c-tree-body>
    <template #header>
      <div class="grid grid-flow-col gap-x-20px">
        <a-input
          v-model:value="treeState.baseName"
          placeholder="搜索"
          @change="methods.searchBasedata()"
        >
          <template #suffix><c-icon icon="cyber-sousuo" size="16" color="#BDBDBD" /></template>
        </a-input>
        <a-dropdown trigger="click">
          <a-button type="primary" ghost>新建</a-button>
          <template #overlay>
            <a-menu class="w-120px pt-7px pb-7px">
              <a-menu-item @click="methods.showModal({ type: '0' })">新建组</a-menu-item>
              <a-menu-item @click="methods.showModal({ type: '1' })">新建表</a-menu-item>
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
      class="basedata-tree"
      :overlay-menu="treeState.overlayMenu"
      :highlight="treeState.highlight"
      @select="methods.onSelect"
    >
      <template #title="record">      
        <span v-if="record.type == '0'" :title="`${record.name} ${record.code}`">{{ record.name }} {{ record.code }}</span>
        <div  v-else class="dict-classify-body" :title="`${record.name} ${record.code}`">
          <div>{{ record.name }} {{ record.code }}</div>
          <!-- <div class="text-[#999999]">{{ record.description || '-' }}</div> -->
        </div>
      </template>
    </g-tree>
  </c-tree-body>

  <ModifyGroup ref="groupRef" @ok="methods.searchQuery()"></ModifyGroup>
  <ModifyTable ref="tableRef" @ok="methods.searchQuery()"></ModifyTable>
</template>

<script setup>
import axios from '@/api';
import { useDict, initHistoryState, changeHistoryState, bus, Modal } from 'cyber-web-ui';
import { onUnmounted } from 'vue';
import ModifyGroup from './ModifyGroup.vue';
import ModifyTable from './ModifyTable.vue';
const { COLLATION, ENGINE } = useDict({ BASEDATA: ['COLLATION', 'ENGINE'] });
const props = defineProps({
  value: String,
});
const groupRef = ref();
const tableRef = ref();
const treeState = reactive({
  treeData: [],
  selectedKeys: [],
  expandedKeys: [],
  highlight: {},
  overlayMenu: [
    { label: '编辑', handler: (record) => methods.showModal(record) },
    { label: '删除', handler: (record) => methods.delete(record) },
    {
      label: '新建表',
      show: (record) => record.type == '0',
      handler: (record) => methods.showModal({ type: '1' }, record.id),
    },
  ],
  baseName: undefined,
});
const queryState = reactive({
  ...initHistoryState({
    baseId: undefined,
  }),
});

const $emit = defineEmits(['update:value', 'change']);
const isModify = inject("isModify");
const interceptAction = inject("interceptAction");
const methods = {
  async searchQuery() {
    try {
      let res = await axios.request({
        url: '/basedata/basedata/tree',
        method: 'get',
      });
      treeState.treeData = (res.data || []).map(item => ({ ...item, selectable: false }));
    } catch(e) {
      treeState.treeData = [];
      throw Error(e);
    }
    if(!treeState.treeData?.length) return;
    let parentNode = '';
    if(queryState.baseId) {
      let reg = new RegExp(`"id":"${queryState.baseId}"`);
      parentNode = treeState.treeData.find(item => reg.test(JSON.stringify(item)));
    }
    if(!parentNode) {
      parentNode = treeState.treeData.find(item => !!item.children?.length);
      queryState.baseId = parentNode ? parentNode.children[0].id : undefined;
    }
    if(parentNode) {
      let target = parentNode.children.find(item => item.id == queryState.baseId);
      treeState.selectedKeys = [target.id];
        treeState.expandedKeys = Array.from(new Set([...treeState.expandedKeys, parentNode.id]));
      $emit('change', target, parentNode);
    }
  },
  async onSelect(selectedKeys, {selected, selectedNodes, node, event}) {
    treeState.selectedKeys = [queryState.baseId];
    try {
      await interceptAction();
    } catch {
      return;
    }
    if(!selected) return;
    queryState.baseId = node.id;
    treeState.selectedKeys = selectedKeys;
    $emit('change', node, node.parent.node);
    changeHistoryState(queryState);
  },
  // 搜索
  searchBasedata() {
    let { baseName } = treeState;
    treeState.highlight = {};
    treeState.expandedKeys = [];
    if(!baseName) return;
    let highlight = {};
    treeState.treeData.forEach(item => {
      if(item.name.includes(baseName) || item.code.includes(baseName)) highlight[item.id] = '1';
      (item.children || []).forEach(citem => {
        if(citem.name.includes(baseName) || citem.code.includes(baseName)) {
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
      if(record.type == '0') unref(groupRef).showModal(record);
      else unref(tableRef).showModal(record, parentId);
    } catch {}
  },
  async delete(record) {
    try {
      await interceptAction();
    } catch {
      return;
    }
    let content = record.type == '0'
      ? `是否确认删除“${record.code}”的主数据组及其相关数据？`
      : `是否确认删除“${record.code}”的模型及其相关数据？`;
    Modal.verify({
      content: content,
      value: record.code,
      params: {
        url: `/basedata/basedata`,
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

bus.on('TABLE_SEARCH', methods.searchQuery);
bus.on('TABLE_DELETE', methods.delete);

onUnmounted(() => {
  bus.off('TABLE_DELETE');
});

defineExpose({
  searchQuery: methods.searchQuery,
});
</script>

<style lang="less" scoped>
.basedata-tree {
  .basedata-tree-node {
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: relative;
  }
  .ant-tree-treenode {
    .basedata-tree-node-disuse {
      color: #BDBDBD;
    }
    &.ant-tree-treenode-selected {
      .basedata-tree-node-disuse {
        color: hardlight(@primary-color, #FFFFFF33);
      }
    }
    .basedata-tree-node-highlight {
      color: @primary-color;
      &.basedata-tree-node-disuse {
        color: hardlight(@primary-color, #FFFFFF33);
      }
    }
  }
}
</style>
