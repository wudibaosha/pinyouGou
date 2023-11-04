<template>
  <div
    class="report-menu">
    <el-button
      v-for="(item, index) in list"
      :key="index"
      :icon="item.iconClass"
      class="report-menu-btn"
      @click="itemClick(item)">
      <span>{{ item.info }}</span>
      <span class="count">{{ item.count }}</span>
    </el-button>
  </div>
</template>

<script>
import XrSystemIconMixin from '@/mixins/XrSystemIcon'

export default {
  // 日志简报菜单
  name: 'ReportMenu',
  components: {},
  mixins: [XrSystemIconMixin],
  props: {
    list: Array
  },
  data() {
    return {}
  },
  computed: {},
  watch: {},
  mounted() {},

  beforeDestroy() {},
  methods: {
    itemClick(item) {
      this.$emit('select', item)
    }
  }
}
</script>

<style lang="scss" scoped>
.report-menu {
  line-height: 1.15;
  white-space: initial;

  &-btn {
    background: $--color-n10;
  }

  .count {
    color: $--color-primary;
  }
}
</style>
