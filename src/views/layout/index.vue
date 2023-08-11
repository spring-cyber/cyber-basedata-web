<template>
  <c-layout :logo="Logo">
    <template #left>
      <div :class="['control-panel', { 'active': $useRoute.path == '/control-panel' }]" @click="toControlPanel">
        <c-icon icon="cyber-bumen" size="14" class="mr-8px"></c-icon>
        <span>控制台</span>
      </div>
    </template>
  </c-layout>
  <c-login-mask :logo="Logo2"></c-login-mask>
</template>

<script setup>
import Logo from '@/assets/img/logo/twins_white.svg';
import Logo2 from '@/assets/img/logo/twins.svg';

const $useRoute = useRoute();
const $useRouter = useRouter();

function toControlPanel() {
  $useRouter.push('/control-panel');
}

</script>

<style lang="less" scoped>
.control-panel {
  margin-left: 30px;
  color: #2D3D48;
  cursor: pointer;
  &.active {
    color: #FFFFFF;
  }
}
</style>