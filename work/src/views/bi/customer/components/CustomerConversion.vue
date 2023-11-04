<template>
  <div
    v-loading="loading"
    class="main-content">
    <filtrate-handle-view
      v-if="initView"
      :show-custom-select="true"
      :custom-default="showType"
      :custom-options="[{name:'折线图', value: 'line'}, {name:'饼状图', value: 'pie'},{name:'柱状图', value: 'bar'}]"
      :title="filterTitle"
      class="filtrate-bar"
      module-type="customer"
      @load="loading=true"
      @change="searchClick"
      @typeChange="showTypeChange" />
    <div class="content">
      <div class="axis-content">
        <div
          :id="'axismain' + type"
          class="axismain" />
      </div>
      <div class="table-content">
        <el-table
          :data="list"
          :class="WKConfig.tableStyle.class"
          :stripe="WKConfig.tableStyle.stripe"
          :cell-class-name="cellClassName"
          @row-click="handleRowClick">
          <el-table-column
            v-for="(item, index) in fieldList"
            :key="index"
            :prop="item.field"
            :label="item.name"
            min-width="140"
            align="center"
            header-align="center"
            show-overflow-tooltip />
        </el-table>
      </div>
    </div>

    <!-- 销售简报列表 -->
    <report-list
      :show.sync="reportListShow"
      :title="reportData.title"
      crm-type="customer"
      :placeholder="reportData.placeholder"
      :request="reportData.request"
      :params="reportData.params"
      :field-list="fieldReportList" />
  </div>
</template>

<script>
import {
  // biCustomerConversionInfoAPI,
  biCustomerConversionAPI,
  biCustomerDetailListAPI
} from '@/api/bi/customer'

import ReportList from '@/views/crm/workbench/components/ReportList'

import BaseMixin from '../../mixins/Base'
// import DetailMixin from '../../mixins/Detail'
import * as echarts from 'echarts'
import { getDate } from '@/views/bi/data'

