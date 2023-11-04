<template>
  <statistics-card
    v-loading="loading"
    icon="wk wk-target-solid"
    @unfold-change="handleUpdateUnfold">
    <template slot="title-left">{{ typeName }}金额目标及完成情况<i class="wk wk-icon-fill-help wk-help-tips" style="margin-left: 4px;" data-type="4" data-id="14" /></template>

    <el-select
      slot="filter-left"
      v-model="optionValue"
      mode="no-border"
      @change="handleCommand">
      <el-option
        v-for="item in options"
        :key="item.value"
        :label="item.name"
        :value="item.value" />
    </el-select>

    <wk-toggle-button
      slot="title-right"
      v-model="typeValue"
      @change="getData">
      <wk-toggle-item
        v-for="item in [{name:'折线图', value: 'line'}, {name:'柱状图', value: 'bar'}]"
        :key="item.value"
        :label="item.name"
        :value="item.value" />
    </wk-toggle-button>

    <el-button v-if="hasSetAuth" slot="filter-right" style="padding: 0;" type="link" @click="enterSetPage">设置目标</el-button>

    <el-empty
      v-show="errorShow"
      style="padding-top: 75px;"
      :image="require('@/assets/img/empty/data.png')"
      description="不能同时选择部门和员工的目标及完成情况" />
    <div v-show="!errorShow" id="sale-statistics" />
  </statistics-card>
</template>

<script>
import { crmIndexSaletrendAPI } from '@/api/crm/workbench'

import { WkToggleButton, WkToggleItem } from '@/components/NewCom/WkToggleButton/index'

import * as echarts from 'echarts'
import ChartMixin from './ChartMixin'
import { mapGetters } from 'vuex'
import xrTheme from '@/styles/xr-theme.scss'
import moment from 'moment'
import { isArray } from '@/utils/types'

