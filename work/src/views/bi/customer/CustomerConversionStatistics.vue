<template>
  <el-tabs
    v-model="tabActiveName"
    class="main-container">
    <el-tab-pane
      v-for="(item, index) in tabList"
      :key="index"
      :label="item.label"
      :name="item.name"
      lazy>
      <template slot="label">
        <span>{{ item.label }}</span>
        <el-tooltip
          effect="dark"
          placement="bottom">
          <div slot="content" v-html="item.tips" />
          <i class="wk wk-help wk-help-tips" />
        </el-tooltip>
      </template>
      <customer-conversion
        :type="item.name"
        :show="item.name == tabActiveName" />
    </el-tab-pane>
  </el-tabs>
</template>

<script>
import CustomerConversion from './components/CustomerConversion'

export default {
  /** 客户转化率 */
  name: 'CustomerConversionTab',
  components: {
    CustomerConversion
  },
  data() {
    return {
      tabActiveName: '1',
      tabList: [
        {
          label: '客户转化率1',
          name: '1',
          tips: '筛选人员的客户状态在筛选时间内变更为已成交的数量/筛选人员<br>在筛选时间内负责的客户新增数量'
        },
        {
          label: '客户转化率2',
          name: '2',
          tips: '筛选人员在筛选时间范围内负责的客户中截止到今天状态变更为<br>已成交的数量/筛选人员在筛选时间负责的客户数新增数量'
        }
      ]
    }
  }
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
