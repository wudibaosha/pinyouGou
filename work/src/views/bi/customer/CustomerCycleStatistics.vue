<template>
  <el-tabs
    v-model="tabActiveName"
    class="main-container">
    <el-tab-pane
      v-for="(item, index) in tabList"
      :key="index"
      :label="item.label"
      :name="item.name">
      <cycle-view
        :type="item.name"
        :show="item.name == tabActiveName" />
    </el-tab-pane>
  </el-tabs>
</template>

<script>
import CycleView from './components/CycleView'

export default {
  /** 成交周期分析 */
  name: 'CustomerCycleStatistics',
  components: {
    CycleView
  },
  data() {
    return {
      tabActiveName: 'customer',
      tabList: [
        { label: '员工客户成交周期', name: 'customer' },
        { label: '地区成交周期', name: 'address' },
        { label: '产品成交周期', name: 'product' }
      ]
    }
  },
  computed: {},
  mounted() {},
  methods: {}
}
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
@import "../styles/detail.scss";

.main-container {
  position: relative;
  height: 100%;

  /deep/ .el-tabs__header {
    padding-right: #{$--interval-base * 5};
  }

  /deep/ .el-tabs__content {
    height: 100%;
    overflow: hidden;

    .el-tab-pane {
      height: 100%;
      overflow: hidden;
    }
  }
}
</style>