export default {
  name: 'SaleStatistics',
  components: {
    WkToggleButton,
    WkToggleItem
  },
  mixins: [ChartMixin],
  data() {
    return {
      typeValue: 'line',
      sortList: [
        { name: '天', list: ['today', 'yesterday', 'tomorrow'] },
        { name: '周', list: ['week', 'lastWeek', 'nextWeek'] },
        { name: '月', list: ['month', 'lastMonth', 'nextMonth'] },
        { name: '季度', list: ['quarter', 'lastQuarter', 'nextQuarter'] },
        { name: '年度', list: ['year', 'lastYear', 'nextYear'] }
      ],
      options: [
        { name: '合同金额', value: 1 },
        { name: '回款金额', value: 2 }
      ],
      optionValue: 1,
      chartOption: {
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            // 坐标轴指示器，坐标轴触发有效 默认为直线，可选为：'line' | 'shadow'
            type: 'shadow'
          }
        },
        grid: {
          top: '16px',
          left: '8px',
          right: '8px',
          bottom: '46px',
          containLabel: true
        },
        legend: {
          bottom: '10px',
          data: ['当月目标金额', '实际完成金额'],
          textStyle: {
            color: xrTheme.colorBlack,
            fontWeight: xrTheme.axisLabelFontWeight
          }
        },
        xAxis: [
          {
            type: 'category',
            data: [],
            // 坐标轴刻度相关设置
            axisTick: {
              lineStyle: { width: 0 }
            },
            axisLabel: {
              // color: xrTheme.colorBlack,
              fontWeight: xrTheme.axisLabelFontWeight
            },
            axisLine: {
              lineStyle: {
                // color: xrTheme.axisLineColor
              }
            },
            // 坐标轴在 grid 区域中的分隔线
            splitLine: {
              show: false
            }
          }
        ],
        yAxis: [
          {
            type: 'value',
            axisTick: {
              show: false
            },
            axisLine: {
              lineStyle: { width: 0 }
            },
            axisLabel: {
              // color: xrTheme.colorBlack,
              fontWeight: xrTheme.axisLabelFontWeight
            },
            splitLine: {
              lineStyle: {
                // color: xrTheme.axisLineColor
              }
            }
          }
        ],
        series: []
      },
      chartObj: null,
      loading: false,
      requestParams: null // 用来判断是否多选员工部门
    }
  },
  computed: {
    ...mapGetters(['manage']),
    // 目标设置权限
    hasSetAuth() {
      return this.manage && this.manage.crm && this.manage.crm.achievement
    },
    // 类型名字
    typeName() {
      return {
        1: '合同',
        2: '回款'
      }[this.optionValue]
    },
    // 不能同事选择
    errorShow() {
      if (this.requestParams) {
        return isArray(this.requestParams.deptList) && this.requestParams.deptList.length > 0 &&
         isArray(this.requestParams.userList) && this.requestParams.userList.length > 0
      }
      return false
    }
  },
  mounted() {
    this.initChart()
    // 请求在 ChartMixin 混入
  },
  methods: {
    initChart() {
      this.chartObj = echarts.init(document.getElementById('sale-statistics'))
      this.chartObj.setOption(this.chartOption, true)
    },

    /**
     * 下拉菜单选项选择
     * @param index 选项序号
     */
    handleCommand() {
      this.getData()
    },

    /**
     * 切换展开/闭合状态
     */
    handleUpdateUnfold(isUnfold) {
      if (isUnfold) {
        this.$nextTick(() => {
          this.initChart()
        })
      }
    },

    getData() {
      this.loading = true
      const params = {
        type: this.optionValue,
        ...this.getBaseParams()
      }
      this.requestParams = params
      crmIndexSaletrendAPI(params).then(res => {
        // this.trendData = {
        //   totlaContractMoney: res.data.totlaContractMoney,
        //   totlaReceivablesMoney: res.data.totlaReceivablesMoney
        // }
        const paramsType = params.dateFilter // 筛选时间关键字 today 等

        const list = res.data || []
        const achievementList = []
        const moneyList = []
        const xAxisData = []
        let noAchievement = true // 是否有设置目标，如果有任何一个值大于0  该为false 有
        const filterDate = this.getFilterDateMoment(paramsType)

        for (let index = 0; index < list.length; index++) {
          const element = list[index]
          if (element.achievement > 0) {
            noAchievement = false
          }

          // 获取筛选条件所在值位置
          const isFilterTime = this.getDataIsFilterTime(paramsType, element.type, filterDate)
          achievementList.push({
            value: element.achievement,
            symbolSize: isFilterTime ? 14 : 8,
            itemStyle: {
              color: '#42526E',
              shadowColor: isFilterTime ? 'rgba(66,82,110, 0.5)' : 'transparent',
              shadowBlur: isFilterTime ? 10 : 0,
              shadowOffsetY: 3,
              borderColor: 'white',
              borderWidth: isFilterTime && this.typeValue === 'line' ? 2 : 0
            }
          })
          moneyList.push({
            value: element.money,
            symbolSize: isFilterTime ? 14 : 8,
            itemStyle: {
              color: isFilterTime ? '#36B37E' : '#0052CC', // 00875A
              shadowColor: isFilterTime ? 'rgba(54,179,126, 0.5)' : 'transparent',
              shadowBlur: isFilterTime ? 10 : 0,
              shadowOffsetY: 3,
              borderColor: 'white',
              borderWidth: isFilterTime && this.typeValue === 'line' ? 2 : 0
            }
          })
          xAxisData.push(element.type)
        }
        this.chartOption.xAxis[0].data = xAxisData.map(str => str.replace(' ', '\n'))

        let targetName = ''
        let seriesOption = {}
        if (['today', 'yesterday', 'tomorrow'].includes(paramsType)) {
          targetName = '平均每天目标金额'
          seriesOption = {
            itemStyle: {
              color: '#97A0AF'
            },
            lineStyle: {
              color: '#97A0AF',
              type: 'dashed'
            }
          }
        } else if (['week', 'lastWeek', 'nextWeek'].includes(paramsType)) {
          targetName = '平均每周目标金额'
          seriesOption = {
            itemStyle: {
              color: '#97A0AF'
            },
            lineStyle: {
              color: '#97A0AF',
              type: 'dashed'
            }
          }
        } else if (['quarter', 'lastQuarter', 'nextQuarter'].includes(paramsType)) {
          targetName = '季度目标金额'
        } else if (['year', 'lastYear', 'nextYear'].includes(paramsType)) {
          targetName = '年度目标金额'
        } else {
          targetName = '当月目标金额'
        }
        this.chartOption.series = this.getChartSeries(achievementList, moneyList, targetName, seriesOption, noAchievement)
        this.chartOption.legend.data[0] = targetName
        this.chartOption.legend.itemWidth = this.typeValue === 'line' ? 25 : 14
        this.chartOption.color = ['#42526E', '#0052CC']
        this.chartObj.setOption(this.chartOption, true)
        this.loading = false
      }).catch(() => {
        this.loading = false
      })
    },

    /**
     * 获取数据是当前时间
     */
    getDataIsFilterTime(type, value, filterDate) {
      if (['today', 'yesterday', 'tomorrow'].includes(type)) {
        return value === filterDate
      } else if (['week', 'lastWeek', 'nextWeek'].includes(type)) {
        return value.includes(filterDate)
      } else if (['month', 'lastMonth', 'nextMonth'].includes(type)) {
        const month = value.split('-')[1]
        return month === filterDate
      } else if (['quarter', 'lastQuarter', 'nextQuarter'].includes(type)) {
        const quarterValue = filterDate.format('YYYY') + filterDate.quarters()
        return value.replace('年', '').includes(quarterValue)
      } else if (['year', 'lastYear', 'nextYear'].includes(type)) {
        return value === filterDate
      }
    },

    /**
     * 获取筛选date
     */
    getFilterDateMoment(type) {
      if (['today', 'yesterday', 'tomorrow'].includes(type)) {
        return {
          today: moment().format('MM-DD'),
          yesterday: moment().subtract(1, 'days').format('MM-DD'),
          tomorrow: moment().add(1, 'days').format('MM-DD')
        }[type]
      } else if (['week', 'lastWeek', 'nextWeek'].includes(type)) {
        moment().startOf('week')
        return {
          week: moment().startOf('week').format('MM-DD'),
          lastWeek: moment().subtract(1, 'weeks').startOf('week').format('MM-DD'),
          nextWeek: moment().add(1, 'weeks').startOf('week').format('MM-DD')
        }[type]
      } else if (['month', 'lastMonth', 'nextMonth'].includes(type)) {
        return {
          month: moment().format('MM'),
          lastMonth: moment().subtract(1, 'months').format('MM'),
          nextMonth: moment().add(1, 'months').format('MM')
        }[type]
      } else if (['quarter', 'lastQuarter', 'nextQuarter'].includes(type)) {
        return {
          quarter: moment(),
          lastQuarter: moment().subtract(1, 'quarters'),
          nextQuarter: moment().add(1, 'quarters')
        }[type]
      } else if (['year', 'lastYear', 'nextYear'].includes(type)) {
        return {
          year: moment().format('YYYY'),
          lastYear: moment().subtract(1, 'years').format('YYYY'),
          nextYear: moment().add(1, 'years').format('YYYY')
        }[type]
      }
    },

    /**
     * 获取展示系列
     */
    getChartSeries(achievementList, moneyList, targetName, seriesOption, noAchievement) {
      const temps = []
      if (!noAchievement) {
        temps.push({
          name: targetName,
          type: this.typeValue,
          barMaxWidth: 15,
          symbol: 'circle',
          symbolSize: 8,
          stack: 'one',
          smooth: true,
          data: achievementList,
          ...seriesOption
        })
      }

      temps.push({
        name: '实际完成金额',
        type: this.typeValue,
        barMaxWidth: 15,
        symbol: 'circle',
        symbolSize: 8,
        stack: 'two',
        smooth: true, // 不同系列的柱间距离，为百分比（如 '30%'，表示柱子宽度的 30%）。
        data: moneyList,
        itemStyle: {
          color: '#0052CC'
        },
        lineStyle: {
          color: '#0052CC'
        }
      })
      return temps
    },

    /**
     * 进入设置页面
     */
    enterSetPage() {
      this.$router.push({
        name: 'crmBizGoals'
      })
    }
  }
}
</script>

<style scoped lang="scss">
  @import "style";

  #sale-statistics {
    width: 100%;
    height: 320px;
    margin-top: 16px;
  }
</style>
