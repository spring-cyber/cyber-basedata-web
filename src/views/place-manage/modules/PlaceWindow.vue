<template>
  <div class="place-window-block">
    <div class="place-info-window">
      <div class="place-info-content">
        <div class="place-info-content-left">
          <div class="flex justify-between  text-14px" v-if="!placeState.isCreate">
            <span class="w-0 flex-1 mr-10px ellipsis font-600">{{ PLACE_TYPE_PARSE[info.type]?.name || info.type || '-' }}</span>
            <span class="text-[#666666]">{{ (info.updateTime || '').replace(/\s.+/, '') }}</span>
          </div>
          <div class="font-600" style="font-size: 16px;">{{ placeState.detail.address || '-' }}</div>
          <div class="flex justify-between text-[#666666]">
            <span class="ellipsis">
              【{{ info.lon }}，{{ info.lat }}】
              <span v-if="!placeState.isCreate">
                {{ RAIL_TYPE_PARSE[info.railType]?.name || info.railType || '-' }}
                <template v-if="info.railType == '0'">/ {{ info.railKm || '-' }}</template>
              </span>
            </span>
            <span v-if="!placeState.visible && !placeState.isCreate" class="place-edit-handler" @click="methods.showModal()">编辑</span>
          </div>
        </div>
        <div class="place-info-content-right" v-if="!placeState.visible && placeState.isCreate" @click="methods.showModal()">
          <div class="place-info-plus-icon">
            <Icon icon="cyber-plus" size="16px"></Icon>
          </div>
          <span>新增</span>
        </div>
      </div>
      <div class="place-info-sharp"></div>
    </div>
    <div class="place-form-window" v-if="placeState.visible">
      <a-form
        ref="formRef"
        name="placeForm"
        :model="formState"
        :rules="rules"
        autocomplete="off"
        labelAlign="right"
        :labelCol="{ style: { width: '75px' } }"
      >
        <a-form-item label="地址类型" name="type">
          <Select v-model:value="formState.type" :options="PLACE_TYPE"></Select>
        </a-form-item>
        <a-form-item label="选择地址" name="area">
          <a-input :title="formState.area" :value="formState.area" disabled></a-input>
        </a-form-item>
        <a-form-item label="详细地址" name="address">
          <a-input v-model:value="formState.address" placeholder="详细地址"></a-input>
        </a-form-item>
        <div class="grid gap-x-20px" style="grid: auto / auto calc((100% - 75px) / 2);">
          <a-form-item name="lon">
            <template #label>
              <span class="mr-6px">坐标</span>
              <Icon icon="cyber-dingwei" isSvg size="16" class="pointer" @click.stop.prevent="methods.handler('1')"></Icon>
            </template>
            <a-input :value="formState.lon" placeholder="经度" disabled></a-input>
          </a-form-item>
          <a-form-item label="" name="lat">
            <a-input :value="formState.lat" placeholder="纬度" disabled></a-input>
          </a-form-item>
          <a-form-item label="电子围栏" name="railType">
            <Select v-model:value="formState.railType" allowClear placeholder="电子围栏" :options="RAIL_TYPE" @change="methods.railTypeChange"></Select>
          </a-form-item>
          <a-form-item label="" name="railKm">
            <a-input-number class="w-1/1" :min="0" v-model:value="formState.railKm" placeholder="围栏公里数" :disabled="formState.railType != '0'" @change="methods.handler('3')"></a-input-number>
          </a-form-item>
        </div>
      </a-form>
      <div class="place-form-action">
        <div class="grid grid-flow-col gap-x-8px">
          <a-button type="primary" ghost :loading="placeState.loading" v-if="formState.railType && formState.lon" @click="methods.handler('2')">绘制</a-button>
          <a-button type="primary" ghost :loading="placeState.loading" @click="methods.onCancel">取消</a-button>
          <a-button type="primary" :loading="placeState.loading" @click="methods.onSubmit">确定</a-button>
        </div>
        <a-button v-if="!placeState.isCreate" type="primary" danger :loading="placeState.loading" @click="methods.handler('4', info)">删除</a-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { required, Select, Icon, checkLongitude, checkLatitude, useDict, parseDict } from 'cyber-web-ui';
