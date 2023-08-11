<template>
  <div class="place-list-body">
    <div class="place-list-header">
      <a-input
        v-model:value="queryState.address"
        placeholder="搜索地点"
        @keydown.enter="methods.searchQuery"
      >
        <template #suffix><c-icon icon="cyber-sousuo" size="16" color="#BDBDBD" /></template>
      </a-input>
      <a-dropdown v-model:visible="placeState.visible" trigger="click">
        <a-button type="primary" ghost>筛选</a-button>
        <template #overlay>
          <div class="place-type-filter">
            <span>地址类型</span>
            <div class="place-type-block">
              <div
                v-for="(item) in PLACE_TYPE"
                :key="item.code"
                :class="[{ 'active' : queryState.type == item.code }]"
                @click="methods.placeTypeChange(item)"
              >{{ item.name }}</div>
            </div>
            <div class="place-type-action">
              <span @click="placeState.visible = false">取消</span>
              <a @click="methods.searchQuery">确定</a>
            </div>
          </div>
        </template>
      </a-dropdown>
    </div>
    <div class="place-ul" ref="placeScrollRef">
      <div
        v-for="item in list"
        :key="item.id"
        :class="[
          'place-li',
          { 'place-li-hover': placeState.hoverId == item.id },
          { 'place-li-active': queryState.selected == item.id }
        ]"
        @click="methods.onLocation(item)"
        @mouseenter="methods.onMouseenter(item)"
        @mouseleave="methods.onMouseleave()"
      >
        <div class="place-info-block">
          <div class="flex justify-between">
            <span class="w-0 flex-1 ellipsis place-name" :title="item.address">{{ item.address || '-' }}</span>
            <span>{{ (item.updateTime || '').replace(/\s.*/, '') || '-' }}</span>
          </div>
          <div class="ellipsis" :title="PLACE_TYPE_PARSE[item.type]?.name || item.type">{{ PLACE_TYPE_PARSE[item.type]?.name || item.type || '-' }}</div>
          <div class="text-[#666666]">[{{ item.lon || '-' }}，{{ item.lat || '-' }}]</div>
          <div class="ellipsis text-[#666666]">
            {{ RAIL_TYPE_PARSE[item.railType]?.name || item.railType || '-' }}
            <template v-if="item.railType == '0'">/ {{ item.railKm ? item.railKm + ' 公里' : '-' }}</template>
          </div>
        </div>
        <div class="flex content-center w-16px">
          <a-dropdown
            v-if="placeState.hoverId == item.id"
            trigger="click"
            :getPopupContainer="e => e"
            @click.stop.prevent
          >
            <div>
              <c-icon icon="cyber-caozuo" size="16px" isSvg class="pointer"/>
            </div>
            <template #overlay>
              <a-menu class="w-120px pt-7px pb-7px">
                <a-menu-item @click="methods.onLocation(item)">定位</a-menu-item>
                <a-menu-item @click="methods.onEdit(item)">编辑</a-menu-item>
                <a-menu-item @click="methods.handler('delete', item)">删除</a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { changeHistoryState, initHistoryState, useDict, parseDict } from 'cyber-web-ui';
const props = defineProps({
  list: {
    type: Array,
    default: () => [],
  },
});
const placeScrollRef = ref();
const { PLACE_TYPE } = useDict({ BASEDATA: ['PLACE_TYPE'] });
const { PLACE_TYPE_PARSE, RAIL_TYPE_PARSE } = parseDict({ BASEDATA: ['PLACE_TYPE', 'RAIL_TYPE'] });
const placeState = reactive({
  hoverId: undefined,
  visible: false,
  firstRender: true,
});
const queryState = reactive({
  ...initHistoryState({
    type: undefined,
    address: undefined,
    selected: undefined,
  }),
});

