<template>
  <c-modal
    ref="modalRef"
    v-model:visible="modalState.visible"
    width="600px"
    :title="modalState.title"
    :okText="modalState.okText"
    @ok="methods.onSubmit"
  >
    <a-form
      ref="formRef"
      name="formName"
      :model="formState"
      :rules="rules"
      autocomplete="off"
      layout="vertical"
    >
      <div class="grid grid-cols-2 gap-x-20px">
        <a-form-item label="主数据组">
          <g-basedata-select type="0" disabled :value="modalState.detail?.parentId"/>
        </a-form-item>
        <a-form-item label="表格">
          <g-basedata-select type="1" disabled :parentId="modalState.detail?.parentId" :value="modalState.detail?.id"/>
        </a-form-item>
      </div>
      <a-form-item label="名称" name="name">
        <a-input v-model:value="formState.name" placeholder="请输入名称..." show-count :maxlength="64"></a-input>
      </a-form-item>
      <a-form-item label="属性" name="columnCode">
        <c-select v-model:value="formState.columnCode" :options="modalState.columnList" :fieldNames="{ label: 'code', value: 'code' }" placeholder="请选择属性编码..."></c-select>
      </a-form-item>
      <div class="grid grid-cols-2 gap-x-20px">
        <a-form-item label="外键表格" name="clTableCode">
          <c-select
            placeholder="请选择关联表格"
            :options="modalState.associationTable"
            :fieldNames="{ label: 'name', value: 'code' }"
            v-model:value="formState.clTableCode"
            allowClear
            @change="methods.changeAssociationTable"
          ></c-select>
        </a-form-item>
        <a-form-item label="外键属性" name="clColumnCode">
          <c-select
            v-model:value="formState.clColumnCode"
            :options="modalState.associateAttribute"
            placeholder="请选择关联属性"
            allowClear
            :fieldNames="{ label: 'name', value: 'code' }"
          ></c-select>
        </a-form-item>
        <a-form-item label="删除时" name="delete">
          <c-select v-model:value="formState.delete" :options="FOREIGN_KEY_ACTION" :fieldNames="{ label: 'code', value: 'code' }" placeholder="请选择属性编码..."></c-select>
        </a-form-item>
        <a-form-item label="更新时" name="update">
          <c-select v-model:value="formState.update" :options="FOREIGN_KEY_ACTION" :fieldNames="{ label: 'code', value: 'code' }" placeholder="请选择属性编码..."></c-select>
        </a-form-item>
      </div>
      <a-form-item label="描述" name="description">
        <a-textarea v-model:value="formState.description" placeholder="请输入描述信息..." show-count :maxlength="120"></a-textarea>
      </a-form-item>
    </a-form>
  </c-modal>
</template>

<script setup>
import axios from '@/api';
import { required, useDict, TRIGGER } from 'cyber-web-ui';
const { FOREIGN_KEY_ACTION } = useDict({ BASEDATA: ['FOREIGN_KEY_ACTION'] });
const formRef = ref(); // 表单ref
// 弹窗信息
const modalState = reactive({
  visible: false,
  currentIndex: -1, // 当前编辑数据的下标
  isCreate: computed(() => modalState.currentIndex == -1),
  title: computed(() => modalState.isCreate ? '新建外键索引' : '编辑外键索引'),
  okText: computed(() => modalState.isCreate ? '新建' : '确定'),
  detail: {},
  columnList: computed(() => {
    return (modalState.detail.columnList || []).filter(item => {
      let some = modalState.detail.fkList.some((citem, cindex) => {
        return citem.columnCode == item.code && cindex != modalState.currentIndex;
      });
      return !some;
    });
  }),
});
// 表单信息
const formState = reactive({
  id: undefined,
  name: undefined,
  columnCode: undefined,
  clTableCode: undefined,
  clColumnCode: undefined,
  delete: undefined,
  update: undefined,
  description: undefined,
});
// 表单校验规则
const rules = {
  parentId: required(),
  name: [required(), {
    validator: (rule, value, callback) => {
      let flag = modalState.detail.fkList?.length && modalState.detail.fkList.some((item, index) => {
        return item.name == value && index != modalState.currentIndex;
      });
      if(flag) return Promise.reject('名称不能重复！');
      return Promise.resolve();
    },
    trigger: TRIGGER,
  }],
  type: required(),
  columnCode: required(),
  sortord: required(),
  structure: required(),
};
const $emit = defineEmits(['ok']);
const methods = {
  async showModal(tableDetail, index) {
    let record = index == -1 ? {} : tableDetail.fkList[index];
    modalState.visible = true;
    modalState.detail = tableDetail;
    modalState.currentIndex = index;
    Object.keys(formState).forEach(key => {
      formState[key] = record?.[key];
    });
    methods.queryBaseGroup();
    nextTick(() => {
      unref(formRef).clearValidate();
    });
  },
  async queryBaseGroup() {
    try {
      let res = await axios.request({
        url: '/basedata/basedata/select',
        method: 'get',
        params: {
          parentId: modalState.detail.parentId,
        }
      });
      modalState.associationTable = (res.data || []).filter(item => item.id != modalState.detail.id);
    } catch {
      modalState.associationTable = [];
    }
  },
  changeAssociationTable() {
    formState.clColumnCode = undefined;
    methods.queryAssociateAttribute();
  },
  async queryAssociateAttribute() {
    if(!formState.clTableCode) return modalState.associateAttribute = [];
    try {
      let res = await axios.request({
        url: '/basedata/basedata/table/column',
        method: 'get',
        params: {
          tableCode: formState.clTableCode,
        }
      });
      modalState.associateAttribute = (res.data || []);
    } catch {
      modalState.associateAttribute = [];
    }
  },
  onSubmit() {
    return new Promise(async (resolve, reject) => {
      try {
        // 校验表单
        await unref(formRef).validate();
        $emit('ok', JSON.parse(JSON.stringify(formState)), modalState.currentIndex);
        resolve();
      } catch (error) {
        reject();
      }
    });
  },
};

defineExpose({
  showModal: methods.showModal,
});
</script>

<style lang="less" scoped>
</style>
