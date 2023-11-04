<template>
  <statistics-card
    v-loading="loading"
    class="performance-chart"
    icon="wk wk-icon-Completion-rate"
    @unfold-change="handleUpdateUnfold">
    <template slot="title-left">业绩指标完成率<i class="wk wk-icon-fill-help wk-help-tips" data-type="4" data-id="21" /></template>

    <template slot="filter-left">
      <el-select
        v-model="optionValue"
        mode="no-border"
        @change="handleCommand">
        <el-option
          v-for="item in options"
          :key="item.value"
          :label="item.name"
          :value="item.value" />
      </el-select>
    </template>

    <div id="performance-chart" />
    <flexbox justify="center" class="info-box">
      <div direction="column" class="info-item">
        <span v-if="noAchievement" class="label mark">暂无目标<el-button
          v-if="noAchievement && $auth('manage.crm.achievement')"
          type="link"
          style="padding: 0; margin-left: 12px;"
          @click="enterSet">设置目标</el-button></span>
        <template v-else>
          <span class="label mark">目标金额</span>
          <span class="value">{{ data.achievementMoneys }}</span>
        </template>
      </div>
      <div v-if="optionValue === 1" direction="column" class="info-item">
        <span class="label mark is-light">完成金额</span>
        <span class="value">{{ data.money | separator }}</span>
      </div>
      <div v-if="optionValue === 2" direction="column" class="info-item">
        <span class="label mark is-light">完成金额</span>
        <span class="value">{{ data.money | separator }}</span>
      </div>
    </flexbox>
  </statistics-card>
</template>

<script>
import {
  crmIndexAchievementDataAPI
} from '@/api/crm/workbench'

import * as echarts from 'echarts'
import ChartMixin from './ChartMixin'

export default {
  name: 'PerformanceChart',
  mixins: [ChartMixin],
  data() {
    return {
      chartOption: {
        color: ['#0052CC'],
        tooltip: {
          textStyle: {
            fontWeight: 500,
            color: '#172B4D'
          },
          formatter: function(data) {
            return `${data.seriesName}<br/>${data.name} : ${data.value}%`
          }
        },
        series: [
          {
            type: 'gauge',
            name: '',
            radius: '85%',
            // 标题 完成率
            title: {
              fontSize: 14,
              color: '#42526e',
              offsetCenter: [0, '60%']
            },
            // 值
            detail: {
              formatter: '{value}%',
              fontSize: 20,
              color: '#20253A'
            },
            splitNumber: 4, // 分割段数
            data: [{ value: 0, name: '完成率', detail: {
              formatter: function(value) {
                if (value === -1) { // -1  没有目标
                  return ''
                }
                return `${value}%`
              }
            }}],
            progress: {
              roundCap: true,
              show: true,
              width: 6
            },
            axisLine: {
              roundCap: true,
              lineStyle: {
                color: [[1, '#A0A5BA']],
                width: 4
              }
            },
            axisTick: {
              show: false// 是否显示刻度
            },
            splitLine: {
              distance: 4,
              length: 8,
              lineStyle: {
                width: 2
              }
            },
            axisLabel: {
              color: '#172B4D',
              fontWeight: 500,
              fontSize: 14
            },
            pointer: {
              width: 6,
              length: '34%',
              itemStyle: {
                color: '#0052CC'
              }
            },
            anchor: {
              show: true,
              showAbove: true,
              size: 18,
              itemStyle: {
                borderColor: '#0052CC',
                borderWidth: 5
              }
            }
          }
        ]
      },
      loading: false,
      data: {
        achievementMoneys: 0,
        contractMoneys: 0,
        receivablesMoneys: 0
      },
      options: [
        { name: '回款金额', value: 2 },
        { name: '合同金额', value: 1 }
      ],
      optionValue: 2
    }
  },
  computed: {
    noAchievement() {
      if (this.data) {
        return this.data.achievementMoneys === 0
      }
      return false
    }
  },
  mounted() {
    this.initChart()
  },
  methods: {
    initChart() {
      this.chartObj = echarts.init(document.getElementById('performance-chart'))
      this.chartObj.setOption(this.chartOption, true)
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

    /**
     * 获取统计数据
     */
    getData() {
      this.loading = true
      crmIndexAchievementDataAPI({
        ...this.getBaseParams(),
        type: this.optionValue
      }).then(res => {
        this.loading = false
        if (res.data) {
          const resData = res.data || {}
          this.data = resData
          const seriesData = this.chartOption.series[0].data[0]
          // seriesData.title = {
          //   show: !noAchievement // 是否展示提示
          // }
          seriesData.name = '完成率'
          // 没有目标完成率是0
          seriesData.value = this.noAchievement ? 0 : (resData.proportion || '0')
          const item = this.options.find(o => o.value === this.optionValue) || {}
          this.chartOption.series[0].name = item.name || ''

          this.chartOption.series[0].splitLine.lineStyle.color = this.noAchievement ? '#A0A5BA' : '#0052CC'
          this.chartObj.setOption(this.chartOption, true)
        }
      }).catch(() => {
        this.loading = false
      })
    },
    /**
     * 下拉菜单选项选择
     * @param index 选项序号
     */
    handleCommand() {
      this.getData()
    },

    /**
     * 去设置
     */
    enterSet() {
      this.$router.push({
        name: 'crmBizGoals'
      })
    }
  }
}
</script>

<style scoped lang="scss">
  @import "style";

  .statistics-card {
    height: auto !important;
  }

  .performance-chart {
    position: relative;

    .el-dropdown-selfdefine {
      display: inline-block;
      cursor: pointer;
    }

    #performance-chart {
      width: 100%;
      height: 260px;
      margin-top: 10px;
    }

    .info-box {
      position: absolute;
      bottom: 24px;
      left: 0;
      width: 100%;

      .info-item {
        margin: 0 5px;

        > .label {
          position: relative;
          display: inline-block;
          color: $--color-text-secondary;
        }

        > .value {
          margin-left: 12px;
          color: $--color-black;
        }

        .mark {
          &::before {
            position: absolute;
            top: 4px;
            left: -12px;
            width: 8px;
            height: 8px;
            content: " ";
            background-color: #a0a5ba;
            border-radius: 4px;
          }

          &.is-light {
            &::before {
              background-color: $--color-primary;
            }
          }
        }
      }

      .info-item + .info-item {
        margin-left: 32px;
      }
    }
  }
</style>
