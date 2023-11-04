<template>
  <div
    v-loading="loading"
    class="main-container">
    <filtrate-handle-view
      title="日志分析"
      class="filtrate-bar"
      module-type="oa"
      @load="loading=true"
      @change="getDataList">
      <el-button
        class="export-button"
        type="primary"
        @click.native="exportExcel">导出</el-button>
    </filtrate-handle-view>
    <div class="content">
      <div class="table-content">
        <el-table
          v-if="showTable"
          :data="list"
          :cell-class-name="cellClassName"
          :class="WKConfig.tableStyle.class"
          :stripe="WKConfig.tableStyle.stripe"
          :height="tableHeight"
          highlight-current-row
          @sort-change="({ prop, order }) => mixinSortFn(list, prop, order)"
          @row-click="handleRowClick">
          <el-table-column
            v-for="(item, index) in fieldList"
            :key="index"
            :prop="item.field"
            :label="item.name"
            sortable="custom"
            align="center"
            header-align="center" />
        </el-table>
      </div>
    </div>

    <c-r-m-full-screen-detail
      :id="relationID"
      :params="nparams"
      :visible.sync="reportListShow"
      crm-type="list" />

  </div>
</template>

<script>
import SortMixin from '../mixins/Sort'

import {
  biLogStatisticsAPI,
  biLogExcelExportAPI
} from '@/api/bi/oa'

import FiltrateHandleView from '../components/FiltrateHandleView'
import { downloadExcelWithResData } from '@/utils'

export default {
  /** 日志统计表 */
  name: 'LogStatistics',

  components: {
    FiltrateHandleView,
    CRMFullScreenDetail: () =>
      import('@/components/CRMFullScreenDetail')
  },
  mixins: [SortMixin],
  data() {
    return {
      loading: false,
      tableHeight: document.documentElement.clientHeight - 170,
      nparams: {},
      postParams: {},
      list: [],
      fieldList: [
        { field: 'realname', name: '员工' },
        { field: 'count', name: '填写数' },
        // { field: 'unReadCont', name: '接收人未读数' },
        { field: 'unCommentCount', name: '未评论数' },
        { field: 'commentCount', name: '已评论数' }
      ],
      reportListShow: false,
      relationID: ''
    }
  },

  mounted() {
    /** 控制table的高度 */
    window.onresize = () => {
      this.tableHeight = document.documentElement.clientHeight - 170
    }
  },

  methods: {
    /**
     * 列表数据
     */
    getDataList(params) {
      this.nparams = this.postParams = params
      this.loading = true
      biLogStatisticsAPI(params)
        .then(res => {
          this.list = res.data || []
          this.loading = false
        })
        .catch(() => {
          this.loading = false
        })
    },

    handleRowClick(row, column, event) {
      if (column.property === 'realname') return
      this.nparams.createUserId = row.userId
      this.relationID = column.property
      this.reportListShow = true
    },

    /**
     * 通过回调控制class
     */
    cellClassName({ row, column, rowIndex, columnIndex }) {
      // if (array.includes(column.property) && row[column.property] > 0) {
      if (column.property !== 'realname') {
        return 'can-visit--underline'
      } else {
        return ''
      }
    },

    /**
     * 导出
     */
    exportExcel() {
      this.loading = true
      biLogExcelExportAPI(this.postParams)
        .then(res => {
          this.loading = false
          downloadExcelWithResData(res)
        })
        .catch(() => {
          this.loading = false
        })
    }
  }
}
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
@import "../styles/detail.scss";
</style>
