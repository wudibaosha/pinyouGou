<template>
  <div
    v-loading="loading"
    class="main-container">
    <filtrate-handle-view
      :show-user-select="false"
      title="新增联系人数排行"
      class="filtrate-bar"
      module-type="ranking"
      @load="loading=true"
      @change="getDataList" />
    <div class="content">
      <div class="content-title">新增联系人数排行（按负责人、创建时间统计）</div>
      <div
        v-empty="list.length === 0"
        class="axis-content"
        xs-empty-text="暂无排行">
        <div id="axismain" />
      </div>
      <div class="table-content">
        <div class="handle-bar">
          <el-button
            class="export-btn"
            @click="exportClick">导出</el-button>
        </div>
        <el-table
          :data="list"
          :cell-class-name="cellClassName"
          :class="WKConfig.tableStyle.class"
          :stripe="WKConfig.tableStyle.stripe"
          height="400"
          highlight-current-row
          @row-click="handleRowClick">
          <el-table-column
            align="center"
            header-align="center"
            show-overflow-tooltip
            label="公司总排名">
            <template slot-scope="scope">
              {{ scope.$index + 1 }}
            </template>
          </el-table-column>
          <el-table-column
            v-for="(item, index) in fieldList"
            :key="index"
            :prop="item.field"
            :label="item.name"
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
import RankingMixin from '../mixins/Ranking'
import DetailMixin from '../mixins/Detail'
import * as echarts from 'echarts'
import { biRankingAddContactsAPI, biRankingAddContactsExportAPI } from '@/api/bi/ranking'
import {
  biContactDetailListAPI
} from '@/api/bi/ranking'

export default {
  /** 新增联系人数排行 */
  name: 'RankingAddContactsStatistics',
  mixins: [RankingMixin, DetailMixin],
  data() {
    return {
      postParams: {}, // 筛选参数
      // 可以点击的数据
      detailFields: [
        {
          name: 'count',
          crmType: 'contacts',
          list: [{
            formType: 'user',
            name: 'ownerUserId',
            type: 3,
            values: []
          }],
          request: biContactDetailListAPI,
          params: null
        }
      ]
    }
  },
  computed: {},
  mounted() {
    this.fieldList = [
      { field: 'realname', name: '创建人' },
      { field: 'deptName', name: '部门' },
      { field: 'count', name: '新增联系人数（个）' }
    ]
    this.initAxis()
  },
  methods: {
    getDataList(params) {
      this.postParams = params
      this.loading = true
      biRankingAddContactsAPI(params)
        .then(res => {
          this.loading = false
          this.list = res.data || []

          const showData = []
          const yAxis = []

          const rankingIndex = res.data.length > 10 ? 10 : res.data.length
          for (let index = 0; index < rankingIndex; index++) {
            const element = res.data[index]
            showData.splice(0, 0, parseFloat(element.count))
            yAxis.splice(0, 0, element.realname)
          }
          this.axisOption.yAxis[0].data = yAxis
          this.axisOption.series[0].data = showData
          this.chartObj.setOption(this.axisOption, true)
        })
        .catch(() => {
          this.loading = false
        })
    },
    /** 柱状图 */
    initAxis() {
      this.chartObj = echarts.init(document.getElementById('axismain'))
      this.axisOption.tooltip.formatter = '{b} : {c}个'
      this.axisOption.xAxis[0].name = '（个）'
      this.chartObj.setOption(this.axisOption, true)
    },

    /**
     * 导出点击
     */
    exportClick() {
      this.requestExportInfo(biRankingAddContactsExportAPI, this.postParams)
    },

    handleRowClick(row, column) {
      if (this.getDetailFieldList(column)) {
        const { values } = this.getValues(row, column)
        const searchList = [
          {
            formType: 'datetime',
            name: 'createTime',
            type: 14,
            values
          },
          {
            formType: 'user',
            name: 'ownerUserId',
            type: 3,
            values: [row.userId]
          }
        ]

        const params = {
          dataType: this.postParams.dataType,
          searchList,
          limit: 15,
          page: 1,
          search: '',
          type: 3
        }

        const field = this.getCurrentClickField(column)
        this.reportData = {
          ...this.reportData,
          ...field,
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
