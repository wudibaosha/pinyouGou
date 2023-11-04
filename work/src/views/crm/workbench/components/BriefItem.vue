<template>
  <flexbox
    class="brief-item">
    <flexbox class="brief-item__body">
      <div class="info">
        <div class="title">
          {{ data.label }}<i v-if="data.helpType" class="wk wk-icon-fill-help wk-help-tips" :data-type="data.helpType" :data-id="data.helpId" @click.stop="" />
        </div>
        <div
          v-fit-text="{ fontSize: 24 }"
          class="number">
          {{ data.num }}<span class="unit">{{ data.unit }}</span>
        </div>
        <div class="des">
          <template v-if="rateText !== ''">{{ rateText }}<span class="rate" :class="data.status">{{ data.rate }}%<span
            :class="statusIcon"
            class="rate__icon" /></span></template>
        </div>
      </div>
    </flexbox>
    <div class="brief-item__others">
      <el-tooltip
        effect="dark"
        placement="bottom"
        content="近6个月数据变化情况">
        <div
          ref="echartsLine"
          class="echarts-line" />
      </el-tooltip>
    </div>
  </flexbox>
</template>

<script>
import * as echarts from 'echarts'
import FitText from '@/directives/fitText'

export default {
  // 销售简报Item
  name: 'BriefItem',

  directives: {
    FitText
  },

  components: {},

  props: {
    data: Object,
    rateText: String,
    isHover: Boolean // 是否hover效果
  },

  data() {
    return {
      hovering: true,
      chartObj: null,
      chartOption: {
        color: ['#0052CC'],
        grid: {
          left: 0,
          top: 5,
          right: 0,
          bottom: 30
        },
        xAxis: {
          type: 'category',
          data: ['1', '2', '3', '4', '5', '6'],
          axisTick: {
            show: false
          },
          axisLine: {
            show: false
          },
          axisLabel: {
            show: false
          }
        },
        yAxis: {
          type: 'value',
          splitLine: {
            show: false
          }
        },
        series: [
          {
            data: [],
            symbol: 'none',
            smooth: true,
            type: 'line',
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                {
                  offset: 0,
                  color: 'rgba(0, 82, 204, 0.2)'
                },
                {
                  offset: 1,
                  color: 'rgba(0, 82, 204, 0)'
                }
              ])
            }
          }
        ]
      }
    }
  },

  computed: {
    statusIcon() {
      if (!this.data.status) return ''
      return this.data.status === 'top' ? 'wk wk-icon-top2' : 'wk wk-icon-bottom'
    }
  },

  watch: {
    'data.chartData': {
      handler() {
        if (this.data.chartData) {
          this.chartOption.series[0].data = this.data.chartData
          this.$nextTick(() => {
            this.chartObj.setOption(this.chartOption, true)
          })
        }
      },
      immediate: true,
      deep: true
    }
  },

  created() {},

  mounted() {
    window.onresize = () => {
      if (this.chartObj) {
        this.chartObj.resize()
      }
    }
    this.initChart()
  },

  beforeDestroy() {
    window.onresize = null
  },

  methods: {
    /**
     * 初始化图表
     */
    initChart() {
      this.chartObj = echarts.init(this.$refs.echartsLine)
      this.chartObj.setOption(this.chartOption, true)
      if (this.isHover) {
        this.mouseEnter()
      } else {
        this.mouseLeave()
      }
    },

    /**
     * 鼠标移入移出
     */
    mouseEnter() {
      this.hovering = true
      this.chartOption.color = ['#DEEBFF']
      this.chartOption.series[0].areaStyle.color = new echarts.graphic.LinearGradient(0, 0, 0, 1, [
        {
          offset: 0,
          color: 'rgba(222,235,255, 0.5)'
        },
        {
          offset: 1,
          color: 'rgba(222,235,255, 0)'
        }
      ])
      this.chartObj.setOption(this.chartOption, true)
    },

    mouseLeave() {
      this.hovering = false
      this.chartOption.color = ['#0052CC']
      this.chartOption.series[0].areaStyle.color = new echarts.graphic.LinearGradient(0, 0, 0, 1, [
        {
          offset: 0,
          color: 'rgba(0, 82, 204, 0.2)'
        },
        {
          offset: 1,
          color: 'rgba(0, 82, 204, 0)'
        }
      ])
      this.chartObj.setOption(this.chartOption, true)
    }
  }
}
</script>

<style lang="scss" scoped>
.brief-item {
  width: calc(25% - 16px);
  height: 112px;
  margin: $--interval-base;
  cursor: pointer;
  border-radius: $--border-radius-base;
  box-shadow: $--box-shadow-bottom-light;

  .brief-item__body {
    flex: 5;
    height: 100%;
    padding: #{$--interval-base * 2};
    overflow: hidden;

    .icon-box {
      flex-shrink: 0;
      width: 36px;
      height: 36px;
      margin-right: 10px;
      margin-left: 15px;
      line-height: 36px;
      text-align: center;
      border-radius: 50%;

      .icon {
        font-size: 19px;
        color: white;
      }
    }

    .info {
      overflow: hidden;

      .title {
        color: $--color-n300;
      }

      .number {
        margin-top: 16px;
        margin-right: 5px;
        overflow: hidden;
        font-size: 20px;
        line-height: 1;
        white-space: nowrap;

        .unit {
          margin-left: 4px;
          font-size: 14px;
        }
      }

      .des {
        margin-top: #{$--interval-base * 2};
        color: $--color-n300;

        .rate {
          margin-left: $--interval-base;
          font-size: 14px;

          .rate__icon {
            margin-left: 2px;
            font-size: 12px;
          }

          &.bottom {
            color: $--color-g300;
          }

          &.top {
            color: $--color-r300;
          }
        }
      }
    }
  }

  .brief-item__others {
    position: relative;
    flex: 4;
    flex-shrink: 0;
    overflow: hidden;
  }

  .echarts-line {
    width: 100%;
    height: 80px;
    margin-top: 20px;
  }

  &.is-current {
    background-color: $--color-primary;

    .title,
    .number,
    .des,
    .rate {
      color: white !important;
    }
  }

  &:hover {
    box-shadow: $--box-shadow-hover-bottom-light;
  }
}
</style>
