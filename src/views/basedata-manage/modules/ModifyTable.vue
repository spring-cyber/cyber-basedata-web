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
      <a-form-item label="主数据组" name="parentId">
        <c-select v-model:value="formState.parentId" :disabled="!!modalState.parentId" :options="modalState.basedataGroup" :fieldNames="{ label: 'name', value: 'id' }" placeholder="请选择主数据组"></c-select>
      </a-form-item>
      <a-form-item label="表格名称" name="name">
        <a-input v-model:value="formState.name" placeholder="请输入字典分组名称..." show-count :maxlength="32"></a-input>
      </a-form-item>
      <a-form-item label="表格编码" name="code">
        <a-input v-model:value="formState.code" placeholder="请输入字典分组编码..." :disabled="!modalState.isCreate" show-count :maxlength="32"></a-input>
      </a-form-item>
      <div class="grid grid-cols-2 gap-x-20px">
        <a-form-item label="排序规则" name="collation">
          <c-select v-model:value="formState.collation" :options="COLLATION" placeholder="请选择排序规则"></c-select>
        </a-form-item>
        <a-form-item label="存储引擎" name="engine">
          <c-select v-model:value="formState.engine" :options="ENGINE" placeholder="请选择存储引擎"></c-select>
        </a-form-item>
      </div>
      <a-form-item label="表格描述" name="description">
        <a-textarea v-model:value="formState.description" placeholder="请输入描述信息..." show-count :maxlength="120"></a-textarea>
      </a-form-item>
    </a-form>
  </c-modal>
</template>

<script setup>
import axios, { queryDetail } from '@/api';
import { message } from 'ant-design-vue';
import { required, checkCode, useDict } from 'cyber-web-ui';
const { COLLATION, ENGINE } = useDict({ BASEDATA: ['COLLATION', 'ENGINE'] });
const formRef = ref(); // 表单ref
// 弹窗信息
const modalState = reactive({
  visible: false,
  isCreate: true,
  title: computed(() => modalState.isCreate ? '新建表格' : '编辑表格'),
  okText: computed(() => modalState.isCreate ? '新建' : '确定'),
  basedataGroup: [],
  parentId: undefined,
});
// 表单信息
const formState = reactive({
  id: undefined,
  parentId: undefined,
  name: undefined,
  code: undefined,
  type: undefined,
  engine: undefined,
  collation: undefined,
  description: undefined,
  version: undefined,
});
// 表单校验规则
const rules = {
  parentId: required(),
  name: required(),
  code: [required(), checkCode()],
  engine: required(),
  collation: required(),
};
const $emit = defineEmits(['ok']);
const methods = {
  async showModal(record, parentId) {
    modalState.visible = true;
    modalState.isCreate = !record?.id;
    modalState.parentId = parentId;
    let detail = await queryDetail('/basedata/basedata', record);
    Object.keys(formState).forEach(key => {
      formState[key] = detail?.[key];
    });
    if(modalState.isCreate) {
      formState.parentId = parentId;
    }
    methods.queryBasedataGroup();
    nextTick(unref(formRef).clearValidate);
  },
  async queryBasedataGroup() {
    try {
      let res = await axios.request({
        url: '/basedata/basedata/select',
        method: 'get',
        params: {
          type: '0',
        },
      });
      modalState.basedataGroup = res.data || [];
    } catch {
      modalState.basedataGroup = [];
    }
  },
  onSubmit() {
    return new Promise(async (resolve, reject) => {
      try {
        // 校验表单
        await unref(formRef).validate();
        // 请求添加/修改接口
        let res = await axios.request({
          url: '/basedata/basedata',
          method: modalState.isCreate ? 'post' : 'put',
          data: formState,
        });
        message.success(res.message);
        $emit('ok');
        resolve();
      } catch (error) {
        console.log('error', error);
        reject();
      }
    })
  },
};

defineExpose({
  showModal: methods.showModal,
});
</script>

<style lang="less" scoped>
</style>
