<template>
  <base-tabs-head
    v-bind="$attrs"
    class="Task-tabs-head"
    v-on="$listeners">
    <span
      slot="left"
      class="title">
      <i class="wk wk-message" />跟进记录（{{ count }}）
    </span>
  </base-tabs-head>
</template>

<script>
import BaseTabsHead from '@/components/BaseTabsHead'

export default {
  /** 任务切换头 */
  name: 'RecordTabHead',
  components: {
    BaseTabsHead
  },
  props: {
    count: {
      type: [String, Number],
      default: 0
    }
  },
  data() {
    return {}
  },
  computed: {},
  watch: {},
  mounted() {},

  beforeDestroy() {},
  methods: {}
}
</script>

<style lang="scss" scoped>
.title {
  margin-left: 30px;
  color: $--color-text-primary;

  i {
    padding: 3px;
    margin-right: 5px;
    font-size: 12px;
    color: white;
    background-color: #487dff;
    border-radius: $--border-radius-base;
  }
}
</style>
