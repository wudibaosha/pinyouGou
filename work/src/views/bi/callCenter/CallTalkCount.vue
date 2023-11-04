<template>
  <div
    v-loading="loading"
    class="main-container">
    <filtrate-handle-view
      class="filtrate-bar"
      module-type="product"
      title="员工通话记录分析"
      @load="loading=true"
      @change="getList" />
    <div class="content">
      <el-table
        id="crm-table"
        :data="list"
        :class="WKConfig.tableStyle.class"
        :stripe="WKConfig.tableStyle.stripe"
        :height="tableHeight"
        :cell-style="cellStyle"
        style="width: 100%;"
        @row-click="handleRowClick">
        <!--        :span-method="objectSpanMethod"-->
        <el-table-column
          v-for="(item, index) in headFieldList"
          :key="index"
          :formatter="timeFormatter"
          :prop="item.field"
          :label="item.name"
          :width="item.width"
          align="center"
          header-align="center"
          show-overflow-tooltip />
      </el-table>
      <div class="p-contianer">
        <el-pagination
          :current-page="currentPage"
          :page-sizes="pageSizes"
          :page-size.sync="pageSize"
          :total="total"
          class="p-bar"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange" />
      </div>
    </div>
    <contract-detail
      v-if="showContractview"
      :id="rowID"
      class="d-view"
      @hide-view="showContractview=false" />
    <customer-detail
      v-if="showCustomerView"
      :id="rowID"
      class="d-view"
      @hide-view="showCustomerView=false" />
    <product-detail
      v-if="showProductview"
      :id="rowID"
      class="d-view"
      @hide-view="showProductview=false" />
  </div>
</template>

<script>
import { crmCallAnalysisAPI } from '@/api/bi/callCenter'

import ContractDetail from '@/views/crm/contract/Detail'
import CustomerDetail from '@/views/crm/customer/Detail'
import ProductDetail from '@/views/crm/product/Detail'
import BaseMixin from '../mixins/Base'

import NP from 'number-precision'

