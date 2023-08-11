<template>
  <c-modal
    ref="modalRef"
    v-model:visible="modalState.visible"
    width="1000px"
    title="定位"
    class="location-map-modal"
    @ok="methods.onSubmit"
  >
    <div ref="container" class="w-1/1 h-600px"></div>
  </c-modal>
</template>

<script setup>
import axios from '@/api';
import { message } from 'ant-design-vue';
import LocationImg from '@/assets/img/location.svg';
const container = ref();
// 弹窗信息
const modalState = reactive({
  visible: false,
  isReadonly: false,
});
let map = undefined; // 地图实例
let marker = {}; // 标记的点位

const $emit = defineEmits(['ok']);
const methods = {
  async showModal(record, isReadonly = false) {
    modalState.visible = true;
    modalState.isReadonly = isReadonly;
    nextTick(() => {
      methods.initMap(record);
    });
  },
  async initMap(record) {
    let { lon, lat } = await methods.getDefaultCoordinate(record);
    map = new AMap.Map(container.value, {
      zoom: 18, //设置地图显示的缩放级别
      resizeEnable: true,
      center: lon ? [lon, lat] : undefined, //设置地图中心点坐标
      mapStyle: 'amap://styles/normal',
    });
    
    if(lon && lat) {
      // 添加点标记
      marker = new AMap.Marker({
        position: [lon, lat],
        offset: new AMap.Pixel(-16, -32),
        icon: new AMap.Icon({
          image: LocationImg,
          imageSize: new AMap.Size(32, 32),
        }),
      });
      map.add(marker);
    }

    // 点击地图触发
    map.on('click', function(ev) {
      if(modalState.isReadonly) return;
      marker.setPosition([ev.lnglat.lng, ev.lnglat.lat]);
    });
  },
  async getDefaultCoordinate(record) {
    let { lon, lat, parentId } = (record || {});
    try {
      if(!lon || !lat) {
        if(parentId) {
          let { data = {} } = await axios.request({
            url: '/basedata/area',
            method: 'get',
            params: { id: parentId },
          });
          if(!data.lon || !data.lat) throw Error();
          lon = data.lon;
          lat = data.lat;
        } else {
          throw Error();
        }
      }
    } catch {
      lon = 116.397506;
      lat = 39.909209;
    }
    return { lon, lat };
  },
  async onSubmit() {
    if(modalState.isReadonly) return;
    return new Promise(async (resolve, reject) => {
      let position = marker?.getPosition?.();
      if(!position || !position.lat || !position.lng) {
        message.warning('请选择点位！');
        reject();
        return;
      }
      AMap.plugin('AMap.Geocoder', () => {
        const geocoder = new AMap.Geocoder({
          city: '全国',
          extensions: 'base',
          radius: 100,
        });
        geocoder.getAddress(new AMap.LngLat(position.lng, position.lat), (status, result) => {
          $emit('ok', { lon: position.lng, lat: position.lat, address: result?.regeocode?.formattedAddress });
          resolve();
        })
      });
    });
  },
};

watch(() => modalState.visible, (visible) => {
  if(!visible) map && map.destroy();
});

defineExpose({
  showModal: methods.showModal,
});
</script>

<style lang="less">
.location-map-modal {
  .ant-modal-body {
    padding: 0 2px !important;
  }
} 
</style>
