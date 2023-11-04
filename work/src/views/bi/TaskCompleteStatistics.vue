<template>
  <div
    v-loading="loading"
    class="main-container">
    <filtrate-handle-view
      :show-year-select="true"
      :show-dept-select="true"
      :show-user-select="true"
      title="业绩目标完成情况"
      class="filtrate-bar"
      @load="loading=true"
      @change="handleToFilter">
      <el-select
        slot="after-time"
        v-model="typeSelect"
        class="type-select">
        <el-option
          v-for="item in [{label:'合同金额', value:1},{label:'回款金额', value:2}]"
          :key="item.value"
          :label="item.label"
          :value="item.value" />
      </el-select>
    </filtrate-handle-view>

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
          v-if="showTable"
          :data="list"
          :class="WKConfig.tableStyle.class"
          :stripe="WKConfig.tableStyle.stripe"
          height="300"
          highlight-current-row>
          <el-table-column
            v-for="(item, index) in fieldList"
            :key="index"
            :prop="item.field"
            :label="item.name"
            align="center"
            header-align="center"
            show-overflow-tooltip>
            <template v-if="item.children">
              <el-table-column
                v-for="(child, childIndex) in item.children"
                :key="childIndex"
                :prop="child.field"
                :label="child.name"
                align="center"
                header-align="center"
                show-overflow-tooltip />
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </div>
</template>

<script>
import {
  biAchievementStatisticsAPI,
  biAchievementStatisticsExportAPI
} from '@/api/bi/bi'

import BaseMixin from './mixins/Base'
import SortMixin from './mixins/Sort'
import * as echarts from 'echarts'
import { floatAdd } from '@/utils'
import { debounce } from 'throttle-debounce'