export default {
  /** 产品销售情况统计 */
  name: 'CallTalkCount',
  components: {
    ContractDetail,
    CustomerDetail,
    ProductDetail
  },
  mixins: [BaseMixin],
  data() {
    return {
      loading: false,
      tableHeight: document.documentElement.clientHeight - 210,
      postParams: {}, // 筛选参数
      headFieldList: [
        { field: 'userInfo.realname', name: '姓名', width: '115px' },
        { field: 'totalCountCalls', name: '总通话数', width: '115px' },
        { field: 'totalCountAnswer', name: '接通数', width: '115px' },
        { field: 'rateAnswer', name: '接通率', width: '115px' },
        { field: 'totalTimeCalls', name: '总通话时长', width: '115px' },
        { field: 'totalCountCallsOut', name: '外呼总数', width: '115px' },
        { field: 'totalCountAnswerOut', name: '外呼接通数', width: '115px' },
        { field: 'rateAnswerOut', name: '外呼接通率', width: '115px' },
        { field: 'totalTimeCallsOut', name: '外呼通话时长', width: '115px' },
        { field: 'averageTimeCallOut', name: '外呼通话平均时长', width: '140px' },
        { field: 'totalCountCallsIn', name: '呼入通话总数', width: '115px' },
        { field: 'totalCountAnswerIn', name: '呼入通话接通数', width: '115px' },
        { field: 'totalTimeCallsIn', name: '呼入通话总时长', width: '115px' },
        { field: 'averageTimeCallIn', name: '呼入通话平均时长', width: '140px' },
        { field: 'rateAnswerIn', name: '呼入接通率', width: '115px' }
      ],
      list: [],
      //
      spanList: [],
      newList: [],
      /** 控制详情展示 */
      showContractview: false,
      showCustomerView: false,
      showProductview: false,
      rowID: '',
      pageData: {}
    }
  },
  computed: {},
  mounted() {
    window.onresize = () => {
      this.tableHeight = document.documentElement.clientHeight - 210
    }
  },
  methods: {
    objectSpanMethod({ row, column, rowIndex, columnIndex }) {
      var item = this.spanList[rowIndex]
      if (columnIndex == 0) {
        if (item.rowspan == 0) {
          return {
            rowspan: 0,
            colspan: 0
          }
        } else {
          return {
            rowspan: item.rowspan,
            colspan: 1
          }
        }
      } else if (columnIndex == 1) {
        if (item.productRowspan == 0) {
          return {
            rowspan: 0,
            colspan: 0
          }
        } else {
          return {
            rowspan: item.productRowspan,
            colspan: 1
          }
        }
      }
    },
    /** 列表操作 */
    // 当某一行被点击时会触发该事件
    handleRowClick(row, column, event) {
      if (column.property === 'customerId') {
        if (this.showProductview) {
          this.showProductview = false
        }
        if (this.showContractview) {
          this.showContractview = false
        }
        this.rowID = row.customerId
        this.showCustomerView = true
      } else if (column.property === 'productName') {
        if (this.showCustomerView) {
          this.showCustomerView = false
        }
        if (this.showContractview) {
          this.showContractview = false
        }
        this.rowID = row.productId
        this.showProductview = true
      } else if (column.property === 'contractId') {
        if (this.showProductview) {
          this.showProductview = false
        }
        if (this.showCustomerView) {
          this.showCustomerView = false
        }
        this.rowID = row.contractId
        this.showContractview = true
      }
    },
    cellStyle({ row, column, rowIndex, columnIndex }) {
      // var item = this.spanList[rowIndex]
      // if (item.isSum == true) {
      //   return {backgroundColor: '#FFF9F2'}
      // } else if (item.isAllSum == true) {
      //   return {backgroundColor: '#FFF3E8'}
      // } else if (columnIndex === 1 || columnIndex === 2 || columnIndex === 4) {
      //   return {color: '#3E84E9', cursor: 'pointer'}
      // }
    },
    /** 获取部门呼叫中心完成信息 */
    getList(params) {
      this.loading = true

      crmCallAnalysisAPI(params)
        .then(res => {
          this.list = res.data.list
          this.total = res.data.totalRow
          // this.handleShowInfo()
          this.loading = false
        })
        .catch(() => {
          this.loading = false
        })
    },
    /** 处理展示数据 */
    // handleShowInfo() {
    //   // 记录分类合并
    //   // 产品合并
    //   // 小产品
    //   /**
    //    * rowspan 数量
    //    *
    //    */
    //
    //   var newList = []
    //   var spanList = []
    //   var seriesIndex = 0 // 操控span中元素
    //   var productIndex = 0
    //
    //   var subCount = 0 // 产品
    //   var subMoney = 0
    //   var allCount = 0 // 系列
    //   var allMoney = 0
    //
    //   var count
    //   for (let index = 0; index < this.list.length; index++) {
    //     const element = this.list[index]
    //
    //     if (spanList.length == 0) {
    //       seriesIndex = 0 //一个新系列的开始
    //       productIndex = 0 //一个新产品的开始
    //       subCount = parseFloat(element.productNum) // 产品
    //       subMoney = parseFloat(element.productSubtotal)
    //       allCount = parseFloat(element.productNum) // 系列
    //       allMoney = parseFloat(element.productSubtotal)
    //
    //       spanList.push({rowspan: 1, productRowspan: 1})
    //       newList.push(element) // 真实数据
    //     } else if (element.categoryId != this.list[index - 1].categoryId) {
    //       // 系列改变时候的逻辑
    //       /** 上一个最后产品的处理 */
    //       var preItem = spanList[seriesIndex]
    //       preItem.rowspan += 1
    //       newList.push({productNum: subCount, productSubtotal: subMoney}) // 产品小计数据
    //       spanList.push({rowspan: 0, productRowspan: 1, isSum: true}) // 产品小计style
    //
    //       newList.push({productNum: allCount, productSubtotal: allMoney}) // 系列小计数据
    //       spanList.push({rowspan: 1, productRowspan: 1, isAllSum: true}) // 系列小计style
    //
    //       /*** 新系列开始 */
    //       spanList.push({rowspan: 1, productRowspan: 1}) // 新系列 新产品的 展示数据开始 style
    //       subCount = parseFloat(element.productNum) // 新产品的值 所以取消了重置为0
    //       subMoney = parseFloat(element.productSubtotal)
    //       allCount = parseFloat(element.productNum) // 系列
    //       allMoney = parseFloat(element.productSubtotal)
    //       newList.push(element) // 真实数据
    //       seriesIndex = spanList.length - 1 //一个新系列的开始
    //       productIndex = spanList.length - 1 //一个新产品的开始
    //     } else {
    //       var preItem = spanList[seriesIndex]
    //       preItem.rowspan += 1
    //       /*** 相同产品 */
    //       if (element.productId == this.list[index - 1].productId) {
    //         var preProItem = spanList[productIndex]
    //         preProItem.productRowspan += 1
    //         spanList.push({rowspan: 0, productRowspan: 0}) // 产品 非第一条数据的style
    //         subCount += parseFloat(element.productNum) // 产品
    //         subMoney += parseFloat(element.productSubtotal)
    //         allCount += parseFloat(element.productNum) // 系列
    //         allMoney += parseFloat(element.productSubtotal)
    //         newList.push(element) // 真实数据
    //       } else {
    //         /*** 不相同产品 */
    //         // 需要添加一个小计
    //         preItem.rowspan += 1
    //
    //         newList.push({productNum: subCount, productSubtotal: subMoney}) // 产品小计数据
    //         spanList.push({rowspan: 0, productRowspan: 1, isSum: true}) // 产品小计Style
    //
    //         spanList.push({rowspan: 0, productRowspan: 1}) // 新产品 第一条数据style
    //         productIndex = spanList.length - 1 //一个新产品的开始=
    //         subCount = parseFloat(element.productNum)
    //         subMoney = parseFloat(element.productSubtotal) //开始了一个新的产品  所以没有 清空数据
    //         allCount += parseFloat(element.productNum) // 系列 继续 叠加
    //         allMoney += parseFloat(element.productSubtotal)
    //         newList.push(element) // 真实数据
    //       }
    //     }
    //
    //     if (this.list.length - 1 == index) {
    //       // 最后一个产品的处理
    //       var preItem = spanList[seriesIndex]
    //       preItem.rowspan += 1
    //       newList.push({productNum: subCount, productSubtotal: subMoney}) // 产品小计数据
    //       subCount = 0
    //       subMoney = 0 // 完成一个产品统计 清空数据
    //       spanList.push({rowspan: 0, productRowspan: 1, isSum: true}) // 产品小计style
    //
    //       newList.push({productNum: allCount, productSubtotal: allMoney}) // 系列小计数据
    //       allCount = 0
    //       allMoney = 0 // 完成一个系列统计 清空数据
    //       spanList.push({rowspan: 1, productRowspan: 1, isAllSum: true}) // 系列小计style
    //     }
    //   }
    //
    //   this.spanList = spanList
    //   this.newList = newList
    // },
    /*
      格式化数据
       */
    timeFormatter(row, column, cellValue, index) {
      switch (column.label) {
        case '外呼接通率': return NP.times(cellValue || 0, 100) + '%'
        case '接通率': return NP.times(cellValue || 0, 100) + '%'
        case '总通话时长': return this.MillisecondToDate(cellValue)
        case '外呼通话平均时长': return this.MillisecondToDate(cellValue)
        case '外呼通话时长': return this.MillisecondToDate(cellValue)
        case '呼入通话总时长': return this.MillisecondToDate(cellValue)
        case '呼入通话平均时长': return this.MillisecondToDate(cellValue)
        case '呼入接通率': return NP.times(cellValue || 0, 100) + '%'
        default: return cellValue
      }
    },
    /**
       * 时间转换
       */
    MillisecondToDate(msd) {
      let time
      if (msd != null && msd != '') {
        time = parseFloat(msd)
      } else {
        time = 0
      }
      if (time < 60) {
        return time + '秒'
      } else if (time < 3600) {
        const mm = Math.floor(time / 60)
        return mm + '分' + Math.floor(time - (mm * 60)) + '秒'
      } else {
        const hh = Math.floor(time / 3600)
        const mm = Math.floor((time - (hh * 3600)) / 60)
        return hh + '小时' + mm + '分'
      }
    }
  }
}
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
  @import "../styles/detail.scss";
  @import "@/views/crm/styles/detailview.scss";

  .content {
    padding-right: #{$--interval-base * 5};
  }
</style>
