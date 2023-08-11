import { defineComponent, reactive, computed, onUnmounted } from 'vue';
import { Tree as ATree, Menu as AMenu, Dropdown as ADropdown, MenuItem as AMenuItem } from 'ant-design-vue';
import './g-tree.less';

export default defineComponent({
  name: 'GTree',
  props: {
    // 操作菜单
    overlayMenu: {
      type: Array,
      default: () => [],
    },
    highlight: {
      type: Object,
      default: () => {},
    }
  },
  setup(props, { attrs, slots, emit, expose }) {
    const treeState = reactive({
      highlight: {},
      hoverId: undefined,
      overlayMenu: computed(() => {
        return (record) => {
          return (props.overlayMenu || []).filter(item => disposeDropdownMent(item?.show, record, true));
        }
      })
    });

    function disposeDropdownMent(target, record, flag = false) {
      if(typeof target == 'boolean') return target;
      if(typeof target == 'function') return target(record);
      return flag;
    }
    function clickHandler() {
      treeState.hoverId = undefined;
    }

    document.addEventListener('click', clickHandler);
    onUnmounted(() => {
      document.removeEventListener('click', clickHandler);
    });

    return () => {
      const customSlots = {
        ...slots,
        title(record) {
          const dropdownSlots = {
            default() {
              return <div onClick={(e) => e.stopPropagation()}><c-icon icon="cyber-caozuo" size="16px" isSvg></c-icon></div>
            },
            overlay() {
              return (
                <AMenu class="w-120px pt-7px pb-7px" onMouseleave={() => treeState.hoverId = undefined}>
                  {
                    treeState.overlayMenu(record).map(item => {
                      return (
                        <AMenuItem
                          disabled={disposeDropdownMent(item?.disabled, record, false)}
                          onClick={() => item.handler?.(record)}
                        >{ typeof item.label == 'function' ? item.label(record) : item.label }</AMenuItem>
                      )
                    })
                  }
                </AMenu>
              )
            },
          }
          function tools() {
            if(treeState.hoverId != record.id) return;
            return (
              <ADropdown
                trigger="click"
                onMouseenter={() => treeState.hoverId = record.id}
                v-slots={dropdownSlots}
              ></ADropdown>
            )
          }
          return (
            <div class="g-tree-node" onMouseenter={() => treeState.hoverId = record.id}>
              <div
                class={[
                  'w-0 flex-1 ellipsis',
                  { 'g-tree-node-highlight': props.highlight?.[record.id] },
                ]}
                onMouseleave={() => treeState.hoverId = undefined}
              >
                { slots.title?.(record) }
              </div>
              <div class="w-16px h-16px">{ tools() }</div>
            </div>
          )
        }
      }
      return (
        <ATree
          block-node={true}
          height={600}
          class="g-tree"
          fieldNames={{ title: 'name', key: 'id' }}
          onClick={(e) => e.stopPropagation()}
          {...attrs}
          v-slots={customSlots}
        ></ATree>
      )
    }
  }
});
