<template>
  <c-page-wrapper :class="[{ 'definition-disalbed': !isModify }]">
    <template #header>
      <c-collapse-form :show-reload="!isModify" @search="methods.searchQuery">
        <span class="text-[#2D3D48] font-600">{{ baseState.group?.name || '-' }} / {{ baseState.detail?.name || '-' }}</span>
        <template #right>
          <div v-if="isModify">
            <a-button type="primary" :loading="baseState.loading" @click="methods.closeModify" danger>取消</a-button>
            <a-button type="primary" class="ml-8px" :loading="baseState.loading" @click="methods.onSubmit">保存</a-button>
          </div>
          <div v-else>
            <a-button type="primary" @click="openModify">编辑</a-button>
            <a-button type="primary" class="ml-8px" danger @click="methods.delete">删除</a-button>
          </div>
        </template>
      </c-collapse-form>
    </template>

    <div class="definition-detail">
      <div class="pr-114px">
        <g-module-title>主数据组</g-module-title>
        <div class="grid grid-cols-3 gap-x-30px">
          <data-item label="主题名称" :content="baseState.group?.name"></data-item>
          <data-item label="主题编码" :content="baseState.group?.code"></data-item>
          <data-item label="负责人" :content="baseState.group?.leaderName"></data-item>
        </div>
        <g-module-title>表格定义</g-module-title>
        <div class="grid grid-cols-3 gap-x-30px">
          <data-item label="表格名称" :content="baseState.detail?.name">
            <a-input v-if="isModify" v-model:value="baseState.detail.name" placeholder="请输入表格名称" :maxlength="32"></a-input>
          </data-item>
          <data-item label="表格编码" :content="baseState.detail?.code"></data-item>
          <data-item label="排序规则" :content="baseState.detail?.collation">
            <c-select v-if="isModify" v-model:value="baseState.detail.collation" :options="INDEX_SORT_RULES" placeholder="请选择排序规则"></c-select>
          </data-item>
          <data-item label="存储引擎" :content="baseState.detail?.engine">
            <c-select v-if="isModify" v-model:value="baseState.detail.engine" :options="ENGINE" placeholder="请选择存储引擎"></c-select>
          </data-item>
          <data-item label="表格描述" :content="baseState.detail?.description" class="col-span-2">
            <a-input v-if="isModify" v-model:value="baseState.detail.description" placeholder="请输入描述信息..." :maxlength="120"></a-input>
          </data-item>
        </div>
      </div>
      <g-module-title>
        <div class="w-1/1 flex justify-between content-center">
          <span>属性定义</span>
          <a class="add-text" v-if="isModify" @click="methods.showModal('0')">新增</a>
        </div>
      </g-module-title>
      <c-table
        rowKey="code"
        ref="tableRef"
        v-model:dataSource="baseState.detail.columnList"
        :columns="baseState.columns"
        :pagination="false"
      >
        <template #bodyCell="{ record, column, index }">
          <template v-if="/primaryKey/.test(column.key)">
            <g-check-switch :checked="record[column.key]" disabled></g-check-switch>
          </template>
          <template v-if="/notNull|autoIncrement/.test(column.key)">
            <g-check-switch type="checkbox" :checked="record[column.key]" disabled></g-check-switch>
          </template>
          <template v-if="column.key == 'action'">
            <div class="action-icon-body">
              <c-icon icon="cyber-bianji1" size="16" @click="methods.showModal('0', index)"></c-icon>
              <c-icon icon="cyber-shanchu2" size="16" @click="methods.onDelete('0', record, index)"></c-icon>
            </div>
          </template>
        </template>
      </c-table>
      <g-module-title>
        <div class="w-1/1 flex justify-between content-center">
          <span>索引定义</span>
          <a class="add-text" v-if="isModify" @click="methods.showModal('1')">新增</a>
        </div>
      </g-module-title>
      <c-table
        rowKey="code"
        ref="tableRef"
        v-model:dataSource="baseState.detail.indexList"
        :columns="baseState.indexColumns"
        :pagination="false"
      >
        <template #bodyCell="{ record, column, index }">
          <template v-if="column.key == 'action'">
            <div class="action-icon-body">
              <c-icon icon="cyber-bianji1" size="16" @click="methods.showModal('1', index)"></c-icon>
              <c-icon icon="cyber-shanchu2" size="16" @click="methods.onDelete('1', record, index)"></c-icon>
            </div>
          </template>
        </template>
      </c-table>
      <g-module-title>
        <div class="w-1/1 flex justify-between content-center">
          <span>外键定义</span>
          <a class="add-text" v-if="isModify" @click="methods.showModal('2')">新增</a>
        </div>
      </g-module-title>
      <c-table
        rowKey="code"
        ref="tableRef"
        v-model:dataSource="baseState.detail.fkList"
        :columns="baseState.fkColumns"
        :pagination="false"
      >
        <template #bodyCell="{ record, column, index }">
          <template v-if="column.key == 'action'">
            <div class="action-icon-body">
              <c-icon icon="cyber-bianji1" size="16" @click="methods.showModal('2', index)"></c-icon>
              <c-icon icon="cyber-shanchu2" size="16" @click="methods.onDelete('2', record, index)"></c-icon>
            </div>
          </template>
        </template>
      </c-table>
    </div>
    <ModifyColumns ref="columnsRef" @ok="(state, index) => methods.onChange('0', state, index)"></ModifyColumns>
    <ModifyIndex ref="indexRef" @ok="(state, index) => methods.onChange('1', state, index)"></ModifyIndex>
    <ModifyForeignKey ref="fkRef" @ok="(state, index) => methods.onChange('2', state, index)"></ModifyForeignKey>
  </c-page-wrapper>
