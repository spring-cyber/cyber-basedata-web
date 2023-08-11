<template>
  <c-page-wrapper>
    <template #header>
      <c-collapse-form>
        <span class="text-[#2D3D48]">主数据组名称 / 表名称</span>
        <template #right>
          <a-button type="primary">编辑</a-button>
          <a-button type="primary" danger>删除</a-button>
          <a-button type="primary" ghost>取消</a-button>
          <a-button type="primary">保存</a-button>
        </template>
      </c-collapse-form>
    </template>

    <div style="padding: 24px 18px 24px 46px;">
      <g-module-title>主数据组</g-module-title>
      <div class="grid grid-cols-3">
        <data-item label="主题名称">主题中文名称</data-item>
        <data-item label="主题编码">主题中文名称</data-item>
        <data-item label="负责人">主题中文名称</data-item>
      </div>
      <g-module-title>表格定义</g-module-title>
      <div class="grid grid-cols-3">
        <data-item label="表格名称">主题中文名称</data-item>
        <data-item label="表格编码">主题中文名称</data-item>
        <data-item label="排序规则">主题中文名称</data-item>
        <data-item label="存储引擎">主题中文名称</data-item>
        <data-item label="表格描述" class="col-span-2">主题中文名称主题中文名称主题中文名称主题中文名称主题中文名称主题中文名称</data-item>
      </div>
      <g-module-title>属性定义</g-module-title>
      
      <g-module-title>索引定义</g-module-title>

      <g-module-title>数据共享</g-module-title>
      
    </div>
  </c-page-wrapper>
</template>

<script setup>
import DataItem from './DataItem.vue';
</script>

<style lang="less" scoped>
.cyber-collapse-form {
  border-bottom: 1px solid #D9E2EB;
}
.g-module-title {
  margin-top: 22px;
  &:first-child {
    margin-top: 0;
  }
  & > div {
    margin-bottom: 14px;
  }
}
</style>