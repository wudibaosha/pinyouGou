<template>
  <div
    v-loading="loading"
    class="main-container">
    <filtrate-handle-view
      :show-year-select="true"
      title="发票统计分析"
      class="filtrate-bar"
      module-type="invoice"
      @load="loading=true"
      @change="getDataList">
      <el-button
        class="export-button"
        type="primary"
        @click.native="exportClick">导出</el-button>
    </filtrate-handle-view>
    <div class="content">
      <div class="content-title">
        回款金额：<span class="special">{{ data.receivablesMoney || 0 }}</span>元；开票金额：<span class="special">{{ data.invoiceMoney || 0 }}</span>元</div>
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
            header-align="center"
            show-overflow-tooltip />
        </el-table>
      </div>
    </div>

    <report-list
      :show.sync="reportListShow"
      :title="reportData.title"
      :placeholder="reportData.placeholder"
      :crm-type="reportData.crmType"
      :request="reportData.request"
      :params="reportData.params"
      :record-request="reportData.recordRequest"
      :paging="reportData.paging"
      :sortable="reportData.sortable" />

  </div>
</template>

<script>
import SortMixin from '../mixins/Sort'
import BaseMixin from '../mixins/Base'
import DetailMixin from '../mixins/Detail'

import {
  biAchievementInvoiceAPI,
  biAchievementInvoiceExportAPI,
  biReceivablesDetailListAPI,
  biInvoiceDetailListAPI
} from '@/api/bi/achievement'

import FiltrateHandleView from '../components/FiltrateHandleView'
import NP from 'number-precision'

export default {
  /** 发票统计分析 */
  name: 'AchievementInvoiceStatistics',
  components: {
    FiltrateHandleView
  },
  mixins: [BaseMixin, SortMixin, DetailMixin],
  data() {
    return {
      loading: false,
      tableHeight: document.documentElement.clientHeight - 210,

      postParams: {}, // 筛选参数

      list: [],
      data: {},
      fieldList: [
        { field: 'type', name: '日期' },
        { field: 'receivablesMoney', name: '回款金额' },
        { field: 'invoiceMoney', name: '开票金额' },
        { field: 'receivablesNoInvoice', name: '已回款未开票' },
        { field: 'invoiceNoReceivables', name: '已开票未回款' }
      ],

      // 可以点击的数据
      detailFields: [
        {
          name: 'receivablesMoney',
          crmType: 'receivables',
          timeName: 'returnTime',
          padDate: true,
          list: [{
            formType: 'checkStatus',
            name: 'checkStatus',
            type: 1,
            values: [1, 10]
          }],
          request: biReceivablesDetailListAPI
        },
        {
          name: 'invoiceMoney',
          crmType: 'invoice',
          timeName: 'realInvoiceDate',
          padDate: true,
          list: [{
            formType: 'checkStatus',
            name: 'checkStatus',
            type: 1,
            values: [1]
          }],
          request: biInvoiceDetailListAPI
        }
        // {
        //   name: 'receivablesNoInvoice',
        //   request: crmInvoiceIndexAPI
        // },
        // {
        //   name: 'invoiceNoReceivables',
        //   request: crmInvoiceIndexAPI
        // }
      ]
    }
  },
  computed: {},
  mounted() {
    /** 控制table的高度 */
    window.onresize = () => {
      this.tableHeight = document.documentElement.clientHeight - 210
    }
  },
  methods: {
    getDataList(params) {
      this.postParams = params
      this.loading = true
      biAchievementInvoiceAPI(params)
        .then(res => {
          this.loading = false
          this.list = res.data || []

          let receivablesMoney = 0
          let invoiceMoney = 0
          this.list.forEach(item => {
            receivablesMoney = NP.plus(receivablesMoney, Number(item.receivablesMoney) || 0)
            invoiceMoney = NP.plus(invoiceMoney, Number(item.invoiceMoney) || 0)
          })
          this.data = {
            receivablesMoney,
            invoiceMoney
          }
        })
        .catch(() => {
          this.loading = false
        })
    },

    /**
     * 导出点击
     */
    exportClick() {
      this.requestExportInfo(biAchievementInvoiceExportAPI, this.postParams)
    },

    handleRowClick(row, column) {
      if (this.getDetailFieldList(column)) {
        const { values } = this.getValues(row, column)
        let searchList = []
        const extraParams = {}
        if (column.property == 'receivablesMoney') {
          searchList = [
            {
              formType: 'date',
              name: 'returnTime',
              type: 14,
              values
            },
            {
              formType: 'checkStatus',
              name: 'checkStatus',
              type: 1,
              values: [1, 10]
            }
          ]
        } else {
          if (!this.postParams.dataType) {
            extraParams.deptList = this.postParams.deptList
            extraParams.userList = this.postParams.userList
          }
          searchList = [
            {
              formType: 'date',
              name: 'realInvoiceDate',
              type: 14,
              values
            },
            {
              formType: 'checkStatus',
              name: 'checkStatus',
              type: 1,
              values: [1]
            }
          ]
        }

        const params = {
          ...extraParams,
          dataType: this.postParams.dataType,
          searchList,
          limit: 15,
          page: 1,
          search: '',
          type: column.property == 'receivablesMoney' ? 7 : 18
        }

        const field = this.getCurrentClickField(column)
        this.reportData = {
          ...this.reportData,
          ...field,
          title: column.label,
          params
        }

        this.reportListShow = true
      }
    }
  }
}
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
@import "../styles/detail.scss";

.content-title {
  padding-bottom: 15px;

  .special {
    margin-right: 3px;
    font-weight: bold;
  }
}
</style>
