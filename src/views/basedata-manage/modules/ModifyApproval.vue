<template>
  <c-modal
    ref="modalRef"
    v-model:visible="modalState.visible"
    width="600px"
    :title="modalState.title"
    okText="提交"
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
        <a-form-item label="修改人" name="creator">
          <a-input :value="formState.creator" disabled></a-input>
        </a-form-item>
        <a-form-item label="修改时间">
          <a-input :value="formState.createTime" disabled></a-input>
        </a-form-item>
      </div>
      <a-form-item label="修改脚本" name="changeSql">
        <a-textarea
          :value="formState.changeSql"
          placeholder="显示脚本内容"
          :autoSize="{ minRows: 10, maxRows: 10 }"
          @focus="e => e.target.blur()"
        ></a-textarea>
      </a-form-item>
      <a-form-item label="审批意见" name="status">
        <a-radio-group v-model:value="formState.status" name="radioGroup">
          <a-radio value="1">通过</a-radio>
          <a-radio value="2">驳回</a-radio>
        </a-radio-group>
      </a-form-item>
      <a-form-item v-if="formState.status == '2'" label="驳回原因" name="cause">
        <a-textarea
          v-model:value="formState.cause"
          placeholder="请输入驳回原因"
          show-count
          :maxlength="120"
          :autoSize="{ minRows: 5, maxRows: 5 }"
        ></a-textarea>
      </a-form-item>
    </a-form>
  </c-modal>
</template>

<script setup>
import axios, { queryDetail } from '@/api';
import { required } from 'cyber-web-ui';
import { permissionStore } from '@/store';
import { message } from 'ant-design-vue';
const formRef = ref(); // 表单ref
// 弹窗信息
const modalState = reactive({
  visible: false,
  isCreate: false,
  title: computed(() => modalState.isCreate ? '新建属性' : '编辑属性'),
  productId: computed(() => {
    return permissionStore().sidebarRoutes.find(item => item.code == import.meta.env.VITE_PRODUCT_CODE)?.id;
  }),
  detail: {},
});
// 表单信息
const formState = reactive({
  id: undefined,
  createTime: undefined,
  creator: undefined,
  changeSql: undefined,
  status: undefined,
  cause: undefined,
});
// 表单校验规则
const rules = {
  cause: required(),
};
const $emit = defineEmits(['ok']);
const methods = {
  async showModal(record, node) {
    modalState.visible = true;
    modalState.isCreate = record.status == '0';
    modalState.detail = node;
    let detail = await queryDetail('/basedata/basedata/approvallog', record);
    Object.keys(formState).forEach(key => {
      formState[key] = detail?.[key];
    });
    if(formState.status == '0') formState.status = '1';
    else formState.status += '';
    nextTick(() => {
      unref(formRef).clearValidate();
    });
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
        // 请求添加/修改接口
        let res = await axios.request({
          url: '/basedata/basedata/approvallog',
          method: 'put',
          data: {
            id: formState.id,
            status: formState.status,
            cause: formState.status == '2' ? formState.cause || '' : '',
          },
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
