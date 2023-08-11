<template>
  <div>
    <c-page-label title="地址库管理" icon="cyber-dizhiku" document-link="#地址库管理">
      <template #tips>地址库是用来创建保存地址多层级地址区域，支持四级地址库管理。</template>
    </c-page-label>

    <div class="flex">
      <AddressTree @change="methods.onChange"></AddressTree>
      <div class="w-0 flex-1 ml-20px">
        <c-table-wrapper
          rowKey="id"
          ref="tableRef"
          v-model:loading="tableState.loading"
          :columns="tableState.columns"
          :overlayMenu="tableState.overlayMenu"
          @search="methods.searchQuery"
        >
          <template #collapse>
            <!-- 名称搜索 -->
            <a-input
              v-model:value="queryState.name"
              placeholder="请输入名称搜索..."
              class="w-256px"
              @keydown.enter="methods.searchQuery()"
            >
              <template #suffix><c-icon icon="cyber-sousuo" size="16" color="#BDBDBD" /></template>
            </a-input>
          </template>
          <template #right>
            <a-button type="primary" :disabled="!tableState.parentNode?.id" @click="methods.showModify({ parentId: tableState.parentNode.id })">新建</a-button>
          </template>
          <template #bodyCell="{ record, column }">
            <template v-if="column.key == 'accuracy'">
              <g-rate :value="record.accuracy" disabled></g-rate>
            </template>
            <template v-if="column.key == 'action'">
              <div class="address-action-handler-block">
                <c-icon icon="cyber-dingwei1" size="16px" isSvg @click="methods.showLocation(record)"/>
                <c-icon icon="cyber-bianji1" size="16px" color="#05C059" @click="methods.showModify(record)"/>
                <c-icon icon="cyber-shanchu2" size="16px" color="#DB5756" @click="methods.delete(record)"/>
              </div>
            </template>
          </template>
        </c-table-wrapper>
      </div>
    </div>

    <ModifyAddress ref="modifyRef" @ok="methods.searchQuery()"></ModifyAddress>
    <LocationMap ref="locationRef"></LocationMap>
  </div>
</template>

<script setup>
import ModifyAddress from './modules/ModifyAddress.vue';
import AddressTree from './modules/AddressTree.vue';
import { changeHistoryState, initHistoryState, Modal } from 'cyber-web-ui';
import { message } from 'ant-design-vue';
import LocationMap from './modules/LocationMap.vue';

const tableRef = ref(); // 表格ref
const modifyRef = ref(); // 弹窗ref
const locationRef = ref();
// 表格请求参数
const queryState = reactive({
  ...initHistoryState({
    name: undefined,
  }),
});
// 表格信息
const tableState = reactive({
  loading: false,
  columns: [
    { title: '详细地址', dataIndex: "name", ellipsis: true },
    { title: '邮政编码', dataIndex: "zipCode", width: '150px', customRender: ({ text }) => text || '-' },
    { title: '精确度', key: "accuracy", width: '180px' },
    { title: '添加时间', dataIndex: "createTime", width: '17%', customRender: ({ text }) => text || '-' },
    { title: '修改时间', dataIndex: "updateTime", width: '17%', customRender: ({ text }) => text || '-' },
    { title: '操作', key: "action", fixed: 'right', width: '110px' },
  ],
  parentNode: {},
  positionRecord: undefined,
});

const methods = {
  onChange(node) {
    tableState.parentNode = node;
    if(node?.id) {
      methods.searchQuery();
    }
  },
  // 搜索表格
  searchQuery() {
    if(!tableState.parentNode?.id) {
      message.warning('请先选择左侧地址树！')
      return;
    }
    changeHistoryState(queryState);
    unref(tableRef).searchQuery({
      url: '/basedata/area/search',
      method: 'get',
      params: {
        ...queryState,
        parentId: tableState.parentNode.id,
        level: '5',
        sortBy: 'per_pin_yin',
        sortType: 'asc',
      },
    });
  },
  // 显示弹窗
  showModify(record) {
    unref(modifyRef).showModal(record);
  },
  showLocation(record) {
    unref(locationRef).showModal(record, true);
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
    }).then(() => {
      methods.searchQuery();
    });
  },
};
</script>

<style lang="less" scoped>
.address-action-handler-block {
  display: flex;
  align-items: center;
  min-height: 40px;
  & > * {
    margin-right: 10px;
    cursor: pointer;
    &:last-child {
      margin-right: 0;
    }
  }
}
</style>
