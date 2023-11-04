<template>
  <div class="box-wrapper">
    <div class="title">
      <span>{{ attr.isNull ? '*' : '' }}</span>{{ attr.name }}<span v-if="attr.inputTips">{{ '（'+attr.inputTips+'）' }}</span>
    </div>
    <div class="box">
      <div class="box-content">{{ attr.defaultValue }}</div>
      <div class="max-tips">{{ attr.defaultValue.length+'/'+attr.maxLength }}</div>
    </div>
    <span
      v-if="isShow"
      class="el-icon-delete control"
      @click="handleDelete" />

  </div>
</template>

<script>
/**
 * 多行文本
 */
import mixins from './mixin'

export default {
  name: 'MultiLineText',
  mixins: [mixins]
}
</script>

<style scoped lang="scss">
@import "form.scss";

.box {
  position: relative;
  width: 310px;
  height: 80px;
  padding: 10px 10px 15px;
  font-size: 14px;
  color: $--color-text-primary;
  background: white;
  border: 1px solid #dcdfe6;
  border-radius: $--border-radius-base;

  .box-content {
    height: 48px;
    overflow: hidden;
    word-break: break-all;
  }

  .max-tips {
    overflow: hidden;
    font-size: 12px;
    color: $--color-text-secondary;
    text-align: right;
    word-break: break-all;
  }
}
</style>
