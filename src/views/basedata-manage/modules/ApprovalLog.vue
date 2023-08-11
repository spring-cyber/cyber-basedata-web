<template>
  <div>
    <c-table-wrapper
      rowKey="id"
      ref="tableRef"
      v-model:loading="tableState.loading"
      :columns="tableState.columns"
      :action="false"
      @search="methods.searchQuery"
    >
      <template #collapse>
        <span class="font-600">{{ parentNode?.name || '-' }} / {{ node?.name || '-' }}</span>
      </template>
      <template #bodyCell="{ record, column }">
        <template v-if="column.key == 'createTime'">
          <c-cell icon="cyber-shijian">{{ record.createTime }}</c-cell>
        </template>
        <!-- <template v-if="column.key == 'status'">
          <a-tooltip placement="bottom">
            <template #title v-if="record.status == '2'">{{ record.cause }}</template>
            <c-cell-dict :value="record.status" :options="APPROVAL_STATUS"></c-cell-dict>
          </a-tooltip>
        </template> -->
      </template>
    </c-table-wrapper>
    <!-- <ModifyApproval ref="modifyRef" @ok="methods.searchQuery"></ModifyApproval> -->
  </div>
</template>

<script setup>
// import { useDict } from 'cyber-web-ui';
// import ModifyApproval from './ModifyApproval.vue';
const props = defineProps({
  node: {
    type: Object,
    default: () => {},
  },
  parentNode: {
    type: Object,
    default: () => {},
  },
});
// const { APPROVAL_STATUS } = useDict({ BASEDATA: ['APPROVAL_STATUS'] });
const tableRef = ref(); // 表格ref
// const modifyRef = ref();
// 表格信息
const tableState = reactive({
  loading: false,
  columns: [
    { title: '修改时间', key: "createTime", width: '220px', },
    { title: '修改人', dataIndex: "creator", width: '15%', ellipsis: true },
    { title: '修改脚本', dataIndex: "changeSql", ellipsis: true },
    // { title: '审批状态', key: "status", width: '15%' }, // 0：未处理 1：通过 2：驳回
    // { title: '操作时间', dataIndex: "updateTime", width: '200px', customRender: ({ text }) => text || '-' },
  ],
  // overlayMenu: [
  //   {
  //     label: "审批",
  //     show: (record) => record.status == '0',
  //     handler: (record) => methods.showModify(record),
  //   },
  //   {
  //     label: "重新审批",
  //     show: (record) => record.status == '2',
  //     handler: (record) => methods.showModify(record),
  //   },
  // ],
});

const methods = {
  // 搜索表格
  searchQuery() {
    unref(tableRef).searchQuery({
      url: '/basedata/basedata/approvallog/search',
      method: 'get',
      params: {
        tableCode: props.node?.code,
        sortBy: 'create_time',
        sortType: 'desc',
      },
    });
  },
  // 显示弹窗
  // showModify(record = {}) {
  //   unref(modifyRef).showModal(record, props.node);
  // },
};

watchEffect(() => {
  if(props.node?.id) nextTick(() => methods.searchQuery());
});
</script>

<style lang="less" scoped>
</style>
