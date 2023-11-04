<template>
  <div
    v-loading="loading"
    class="main-container">
    <filtrate-handle-view
      title="产品销售情况统计"
      class="filtrate-bar"
      module-type="product"
      @load="loading=true"
      @change="getProductDatalist">
      <el-button
        class="export-button"
        type="primary"
        @click.native="exportClick">导出</el-button>
    </filtrate-handle-view>
    <div class="content">
      <el-table
        id="crm-table"
        :data="list"
        :class="WKConfig.tableStyle.class"
        :stripe="WKConfig.tableStyle.stripe"
        :height="tableHeight"
        :cell-class-name="cellClassName"
        :summary-method="getSummaries"
        show-summary
        @row-click="handleRowClick">
        <el-table-column
          v-for="(item, index) in headFieldList"
          :key="index"
          :prop="item.field"
          :label="item.name"
          align="center"
          header-align="center"
          show-overflow-tooltip />
      </el-table>
      <div class="p-contianer">
        <el-pagination
          :current-page="currentPage"
          :page-sizes="pageSizes"
          :page-size.sync="pageSize"
          :total="total"
          :pager-count="5"
          class="p-bar"
          background
          layout="prev, pager, next, sizes, total, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange" />
      </div>
    </div>
    <!-- 预览合同 -->
    <report-list
      :show.sync="reportListShow"
      :title="reportData.title"
      :placeholder="reportData.placeholder"
      :request="reportData.request"
      :params="reportData.params"
      crm-type="contract" />
  </div>
</template>

<script>
import { biProductStatisticsAPI, biProductStatisticsExportAPI } from '@/api/bi/bi'
import { crmContractQueryListByProductIdAPI } from '@/api/crm/contract'

import ReportList from '@/views/crm/workbench/components/ReportList'

import BaseMixin from '../mixins/Base'

export default {
  /** 产品销售情况统计 */
  name: 'ProductStatistics',
  components: {
    ReportList
  },
  mixins: [BaseMixin],
  data() {
    return {
      loading: false,
      tableHeight: document.documentElement.clientHeight - 210,
      currentPage: 1,
      pageSize: 15,
      pageSizes: [15, 30, 60, 100],
      total: 0,
      postParams: {}, // 筛选参数

      headFieldList: [
        { field: 'categoryName', name: '产品分类', width: '115px' },
        { field: 'productName', name: '产品名称', width: '115px' },
        { field: 'contractNum', name: '合同数', width: '115px' },
        { field: 'num', name: '数量合计', width: '115px' },
        { field: 'total', name: '订单产品小计', width: '115px' }
      ],
      list: [],
      extraData: {
        contractNum: 0,
        num: 0,
        total: 0
      },

      reportListShow: false,
      reportData: {
        title: '',
        placeholder: '',
        request: null,
        params: null
      }
    }
  },
  computed: {},
  mounted() {
    window.onresize = () => {
      const offsetHei = document.documentElement.clientHeight
      this.tableHeight = offsetHei - 210
    }
  },
  methods: {
    /** 列表操作 */
    /**
     * 通过回调控制class
     */
    cellClassName({ row, column, rowIndex, columnIndex }) {
      if (column.property === 'contractNum') {
        return 'can-visit--underline'
      }
      return ''
    },

    /**
     * 更改每页展示数量
     */
    handleSizeChange(val) {
      this.pageSize = val
      this.getProductDatalist()
    },

    /**
     * 更改当前页数
     */
    handleCurrentChange(val) {
      this.currentPage = val
      this.getProductDatalist()
    },

    /**
     * 当某一行被点击时会触发该事件
     */
    handleRowClick(row, column, event) {
      if (column.property === 'contractNum') {
        this.reportData.title = `${column.label}详情`
        this.reportData.request = crmContractQueryListByProductIdAPI
        this.reportData.placeholder = '请输入客户联系人/合同编号/合同名称'
        this.reportData.params = {
          ...this.postParams,
          id: row.productId
        }
        this.reportListShow = true
      }
    },

    /**
     * 获取部门业绩完成信息
     */
    getProductDatalist(params) {
      if (params) {
        this.postParams = params
      }
      this.loading = true
      biProductStatisticsAPI({
        ...this.postParams,
        page: this.currentPage,
        limit: this.pageSize
      })
        .then(res => {
          const resData = res.data || {}
          this.list = resData.list || []
          this.extraData = resData.extraData ||
            {
              extraData: 0,
              num: 0,
              total: 0
            }
          this.total = resData.totalRow
          this.loading = false
        })
        .catch(() => {
          this.loading = false
        })
    },

    /**
     * 合计
     */
    getSummaries(param) {
      return ['合计', '', this.extraData.contractNum, this.extraData.num, this.extraData.total]
    },

    /**
     * 导出点击
     */
    exportClick() {
      this.requestExportInfo(biProductStatisticsExportAPI, this.postParams)
    }
  }
}
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
@import "../styles/detail.scss";
@import "@/views/crm/styles/detailview.scss";

.content {
  padding-right: #{$--interval-base * 5};
}
</style>
