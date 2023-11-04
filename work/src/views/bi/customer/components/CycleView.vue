<template>
  <div
    v-loading="loading"
    class="cycle-content">
    <filtrate-handle-view
      v-if="initView"
      :title="filterTitle"
      class="filtrate-bar"
      module-type="customer"
      @load="loading=true"
      @change="getDataList" />
    <div class="content">
      <div class="axis-content">
        <div class="content-title">{{ title }}</div>
        <div
          :id="'axismain' + type"
          class="axismain" />
      </div>
      <div class="table-content">
        <div class="handle-bar">
          <el-button
            class="export-btn"
            @click="exportClick">导出</el-button>
        </div>
        <el-table
          v-if="showTable"
          :class="WKConfig.tableStyle.class"
          :stripe="WKConfig.tableStyle.stripe"
          :cell-class-name="cellClassName"
          :data="list"
          :summary-method="getSummaries"
          height="400"
          show-summary
          highlight-current-row
          @row-click="handleRowClick"
          @sort-change="({ prop, order }) => mixinSortFn(list, prop, order)">
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

    <!-- 汇报列表 (详情)-->
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
<script type="text/javascript">
import BaseMixin from '../../mixins/Base'
import SortMixin from '../../mixins/Sort'
import SummaryMixin from '../../mixins/Summary'
import DetailMixin from '@/views/bi/mixins/Detail'

import * as echarts from 'echarts'
import {
  biCustomerUserCycleAPI,
  biCustomerUserCycleExportAPI,
  biCustomerAddressCycleAPI,
  biCustomerAddressCycleExportAPI,
  biCustomerProductCycleAPI,
  biCustomerProductCycleExportAPI,
  employeeCycleInfoAPI,
  biCustomerDetailListAPI
} from '@/api/bi/customer'
import { biProductCircleDetailListAPI } from '@/api/bi/product'

