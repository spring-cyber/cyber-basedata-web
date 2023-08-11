<template>
  <div>
    <c-page-label title="地点管理" icon="cyber-didian" document-link="#地点管理">
      <template #tips>地点是用来创建保存详细地址信息及电子围栏等信息的地方。</template>
    </c-page-label>

    <div class="flex">
      <PlaceList
        ref="placeListRef"
        :list="placeState.list"
        @search="methods.onSearch"
        @change="methods.onChange"
        @location="methods.onLocation"
        @delete="methods.delete"
      ></PlaceList>
      <c-page-wrapper class="w-0 flex-1 ml-20px">
        <template #header>
          <c-collapse-form @search="methods.searchQuery">
            <span class="text-[#2D3D48] font-600">地点分布</span>
            <template #right>
              <a-button type="primary" @click="methods.showModify">新建</a-button>
            </template>
          </c-collapse-form>
        </template>
        <div class="place-map-container">
          <div ref="container" class="w-1/1 h-1/1"></div>
          <div class="place-search-block">
            <c-select
              v-model:value="placeState.searchValue"
              width="400px"
              allowClear
              showSearch
              :arrowTurn="false"
              placeholder="搜索地点..."
              :options="placeState.list"
              :fieldNames="{ label: 'address', value: 'id' }"
              @change="(value, option) => value && methods.onLocation('0', option)"
            >
              <template #suffixIcon><c-icon icon="cyber-sousuo" size="12" color="#BDBDBD" /></template>
            </c-select>
          </div>
          <div class="place-action-container" v-if="/[1,2]/.test(placeState.actionType)">
            <template v-if="placeState.actionType == '1'">
              <a-button type="primary" ghost @click="methods.onSave('0', false)">取消选点</a-button>
              <a-button type="primary" @click="methods.onSave('0')">确定选点</a-button>
            </template>
            <template v-if="placeState.actionType == '2'">
              <a-button type="primary" ghost :disabled="!!placeState.coverEditor" @click="methods.startDrawing()">开始绘制</a-button>
              <a-button type="primary" ghost @click="methods.onSave('1')">结束绘制</a-button>
            </template>
          </div>
        </div>
      </c-page-wrapper>
    </div>
    <AddPlaceModal ref="addPlaceRef" :color="color" @ok="methods.searchQuery()"></AddPlaceModal>
  </div>
</template>

<script setup>
import axios from '@/api';
import PlaceList from './modules/PlaceList.vue';
import LocationImg from '@/assets/img/location.svg';
import LocationActionImg from '@/assets/img/location2.svg';
import PlaceWindowVue from './modules/PlaceWindow.vue';
import { Modal, initHistoryState } from 'cyber-web-ui';
import Big from '@/utils/bigjs/big.js';
import { onBeforeRouteLeave } from 'vue-router';
import { watchEffect } from 'vue';
import { maintainStore } from '@/store';
import AddPlaceModal from './modules/AddPlaceModal.vue';
let map = undefined;
const container = ref();
const addPlaceRef = ref();
const placeListRef = ref();
let queryState = reactive({
  ...initHistoryState({
    type: undefined,
    address: undefined,
    selected: undefined,
  }),
});
// 海量标记
const massMarks = new AMap.MassMarks(null, {
  cursor: 'pointer',
  opacity: 1,
  zIndex: 120,
  zooms: [1, 20],	 // 在指定地图缩放级别范围内展示海量点图层
  style: {
    url: LocationImg,
    size: new AMap.Size(32, 32),      // 图标大小
    anchor: new AMap.Pixel(16, 32), // 图标显示位置偏移量，基准点为图标左上角
  }
});
// 覆盖物
const overlayGroup = new AMap.OverlayGroup([]);
const placeState = reactive({
  list: [],
  searchValue: undefined,
  // 编辑信息弹窗
  div: document.createElement('div'),
  app: undefined,
  info: undefined, // 未修改的数据
  detail: undefined, // 修改的数据
  actionType: undefined,
  isAction: false,
  // 编辑点标记
  marker: undefined,
  righClickPoint: undefined, // 右击点位
  // 编辑覆盖物
  covering: undefined, // 覆盖物
  // 绘制覆盖物
  coverEditor: undefined, // 编辑覆盖物实例
  // 拦截路由
  interceptRoute: false,
});
// 信息弹窗
const infoWindow = new AMap.InfoWindow({
  content: placeState.div,  //使用默认信息窗体框样式，显示信息内容
  isCustom: true,
  autoMove: true,
  anchor: 'bottom-center',
  offset: [0, -42],
});
// 右键菜单
const contextMenu = new AMap.ContextMenu();
contextMenu.addItem("新建地点", async () => {
  let { lnglat } = placeState.righClickPoint;
  try {
    await methods.interceptAction();
    methods.removeMarker();
    methods.removeCovering();
    methods.openInfoWindow('0', { lon: lnglat.lng, lat: lnglat.lat });
    methods.addMarker({ position: [lnglat.lng, lnglat.lat] });
  } catch {}
  contextMenu.close(map);
}, 0);
const color = {
  border: '#55D9DF',
  opacity: 0.2,
};

