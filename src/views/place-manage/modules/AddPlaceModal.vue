<template>
  <c-modal
    ref="modalRef"
    v-model:visible="modalState.visible"
    width="1000px"
    title="新建地点"
    okText="新建"
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
      <div class="grid gap-x-20px" style="grid: auto / 260px auto;">
        <a-form-item label="地址类型" name="type">
          <c-select v-model:value="formState.type" :options="PLACE_TYPE"></c-select>
        </a-form-item>
        <a-form-item label="选择地址" name="area">
          <a-input :title="formState.area" :value="formState.area" placeholder="地址信息" disabled></a-input>
        </a-form-item>
        <a-form-item label="详细地址" name="address" class="col-span-2">
          <a-input v-model:value="formState.address" placeholder="详细地址"></a-input>
        </a-form-item>
        <div>
          <a-form-item label="地址经纬度" name="lon">
            <a-input :value="[formState.lon, formState.lat].filter(item => item).join('，')" placeholder="经度，纬度" disabled></a-input>
          </a-form-item>
          <a-form-item label="电子围栏" name="railType">
            <c-select v-model:value="formState.railType" allowClear placeholder="电子围栏" :options="RAIL_TYPE" @change="methods.railTypeChange"></c-select>
          </a-form-item>
          <a-form-item label="围栏公里数" name="railKm">
            <a-input-number class="w-1/1" :min="0" v-model:value="formState.railKm" placeholder="围栏公里数" :disabled="formState.railType != '0'" @change="methods.changeRailKm"></a-input-number>
          </a-form-item>
        </div>
        <a-form-item label="地址位置">
          <div ref="container" class="h-400px"></div>
        </a-form-item>
      </div>
    </a-form>
  </c-modal>
</template>