</template>

<script setup>
import axios from '@/api';
import DataItem from './DataItem.vue';
import { Modal, bus, useDict } from 'cyber-web-ui';
import ModifyColumns from './ModifyColumns.vue';
import ModifyIndex from './ModifyIndex.vue';
import ModifyForeignKey from './ModifyForeignKey.vue';
import { message } from 'ant-design-vue';
import { maintainStore } from '@/store';
const props = defineProps({
  node: {
    type: Object,
    default: () => {},
  },
});
const $maintainStore = maintainStore();
const { INDEX_SORT_RULES, ENGINE } = useDict({ BASEDATA: ['INDEX_SORT_RULES', 'ENGINE'] });
const columnsRef = ref();
const indexRef = ref();
const fkRef = ref();
const baseState = reactive({
  group: {},
  detail: {},
  columns: [
    { title: '属性', dataIndex: "code", width: '15%', ellipsis: true },
    { title: '名称', dataIndex: "name", width: '15%', ellipsis: true },
    { title: '类型', dataIndex: "type", width: '15%' },
    { title: '长度', dataIndex: "length", width: '15%' },
    { title: '描述', dataIndex: "description", width: '15%', ellipsis: true },
    { title: '主键', key: "primaryKey", width: '80px' },
    { title: '非空', key: "notNull", width: '80px' },
    { title: '自增', key: "autoIncrement", width: '80px' },
    { title: '关联表格', dataIndex: "clTableCode", width: '15%', ellipsis: true },
    { title: '关联属性', dataIndex: "clColumnCode", width: '15%', ellipsis: true },
    { title: '操作', key: "action", fixed: 'right', width: '110px', rowDrag: true, disabledRowDrag: computed(() => !isModify.value) },
  ],
  indexColumns: [
    { title: '名称', dataIndex: "name", width: '20%', ellipsis: true },
    { title: '类型', dataIndex: "type", width: '20%', ellipsis: true },
    { title: '属性', dataIndex: "columnCode", width: '20%', ellipsis: true },
    { title: '排序方式', dataIndex: "sortord", width: '20%', ellipsis: true },
    { title: '存储结构', dataIndex: "structure", width: '20%', ellipsis: true },
    { title: '描述', dataIndex: "description", width: '20%', ellipsis: true },
    { title: '操作', key: "action", fixed: 'right', width: '85px' },
  ],
  fkColumns: [
    { title: '名称', dataIndex: "name", width: '20%', ellipsis: true },
    { title: '属性', dataIndex: "columnCode", width: '20%', ellipsis: true },
    { title: '关联表格', dataIndex: "clTableCode", width: '20%', ellipsis: true },
    { title: '关联属性', dataIndex: "clColumnCode", width: '20%', ellipsis: true },
    { title: '描述', dataIndex: "description", width: '20%', ellipsis: true },
    { title: '操作', key: "action", fixed: 'right', width: '85px' },
  ],
  loading: false,
});
const interceptAction = inject("interceptAction");
const isModify = inject("isModify");
const openModify = inject('openModify');
const closeModify = inject('closeModify');
const methods = {
  async searchQuery() {
    baseState.group = {};
    baseState.detail = {};
    try {
      let res = await axios.request({
        url: '/basedata/basedata',
        method: 'get',
        params: {
          id: props.node.id,
        },
      });
      baseState.detail = res.data || {};
      let groupRes = await axios.request({
        url: '/basedata/basedata',
        method: 'get',
        params: {
          id: baseState.detail.parentId,
        },
      });
      baseState.group = groupRes.data || {};
    } catch {}
  },
  showModal(type = '0', index = -1) {
    if(!isModify.value) return;
    if(type == '0') unref(columnsRef).showModal(baseState.detail, index);
    else if(type == '1') unref(indexRef).showModal(baseState.detail, index);
    else unref(fkRef).showModal(baseState.detail, index);
  },
  onChange(type = '0', state, index) {
    if(!isModify.value) return;
    if(type == '0') {
      if(state.autoIncrement == '1') {
        baseState.detail.autoIncrementVal = state.autoIncrementVal;
      }
      if(index == -1) baseState.detail.columnList.push(state);
      else baseState.detail.columnList.splice(index, 1, state);
    } else if(type == '1') {
      if(index == -1) baseState.detail.indexList.push(state);
      else baseState.detail.indexList.splice(index, 1, state);
    } else {
      if(index == -1) baseState.detail.fkList.push(state);
      else baseState.detail.fkList.splice(index, 1, state);
    }
  },
  // 删除属性、索引、外键
  onDelete(type = '0', record, index) {
    if(!isModify.value) return;
    let title = type == '0' ? '属性' : type == '1' ? '索引' : '外键';
    Modal.confirm({
      content: h('div', {}, `是否确认删除“${type == '0' ? record.code : record.name}”${title}？`),
      onOk: () => {
        if(type == '0') baseState.detail.columnList.splice(index, 1);
        else if(type == '1') baseState.detail.indexList.splice(index, 1);
        else baseState.detail.fkList.splice(index, 1);
      },
    });
  },
  async onSubmit() {
    if(!baseState.detail?.name) return message.warning('表格名称不能为空！');
    baseState.loading = true;
    $maintainStore.loading = true;
    try {
      let { detail } = baseState;
      let res = await axios.request({
        url: '/basedata/basedata',
        method: 'put',
        data: {
          ...detail,
          columnList: (detail.columnList || []).map((item, index) => {
            return { ...item, tableCode: detail.code, orderNum: index + 1 };
          }),
          indexList: (detail.indexList || []).map((item) => {
            return { ...item, tableCode: detail.code };
          }),
          fkList: (detail.fkList || []).map((item) => {
            return { ...item, tableCode: detail.code };
          }),
        }
      });
      message.success(res.message);
      closeModify();
      bus.emit('TABLE_SEARCH');
    } catch {}
    baseState.loading = false;
    $maintainStore.loading = false;
  },
  // 关闭修改
  async closeModify() {
    try {
      await interceptAction();
      closeModify();
      methods.searchQuery();
    } catch {}
  },
  // 删除表
  delete() {
    bus.emit('TABLE_DELETE', props.node);
  },
};

watchEffect(() => {
  if(props.node?.id) nextTick(() => methods.searchQuery());
});
</script>

<style lang="less" scoped>
.definition-detail {
  padding: 24px 18px 24px 46px;
  .ant-input,
  .cyber-select {
    width: 100%;
  }
}
.cyber-collapse-form {
  border-bottom: 1px solid #D9E2EB;
}
.g-module-title {
  margin-top: 22px;
  &:first-child {
    margin-top: 0;
  }
  .add-text {
    font-size: 12px;
    font-weight: normal;
    text-decoration: underline;      
  }
}
.action-icon-body {
  & > * {
    margin-right: 10px;
    cursor: pointer;
    &:last-child {
      margin-right: 0;
    }
  }
  .cyber-bianji1 {
    color: @primary-color;
  }
  .cyber-shanchu2 {
    color: @error-color;
  }
}
.definition-disalbed {
  .action-icon-body {
    & > * {
      cursor: not-allowed;
      color: #666666;
    }
  }
}
</style>