massMarks.on('click', async (event) => {
  await methods.interceptAction();
  const { data, target } = event;
  unref(placeListRef).onSelect(data);
});

const methods = reactive({
  async searchQuery() {
    try {
      maintainStore().loading = true;
      let res = await axios.request({
        url: '/basedata/place/select',
        method: 'get',
        params: {
          ...queryState,
          sortBy: 'create_time',
          sortType: 'desc',
        },
      });
      let overlayList = [];
      placeState.list = (res.data || []).map(item => {
        item.name = item.address;
        item.lnglat = [item.lon, item.lat].filter(item => item);
        try {
          // 绘制覆盖物
          if(item.railType == '0' && item.railKm) {
            overlayList.push(new AMap.Circle({
              ...item,
              center: item.lnglat,
              radius: item.railKm / 2,
            }));
          } else if(item.railType == '1' && item.railLonLat?.length == 2) {
            overlayList.push(new AMap.Rectangle({
              ...item,
              bounds: new AMap.Bounds(item.railLonLat[0], item.railLonLat[1]),
            }));
          } else if(item.railType == '2' && item.railLonLat?.length > 2) {
            overlayList.push(new AMap.Polygon({
              ...item,
              path: item.railLonLat,
            }));
          }
        } catch(error) {
          console.log('error', error);
        }
        return item;
      });
      // 添加标记
      massMarks.clear();
      massMarks.setData(placeState.list);
      // 添加覆盖物
      overlayGroup.clearOverlays();
      overlayGroup.addOverlays(overlayList);
      overlayGroup.setOptions({
        zIndex: 100,
        fillColor: '#05c059',
        fillOpacity: 0.1,
        strokeColor: '#05c059',
        bubble: true,
      });
      maintainStore().loading = false;
    } catch(e) {
      placeState.list = [];
      maintainStore().loading = false;
      throw Error(e);
    }
  },
  async initMap() {
    map = new AMap.Map(container.value, {
      zoom: 17.5, //设置地图显示的缩放级别
      resizeEnable: true,
      center: [116.397506, 39.909209], //设置地图中心点坐标
      mapStyle: 'amap://styles/normal',
    });
    map.add(overlayGroup);
    massMarks.setMap(map);
    
    // 点击地图触发
    map.on('click', function(ev) {
      let { lnglat } = ev;
      if(placeState.actionType) {
        // 修改点位坐标
        if(placeState.actionType == '1') {
          methods.markerHandler({ lon: lnglat.lng, lat: lnglat.lat });
          if(placeState.detail.railType == '0' && placeState.covering) {
            placeState.covering.setCenter([lnglat.lng, lnglat.lat]);
          }
        }
        return;
      }
      methods.removeMarker();
      methods.removeCovering();
      methods.closeInfoWindow();
    });
    map.on('rightclick', function(ev) {
      let { lnglat } = ev;
      placeState.righClickPoint = ev;
      contextMenu.open(map, [lnglat.lng, lnglat.lat]);
      if(placeState.actionType) return;
      methods.removeMarker();
      methods.removeCovering();
      methods.closeInfoWindow();
    });
  },
  /**
   * @function openInfoWindow 打开信息弹窗
   * @param {string} type 操作类型 0：查看地点详情 1：添加/修改弹窗
   * @param {object} info 当前地点的信息
   * @param {boolean} flag 是否更新当前点位信息
   */
  openInfoWindow(type = '0', info = {}, flag = false) {
    if(type == '0' || flag) placeState.info = JSON.parse(JSON.stringify(info));
    placeState.app && placeState.app.unmount(placeState.div);
    placeState.app = createApp(h(PlaceWindowVue, {
      type: type,
      info: info,
      onOk: async (record) => {
        methods.searchQuery();
        placeState.actionType = undefined;
        if(!record.id) methods.closeInfoWindow();
        else methods.openInfoWindow('0', record);
        methods.removeMarker();
        methods.removeCovering();
        placeState.interceptRoute = false;
      },
      onCancel: () => {
        if(placeState.info?.id) {
          methods.removeMarker();
          methods.openInfoWindow('0', placeState.info);
        } else {
          methods.showLayer();
        }
        methods.removeCovering();
        placeState.actionType = undefined;
        placeState.interceptRoute = false;
      },
      /**
       * @function 弹窗操作回调
       * @param {string} type 0：开始操作 1：重新定位 2：绘制电子围栏 3：更新电子围栏 4：删除
       * @param {object} record 操作项
       */
      onAction: (type = '0', record) => {
        // 删除
        if(type == '4') {
          methods.delete(record, false).then(() => methods.closeInfoWindow());
          return;
        }
        placeState.interceptRoute = true;
        placeState.actionType = type;
        placeState.detail = JSON.parse(JSON.stringify(record));
        // 开始操作
        if(type == '0') {
          methods.markerHandler(placeState.detail, false);
          methods.coveringHandler(record);
          methods.hideLayer();
          return;
        }
        if(type == '3') {
          methods.coveringHandler(record);
          return;
        }
        methods.closeInfoWindow(false);
      },
    }));
    placeState.app.mount(placeState.div);
    infoWindow.open(map, [info.lon, info.lat]);
  },
  // 关闭信息弹窗
  closeInfoWindow(clear = true) {
    if(clear) {
      placeState.isAction = false;
      placeState.actionType = undefined;
      unref(placeListRef).clearSelect();
    }
    infoWindow.close(map);
  },
  /**
   * @function markerHandler 点标记处理
   * @param {object} record { lon, lat }
   */
  markerHandler(record, closeEdit = true) {
    // 没有经纬度，清空点标记
    if(!record.lon || !record.lat) {
      methods.removeMarker(false);
      return;
    }
    // 修改点标记
    if(placeState.marker) {
      placeState.marker && placeState.marker.setPosition([record.lon, record.lat]);
      return;
    }
    methods.addMarker({ position: [record.lon, record.lat] }, closeEdit);
  },
  addMarker(options, closeEdit = true) {
    methods.removeMarker(closeEdit);
    placeState.marker = new AMap.Marker({
      zIndex: 130,
      offset: new AMap.Pixel(-16, -32),
      icon: new AMap.Icon({
        image: LocationActionImg,
        imageSize: new AMap.Size(32, 32),
      }),
      ...options,
    });
    map && map.add(placeState.marker);
    map && map.setCenter(options.position);
  },
  // 删除点标记
  removeMarker(closeEdit = true) {
    placeState.marker && map && map.remove(placeState.marker);
    placeState.marker = undefined;
    if(closeEdit) {
      methods.showLayer();
    }
  },
  // 显示覆盖物图层
  showLayer() {
    massMarks && massMarks.show();
    // overlayGroup && overlayGroup.show();
    let record = overlayGroup._overlays.find(item => item['_opts']?.id == placeState.info?.id);
    record && record.show();
  },
  // 隐藏覆盖物图层
  hideLayer() {
    massMarks && massMarks.hide();
    let record = overlayGroup._overlays.find(item => item['_opts']?.id == placeState.info?.id);
    record && record.hide();
  },
  // 处理覆盖物
  coveringHandler(record) {
    placeState.covering = methods.addCovering(record);
    placeState.covering && map && map.add(placeState.covering);
  },
  // 添加覆盖物
  addCovering(record = {}) {
    let { lon, lat, railType, railKm, railLonLat } = record || {};
    if(!railType || !lon || !lat || (!railKm && !railLonLat?.length)) {
      methods.removeCovering();
      return;
    }
    // 圆形覆盖物
    if(railType == '0') {
      if(placeState.covering) {
        placeState.covering.setRadius(railKm / 2);
        return placeState.covering;
      }
      return new AMap.Circle({
        center: [lon, lat],
        radius: railKm / 2,
        zIndex: 100,
        strokeColor: color.border,
        fillColor: color.border,
        fillOpacity: color.opacity,
      });
    }
    methods.removeCovering();
    // 矩形
    if(railType == '1') {
      if(railLonLat?.length != '2') return;
      return new AMap.Rectangle({
        bounds: new AMap.Bounds(railLonLat[0], railLonLat[1]),
        zIndex: 100,
        strokeColor: color.border,
        fillColor: color.border,
        fillOpacity: color.opacity,
      });
    }
    // 多边形
    if(railType == '2') {
      if(!railLonLat?.length) return;
      return new AMap.Polygon({
        path: railLonLat,
        zIndex: 100,
        strokeColor: color.border,
        fillColor: color.border,
        fillOpacity: color.opacity,
      });
    }
  },
  // 删除覆盖物
  removeCovering() {
    if(!placeState.covering) return;
    map && map.remove(placeState.covering);
    placeState.covering.destroy();
    placeState.covering = undefined;
    placeState.coverEditor && placeState.coverEditor.close();
  },
  // 开始绘制
  startDrawing() {
    if(!placeState.detail) return;
    let { lon, lat, railType } = placeState.detail;
    AMap.plugin(['AMap.CircleEditor', 'AMap.RectangleEditor', 'AMap.PolygonEditor'], () => {
      if(railType == '0') {
        if(!placeState.covering) {
          placeState.covering = methods.addCovering({ ...placeState.detail, railKm: 40 });
          if(!placeState.covering) return;
          placeState.covering && map && map.add(placeState.covering);
        }
        placeState.coverEditor = new AMap.CircleEditor(map, placeState.covering, {
          editOptions: {
            draggable: false,
          },
          movePoint: {
            draggable: false,
            zIndex: -100,
          },
        });
      } else if(railType == '1') {
        if(!placeState.covering) {
          let northeast = [new Big(lon).plus(0.0001).toNumber(), new Big(lat).plus(0.0001).toNumber()];
          let southwest = [new Big(lon).plus(-0.0001).toNumber(), new Big(lat).plus(-0.0001).toNumber()];
          placeState.covering = methods.addCovering({ ...placeState.detail, railLonLat: [northeast, southwest] });
          if(!placeState.covering) return;
          placeState.covering && map && map.add(placeState.covering);
        }
        placeState.coverEditor = new AMap.RectangleEditor(map, placeState.covering);
      } else if(railType == '2') {
        if(!placeState.covering) {
          let north = new Big(lon).plus(0.0001).toNumber();
          let west = new Big(lon).plus(-0.0001).toNumber();
          let south = new Big(lat).plus(-0.0001).toNumber();
          let east = new Big(lat).plus(0.0001).toNumber();
          let path = [[north, east], [north, south], [west, south], [west, east]];
          placeState.covering = methods.addCovering({ ...placeState.detail, railLonLat: path });
          if(!placeState.covering) return;
          placeState.covering && map && map.add(placeState.covering);
        }
        placeState.coverEditor = new AMap.PolygonEditor(map, placeState.covering);
      }
      placeState.coverEditor.open();
    });
  },
  /**
   * @function onSave 保存操作
   * @param {string} type 0：定位 1：绘制电子围栏
   * @param {boolean} flag 是否保存操作
   */
  async onSave(type, flag = true) {
    try {
      if(type == '0' && flag) {
        let { lng, lat } = placeState.marker.getPosition();
        if(placeState.detail.railType && placeState.detail.railType != '0') {
          await methods.interceptModal(`是否确定修改中心点，确定后将清除围栏信息！`);
          placeState.detail.railType = undefined;
          placeState.detail.railKm = undefined;
          placeState.detail.railLonLat = [];
        }
        placeState.detail.lon = lng;
        placeState.detail.lat = lat;
      }
      let { lon, lat } = placeState.detail;
      if(type == '1' && placeState.coverEditor && placeState.covering) {
        let target = placeState.coverEditor.getTarget();
        if(placeState.detail.railType == '0') {
          let radius = target.getRadius();
          placeState.detail.railKm = radius * 2;
          placeState.covering.setRadius(radius);
        } else if(placeState.detail.railType == '1') {
          if(!target.contains([lon, lat])) await methods.interceptModal(`当前点坐标已不在电子围栏内，是否继续保存操作？`);
          let { bounds } = target.getOptions();
          let { northEast, southWest } = bounds;
          placeState.detail.railLonLat = [[northEast.lng, northEast.lat], [southWest.lng, southWest.lat]];
          placeState.covering.setOptions({ bounds });
        } else if(placeState.detail.railType == '2') {
          if(target) {
            if(!target.contains([lon, lat])) await methods.interceptModal(`当前点坐标已不在电子围栏内，是否继续保存操作？`);
            let path = target.getPath();
            placeState.detail.railLonLat = path;
            placeState.covering.setOptions({ path: path });
          } else {
            placeState.detail.railLonLat = [];
            methods.removeCovering();
          }
        }
      }
      placeState.coverEditor && placeState.coverEditor.close();
      placeState.coverEditor = undefined;
      placeState.actionType = '0';
      methods.openInfoWindow('1', placeState.detail);
      map && map.setCenter([placeState.detail.lon, placeState.detail.lat]);
    } catch (error) {
      throw Error(error);
    }
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
  // 拦截操作
  async interceptAction() {
    if(!placeState.actionType) return;
    try {
      await methods.interceptModal(`当前有地点正在进行${placeState.detail?.id ? '添加' : '修改'}操作，是否接着进行当前操作？确定后将不保存之前的操作!`);
      methods.closeInfoWindow();
    } catch {
      return Promise.reject();
    }
  },
  onChange(record = {}) {},
  // 搜索回调
  onSearch(query) {
    queryState = query;
    methods.searchQuery();
  },
  // 定位回调
  async onLocation(type, record) {
    try {
      await methods.interceptAction();
    } catch {
      return Promise.reject();
    }
    methods.removeMarker();
    methods.removeCovering();
    methods.openInfoWindow(type, record, true);
    map.setCenter([record.lon, record.lat]);
  },
  // 删除
  async delete(record, intercept = true) {
    if(intercept) {
      try {
        await methods.interceptAction();
      } catch {
        return Promise.reject();
      }
    }
    return new Promise((resolve, reject) => {
      Modal.verify({
        content: `是否确认删除“${record.address}”地点？`,
        value: record.address,
        params: {
          url: '/basedata/place',
          method: 'delete',
          params: {
            id: record.id,
          }
        },
      }).then(() => {
        methods.removeMarker();
        methods.removeCovering();
        methods.searchQuery(record);
        maintainStore().leaveIntercept = false;
        resolve();
      }).catch(() => {
        reject();
      });
    });
  },
  showModify() {
    unref(addPlaceRef).showModal(map.getCenter());
  },
});

methods.searchQuery();
onMounted(() => methods.initMap());
onUnmounted(() => map && map.destroy());

watchEffect(() => {
  maintainStore().leaveIntercept = placeState.interceptRoute;
});

onBeforeRouteLeave(async (to, form, next) => {
  if(!placeState.interceptRoute) return next();
  try {
    // 离开页面确认操作弹窗
    await methods.interceptAction();
    maintainStore().leaveIntercept = false;
    next();
  } catch {
    next(false);
  }
});
</script>

<style lang="less" scoped>
.place-search-block {
  position: absolute;
  top: 20px;
  left: 20px;
}
.place-map-container {
  position: relative;
  height: 632px;
  .place-action-container {
    position: absolute;
    bottom: 16px;
    right: 16px;
    padding: 8px 12px;
    border-radius: @border-radius-base;
    background-color: #FFFFFF;
    box-shadow: 0px 4px 10px 0px rgba(0, 0, 0, 0.06);
    display: grid;
    grid-auto-flow: row;
    grid-row-gap: 10px;
  }
}
</style>
