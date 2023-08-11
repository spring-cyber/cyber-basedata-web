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
      <div class="grid grid-cols-2 gap-x-20px">
        <a-form-item label="类型" name="type">
          <c-select v-model:value="formState.type" :options="INDEX" placeholder="请选择类型"></c-select>
        </a-form-item>
        <a-form-item label="属性" name="columnCode">
          <c-select v-model:value="formState.columnCode" :options="modalState.columnList" :fieldNames="{ label: 'code', value: 'code' }" placeholder="请选择属性编码..."></c-select>
        </a-form-item>
        <a-form-item label="排序方式" name="sortord">
          <c-select v-model:value="formState.sortord" :options="INDEX_SORT_RULES" allowClear placeholder="请选择排序方式"></c-select>
        </a-form-item>
        <a-form-item label="存储结构" name="structure">
          <c-select v-model:value="formState.structure" :options="STRUCTURE" placeholder="请选择存储结构"></c-select>
        </a-form-item>
      </div>
      <a-form-item label="描述" name="description">
        <a-textarea v-model:value="formState.description" placeholder="请输入描述信息..." show-count :maxlength="120"></a-textarea>
      </a-form-item>
    </a-form>
  </c-modal>
</template>

<script setup>
import { required, useDict } from 'cyber-web-ui';
const { INDEX, INDEX_SORT_RULES, STRUCTURE } = useDict({ BASEDATA: ['INDEX', 'INDEX_SORT_RULES', 'STRUCTURE'] });
const formRef = ref(); // 表单ref
// 弹窗信息
const modalState = reactive({
  visible: false,
  currentIndex: -1, // 当前编辑数据的下标
  isCreate: computed(() => modalState.currentIndex == -1),
  title: computed(() => modalState.isCreate ? '新建索引' : '编辑索引'),
  okText: computed(() => modalState.isCreate ? '新建' : '确定'),
  detail: {},
  columnList: computed(() => {
    return (modalState.detail.columnList || []).filter(item => {
      let some = modalState.detail.indexList.some((citem, cindex) => {
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
  type: undefined,
  sortord: undefined,
  structure: undefined,
  description: undefined,
});
// 表单校验规则
const rules = {
  parentId: required(),
  name: required(),
  type: required(),
  columnCode: required(),
  sortord: required(),
  structure: required(),
};
const $emit = defineEmits(['ok']);
const methods = {
  async showModal(tableDetail, index) {
    let record = index == -1 ? {} : tableDetail.indexList[index];
    modalState.visible = true;
    modalState.detail = tableDetail;
    modalState.currentIndex = index;
    Object.keys(formState).forEach(key => {
      formState[key] = record?.[key];
    });
    nextTick(() => {
      unref(formRef).clearValidate();
    });
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