export default {
  name: 'CycleView',
  components: {},
  mixins: [BaseMixin, SortMixin, SummaryMixin, DetailMixin],
  props: {
    type: {
      required: true,
      type: String
    }, // 'customer' 'product' 'address'
    show: {
      // 是否展示
      required: true,
      type: Boolean
    }
  },
  data() {
    return {
      loading: false,
      axisOption: null,

      postParams: null,

      list: [],
      fieldList: null,
      initView: false, // 默认没有初始化
      // 可以点击的数据
      detailFields: [
        {
          name: 'customerNum',
          crmType: 'customer',
          request: biCustomerDetailListAPI,
          params: {}
        }
      ]
    }
  },
  computed: {
    title() {
      return {
        customer: '员工客户成交周期（根据合同下单时间和客户创建时间计算）',
        address: '地区成交周期（根据合同下单时间和客户创建时间计算）',
        product: '产品成交周期（根据合同下单时间和客户创建时间计算）'
      }[this.type]
    },
    filterTitle() {
      return {
        customer: '员工客户成交周期分析',
        address: '地区成交周期分析',
        product: '产品成交周期分析'
      }[this.type]
    }
  },
  watch: {
    show: function(value) {
      if (value && !this.initView) {
        this.initView = true
        if (this.postParams) {
          this.getDataList(this.postParams)
        }
        this.$nextTick(() => {
          this.initAxis()
        })
      }
      if (value && this.initView) {
        this.$nextTick(() => {
          this.resizeFn()
        })
      }
    }
  },
  mounted() {
    this.fieldList = this.getFieldList()
    if (this.show) {
      this.initView = true
      this.initAxis()
    }
  },
  methods: {
    getDataList(params) {
      this.postParams = params
      if (!this.show) {
        return
      }
      this.loading = true
      const request = {
        customer: biCustomerUserCycleAPI,
        product: biCustomerProductCycleAPI,
        address: biCustomerAddressCycleAPI
      }[this.type]
      request(params)
        .then(res => {
          this.loading = false
          const axisList = res.data || []
          if (this.type !== 'customer') {
            this.list = axisList
          }

          const cycleData = []
          const dealData = []
          const xAxis = []
          for (let index = 0; index < axisList.length; index++) {
            const element = axisList[index]
            cycleData.push(element.cycle)
            dealData.push(element.customerNum)
            if (this.type === 'customer') {
              xAxis.push(element.type)
            } else if (this.type === 'address') {
              xAxis.push(element.type)
            } else if (this.type === 'product') {
              xAxis.push(element.productName)
            }
          }
          this.axisOption.xAxis[0].data = xAxis
          this.axisOption.series[0].data = cycleData
          this.axisOption.series[1].data = dealData
          this.chartObj.setOption(this.axisOption, true)
        })
        .catch(() => {
          this.loading = false
        })
      if (this.type === 'customer') {
        employeeCycleInfoAPI(params)
          .then(res => {
            this.loading = false
            this.list = res.data || []
          })
          .catch(() => {
            this.loading = false
          })
      }
    },
    /** 柱状图 */
    initAxis() {
      const chartObj = echarts.init(
        document.getElementById('axismain' + this.type)
      )

      const option = {
        color: this.echartLineBarColors,
        toolbox: this.toolbox,
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            // 坐标轴指示器，坐标轴触发有效
            type: 'shadow' // 默认为直线，可选为：'line' | 'shadow'
          }
        },
        legend: {
          data: ['成交周期', '成交客户数'],
          ...this.chartDefaultOptions.legend
        },
        grid: this.chartDefaultOptions.grid,
        xAxis: [
          {
            type: 'category',
            data: [],
            ...this.chartXAxisStyle
          }
        ],
        yAxis: [
          {
            type: 'value',
            name: '成交周期',
            ...this.getChartYAxisStyle({
              axisLabel: {
                formatter: '{value}天'
              }
            })
          },
          {
            type: 'value',
            name: '成交客户数',
            ...this.getChartYAxisStyle({
              axisLabel: {
                formatter: '{value}个'
              },
              splitLine: {
                show: true
              }
            })
          }
        ],
        series: [
          {
            name: '成交周期',
            type: 'bar',
            yAxisIndex: 0,
            barMaxWidth: 15,
            data: []
          },
          {
            name: '成交客户数',
            type: 'bar',
            yAxisIndex: 1,
            barMaxWidth: 15,
            data: []
          }
        ]
      }

      chartObj.setOption(option, true)
      this.axisOption = option
      this.chartObj = chartObj
    },
    getFieldList() {
      return {
        customer: [
          { field: 'realname', name: '姓名' },
          { field: 'cycle', name: '平均成交周期（天）' },
          { field: 'customerNum', name: '成交客户数' }
        ],
        product: [
          { field: 'productName', name: '产品名称' },
          { field: 'cycle', name: '平均成交周期（天）' },
          { field: 'customerNum', name: '成交客户数' }
        ],
        address: [
          { field: 'type', name: '地区' },
          { field: 'cycle', name: '平均成交周期（天）' },
          { field: 'customerNum', name: '成交客户数' }
        ]
      }[this.type]
    },

    /**
     * 导出点击
     */
    exportClick() {
      this.requestExportInfo({
        customer: biCustomerUserCycleExportAPI,
        product: biCustomerProductCycleExportAPI,
        address: biCustomerAddressCycleExportAPI
      }[this.type], this.postParams)
    },

    handleRowClick(row, column) {
      if (this.getDetailFieldList(column)) {
        const { values } = this.getValues(row, column)
        let extraParams = {}
        const searchList = [
          {
            formType: 'datetime',
            name: 'createTime',
            type: 14,
            values
          }, {
            formType: 'dealStatus',
            name: 'dealStatus',
            type: 1,
            values: [1]
          }
        ]

        if (this.type == 'address') {
          searchList.push({
            formType: 'map_address',
            name: 'address',
            type: 3,
            values: [row.type]
          })
        } else if (this.type == 'customer') {
          searchList.push({
            formType: 'user',
            name: 'ownerUserId',
            type: 3,
            values: [row.userId]
          })
        } else if (this.type == 'product') {
          extraParams = {
            dateFilter: this.postParams.dateFilter,
            id: row.productId
          }
        }

        if (!this.postParams.dataType) {
          extraParams.deptList = this.postParams.deptList
          extraParams.userList = this.postParams.userList
        }

        const params = {
          dataType: this.postParams.dataType,
          searchList,
          ...extraParams,
          limit: 15,
          page: 1,
          search: ''
        }

        if (['address', 'customer'].includes(this.type)) {
          params.type = 2
        }

        const field = this.getCurrentClickField(column)
        this.reportData = {
          ...this.reportData,
          ...field,
          title: column.label,
          params
        }

        if (this.type == 'product') {
          this.reportData.request = biProductCircleDetailListAPI
        } else {
          this.reportData.request = biCustomerDetailListAPI
        }

        this.reportListShow = true
      }
    }
  }
}
</script>
<style lang="scss" scoped>
@import "../../styles/detail.scss";

.filtrate-bar {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  z-index: 2;
}

.content {
  padding-top: 54px;
}

.cycle-content {
  height: 100%;
  overflow-y: auto;
}
</style>
