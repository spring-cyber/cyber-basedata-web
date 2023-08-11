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
      <a-form-item label="名称" name="name">
        <a-input v-model:value="formState.name" placeholder="请输入字典分组名称..." show-count :maxlength="64"></a-input>
      </a-form-item>
      <a-form-item label="编码" name="code">
        <a-input v-model:value="formState.code" placeholder="请输入字典分组编码..." :disabled="!modalState.isCreate" show-count :maxlength="64"></a-input>
      </a-form-item>
      <a-form-item label="负责人" name="leader">
        <c-user-select v-model:value="formState.leader" v-if="modalState.visible" :productId="modalState.productId" placeholder="请选择负责人"></c-user-select>
      </a-form-item>
      <a-form-item label="描述" name="description">
        <a-textarea v-model:value="formState.description" placeholder="请输入描述信息..." show-count :maxlength="120"></a-textarea>
      </a-form-item>
    </a-form>
  </c-modal>
</template>

<script setup>
import axios, { queryDetail } from '@/api';
import { message } from 'ant-design-vue';
import { required, checkCode } from 'cyber-web-ui';
import { permissionStore } from '@/store';
const formRef = ref(); // 表单ref
// 弹窗信息
const modalState = reactive({
  visible: false,
  isCreate: true,
  title: computed(() => modalState.isCreate ? '新建主数据组' : '编辑主数据组'),
  okText: computed(() => modalState.isCreate ? '新建' : '确定'),
  productId: computed(() => {
    return permissionStore().sidebarRoutes.find(item => item.code == import.meta.env.VITE_PRODUCT_CODE)?.id;
  }),
});
// 表单信息
const formState = reactive({
  id: undefined,
  parentId: undefined,
  name: undefined,
  code: undefined,
  leader: undefined,
  type: undefined,
  description: undefined,
  version: undefined,
});
// 表单校验规则
const rules = {
  name: required(),
  code: [required(), checkCode()],
  leader: required(),
};
const $emit = defineEmits(['ok']);
const methods = {
  async showModal(record) {
    modalState.visible = true;
    modalState.isCreate = !record?.id;
    let detail = await queryDetail('/basedata/basedata', record);
    Object.keys(formState).forEach(key => {
      formState[key] = detail?.[key];
    });
    nextTick(unref(formRef).clearValidate);
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
