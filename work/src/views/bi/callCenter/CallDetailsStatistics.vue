<template>
  <div
    v-loading="loading"
    class="main-container">
    <filtrate-handle-view
      class="filtrate-bar"
      title="员工通话记录"
      module-type="product"
      @load="loading=true"
      @change="getProductDatalist">
      <el-input slot="append" v-model="talkTime" class="input-with-select">
        <el-select slot="prepend" v-model="talkTimeCondition" style="width: 100px;" placeholder="通话时长">
          <el-option label="大于" value=">" />
          <el-option label="小于" value="<" />
          <el-option label="等于" value="=" />
        </el-select>
        <el-button slot="append" type="text">秒</el-button>
      </el-input>
    </filtrate-handle-view>
    <div class="content">
      <el-table
        id="crm-table"
        :data="list"
        :class="WKConfig.tableStyle.class"
        :stripe="WKConfig.tableStyle.stripe"
        :height="tableHeight"
        :cell-style="cellStyle"
        @row-click="handleRowClick">
        <el-table-column
          v-for="(item, index) in headFieldList"
          :key="index"
          :min-width="item.width"
          :formatter="timeFormatter"
          :prop="item.field"
          :label="item.name"
          align="center"
          header-align="center"
          show-overflow-tooltip />
        <el-table-column prop="type" label="通话状态" width="200px">
          <template slot-scope="scope">
            {{ typeArr[scope.row.type] }}-{{ stateArr[scope.row.state] }}
          </template>
        </el-table-column>
        <el-table-column prop="audio" label="录音播放" width="300px">
          <template slot-scope="{ row }">
            <audios
              :duration="row.talkTime"
              :props="getAudiosProps(row)" />
          </template>
        </el-table-column>
        <el-table-column prop="down" label="操作" width="80px">
          <template slot-scope="scope">
            <el-button type="text" @click="download(scope.row.callRecordId, scope.row.fileName)">下载</el-button>
          </template>
        </el-table-column>
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
      v-if="showCustomerView && customertype === 'contract'"
      :id="rowID"
      class="d-view"
      @hide-view="showCustomerView=false" />
    <customer-detail
      v-else-if="showCustomerView && customertype === 'customer'"
      :id="rowID"
      class="d-view"
      @hide-view="showCustomerView=false" />
    <leads-detail
      v-else-if="showCustomerView && customertype === 'leads'"
      :id="rowID"
      class="d-view"
      @hide-view="showCustomerView=false" />
  </div>
</template>

<script>
// memberCallQueryRanKingAPI
// import { memberCallQqueryListAPI } from "@/api/bi/callCenter"
import { crmCallIndexAPI, crmCallDownloadAPI } from '@/api/bi/callCenter'
import ContractDetail from '@/views/crm/contract/Detail'
import CustomerDetail from '@/views/crm/customer/Detail'
import LeadsDetail from '@/views/crm/leads/Detail'
import BaseMixin from '../mixins/Base'
import Audios from '@/components/Audios'
import { downloadFileWithBuffer } from '@/utils'