export default {
  /** 客户转化率分析 */
  name: 'CustomerConversionStatistics',
  components: {
    ReportList
  },
  mixins: [BaseMixin],
  props: {
    type: {
      required: true,
      type: String
    },
    show: {
      // 是否展示
      required: true,
      type: Boolean
    }
  },
  data() {
    return {
      loading: false,
      showType: 'line',
      initView: false, // 默认没有初始化

      axisOption: null,
      pieOption: null,

      postParams: {}, // 筛选参数
      list: [],
      axisList: [],
      fieldList: [],

      reportListShow: false,
      fieldReportList: null,
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
      return `客户转化率分析${this.type}`
    }
  },
  watch: {
    show: {
      handler(value) {
        if (value && this.initView) {
          this.$nextTick(() => {
            this.resizeFn()
          })
        }
      }
    }
  },
  mounted() {
    this.initView = true
    this.initPie()
    this.initAxis()
  },
  methods: {
    showTypeChange(type) {
      this.showType = type
      this.refreshChartInfo()
    },
    refreshChartInfo() {
      if (this.showType !== 'pie') {
        this.axisOption.series[0].type = this.showType
        this.chartObj.setOption(this.axisOption, true)
      } else {
        this.chartObj.setOption(this.pieOption, true)
      }
    },
    /**
     * 搜索点击
     */
    searchClick(params) {
      this.postParams = params
      this.getDataList()
    },
    /**
     * 图表数据
     */
    getDataList() {
      this.loading = true
      biCustomerConversionAPI({
        ...this.postParams,
        type: this.type
      })
        .then(res => {
          this.loading = false
          const list = res.data || []
          this.axisList = list

          // 循环表头
          const fieldList = [{
            name: '日期',
            field: 'name'
          }]

          const pieData = []
          const axisData = []
          const legendData = []

          // 转化率table展示数据
          const listData = [
            { name: '转化率', field: 'rate' },
            { name: '成交客户数', field: 'deal' },
            { name: '新增客户数', field: 'add' }
          ]
          for (let index = 0; index < list.length; index++) {
            const element = list[index]
            pieData.push({ name: element.type, value: element.dealCustomerRate })
            axisData.push(element.dealCustomerRate)
            legendData.push(element.type)
            fieldList.push({
              name: element.type,
              field: `type${index}`
            })
            listData[0][`type${index}`] = element.dealCustomerRate + '%'
            listData[1][`type${index}`] = element.dealCustomerNum
            listData[2][`type${index}`] = element.customerNum
          }

          this.fieldList = fieldList
          this.list = listData

          this.pieOption.legend.data = legendData
          this.pieOption.series[0].data = pieData

          this.axisOption.xAxis[0].data = legendData
          this.axisOption.series[0].data = axisData

          this.refreshChartInfo()
        })
        .catch(() => {
          this.loading = false
        })
    },

    /**
     * 通过回调控制class
     */
    cellClassName({ row, column, rowIndex, columnIndex }) {
      if (column.property !== 'name' && row.field !== 'rate') {
        return 'can-visit--underline'
      }
      return ''
    },

    /**
     * 列表点击
     */
    handleRowClick(row, column, event) {
      if (column.property != 'name' && row.field !== 'rate') {
        this.reportData.title = `${column.label}详情`
        this.reportData.request = biCustomerDetailListAPI

        const values = getDate(column.label, this.postParams.dateFilter)

        this.postParams.searchList = [
          {
            formType: 'datetime',
            name: row.field == 'deal' && this.type == 1 ? 'dealTime' : 'createTime',
            type: 14,
            values: values
          }
        ]

        if (['rate', 'deal'].includes(row.field)) {
          this.postParams.searchList.push({
            formType: 'dealStatus',
            name: 'dealStatus',
            type: 1,
            values: [1]
          })
        }
        const params = { ...this.postParams }
        params.type = 2
        this.reportData.params = params
        this.reportListShow = true
      }
    },

    /** 柱状图 */
    initAxis() {
      this.chartObj = echarts.init(
        document.getElementById('axismain' + this.type)
      )
      this.chartObj.on('click', params => {
        // seriesIndex	1：跟进客户数 2:跟进次数  dataIndex 具体的哪条数据
        // this.getRecordList(params.dataIndex)
      })

      this.axisOption = {
        color: ['#0065FF'],
        toolbox: this.toolbox,
        tooltip: {
          trigger: 'axis',
          formatter: '{b} : {c}% ',
          axisPointer: {
            // 坐标轴指示器，坐标轴触发有效
            type: 'shadow' // 默认为直线，可选为：'line' | 'shadow'
          }
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
            name: '',
            ...this.getChartYAxisStyle({
              axisLabel: {
                formatter: '{value}%'
              }
            })
          }
        ],
        series: [
          {
            ...this.chartDefaultOptions.seriesLine,
            name: '',
            type: this.showType,
            barWidth: 15,
            data: []
          }
        ]
      }
    },
    /** 饼状图 */
    initPie() {
      this.pieOption = {
        color: this.chartColors,
        toolbox: this.toolbox,
        tooltip: {
          trigger: 'item',
          formatter: '{b} : {c}% '
        },
        legend: {
          ...this.chartDefaultOptions.legend,
          type: 'scroll',
          bottom: '0px',
          data: []
        },
        series: [
          {
            name: '',
            type: 'pie',
            radius: '55%',
            center: ['40%', '50%'],
            stillShowZeroSum: false,
            data: [],
            label: {
              color: this.chartDefaultBase.textColor,
              fontWeight: this.chartDefaultBase.fontWeight
            },
            itemStyle: {
              emphasis: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            }
          }
        ]
      }
    }
  }
}
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
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
  padding-bottom: 20px;
}

.main-content {
  height: 100%;
  overflow-y: auto;
}
</style>
