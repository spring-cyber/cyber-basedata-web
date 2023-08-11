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
          <g-basedata-select v-if="modalState.visible" type="0" disabled :value="modalState.detail?.parentId"/>
        </a-form-item>
        <a-form-item label="表格">
          <g-basedata-select type="1" disabled :parentId="modalState.detail?.parentId" :value="modalState.detail?.id"/>
        </a-form-item>
        <a-form-item label="属性" name="code">
          <a-input v-model:value="formState.code" placeholder="请输入属性编码..." show-count :maxlength="64"></a-input>
        </a-form-item>
        <a-form-item label="名称" name="name">
          <a-input v-model:value="formState.name" placeholder="请输入属性名称..." show-count :maxlength="64"></a-input>
        </a-form-item>
        <a-form-item label="类型" name="type">
          <c-select v-model:value="formState.type" :options="DATA_TYPE" placeholder="请选择属性类型" @change="methods.onTypeChange"></c-select>
        </a-form-item>
        <a-form-item label="长度" name="length">
          <a-input-number
            class="w-1/1"
            :min="1"
            :max="999"
            :disabled="modalState.disabledLength"
            v-model:value="formState.length"
            placeholder="请输入长度"
          ></a-input-number>
        </a-form-item>
        <a-form-item label="关联表格" name="clTableCode">
          <c-select
            placeholder="请选择关联表格"
            :options="modalState.associationTable"
            :fieldNames="{ label: 'name', value: 'code' }"
            v-model:value="formState.clTableCode"
            allowClear
            @change="methods.changeAssociationTable"
          ></c-select>
        </a-form-item>
        <a-form-item label="关联属性" name="clColumnCode" extra="类型不同或长度不同时，有可能造成数据丢失">
          <c-select
            v-model:value="formState.clColumnCode"
            :options="modalState.associateAttribute"
            placeholder="请选择关联属性"
            allowClear
            :fieldNames="{ label: 'name', value: 'code' }"
          ></c-select>
        </a-form-item>
      </div>
      <div class="switch-block">
        <a-form-item label="其他约束" name="primaryKey">
          <g-check-switch v-model:checked="formState.primaryKey" :disabled="modalState.disabledPrimaryKey">Primary Key（主键）</g-check-switch>
        </a-form-item>
        <a-form-item label=" " name="autoIncrement">
          <div class="flex">
            <g-check-switch
              v-model:checked="formState.autoIncrement"
              :disabled="modalState.disabledAutoIncrement || !/int/.test(formState.type)"
            >Auto Increment（自增）</g-check-switch>
            <a-input
              class="w-32px"
              size="small"
              :min="0"
              :disabled="modalState.disabledAutoIncrement || !/int/.test(formState.type)"
              v-model:value="formState.autoIncrementVal"
            ></a-input>
          </div>
        </a-form-item>
        <a-form-item label=" " name="notNull">
          <g-check-switch v-model:checked="formState.notNull">Not Null（非空约束）</g-check-switch>
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
import { required, checkCode, useDict, TRIGGER } from 'cyber-web-ui';
const { DATA_TYPE } = useDict({ BASEDATA: ['DATA_TYPE'] });
const formRef = ref(); // 表单ref
// 弹窗信息
const modalState = reactive({
  visible: false,
  currentIndex: -1, // 当前编辑数据的下标
  disabledPrimaryKey: false, // 禁用主键
  disabledAutoIncrement: false, // 禁用自增
  isCreate: computed(() => modalState.currentIndex == -1),
  title: computed(() => modalState.isCreate ? '新建属性' : '编辑属性'),
  okText: computed(() => modalState.isCreate ? '新建' : '确定'),
  disabledLength: computed(() => /date|time|boolean/.test(formState.type)),
  detail: {},
});
// 表单信息
const formState = reactive({
  id: undefined,
  name: undefined,
  code: undefined,
  type: undefined,
  length: undefined,
  clTableCode: undefined,
  clColumnCode: undefined,
  primaryKey: '0',
  autoIncrement: '0',
  notNull: '0',
  description: undefined,
  autoIncrementVal: undefined,
});
// 表单校验规则
const rules = reactive({
  name: required(),
  code: [required(), checkCode(), {
    validator: (rule, value, callback) => {
      let flag = modalState.detail.columnList?.length && modalState.detail.columnList.some((item, index) => {
        return item.code == value && index != modalState.currentIndex;
      });
      if(flag) return Promise.reject('属性不能重复！');
      return Promise.resolve();
    },
    trigger: TRIGGER,
  }],
  type: required(),
  length: computed(() => modalState.disabledLength ? undefined : required()),
  clTableCode: computed(() => formState.clTableCode ? required() : undefined),
  clColumnCode: computed(() => formState.clTableCode ? required() : undefined),
});
const $emit = defineEmits(['ok']);
const methods = {
  async showModal(tableDetail, index) {
    let record = index == -1 ? {} : tableDetail.columnList[index];
    modalState.visible = true;
    modalState.detail = tableDetail;
    modalState.currentIndex = index;
    Object.keys(formState).forEach(key => {
      formState[key] = record?.[key];
    });
    methods.initFormState();
    methods.queryBaseTable();
    methods.queryAssociateAttribute();
    nextTick(() => {
      unref(formRef).clearValidate();
    });
  },
  initFormState() {
    modalState.disabledPrimaryKey = false;
    modalState.disabledAutoIncrement = false;
    (modalState.detail?.columnList || []).forEach((item, index) => {
      if(item.primaryKey == '1') {
        modalState.disabledPrimaryKey = index != modalState.currentIndex;
      }
      if(item.autoIncrement == '1') {
        modalState.disabledAutoIncrement = index != modalState.currentIndex;
      }
    });
    if(modalState.disabledPrimaryKey) formState.primaryKey = '0';
    if(formState.autoIncrement == '1') {
      formState.autoIncrementVal = modalState.detail.autoIncrementVal;
    } else {
      formState.autoIncrement = '0';
    }
    if(formState.notNull != '1') formState.notNull = '0';
  },
  async queryBaseTable() {
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
    if(!formState.clTableCode) {
      unref(formRef)?.clearValidate?.(['clColumnCode']);
      modalState.associateAttribute = [];
      return;
    }
    try {
      let res = await axios.request({
        url: '/basedata/basedata/table/column',
        method: 'get',
        params: {
          tableCode: formState.clTableCode,
          sortBy: 'order_num',
          sortType: 'asc',
        }
      });
      modalState.associateAttribute = (res.data || []);
    } catch {
      modalState.associateAttribute = [];
    }
  },
  onTypeChange() {
    formState.autoIncrement = '0';
    formState.autoIncrementVal = undefined;
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
.switch-block {
  display: flex;
  align-items: center;
  justify-content: space-between;
  & > * {
    margin-left: 20px;
    &:first-child {
      margin-left: 0;
    }
  }
}
</style>
