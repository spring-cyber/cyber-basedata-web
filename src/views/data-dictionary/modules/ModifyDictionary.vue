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
        <a-form-item label="字典分组" name="parentId">
          <c-select v-model:value="formState.parentId" :disabled="modalState.isCreate && modalState.parentId" :options="modalState.dictionaryGroup" placeholder="请选择字典分组..." :fieldNames="{ label: 'name', value: 'id' }"></c-select>
        </a-form-item>
        <a-form-item label="字典名称" name="name">
          <a-input v-model:value="formState.name" placeholder="请输入字典名称" show-count :maxlength="32"></a-input>
        </a-form-item>
        <a-form-item label="编码" name="code">
          <a-input v-model:value="formState.code" placeholder="请输入字典编码..." :disabled="!modalState.isCreate" show-count :maxlength="64"></a-input>
        </a-form-item>
        <a-form-item label="显示顺序" name="orderNum">
          <a-input-number
            :min="0"
            :max="9999"
            class="w-150px"
            placeholder="请输入排序..."
            v-model:value="formState.orderNum"
          ></a-input-number>
        </a-form-item>
      </div>
      <a-form-item label="字典描述" name="description">
        <a-textarea v-model:value="formState.description" placeholder="请输入描述信息..." show-count :maxlength="120"></a-textarea>
      </a-form-item>
    </a-form>
  </c-modal>
</template>

<script setup>
import axios, { queryDetail } from '@/api';
import { message } from 'ant-design-vue';
import { required } from 'cyber-web-ui';
const formRef = ref(); // 表单ref
// 弹窗信息
const modalState = reactive({
  visible: false,
  isCreate: true,
  title: computed(() => modalState.isCreate ? '新建字典' : '编辑字典'),
  okText: computed(() => modalState.isCreate ? '新建' : '确定'),
  dictionaryGroup: [],
  parentId: undefined,
});
// 表单信息
const formState = reactive({
  id: undefined,
  parentId: undefined,
  name: undefined,
  code: undefined,
  orderNum: undefined,
  description: undefined,
  version: undefined,
});
// 表单校验规则
const rules = {
  parentId: required(),
  name: required(),
  code: required(),
  orderNum: required(),
};
const $emit = defineEmits(['ok']);
const methods = {
  async showModal(record, parentId) {
    modalState.visible = true;
    modalState.isCreate = !record?.id;
    let detail = await queryDetail('/basedata/dict', record);
    Object.keys(formState).forEach(key => {
      formState[key] = detail?.[key];
    });
    modalState.parentId = parentId;
    if(modalState.isCreate) {
      formState.orderNum = 1;
      formState.parentId = parentId;
    }
    methods.queryDictionaryGroup();
    nextTick(unref(formRef).clearValidate);
  },
  async queryDictionaryGroup() {
    modalState.dictionaryGroup = [];
    try {
      let res = await axios.request({
        url: '/basedata/dict/select',
        method: 'get',
        params: { type: '0' },
      });
      modalState.dictionaryGroup = res.data || [];
    } catch {}
  },
  onSubmit() {
    return new Promise(async (resolve, reject) => {
      try {
        // 校验表单
        await unref(formRef).validate();
        // 请求添加/修改接口
        let res = await axios.request({
          url: '/basedata/dict',
          method: modalState.isCreate ? 'post' : 'put',
          data: {
            ...formState,
            type: '1', // 字典类型
          }
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
