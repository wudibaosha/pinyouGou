<template>
  <div
    v-loading="loading"
    class="main-container">
    <filtrate-handle-view
      :title="filterTitle"
      class="filtrate-bar"
      module-type="portrait"
      @load="loading=true"
      @change="getDataList" />
    <div class="content">
      <div class="axis-content">
        <div id="axismain" />
      </div>
      <div class="table-content">
        <el-table
          :data="list"
          :class="WKConfig.tableStyle.class"
          :stripe="WKConfig.tableStyle.stripe"
          height="400"
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
      crm-type="customer"
      :placeholder="reportData.placeholder"
      :request="reportData.request"
      :params="reportData.params" />

  </div>
</template>

<script>
import { biCustomerDetailListAPI } from '@/api/bi/customer.js'

import BaseMixin from '../mixins/Base'
import * as echarts from 'echarts'
import { biAchievementPortraitAPI } from '@/api/bi/customerPortrayal'

import ReportList from '@/views/crm/workbench/components/ReportList'
const LOGIC_OTHER = '其他'

export default {
  /** 客户画像分析 */
  name: 'CustomerPortrayalStatistics',
  components: {
    ReportList
  },
  mixins: [BaseMixin],
  props: {},
  data() {
    return {
      loading: false,
      axisOption: null,

      list: [],
      type: '', // 类型 source：客户来源；industry：客户行业；level：客户级别

      postParams: {},
      fieldList: [],

      reportListShow: false,
      reportData: {
        title: '',
        placeholder: '',
        request: null,
        params: null
      }
    }
  },
  computed: {
    filterTitle() {
      return {
        source: '客户来源分析',
        industry: '客户行业分析',
        level: '客户级别分析'
      }[this.type] || ''
    }
  },
  created() {
    this.type = this.$route.params.type
  },
  mounted() {
    this.initAxis()
  },
  beforeRouteUpdate(to, from, next) {
    this.type = to.params.type
    this.getDataList(this.postParams)
    next()
  },
  methods: {
    getDataList(params) {
      this.postParams = params
      this.loading = true
      params.type_analyse = this.type
      biAchievementPortraitAPI(params)
        .then(res => {
          this.loading = false

          // 图表信息
          const allData = []
          const dealData = []
          const legendData = []

          // 表信息
          const list = [
            {
              name: '所有客户（个）',
              field: 'all',
              deal: false
            },
            {
              name: '成交客户（个）',
              deal: true,
              field: 'deal'
            }
          ]
          const fieldList = [
            {
              field: 'name',
              name: {
                source: '客户来源',
                industry: '客户行业',
                level: '客户级别'
              }[this.type]
            }
          ]

          for (let eIndex = 0; eIndex < res.data.length; eIndex++) {
            const element = res.data[eIndex]
            // 图表信息
            allData.push({
              name: element.type,
              value: element.allCustomer
            })
            dealData.push({
              name: element.type,
              value: element.dealCustomer
            })
            legendData.push(element[this.type])

            // 处理表头逻辑
            const fieldKey = 'value' + eIndex
            if (fieldList.length <= res.data.length) {
              fieldList.push({
                field: fieldKey,
                name: element.type
              })
            }
            const keys = ['allCustomer', 'dealCustomer']
            for (let keyIndex = 0; keyIndex < keys.length; keyIndex++) {
              const keyElement = keys[keyIndex]
              list[keyIndex][fieldKey] = element[keyElement]
            }
          }

          // 图表展示
          this.axisOption.legend.data = legendData

          this.axisOption.series[0].data = allData
          this.axisOption.series[1].data = dealData

          this.chartObj.setOption(this.axisOption, true)

          // 列表展示
          this.fieldList = fieldList
          this.list = list
        })
        .catch(() => {
          this.loading = false
        })
    },
    /** 柱状图 */
    initAxis() {
      this.chartObj = echarts.init(document.getElementById('axismain'))
      this.axisOption = this.getChartOptione()
      this.chartObj.setOption(this.axisOption, true)
    },
    getChartOptione() {
      return {
        title: [
          {
            text: '全部客户',
            x: '20%',
            bottom: '25'
          },
          {
            text: '成交客户',
            x: '70%',
            bottom: '25'
          }
        ],
        color: this.chartColors,
        toolbox: this.toolbox,
        tooltip: {
          trigger: 'item',
          formatter: '{b} : {c}'
        },
        legend: {
          ...this.chartDefaultOptions.legend,
          x: 'center',
          y: 'bottom',
          type: 'scroll',
          data: []
        },
        series: [
          {
            name: '全部客户',
            type: 'pie',
            label: this.chartDefaultBase.label,
            radius: ['35%', '50%'],
            center: ['25%', '50%'],
            data: []
          },
          {
            name: '成交客户',
            type: 'pie',
            label: this.chartDefaultBase.label,
            radius: ['35%', '50%'],
            center: ['75%', '50%'],
            data: []
          }
        ]
      }
    },

    /**
     * 通过回调控制class
     */
    cellClassName({ row, column, rowIndex, columnIndex }) {
      if (columnIndex) {
        return 'can-visit--underline'
      }
      return ''
    },

    /**
         * 列表点击
         */
    handleRowClick(row, column, event) {
      if (column.property != 'name') {
        this.reportData.title = row.field === 'deal' ? `${column.label}（成交客户）` : `${column.label}（所有客户）`
        this.reportData.request = biCustomerDetailListAPI

        let lastDate = ''
        if (this.postParams.padDate) {
          const [one] = this.postParams.startDate.split('-')
          lastDate = `${Number(one) + 1}-01-01`
        }
        const values = this.postParams.dateFilter == 'custom'
          ? [`${this.postParams.startDate}`, this.postParams.endDate || lastDate]
          : [this.postParams.dateFilter]

        const params = {
          search: '',
          dataType: this.postParams.dataType,
          type: 2
        }

        if (this.postParams.dataType == 0) {
          params.userList = this.postParams.userList
          params.deptList = this.postParams.deptList
        }

        params.searchList = [{
          formType: 'datetime',
          name: 'createTime',
          type: 14,
          values: values
        }]

        if (row.deal) {
          params.searchList.push({
            formType: 'dealStatus',
            name: 'dealStatus',
            type: 1,
            values: [1]
          })
        }

        // `value${this.fieldList.length - 2}` 表示列表最后一列是'其他'列
        const label = column.property == `value${this.fieldList.length - 2}` ? [] : [column.label]
        params.searchList.push({
          formType: 'select',
          name: this.type,
          type: label.length == 0 ? 5 : 1,
          values: label
        })

        this.reportData.params = params
        this.reportListShow = true
      }
    }
  }
}
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
@import "../styles/detail.scss";

.axis-content {
  #axismain {
    height: 420px;
  }
}
</style>
