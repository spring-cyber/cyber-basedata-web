<template>
  <div>
    <c-page-label title="数据字典" icon="cyber-shujuzidian" document-link="#数据字典">
      <template #tips>数据字典可以帮助企业更好地管理数据，提高数据的可维护性和可重用性，降低数据管理成本。</template>
    </c-page-label>
    
    <div class="flex">
      <DictionaryTree @change="methods.onChange"></DictionaryTree>
      <div class="w-0 flex-1 ml-20px">
        <c-table-wrapper
          rowKey="id"
          ref="tableRef"
          v-model:loading="tableState.loading"
          :dataSource="tableState.dataSource"
          :total="tableState.total"
          :columns="tableState.columns"
          :overlayMenu="tableState.overlayMenu"
          :scroll="{ x: 1300 }"
          :customRow="tableState.customRow"
          @search="methods.searchQuery"
        >
          <template #collapse>
            <span class="font-600">{{ tableState.dictGroupNode.name || '-' }} / {{ tableState.dictNode.name || '-' }}</span>
          </template>
          <template #right>
            <a-button type="primary" :disabled="!tableState.dictNode.id || tableState.loading" @click="methods.initFormState('0')">新增</a-button>
          </template>
          <template #bodyCell="{ column, record }">
            <!-- 编辑 -->
            <template v-if="formState.id == record.id && tableState.isModify">
              <template v-if="column.key == 'code' && formState.action == '0'">
                <a-input v-model:value="formState.code"></a-input>
              </template>
              <template v-if="column.key == 'name'">
                <a-input v-model:value="formState.name"></a-input>
              </template>
              <template v-if="column.key == 'description'">
                <a-input v-model:value="formState.description"></a-input>
              </template>
              <template v-if="column.key == 'orderNum'">
                <a-input-number v-model:value="formState.orderNum" :min="0" :max="9999" placeholder="请输入排序..."></a-input-number>
              </template>
            </template>
            <!-- 状态 -->
            <template v-if="column.key == 'status'">
              <c-select v-if="formState.id == record.id && tableState.isModify" v-model:value="formState.status" width="100%" :options="DICTIONARY_STATUS" :getPopupContainer="(triggerNode) => triggerNode.parentNode.parentNode.parentNode"></c-select>
              <c-cell-dict v-else :options="DICTIONARY_STATUS" :value="record.status"></c-cell-dict>
            </template>
            <!-- 颜色 -->
            <template v-if="column.key == 'color'">
              <ColorPicker
                v-if="formState.id == record.id && tableState.isModify" 
                v-model:pureColor="formState.color"
                format="hex8"
                shape="circle"
                pickerType="chrome"
                useType="pure"
                disableHistory
                roundHistory
                lang="ZH-cn"
                theme="black"
              ></ColorPicker>
              <div v-else class="dict-color-block"><div :style="{ background: record.color }"></div></div>
            </template>
            <!-- 图标 -->
            <template v-if="column.key == 'icon'">
              <c-icon-select v-if="formState.id == record.id && tableState.isModify" v-model:value="formState.icon"></c-icon-select>
              <c-icon v-else :icon="record.icon" size="16" isSvg></c-icon>
            </template>
            <template v-if="column.key == 'action'">
              <div class="dict-acion-handler-block" @dblclick.stop>
                <!-- 撤回 -->
                <c-icon v-if="formState.id == record.id && tableState.isModify" icon="cyber-chexiao" size="16" color="#4D6AAB" @click="methods.revocation"></c-icon>
                <!-- 复制 -->
                <c-icon v-else icon="cyber-fuzhi" size="16" color="#4D6AAB" @click="methods.initFormState('0', record)"></c-icon>
                <!-- 保存 -->
                <c-icon v-if="formState.id == record.id && tableState.isModify" icon="cyber-baocun" size="16" color="#05C059" @click="methods.onSubmit"></c-icon>
                <!-- 编辑 -->
                <c-icon v-else icon="cyber-bianji1" size="16" color="#05C059" @click="methods.initFormState('1', record)"></c-icon>
                <!-- 删除 -->
                <c-icon icon="cyber-shanchu2" size="16" color="#DB5756" @click="methods.delete(record)"></c-icon>
              </div>
            </template>
          </template>
        </c-table-wrapper>
      </div>
    </div>
  </div>
</template>

<script setup>
import DictionaryTree from './modules/DictionaryTree.vue';
import axios from '@/api';
import { ColorPicker } from "vue3-colorpicker";
import "vue3-colorpicker/dist/style.css";
import { message } from 'ant-design-vue';
import { generateRandomCode, Modal, useDict } from 'cyber-web-ui';
import { maintainStore } from '@/store';
import { onBeforeRouteLeave } from 'vue-router';
import { watchEffect } from 'vue';

const { DICTIONARY_STATUS } = useDict({ BASEDATA: ['DICTIONARY_STATUS'] });
const tableRef = ref(); // 表格ref
// 表格信息
const tableState = reactive({
  loading: false,
  columns: [
    { title: '编码', dataIndex: 'code', key: "code", width: '15%', ellipsis: true },
    { title: '名称', dataIndex: 'name', key: "name", width: '15%', ellipsis: true },
    { title: '描述', dataIndex: 'description', key: "description", width: '15%', ellipsis: true, customRender: ({ text }) => text || '-' },
    { title: '状态', key: "status", width: '15%' },
    { title: '颜色', key: "color", width: '80px' },
    { title: '图标', key: "icon", width: '15%' },
    { title: '排序', dataIndex: 'orderNum', key: "orderNum", width: '15%'  },
    { title: '操作人', dataIndex: "updator", width: '120px', ellipsis: true, customRender: ({ text }) => text || '-/-'  },
    { title: '操作时间', dataIndex: "updateTime", width: '180px', customRender: ({ text }) => text || '-/-'  },
    { title: '操作', fixed: "right", key: "action", width: '110px'  },
  ],
  dictNode: {},
  dictGroupNode: {},
  dataSource: [],
  total: 0,
  customRow: (record, index) => {
    return {
      onDblclick: (event) => {
        event && event.stopPropagation();
        if(record.id == formState.id) return;
        methods.initFormState('1', record);
      }
    }
  },
  isModify: false,
});