export default {
  /** 产品销售情况统计 */
  name: 'CallDetailsStatistics',
  components: {
    Audios,
    ContractDetail,
    CustomerDetail,
    LeadsDetail
  },
  mixins: [BaseMixin],
  data() {
    return {
      loading: false,
      tableHeight: document.documentElement.clientHeight - 210,
      postParams: {}, // 筛选参数
      stateArr: ['未振铃', '未接通', '接通', '呼入未接通'],
      typeArr: ['呼出', '呼入'],
      headFieldList: [
        { field: 'ownerUserName', name: '姓名', width: '115px' },
        { field: 'createTime', name: '通话时间', width: '115px' },
        { field: 'number', name: '呼/被叫号码', width: '115px' },
        { field: 'modelName', name: '相关客户', width: '115px' },
        { field: 'talkTime', name: '通话时长', width: '115px' },
        { field: 'dialTime', name: '摘机时长', width: '115px' }
        // { field: 'type', name: '通话状态', width: '115px' },
        // { field: 'audio', name: '录音播放', width: '300px' },
        // { field: 'file_path', name: '下载录音', width: '100px' }
      ],
      list: [],
      //
      spanList: [],
      newList: [],
      /** 控制详情展示 */
      showCustomerView: false,
      customertype: '',
      rowID: '',
      pageData: {},
      talkTime: '',
      talkTimeCondition: '<'
    }
  },
  computed: {},
  mounted() {
    window.onresize = () => {
      this.tableHeight = document.documentElement.clientHeight - 210
    }
  },
  methods: {
    // objectSpanMethod({ row, column, rowIndex, columnIndex }) {
    //   var item = this.spanList[rowIndex]
    //   if (columnIndex == 0) {
    //     if (item.rowspan == 0) {
    //       return {
    //         rowspan: 0,
    //         colspan: 0
    //       }
    //     } else {
    //       return {
    //         rowspan: item.rowspan,
    //         colspan: 1
    //       }
    //     }
    //   } else if (columnIndex == 1) {
    //     if (item.productRowspan == 0) {
    //       return {
    //         rowspan: 0,
    //         colspan: 0
    //       }
    //     } else {
    //       return {
    //         rowspan: item.productRowspan,
    //         colspan: 1
    //       }
    //     }
    //   }
    // },
    /** 列表操作 */
    // 当某一行被点击时会触发该事件
    handleRowClick(row, column, event) {
      if (column.property === 'modelName') {
        this.rowID = row.modelId
        this.customertype = row.model
        this.showCustomerView = true
      }
    },
    cellStyle({ row, column, rowIndex, columnIndex }) {
      if (column.property === 'modelName') {
        return { color: '#3E84E9', cursor: 'pointer' }
      }
      return {}
    },
    /** 获取部门业绩完成信息 */
    getProductDatalist(params) {
      this.pageData = params // 储存页面的筛选条件
      const data = {
        ...params,
        talkTime: this.talkTime,
        talkTimeCondition: this.talkTimeCondition,
        page: 1 // 每次筛选都从第一页开始展示
      }
      this.getList(data)
    },
    /** 处理展示数据 */
    handleShowInfo() {
      // 记录分类合并
      // 产品合并
      // 小产品
      /**
         * rowspan 数量
         *
         */

      var newList = []
      var spanList = []
      var seriesIndex = 0 // 操控span中元素
      var productIndex = 0

      var subCount = 0 // 产品
      var subMoney = 0
      var allCount = 0 // 系列
      var allMoney = 0

      for (let index = 0; index < this.list.length; index++) {
        const element = this.list[index]

        if (spanList.length == 0) {
          seriesIndex = 0 // 一个新系列的开始
          productIndex = 0 // 一个新产品的开始
          subCount = parseFloat(element.productNum) // 产品
          subMoney = parseFloat(element.productSubtotal)
          allCount = parseFloat(element.productNum) // 系列
          allMoney = parseFloat(element.productSubtotal)

          spanList.push({ rowspan: 1, productRowspan: 1 })
          newList.push(element) // 真实数据
        } else if (element.categoryId != this.list[index - 1].categoryId) {
          // 系列改变时候的逻辑
          /** 上一个最后产品的处理 */
          var preItem = spanList[seriesIndex]
          preItem.rowspan += 1
          newList.push({ productNum: subCount, productSubtotal: subMoney }) // 产品小计数据
          spanList.push({ rowspan: 0, productRowspan: 1, isSum: true }) // 产品小计style

          newList.push({ productNum: allCount, productSubtotal: allMoney }) // 系列小计数据
          spanList.push({ rowspan: 1, productRowspan: 1, isAllSum: true }) // 系列小计style

          /** * 新系列开始 */
          spanList.push({ rowspan: 1, productRowspan: 1 }) // 新系列 新产品的 展示数据开始 style
          subCount = parseFloat(element.productNum) // 新产品的值 所以取消了重置为0
          subMoney = parseFloat(element.productSubtotal)
          allCount = parseFloat(element.productNum) // 系列
          allMoney = parseFloat(element.productSubtotal)
          newList.push(element) // 真实数据
          seriesIndex = spanList.length - 1 // 一个新系列的开始
          productIndex = spanList.length - 1 // 一个新产品的开始
        } else {
          var preItem = spanList[seriesIndex]
          preItem.rowspan += 1
          /** * 相同产品 */
          if (element.productId == this.list[index - 1].productId) {
            var preProItem = spanList[productIndex]
            preProItem.productRowspan += 1
            spanList.push({ rowspan: 0, productRowspan: 0 }) // 产品 非第一条数据的style
            subCount += parseFloat(element.productNum) // 产品
            subMoney += parseFloat(element.productSubtotal)
            allCount += parseFloat(element.productNum) // 系列
            allMoney += parseFloat(element.productSubtotal)
            newList.push(element) // 真实数据
          } else {
            /** * 不相同产品 */
            // 需要添加一个小计
            preItem.rowspan += 1

            newList.push({ productNum: subCount, productSubtotal: subMoney }) // 产品小计数据
            spanList.push({ rowspan: 0, productRowspan: 1, isSum: true }) // 产品小计Style

            spanList.push({ rowspan: 0, productRowspan: 1 }) // 新产品 第一条数据style
            productIndex = spanList.length - 1 // 一个新产品的开始=
            subCount = parseFloat(element.productNum)
            subMoney = parseFloat(element.productSubtotal) // 开始了一个新的产品  所以没有 清空数据
            allCount += parseFloat(element.productNum) // 系列 继续 叠加
            allMoney += parseFloat(element.productSubtotal)
            newList.push(element) // 真实数据
          }
        }

        if (this.list.length - 1 == index) {
          // 最后一个产品的处理
          var preItem = spanList[seriesIndex]
          preItem.rowspan += 1
          newList.push({ productNum: subCount, productSubtotal: subMoney }) // 产品小计数据
          subCount = 0
          subMoney = 0 // 完成一个产品统计 清空数据
          spanList.push({ rowspan: 0, productRowspan: 1, isSum: true }) // 产品小计style

          newList.push({ productNum: allCount, productSubtotal: allMoney }) // 系列小计数据
          allCount = 0
          allMoney = 0 // 完成一个系列统计 清空数据
          spanList.push({ rowspan: 1, productRowspan: 1, isAllSum: true }) // 系列小计style
        }
      }

      this.spanList = spanList
      this.newList = newList
    },

    /**
     * @description: 获取录音文件的配置
     * @param {*}
     * @return {*}
     */
    getAudiosProps(item) {
      return {
        fileRequest: crmCallDownloadAPI, // 添加请求和参数
        fileParams: { id: item.callRecordId }
      }
    },

    /*
      音频下载
       */
    download(id, fileName) {
      crmCallDownloadAPI({ id: id }).then(res => {
        downloadFileWithBuffer(res.data, fileName)
      }).catch(() => {})
    },
    /*
     格式化数据
      */
    timeFormatter(row, column, cellValue, index) {
      switch (column.label) {
        case '外呼接通率': return (parseInt(cellValue) || '0') + '%'
        case '接通率': return (parseInt(cellValue) || '0') + '%'
        case '通话时长': return this.MillisecondToDate(cellValue)
        case '摘机时长': return this.MillisecondToDate(cellValue)
        case '外呼通话时长': return this.MillisecondToDate(cellValue)
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
    },

    /**
       * 获取分页列表
       */
    getList(params) {
      this.loading = true
      crmCallIndexAPI(params)
        .then(res => {
          this.list = res.data.list
          this.total = res.data.totalRow
          // this.handleShowInfo()
          this.loading = false
        })
        .catch(() => {
          this.loading = false
        })
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

  /deep/.el-input-group__append {
    text-align: center;
  }

  .input-with-select {
    width: 300px;
    margin-right: 10px;
  }
</style>
