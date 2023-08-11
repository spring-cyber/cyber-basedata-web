import { defineComponent, reactive, computed } from 'vue';
import './g-rate.less';

export default defineComponent({
  name: 'CTreeBody',
  props: {
    value: [String, Number],
    count: {
      type: Number,
      default: 5,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    icon: {
      type: String,
      default: 'cyber-wujiaoxing1'
    },
    activeIcon: {
      type: String,
      default: 'cyber-wujiaoxing-2',
    }
  },
  setup(props, { attrs, slots, emit, expose }) {

    const rateState = reactive({
      value: 0,
      hoverIndex: 0,
      icon: computed(() => {
        return (index) => {
          let current = rateState.hoverIndex > 0 ? rateState.hoverIndex : rateState.value;
          return index <= current ? props.activeIcon : props.icon;
        }
      }),
    });

    function onMouseenter(index) {
      if(props.disabled) return;
      rateState.hoverIndex = index;
    }
    function onClick(index) {
      if(props.disabled) return;
      rateState.value = index;
      emit('update:value', rateState.value);
    }
    function onMouseleave() {
      rateState.hoverIndex = 0;
    }

    watchEffect(() => {
      rateState.value = props.value ? props.value * 1 : 0;
    });

    return () => {
      function starSlot() {
        let stars = [];
        for (let index = 0; index < props.count; index++) {
          stars.push(
            <c-icon
              icon={rateState.icon(index + 1)}
              isSvg
              size="16px"
              onMouseenter={() => onMouseenter(index + 1)}
              onClick={() => onClick(index + 1)}
            ></c-icon>
          );
        }
        return stars;
      }
      return (
        <div class={['g-rate', { 'g-rate-disabled': props.disabled }]} onMouseleave={onMouseleave}>
          { starSlot() }
        </div>
      )
    }
  }
});