const formState = reactive({
  id: undefined,
  code: undefined,
  name: undefined,
  description: undefined,
  status: undefined,
  color: undefined,
  icon: undefined,
  orderNum: undefined,
  action: undefined,
  version: undefined,
});


const methods = {
  onChange(node, parentNode) {
    tableState.dictNode = node;
    tableState.dictGroupNode = parentNode;
    methods.searchQuery();
  },
  // 搜索表格
  async searchQuery() {
    try {
      await methods.interceptAction(false);
    } catch {
      return;
    }
    let { data, total } = await unref(tableRef).searchQuery({
      url: '/basedata/dict/search',
      method: 'get',
      params: {
        type: '2',
        parentId: tableState.dictNode.id,
        sortBy: 'order_num',
        sortType: 'asc',
      },
    });
    tableState.dataSource = data;
    tableState.total = total;
  },
  interceptAction(flag = true) {
    if(!tableState.isModify) return Promise.resolve();
    return new Promise((resolve, reject) => {
      Modal.confirm({
        width: '500px',
        content: `确定取消${ formState.action == '0' ? '添加' : '编辑' }操作？确定后将不保存之前的操作!`,
        onOk: async () => {
          tableState.isModify = false;
          if(flag) await methods.searchQuery();
          else tableState.dataSource = tableState.dataSource.filter(item => item.id != formState.id);
          resolve();
        },
        oncancel: reject,
      });
    });
  },
  async initFormState(action = '0', record = { orderNum: 1, status: '0', color: '#05C059' }) {
    try {
      await methods.interceptAction();
      tableState.isModify = true;
    } catch(error) {
      if(error) throw Error(error);
      return;
    }
    Object.keys(formState).forEach(key => {
      formState[key] = record[key];
    });
    formState.action = action;
    formState.status += '';
    if(action == '0') {
      formState.id = generateRandomCode();
      tableState.dataSource.push(formState);
    }
  },
  // 撤回
  async revocation() {
    Modal.confirm({
      title: `系统提示`,
      width: '500px',
      icon: 'cyber-tishi',
      content: `确定进行撤回吗？撤回后将不保存之前的操作!`,
      okButtonProps: {
        danger: true,
      },
      onOk: () => {
        tableState.isModify = false;
        methods.searchQuery();
      },
    });
  },
  // 删除
  async delete(record) {
    if(formState.action == '0' && formState.id == record.id) {
      methods.searchQuery();
      tableState.isModify = false;
      return;
    }
    try {
      await methods.interceptAction(false);
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
        tableState.isModify = false;
      });
    } catch {}
  },
  async onSubmit() {
    tableState.loading = true;
    let find = [
      { key: 'code', label: '编码' },
      { key: 'name', label: '名称' },
      { key: 'status', label: '状态' },
      { key: 'orderNum', label: '排序' },
    ].find(({ key }) => !formState[key] && typeof formState[key] != 'number');
    if(find) {
      tableState.loading = false;
      message.warning(`${find.label}字段不能为空！`);
      return;
    }
    if (/^\s|\s$/.test(formState.code)) {
      tableState.loading = false;
      message.warning('编码首尾不能有空格！');
      return;
    }
    if(!/^[A-Za-z0-9_-\s]+$/.test(formState.code)) {
      tableState.loading = false;
      message.warning('请输入大小写字母、数字、空格、下划线和横线');
      return;
    }
    try {
      // 请求添加/修改接口
      let res = await axios.request({
        url: '/basedata/dict',
        method: formState.action == '0' ? 'post' : 'put',
        data: {
          ...formState,
          type: '2', // 字典类型
          action: undefined,
          id: formState.action == '0' ? undefined : formState.id,
          parentId: tableState.dictNode.id,
        },
      });
      tableState.isModify = false;
      message.success(res.message);
      methods.searchQuery();
    } catch (error) {
      console.log('error', error);
      tableState.loading = false;
    }
  },
};
provide('interceptAction', methods.interceptAction);
watchEffect(() => maintainStore().leaveIntercept = tableState.isModify);
onBeforeRouteLeave(async (to, form, next) => {
  if(!tableState.isModify) return next();
  try {
    // 离开页面确认操作弹窗
    await methods.interceptAction(false);
    maintainStore().leaveIntercept = false;
    next();
  } catch {
    next(false);
  }
});
</script>

<style lang="less" scoped>
.dict-acion-handler-block {
  .cyber-iconfont {
    cursor: pointer;
    margin-right: 10px;
    &:last-child {
      margin-right: 0;
    }
  }
}
.dict-color-block {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  box-shadow: 3px 0 5px #00000014;
  border: 1px solid #d8d8d8;
  background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAIAAADZF8uwAAAAGUlEQVQYV2M4gwH+YwCGIasIUwhT25BVBADtzYNYrHvv4gAAAABJRU5ErkJggg==);
  & > div {
    width: 100%;
    height: 100%;
    border-radius: 50%;
  }
}
</style>
