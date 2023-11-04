<template>
  <div
    v-loading="loading"
    class="main-container">
    <filtrate-handle-view
      :show-business-select="true"
      title="销售漏斗"
      class="filtrate-bar"
      module-type="business"
      @load="loading=true"
      @change="getDataList" />
    <div class="content">
      <div class="axis-content">
        <div id="axismain" />
      </div>
      <div class="table-content">
        <el-table
          v-if="showTable"
          :data="list"
          :cell-class-name="cellClassName"
          :class="WKConfig.tableStyle.class"
          :stripe="WKConfig.tableStyle.stripe"
          :summary-method="getSummaries"
          height="400"
          show-summary
          highlight-current-row
          @sort-change="({ prop, order }) => mixinSortFn(list, prop, order)"
          @row-click="handleRowClick">
          <el-table-column
            v-for="(item, index) in fieldList"
            :key="index"
            :prop="item.field"
            :label="item.name"
            :sortable="item.sortable"
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
import BaseMixin from '../mixins/Base'
import SortMixin from '../mixins/Sort'
import DetailMixin from '../mixins/Detail'
import * as echarts from 'echarts'
import { biBusinessFunnelAPI } from '@/api/bi/bi'
import {
  biBusinessDetailListAPI,
  biBusinessWinOrFailDetailListAPI
} from '@/api/bi/business'

export default {
  /** 销售漏斗 */
  name: 'FunnelStatistics',
  components: {},
  mixins: [BaseMixin, SortMixin, DetailMixin],
  data() {
    return {
      loading: false,

      list: [],
      fieldList: [
        { field: 'settingName', name: '阶段' },
        { field: 'businessMoney', name: '金额', sortable: 'custom' },
        { field: 'businessNum', name: '商机数', sortable: 'custom' }
      ],

      postParams: {}, // 筛选参数
      businessItem: [],

      // 可以点击的数据
      detailFields: [
        {
          name: 'businessNum',
          flowName: true,
          isBusiness: true,
          crmType: 'business',
          list: [],
          request: biBusinessDetailListAPI,
          params: null
        }
      ],

      funnelOption: null
    }
  },
  computed: {},
  mounted() {
    this.initAxis()
  },
  methods: {
    /**
     * 图表数据
     */
    getDataList(params) {
      const { businessItem, ...rest } = params
      this.businessItem = businessItem.filter(ite => ite).map(item => {
        if (item.flowId == params.typeId) {
          return item
        }
      })
      this.postParams = rest
      this.loading = true
      biBusinessFunnelAPI(rest)
        .then(res => {
          this.loading = false
          this.list = res.data
          const data = []
          let sumCount = 0
          for (let index = 0; index < res.data.length; index++) {
            const element = res.data[index]

            element.settingName = {
              1: '赢单',
              2: '输单'
            }[element.isEnd] || element.settingName

            data.push({
              name: (element.settingName || '') + '(' + element.businessMoney + '元)',
              value: parseFloat(element.businessNum)
            })
            sumCount += parseFloat(element.businessNum)
          }

          this.funnelOption.series[0].data = data
          this.funnelOption.legend.data = data.map(o => o.name)
          this.funnelOption.series[0].max = sumCount < 1 ? 1 : sumCount
          this.chartObj.setOption(this.funnelOption, true)
        })
        .catch(() => {
          this.loading = false
        })
    },

    /**
     * 合计
     */
    getSummaries(param) {
      const { columns, data } = param
      const sums = []
      columns.forEach((column, index) => {
        if (index === 0) {
          sums[index] = '合计'
          return
        }
        const values = data.map(item => Number(item[column.property]))
        if (!values.every(value => isNaN(value))) {
          sums[index] = values.reduce((prev, curr) => {
            const value = Number(curr)
            if (!isNaN(value)) {
              return prev + curr
            } else {
              return prev
            }
          }, 0)
          if (index === 1) {
            sums[index] = sums[index].toFixed(2)
          }
        } else {
          sums[index] = ''
        }
      })
      return sums
    },

    /** 销售漏斗 */
    initAxis() {
      var chartObj = echarts.init(document.getElementById('axismain'))
      var option = {
        toolbox: this.toolbox,
        tooltip: {
          trigger: 'item',
          formatter: '{b} <br/> 商机个数: {c}个'
        },
        calculable: true,
        legend: {
          data: [],
          // 图例文本格式化
          formatter: function(name) {
            return name.split('(')[0]
          },
          textStyle: {
            color: this.chartDefaultBase.textColor,
            fontWeight: this.chartDefaultBase.fontWeight
          }
        },
        grid: {
          left: 0,
          right: 0,
          bottom: 0,
          top: 0
        },
        color: this.chartColors,
        series: [
          {
            name: '漏斗图',
            type: 'funnel',
            left: '20%',
            width: '56%',
            /** 数据排序 */
            sort: 'none',
            /** 数据图形间距。 */
            gap: 2,
            label: {
              color: this.chartDefaultBase.textColor,
              fontWeight: this.chartDefaultBase.fontWeight
            },
            labelLine: {
              length: 20,
              lineStyle: {
                width: 2,
                type: 'solid'
              }
            },
            data: []
          }
        ]
      }

      chartObj.setOption(option, true)
      this.funnelOption = option
      this.chartObj = chartObj
    },

    handleRowClick(row, column) {
      if (this.getDetailFieldList(column)) {
        const {
          typeId,
          dateFilter,
          dataType,
          startDate,
          endDate,
          deptList,
          userList
        } = this.postParams

        const extraParams = {}
        if (!dataType) {
          extraParams.deptList = deptList
          extraParams.userList = userList
        }
        extraParams.dataType = dataType

        let searchList = []
        let request = null
        if (row.isEnd) {
          extraParams.categoryId = typeId
          extraParams.dateFilter = dateFilter
          if (!dataType) {
            extraParams.startDate = startDate
            extraParams.endDate = endDate
          }
          request = biBusinessWinOrFailDetailListAPI
        } else {
          request = biBusinessDetailListAPI
          const { values } = this.getValues(row, column)
          const businessName = this.businessItem[0]
          searchList = [
            {
              formType: 'datetime',
              name: 'createTime',
              type: 14,
              values
            },
            {
              formType: 'business_cause',
              name: 'flowName',
              type: 1,
              values: [businessName.flowName]
            },
            {
              formType: 'business_cause',
              name: 'settingName',
              stage: true,
              type: 1,
              values: [row.settingName]
            }
          ]
        }

        const params = {
          ...extraParams,
          searchList,
          limit: 15,
          page: 1,
          search: '',
          type: row.isEnd || 5
        }

        const field = this.getCurrentClickField(column)
        this.reportData = {
          ...this.reportData,
          ...field,
          request,
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
</style>
