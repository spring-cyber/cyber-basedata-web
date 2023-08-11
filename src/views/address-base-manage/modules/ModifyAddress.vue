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
      autocomplete="off" layout="vertical"
    >
      <a-form-item label="所在地" name="parentId">
        <c-area-tree-select v-if="modalState.visible" level="4" v-model:value="formState.parentId" :disabled="!!(modalState.isCreate && modalState.parentId)" />
      </a-form-item>
      <a-form-item label="邮政编码" name="zipCode">
        <a-input v-model:value="formState.zipCode" placeholder="请输入邮政编码..."></a-input>
      </a-form-item>
      <a-form-item label="详细地址" name="name">
        <a-input v-model:value="formState.name" placeholder="请输入详细地址...">
          <template #suffix>
            <c-icon icon="cyber-dingwei" isSvg size="16" class="pointer" @click="() => locationRef.showModal?.(formState)"></c-icon>
          </template>
        </a-input>
      </a-form-item>
      <div class="grid grid-cols-2 gap-x-20px">
        <a-form-item label="地址经纬度" name="lon">
          <a-input :value="modalState.coordinates" disabled placeholder="经度，纬度"></a-input>
        </a-form-item>
        <a-form-item label="地址准确度" name="accuracy">
          <g-rate v-model:value="formState.accuracy"></g-rate>
        </a-form-item>
      </div>
    </a-form>
  </c-modal>
  <LocationMap ref="locationRef" @ok="methods.setPosition"></LocationMap>
</template>

<script setup>
import axios, { queryDetail } from '@/api';
import { message } from 'ant-design-vue';
import { required } from 'cyber-web-ui';
import pinyin from 'pinyin';
import LocationMap from './LocationMap.vue';
const formRef = ref(); // 表单ref
const locationRef = ref();
// 弹窗信息
const modalState = reactive({
  visible: false,
  isCreate: true,
  title: computed(() => modalState.isCreate ? '新建地址' : '编辑地址'),
  okText: computed(() => modalState.isCreate ? '新建' : '确定'),
  coordinates: computed(() => {
    if(!formState.lon || !formState.lat) return;
    return `${formState.lon}, ${formState.lat}`;
  }),
  parentId: undefined,
});
// 表单信息
const formState = reactive({
  id: undefined,
  parentId: undefined,
  level: undefined,
  name: undefined,
  accuracy: undefined,
  wholeName: undefined,
  lon: undefined,
  lat: undefined,
  zipCode: undefined,
  pinYin: undefined, // 名称全拼
  simplePy: undefined, // 首字母简拼
  perPinYin: undefined, // 拼音的第一个字母
});
// 表单校验规则
const rules = {
  parentId: required(),
  name: required(),
  zipCode: required(),
};
const $emit = defineEmits(['ok']);
const methods = {
  async showModal(record) {
    modalState.visible = true;
    modalState.isCreate = !record?.id;
    modalState.parentId = record?.parentId;
    let detail = await queryDetail('/basedata/area', record);
    Object.keys(formState).forEach(key => {
      formState[key] = detail[key];
    });
    if(modalState.isCreate) formState.accuracy = 5;
    nextTick(unref(formRef)?.clearValidate);
  },
  setPosition({ lon, lat, address }) {
    formState.lon = lon;
    formState.lat = lat;
    formState.name = address;
  },
  onSubmit() {
    return new Promise(async (resolve, reject) => {
      try {
        // 校验表单
        await unref(formRef).validate();
        let wholeName = '';
        try {
          if(formState.parentId && formState.parentId != '0') {
            let parentRes = await queryDetail('/basedata/area', { id: formState.parentId });
            wholeName = `${parentRes.wholeName}，${formState.name}`;
          } else {
            wholeName = formState.name;
          }
        } catch(error) {
          wholeName = formState.name;
        }
        let simplePy = '';
        let perPinYin = '';
        let pinYin = (pinyin(formState.name, { style: 'normal', compact: true })?.[0] || []).map((str, index) => {
          if(!str) return;
          let first = str.slice(0, 1).toUpperCase();
          if(first) simplePy += first;
          if(index == 0) perPinYin = first;
          return first + str.slice(1);
        }).filter(item => item).join('');
        // 请求添加/修改接口
        let res = await axios.request({
          url: '/basedata/area',
          method: modalState.isCreate ? 'post' : 'put',
          data: {
            ...formState,
            wholeName,
            level: '5',
            simplePy: simplePy,
            perPinYin: perPinYin,
            pinYin: pinYin,
          }
        });
        message.success(res.message);
        $emit('ok', { id: formState.id, parentId: formState.parentId || '0', level: formState.level });
        resolve();
      } catch (error) {
        console.log('error', error);
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
