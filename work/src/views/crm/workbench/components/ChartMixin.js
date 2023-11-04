import StatisticsCard from './StatisticsCard'

export default {
  components: {
    StatisticsCard
  },
  props: {
    filterValue: {
      type: Object,
      default: () => {}
    }
  },
  data() {
    return {
      echatsOptions: {
        color: [
          '#FF5630',
          '#FFAB00',
          '#36B37E',
          '#00B8D9',
          '#6554C0',
          '#172B4D',
          '#006644',
          '#008DA6'
        ]
      }
    }
  },
  watch: {
    // 根据筛选条件获取统计数据
    filterValue: {
      handler() {
        if (this.getData) {
          this.getData()
        }
      },
      deep: true
    }
  },
  mounted() {
    // 根据窗口的大小变化实时调整 chart 大小
    this.$bus.on('window-resize', () => {
      if (this.chartObj) {
        this.chartObj.resize()
      }
    })

    if (this.getData) {
      this.getData()
    }
  },
  beforeDestroy() {
    this.$bus.off('window-resize')
  },
  methods: {
    /**
     * 获取请求参数
     */
    getBaseParams() {
      const params = {}
      if (this.filterValue.dataType !== 'custom') {
        params.dataType = this.filterValue.dataType
      } else {
        params.dataType = 0
        params.deptList = (this.filterValue.strucs || [])
          .map(item => item.deptId)

        params.userList = (this.filterValue.users || [])
          .map(item => item.userId)
      }

      if (this.filterValue.timeLine.type) {
        if (this.filterValue.timeLine.type === 'custom') {
          params.dateFilter = 'custom'
          params.startDate = this.filterValue.timeLine.startTime.replace(/\./g, '-')
          params.endDate = this.filterValue.timeLine.endTime.replace(/\./g, '-')
        } else {
          params.dateFilter = this.filterValue.timeLine.value || ''
        }
      }
      return params
    }
  }
}