import axios from '@/api';
import { message } from 'ant-design-vue';
const props = defineProps({
  type: {
    type: String,
    default: '0',
  },
  info: {
    type: Object,
    default: () => {},
  },
});
const { PLACE_TYPE, RAIL_TYPE } = useDict({ BASEDATA: ['PLACE_TYPE', 'RAIL_TYPE'] });
const { PLACE_TYPE_PARSE, RAIL_TYPE_PARSE } = parseDict({ BASEDATA: ['PLACE_TYPE', 'RAIL_TYPE'] });
const formRef = ref();
const placeState = reactive({
  visible: false,
  loading: false,
  isCreate: computed(() => !props.info?.id),
  detail: computed(() => {
    return {
      ...props.info,
      ...(placeState.isCreate ? formState : {}),
    };
  }),
});
const formState = reactive({
  id: undefined,
  area: undefined,
  type: undefined,
  address: undefined,
  lon: undefined,
  lat: undefined,
  railType: undefined,
  railKm: undefined,
  railLonLat: [],
});
const rules = {
  type: required(),
  address: required(),
  lon: [required(), checkLongitude()],
  lat: [required(), checkLatitude()],
};
const $emit = defineEmits(['ok', 'action', 'cancel']);
const methods = {
  showModal() {
    if(placeState.visible) return;
    placeState.visible = true;
    if(!placeState.isCreate || props.type == '1') {
      Object.keys(formState).forEach(key => {
        formState[key] = props.info[key];
      });
      AMap.plugin('AMap.Geocoder', () => {
        const geocoder = new AMap.Geocoder({
          city: '全国',
          extensions: 'base',
          radius: 100,
        });
        geocoder.getAddress(new AMap.LngLat(formState.lon, formState.lat), (status, result) => {
          if (status !== 'complete' || result.info !== 'OK') return;
          let { province, city, district, township } = result.regeocode?.addressComponent || {};
          formState.area = [province, city, district, township].filter(item => item).join('/');
        });
      });
    }
    if(!placeState.isCreate) {
      formState.type += '';
      formState.railType = typeof formState.railType == 'number' ? formState.railType + '' : formState.railType;
    }
    $emit('action', '0', {
      ...props.info,
      ...formState,
    });
  },
  async onSubmit() {
    placeState.loading = true;
    try {
      // 校验表单
      await unref(formRef).validate();
      let { railType, railKm, railLonLat } = formState;
      railType = railType || typeof railType == 'number' ? railType : null;
      railKm = railKm || typeof railKm == 'number' ? railKm : null;
      railLonLat = railLonLat ? railLonLat : [];
      // 请求添加/修改接口
      let res = await axios.request({
        url: '/basedata/place',
        method: placeState.isCreate ? 'post' : 'put',
        data: {
          ...formState,
          area: undefined,
          railKm: railKm,
          railType: railType,
          railLonLat: railLonLat,
        }
      });
      placeState.visible = false;
      message.success(res.message);
      $emit('ok', formState);
    } catch (error) {
      placeState.loading = false;
    }
  },
  onCancel() {
    placeState.visible = false;
    $emit('cancel');
  },
  handler(type = '0', record = formState) {
    $emit('action', type, record);
  },
  railTypeChange() {
    formState.railKm = undefined;
    formState.railLonLat = [];
    methods.handler('3');
  },
};
if(props.type == '1') {
  methods.showModal();
} else if(placeState.isCreate) {
  formState.lon = props.info.lon;
  formState.lat = props.info.lat;
  AMap.plugin('AMap.Geocoder', () => {
    const geocoder = new AMap.Geocoder({
      city: '全国',
      extensions: 'base',
      radius: 100,
    });
    geocoder.getAddress(new AMap.LngLat(formState.lon, formState.lat), (status, result) => {
      if (status !== 'complete' || result.info !== 'OK') return;
      let { province, city, district, township } = result.regeocode?.addressComponent || {};
      formState.area = [province, city, district, township].filter(item => item).join('/');
      formState.address = result.regeocode?.formattedAddress;
    });
  });
}
</script>

<style lang="less" scoped>
.place-window-block {
  width: 450px;
  position: relative;
  line-height: 1.5;
  .place-info-window {
    width: 100%;
    position: relative;
    padding-bottom: 8px;
    .place-info-content {
      background: #fff;
      padding: 18px 24px;
      line-height: 1.4;
      overflow: auto;
      box-shadow: 0 1px 5px rgba(0,0,0,.2);
      border-radius: @border-radius-base;
      display: flex;
      justify-content: space-between;
      .place-info-content-left {
        width: 0;
        flex: 1;
        height: 100%;
        & > * {
          margin-bottom: 8px;
          &:last-child {
            margin-bottom: 0;
          }
        }
        .place-edit-handler {
          color: @primary-color;
          cursor: pointer;
        }
      }
      .place-info-content-right {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        color: @primary-color;
        font-size: 14px;
        padding-left: 24px;
        border-left: 1px solid @border-color-base;
        cursor: pointer;
        .place-info-plus-icon {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid @primary-color;
          border-radius: 50%;
          margin-bottom: 8px;
        }
      }
    }
    .place-info-sharp {
      position: absolute;
      bottom: 0;
      left: 50%;
      border-top: 8px solid #fff;
      margin-left: -8px;
      border-left: 8px solid transparent;
      border-right: 8px solid transparent;
      &::after {
        position: absolute;
        content: "";
        margin-top: -7px;
        border-top: 8px solid rgba(0,0,0,.3);
        filter: blur(2px);
        z-index: -1;
        margin-left: -8px;
        border-left: 8px solid transparent;
        border-right: 8px solid transparent;
        display: block;
      }
    }
  }
  .place-form-window {
    position: absolute;
    width: 100%;
    min-height: 100px;
    margin-top: 5px;
    padding: 18px 24px;
    background-color: #FFFFFF;
    border-radius: @border-radius-base;
    box-shadow: 0 1px 5px rgba(0,0,0,.2);
    .place-form-action {
      display: flex;
      flex-direction: row-reverse;
      justify-content: space-between;
    }
  }
}
</style>