<script setup>
import axios from '@/api';
import { required, useDict, Modal } from 'cyber-web-ui';
import { message } from 'ant-design-vue';
import LocationActionImg from '@/assets/img/location2.svg';
import { watchEffect } from 'vue';
import Big from '@/utils/bigjs/big.js';
const props = defineProps({
  color: Object,
});
const container = ref();
let map = undefined;
const marker = new AMap.Marker({
  zIndex: 130,
  offset: new AMap.Pixel(-16, -32),
  icon: new AMap.Icon({
    image: LocationActionImg,
    imageSize: new AMap.Size(32, 32),
  }),
  position: [],
});
let covering = undefined;
let coverEditor = undefined;
const { PLACE_TYPE, RAIL_TYPE } = useDict({ BASEDATA: ['PLACE_TYPE', 'RAIL_TYPE'] });
const formRef = ref();
const modalState = reactive({
  visible: false,
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
  lon: required(),
};
const $emit = defineEmits(['ok', 'action', 'cancel']);
const methods = {
  showModal(center) {
    modalState.visible = true;
    Object.keys(formState).forEach(key => formState[key] = undefined);
    nextTick(() => {
      unref(formRef).clearValidate();
      methods.initMap(center);
    });
  },
  initMap({ lng, lat }) {
    map = new AMap.Map(container.value, {
      zoom: 19, //设置地图显示的缩放级别
      resizeEnable: true,
      center: [lng, lat], //设置地图中心点坐标
      mapStyle: 'amap://styles/normal',
    });
    
    // 点击地图触发
    map.on('click', function(ev) {
      let { lnglat } = ev;
      marker.setPosition([lnglat.lng, lnglat.lat]);
      map.add(marker);
      formState.lon = lnglat.lng;
      formState.lat = lnglat.lat;
      methods.removeCovering();
      map.setCenter([lnglat.lng, lnglat.lat]);
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
          formState.railLonLat = [];
          formState.railKm = undefined;
          formState.railType = undefined;
          unref(formRef).validate(['area', 'address', 'lon'])
        });
      });
    });
  },
  railTypeChange() {
    formState.railKm = undefined;
    formState.railLonLat = [];
    methods.addCovering();
  },
  // 添加覆盖物
  addCovering() {
    methods.removeCovering();
    let { lon, lat, railType, railKm = 0 } = formState;
    if(!railType || !lon || !lat || !map) return;
    AMap.plugin(['AMap.CircleEditor', 'AMap.RectangleEditor', 'AMap.PolygonEditor'], () => {
      // 圆形覆盖物
      if(railType == '0') {
        if(!railKm) formState.railKm = 40;
        covering = new AMap.Circle({
          center: [lon, lat],
          radius: formState.railKm / 2,
          zIndex: 100,
          strokeColor: props.color.border,
          fillColor: props.color.border,
          fillOpacity: props.color.opacity,
        });
        coverEditor = new AMap.CircleEditor(map, covering, {
          editOptions: {
            draggable: false,
          },
          movePoint: {
            draggable: false,
            zIndex: -100,
          },
        });
        coverEditor.on('adjust', (data) => {
          formState.railKm = data.radius * 2;
        });
      }
      // 矩形
      if(railType == '1') {
        let northeast = [new Big(lon).plus(0.0001).toNumber(), new Big(lat).plus(0.0001).toNumber()];
        let southwest = [new Big(lon).plus(-0.0001).toNumber(), new Big(lat).plus(-0.0001).toNumber()];
        covering = new AMap.Rectangle({
          bounds: new AMap.Bounds(northeast, southwest),
          zIndex: 100,
          strokeColor: props.color.border,
          fillColor: props.color.border,
          fillOpacity: props.color.opacity,
        });
        coverEditor = new AMap.RectangleEditor(map, covering);
      }
      // 多边形
      if(railType == '2') {
        let north = new Big(lon).plus(0.0001).toNumber();
        let west = new Big(lon).plus(-0.0001).toNumber();
        let south = new Big(lat).plus(-0.0001).toNumber();
        let east = new Big(lat).plus(0.0001).toNumber();
        let path = [[north, east], [north, south], [west, south], [west, east]];
        covering = new AMap.Polygon({
          path: path,
          zIndex: 100,
          strokeColor: props.color.border,
          fillColor: props.color.border,
          fillOpacity: props.color.opacity,
        });
        coverEditor = new AMap.PolygonEditor(map, covering);
      }
      if(!covering) return;
      map.add(covering);
      coverEditor.open();
    });
  },
  // 删除覆盖物
  removeCovering() {
    if(!covering) return;
    map && map.remove(covering);
    covering.destroy();
    covering = undefined;
    coverEditor && coverEditor.close();
  },
  changeRailKm(value) {
    methods.addCovering();
  },
  // 拦截弹窗
  interceptModal(content) {
    return new Promise((resolve, reject) => {
      Modal.confirm({
        title: `系统提示`,
        icon: 'cyber-tishi',
        content: content,
        okButtonProps: {
          danger: true,
        },
        onOk: resolve,
        onCancel: reject,
      });
    })
  },
  async onSubmit() {
    try {
      // 校验表单
      await unref(formRef).validate();
      let { lon, lat, railType, railKm, railLonLat = [] } = formState;
      railType = railType || typeof railType == 'number' ? railType : null;
      railKm = railKm || typeof railKm == 'number' ? railKm : null;
      if(/1|2/.test(railType)) {
        let target = coverEditor.getTarget();
        if(!target.contains([lon, lat])) await methods.interceptModal(`当前点坐标已不在电子围栏内，是否继续保存操作？`);
        let { bounds } = target.getOptions();
        if(/1/.test(railType)) {
          let { northEast, southWest } = bounds;
          railLonLat = [[northEast.lng, northEast.lat], [southWest.lng, southWest.lat]];
        } else if(/2/.test(railType)) {
          railLonLat = target.getPath();
        }
      }
      // 请求添加接口
      let res = await axios.request({
        url: '/basedata/place',
        method: 'post',
        data: {
          ...formState,
          area: undefined,
          railKm: railKm,
          railType: railType,
          railLonLat: railLonLat,
        }
      });
      message.success(res.message);
      $emit('ok', formState);
    } catch (error) {
      console.log('error', error);
      return Promise.reject();
    }
  },
};

watchEffect(() => {
  if(!modalState.visible && map) map.destroy();
});

defineExpose({
  showModal: methods.showModal,
});
</script>

<style lang="less" scoped>
</style>
