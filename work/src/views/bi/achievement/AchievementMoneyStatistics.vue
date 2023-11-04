<template>
  <div
    v-loading="loading"
    class="main-container">
    <filtrate-handle-view
      :show-year-select="true"
      title="合同金额分析"
      class="filtrate-bar"
      module-type="contract"
      @load="loading=true"
      @change="getDataList" />
    <div class="content">
      <div class="axis-content">
        <div id="axismain" />
      </div>
      <div class="table-content">
        <div class="handle-bar">
          <el-button
            class="export-btn"
            @click="exportClick">导出</el-button>
        </div>
        <el-table
          :data="list"
          :class="WKConfig.tableStyle.class"
          :stripe="WKConfig.tableStyle.stripe"
          height="180"
          highlight-current-row
          :cell-class-name="cellClassName"
          @row-click="handleRowClick">
          <el-table-column
            v-for="(item, index) in fieldList"
            :key="index"
            :min-width="index==0?180: 100"
            :prop="item.field"
            :label="item.name"
            align="center"
            header-align="center"
            show-overflow-tooltip />
        </el-table>
      </div>
    </div>

    <report-list
      :show.sync="reportListShow"
      :title="reportData.title"
      crm-type="contract"
      :placeholder="reportData.placeholder"
      :request="reportData.request"
      :params="reportData.params" />

  </div>
</template>

<script>
import AchievementMixin from '../mixins/Achievement'

import ReportList from '@/views/crm/workbench/components/ReportList'

export default {
  /** 合同金额分析 */
  name: 'AchievementMoneyStatistics',
  components: {
    ReportList
  },
  mixins: [AchievementMixin],
  data() {
    return { }
  },
  computed: {},
  created() {
    this.type = 'money'
  },
  methods: {}
}
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
@import "../styles/detail.scss";
</style>
