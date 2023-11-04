export default {
  data() {
    return {
      summaryData: null
    }
  },
  methods: {
    getSummariesData(data) {
      this.summaryData = data || {}
    },

    /**
     * 表尾合计行
     * @param params
     * @return {*[]}
     */
    getSummaries(params) {
      const { columns, data } = params
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
        } else {
          sums[index] = ''
        }
      })

      return sums
    }
  }
}