const $emit = defineEmits(['change', 'search', 'location', 'delete']);
const methods = {
  // 定位
  onLocation(record) {
    if(queryState.selected == record.id) return;
    queryState.selected = record.id;
    queryState.hoverId = undefined;
    changeHistoryState(queryState);
    $emit('change', record);
    $emit('location', '0', record);
  },
  // 编辑
  onEdit(record) {
    if(queryState.selected == record.id) return;
    queryState.selected = record.id;
    queryState.hoverId = undefined;
    changeHistoryState(queryState);
    $emit('change', record);
    $emit('location', '1', record);
  },
  // 选中
  onSelect(record) {
    methods.onLocation(record);
    let index = props.list.findIndex(item => item.id == record.id);
    methods.scrollTo(index);
  },
  onMouseenter(record) {
    placeState.hoverId = record.id;
  },
  onMouseleave() {
    placeState.hoverId = undefined;
  },
  handler(type, record) {
    placeState.hoverId = undefined;
    $emit(type, record);
  },
  initSelected() {
    let { selected } = queryState;
    if(!props.list?.length) return;
    let index = props.list.findIndex(item => item.id == selected);
    if(index == -1) index = 0;
    let record = props.list[index];
    queryState.selected = record.id;
    methods.scrollTo(index);
    $emit('change', record);
    $emit('location', '0', record);
  },
  searchQuery() {
    placeState.visible = false;
    changeHistoryState(queryState);
    $emit('search', queryState);
  },
  placeTypeChange(record) {
    if(queryState.type != record.code) queryState.type = record.code;
    else queryState.type = undefined;
  },
  clearSelect() {
    queryState.selected = undefined;
    queryState.hoverId = undefined;
    changeHistoryState(queryState);
  },
  scrollTo(index) {
    nextTick(() => {
      let target = unref(placeScrollRef);
      if(index == -1 || target.scrollHeight == target.clientHeight) return;
      target.scrollTop = target.children[index].offsetTop;
    })
  },
};

watch(() => props.list, (value) => {
  if(value?.length && placeState.firstRender) {
    methods.initSelected();
    placeState.firstRender = false;
  }
}, { immediate: true });

defineExpose({
  onSelect: methods.onSelect,
  clearSelect: methods.clearSelect,
});
</script>

<style lang="less" scoped>
.place-type-filter {
  width: 388px;
  background-color: #FFFFFF;
  border-radius: @border-radius-base;
  padding: 22px 20px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid: auto / 50px auto;
  grid-gap: 10px;
  & > span {
    line-height: 32px;
  }
  .place-type-block {
    display: flex;
    flex-wrap: wrap;
    & > * {
      padding: 6px 12px;
      border: 1px solid #D9E2EB;
      margin-left: 10px;
      margin-bottom: 10px;
      cursor: pointer;
      &.active {
        border-color: @primary-color;
        background-color: #EDF9EB;
      }
    }
  }
  .place-type-action {
    grid-column: span 2 / span 2;
    display: flex;
    justify-content: flex-end;
    & > * {
      margin-left: 20px;
      cursor: pointer;
    }
  }
}
.place-list-body {
  width: 264px;
  background-color: #FFFFFF;
  border-radius: 4px;
  box-shadow: 0px 4px 10px 0px rgba(0, 0, 0, 0.06);
  .place-list-header {
    display: grid;
    grid-auto-flow: column;
    grid-column-gap: 20px;
    min-height: 56px;
    padding: 0 20px;
    border-bottom: 1px solid #EFF1F6;
    font-size: 14px;
    font-weight: 600;
    color: #2D3D48;
    display: flex;
    align-items: center;
  }
  .place-ul {
    width: 100%;
    height: 632px;
    overflow-y: auto;
    position: relative;
    .place-li {
      width: 100%;
      display: flex;
      align-items: center;
      cursor: pointer;
      justify-content: space-between;
      padding: 8px 20px 0;
      border-bottom: 1px solid #D9E2EB;
      .place-info-block {
        width: 0;
        flex: 1;
        & > * {
          margin-bottom: 6px;
          &:first-child {
            margin-top: 0;
          }
        }
      }
      &.place-li-hover,
      &.place-li-active {
        &::before {
          content: '';
        }
        background: hardlight(@primary-color, #FFFFFFe6);
      }
      &.place-li-active {
        .place-name {
          color: @primary-color;
        }
      }
    }
  }
}
</style>