export default {
  /** 业绩目标完成情况 */
  name: 'TaskCompleteStatistics',
  mixins: [BaseMixin, SortMixin],
  data() {
    return {
      pickerOptions: {
        disabledDate(time) {
          return time.getTime() > Date.now()
        }
      },
      loading: false,
      postParams: {},

      dateSelect: '', // 选择的date
      typeSelect: 1, // 类型选择 1销售（目标）2回款（目标）

      // 部门员工
      dataSelect: 1,
      // 部门员工选择值
      deptSelectValue: '',
      userSelectValue: '',

      list: [],
      fieldList: [],

      axisChart: null, // 柱状图
      axisOption: null
    }
  },

  mounted() {
    this.debouncedResize = debounce(300, this.resizeFn)

    this.$nextTick(() => {
      window.addEventListener('resize', this.debouncedResize)
    })

    this.initAxis()

    const keysName = ['名称', '年度目标', '第一季度', '1月', '2月', '3月', '第二季度', '4月', '5月', '6月', '第三季度', '7月', '8月', '9月', '第四季度', '10月', '11月', '12月']
    const keys = ['name', 'Year', 'Quarter1', '1', '2', '3', 'Quarter2', '4', '5', '6', 'Quarter3', '7', '8', '9', 'Quarter4', '10', '11', '12']
    for (let index = 0; index < keysName.length; index++) {
      const key = keysName[index]
      if (index === 0) {
        this.fieldList.push({ field: keys[index], name: key })
      } else {
        const children = [
          { field: `achievement${keys[index]}`, name: '目标' },
          { field: `money${keys[index]}`, name: '完成' },
          { field: `rate${keys[index]}`, name: '完成率' }
        ]

        this.fieldList.push({ field: '', name: key, children: children })
      }
    }
  },

  beforeDestroy() {
    window.removeEventListener('resize', this.debouncedResize)
  },

  methods: {
    /**
     * 窗口尺寸发生改变实时调整 EChart 尺寸
     */
    resizeFn() {
      if (this.axisChart) {
        this.axisChart.resize()
      }
    },

    getDataList() {
      this.loading = true
      biAchievementStatisticsAPI(this.postParams)
        .then(res => {
          this.refreshTableHeadAndChartInfo()
          if (res.data && res.data.length > 0) {
            this.list = []
            // 月份合计list
            const sumList = []
            for (let index = 0; index < 12; index++) {
              sumList.push({
                achievement: 0,
                money: 0
              })
            }

            for (let index = 0; index < res.data.length; index++) {
              const element = res.data[index]
              // 循环出表头展示字段 注入element
              // 一条数据的开始 季度数据
              let quarter = {
                achievement: 0,
                money: 0
              }

              // 年数据
              const year = {
                achievement: 0,
                money: 0
              }

              for (let childIndex = 0; childIndex < element.biMonthReceivedMoneyVOS.length; childIndex++) {
                const child = element.biMonthReceivedMoneyVOS[childIndex]

                // 表展示数据
                const keys = ['achievement', 'rate', 'money']
                // eslint-disable-next-line no-unused-vars
                for (const key of keys) {
                  const childValue = child[key]
                  element[`${key}${childIndex + 1}`] = childValue

                  if (quarter.hasOwnProperty(key)) {
                    quarter[key] = floatAdd(quarter[key], childValue)
                    year[key] = floatAdd(year[key], childValue)
                  }
                }

                // 获取季度值
                if (childIndex % 3 === 2) {
                  const quarterIndex = parseInt(childIndex / 3) + 1
                  element[`achievementQuarter${quarterIndex}`] = quarter.achievement
                  element[`moneyQuarter${quarterIndex}`] = quarter.money
                  element[`rateQuarter${quarterIndex}`] = quarter.money ? (quarter.money / quarter.achievement * 100 + 0.001).toFixed(2).toString() : '0.00'
                  // 重置到新季度初始值
                  quarter = {
                    achievement: 0,
                    money: 0
                  }
                }

                // 合计数据
                const sumItem = sumList[childIndex]
                sumItem.achievement = floatAdd(sumItem.achievement, child.achievement)
                sumItem.money = floatAdd(sumItem.money, child.money)
              }
              // 获取年
              element['achievementYear'] = year.achievement
              element['moneyYear'] = year.money
              element['rateYear'] = year.money ? (year.money / year.achievement * 100 + 0.001).toFixed(2).toString() : '0.00'
              this.list.push(element)
            }

            const receivables = []
            const achievements = []
            const rates = []

            for (let index = 0; index < sumList.length; index++) {
              const element = sumList[index]
              receivables.push(element.money)
              achievements.push(element.achievement)

              if (element.achievement) {
                rates.push(element.money ? (element.money / element.achievement * 100 + 0.001).toFixed(2).toString() : '0.00')
              } else {
                rates.push('--')
              }
            }

            this.axisOption.series[0].data = receivables
            this.axisOption.series[1].data = achievements
            this.axisOption.series[2].data = rates
            this.axisChart.setOption(this.axisOption, true)
          } else {
            this.list = []
            this.axisOption.series[0].data = []
            this.axisOption.series[1].data = []
            this.axisOption.series[2].data = []
            this.axisChart.setOption(this.axisOption, true)
          }

          this.loading = false
        })
        .catch(() => {
          this.loading = false
        })
    },

    /**
     * 去搜索
     */
    handleToFilter(params, others = {}) {
      // 通过 isUser 来判断选择的是员工还是部门
      params.module = this.typeSelect
      params.isUser = params.userList ? 1 : 0
      this.postParams = params
      this.getDataList()
    },

    /**
     * 刷新表头和图标关键字
     */
    refreshTableHeadAndChartInfo() {
      const typeName = this.typeSelect === 1 ? '合同金额' : '回款金额'
      this.fieldList[1].name = typeName + '(元)'
      this.axisOption.legend.data[0] = typeName
      this.axisOption.series[0].name = typeName
    },

    /** 柱状图 */
    initAxis() {
      const axisChart = echarts.init(document.getElementById('axismain'))

      const option = {
        color: ['#0065FF', '#00B8D9', '#FF5630'],
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            // 坐标轴指示器，坐标轴触发有效
            type: 'shadow' // 默认为直线，可选为：'line' | 'shadow'
          }
        },
        legend: {
          ...this.chartDefaultOptions.legend,
          data: ['合同金额', '目标', '完成率']
        },
        grid: this.chartDefaultOptions.grid,
        xAxis: [
          {
            ...this.chartXAxisStyle,
            type: 'category',
            data: Array.from({ length: 12 }, (o, i) => `${i + 1}月`)
          }
        ],
        yAxis: [
          {
            ...this.getChartYAxisStyle({
              axisLabel: {
                formatter: '{value}元'
              }
            }),
            type: 'value',
            name: '合同金额'
          },
          {
            ...this.getChartYAxisStyle({
              axisLabel: {
                formatter: '{value}%'
              }
            }),
            type: 'value',
            name: '完成率'
          }
        ],
        series: [
          {
            name: '合同金额',
            type: 'bar',
            yAxisIndex: 0,
            barMaxWidth: 15,
            label: this.chartDefaultBase.label,
            data: []
          },
          {
            name: '目标',
            type: 'bar',
            yAxisIndex: 0,
            barMaxWidth: 15,
            label: this.chartDefaultBase.label,
            data: []
          },
          {
            ...this.chartDefaultOptions.seriesLine,
            name: '完成率',
            type: 'line',
            yAxisIndex: 1,
            data: []
          }
        ]
      }

      axisChart.setOption(option, true)
      this.axisOption = option
      this.axisChart = axisChart
    },

    /**
     * 导出点击
     */
    exportClick() {
      this.requestExportInfo(biAchievementStatisticsExportAPI, this.postParams)
    }
  }
}
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
@import "./styles/detail.scss";

.type-select {
  width: 120px;
  margin-right: 16px;
}
</style>

