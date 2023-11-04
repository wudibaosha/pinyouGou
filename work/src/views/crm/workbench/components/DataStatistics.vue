<template>
  <statistics-card
    v-loading="loading"
    icon="wk wk-icon-summary"
    class="data-statistics card">

    <template slot="title-left">数据汇总</template>

    <div v-if="data" class="content">
      <div
        v-for="(section, sIndex) in sections"
        :key="sIndex"
        class="section">
        <div class="section__hd">
          <el-divider content-position="left">{{ section.label }}</el-divider>
        </div>
        <div class="section__bd">
          <flexbox>
            <div
              v-for="(item, index) in section.list"
              :key="index"
              class="section-item-wrap">
              <div
                class="section-item"
                @click="showDetailList(section.crmType, item)">
                <div class="title">
                  {{ item.label }}
                  <el-tag v-if="item.tagType" disable-transitions :type="item.tagType">
                    {{ item.tagContent }}
                  </el-tag>
                  <i v-if="item.helpType" class="wk wk-icon-fill-help wk-help-tips" :data-type="item.helpType" :data-id="item.helpId" @click.stop="" />
                </div>
                <div v-fit-text="{ fontSize: 20 }" class="value">
                  {{ data[item.field] }}
                  <span class="value-unit">
                    {{ item.unit }}
                  </span>
                </div>
              </div>
            </div>
          </flexbox>
        </div>
      </div>

      <flexbox
        v-for="(childs, cIndex) in otherSections"
        :key="`s${cIndex}`">
        <div
          v-for="(section, sIndex) in childs"
          :key="sIndex"
          class="section two-columns">
          <div class="section__hd">
            <el-divider content-position="left">{{ section.label }}</el-divider>
          </div>
          <div class="section__bd">
            <flexbox>
              <div
                v-for="(item, index) in section.list"
                :key="index"
                class="section-item-wrap">
                <div
                  class="section-item"
                  @click="showDetailList(section.crmType, item)">
                  <div class="title">
                    {{ item.label }}<el-tag v-if="item.tagType" disable-transitions :type="item.tagType">{{ item.tagContent }}</el-tag><i v-if="item.helpType" class="wk wk-icon-fill-help wk-help-tips" :data-type="item.helpType" :data-id="item.helpId" @click.stop="" />
                  </div>
                  <div v-fit-text="{ fontSize: 20 }" class="value">{{ data[item.field] }}<span class="value-unit">
                    {{ item.unit }}
                  </span>
                  </div>
                </div>
              </div>
            </flexbox>
          </div>
        </div>
      </flexbox>
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

  </statistics-card>
</template>

<script>
import {
  queryDataInfo,
  crmIndexNoRecordCustomerListAPI,
  crmPlanReturnMoneyAPI
} from '@/api/crm/workbench'
import { crmCustomerIndexAPI } from '@/api/crm/customer.js'
import { crmContractIndexAPI } from '@/api/crm/contract.js'
import {
  crmBusinessIndexAPI
} from '@/api/crm/business'
import {
  biReceivablesDetailListAPI
} from '@/api/bi/achievement'
import {
  biPoolDetailListAPI,
  biCustomerFollowListAPI,
  biCustomerDetailListAPI
} from '@/api/bi/customer'
import {
  crmMessagEndContractAPI
} from '@/api/crm/message'
import {
  biBusinessWinOrFailDetailListAPI,
  biBusinessDetailListAPI
} from '@/api/bi/business'
import {
  biContractDetailListAPI
} from '@/api/bi/bi'

import ReportList from '@/views/crm/workbench/components/ReportList'

import ChartMixin from './ChartMixin'
import { separator } from '@/filters/vueNumeralFilter/filters'
import FitText from '@/directives/fitText'
import { mapGetters } from 'vuex'

export default {
  name: 'DataStatistics',
  components: {
    ReportList
  },
  directives: {
    FitText
  },
  filters: {},
  mixins: [ChartMixin],
  data() {
    return {
      data: null,
      sections: [{
        label: '客户汇总',
        crmType: 'customer',
        list: [{
          label: '新增客户',
          field: 'allCustomer',
          unit: '个',
          query: ['createTime']
        }, {
          label: '转成交客户',
          field: 'dealCustomer',
          unit: '个',
          helpType: '4',
          helpId: '15',
          query: ['createTime', 'dealStatus']
        }, {
          label: '放入公海客户',
          field: 'putInPoolNum',
          unit: '个',
          helpType: '4',
          helpId: '16',
          query: ['createTime']
        }, {
          label: '公海池领取',
          field: 'receiveNum',
          unit: '个',
          query: ['receiveTime', 'isReceive']
        }]
      }, {
        label: '商机汇总',
        crmType: 'business',
        list: [{
          label: '新增商机',
          field: 'allBusiness',
          unit: '个',
          query: ['createTime']
        }, {
          label: '赢单商机',
          field: 'endBusiness',
          unit: '个',
          query: ['createTime', 'isEnd']
        }, {
          label: '输单商机',
          field: 'loseBusiness',
          unit: '个',
          query: ['createTime', 'isEnd']
        }, {
          label: '商机总金额',
          field: 'businessMoney',
          unit: '元',
          query: ['createTime']
        }]
      }, {
        label: '合同汇总',
        crmType: 'contract',
        list: [{
          label: '签约合同',
          field: 'allContract',
          unit: '个',
          query: ['orderDate', 'checkStatus']
        }, {
          label: '即将到期',
          field: 'expireContract',
          unit: '个',
          tagType: 'warning',
          tagContent: '警告',
          helpType: '4',
          helpId: '17',
          query: ['checkStatus']
        }, {
          label: '已到期',
          field: 'endContract',
          unit: '个',
          tagType: 'danger',
          tagContent: '已到期',
          query: ['endTime', 'checkStatus']
        }, {
          label: '合同金额',
          field: 'contractMoney',
          unit: '元',
          query: ['orderDate', 'checkStatus']
        }]
      }],
      otherSections: [[{
        label: '跟进汇总',
        crmType: 'customer',
        list: [{
          label: '跟进客户数',
          field: 'activityNum',
          unit: '个',
          query: ['createTime']
        }, {
          label: '新增未跟进客户数',
          field: 'activityRealNum',
          unit: '个',
          query: ['createTime']
        }]
      }, {
        label: '回款金额',
        crmType: 'receivables',
        list: [{
          label: '回款',
          field: 'receivablesMoney',
          unit: '元',
          helpType: '4',
          helpId: '18',
          query: ['returnTime', 'checkStatus']
        }, {
          label: '预计回款',
          field: 'planMoney',
          unit: '元',
          helpType: '4',
          helpId: '19',
          query: ['returnDate']
        }]
      }]],
      loading: false,

      reportListShow: false,
      fieldReportList: null,
      reportData: {
        title: '',
        placeholder: '',
        request: null,
        params: null
      }
    }
  },
  computed: {
    ...mapGetters(['userInfo'])
  },
  methods: {
    getData() {
      this.loading = true
      queryDataInfo(this.getBaseParams()).then(res => {
        this.loading = false
        const resData = res.data || {}
        resData.noActivityNum = resData.allCustomer - resData.activityRealNum
        resData.businessMoney = separator(resData.businessMoney)
        resData.contractMoney = separator(resData.contractMoney)
        resData.receivablesMoney = separator(resData.receivablesMoney)
        resData.planMoney = separator(resData.planMoney)
        this.data = resData
      }).catch(() => {
        this.loading = false
      })
    },

    getDateFilter() {
      const { type, value, startTime, endTime } = this.filterValue.timeLine
      const params = {}

      params.dateFilter = type === 'default' ? value : type

      if (type === 'custom') {
        params.startDate = startTime.replace(/\./g, '-')
        params.endDate = endTime.replace(/\./g, '-')
      }

      return params
    },

    showDetailList(crmType, item) {
      if (item.field === 'putInPoolNum') return
      const ptype = {
        receivables: item.field === 'planMoney' ? 8 : 7,
        customer: 2,
        contract: 6,
        business: 5
      }[crmType]

      this.reportData.title = item.label
      this.reportData.type = ptype
      this.reportData.crmType = item.field === 'planMoney' ? 'receivablesPlan' : crmType

      const { type, value, startTime, endTime } = this.filterValue.timeLine
      let params = {
        search: '',
        type: ptype,
        searchList: []
      }

      let dataType = null
      if (this.filterValue.dataType !== 'custom') {
        dataType = params.dataType = this.filterValue.dataType
      }

      const values = type === 'custom'
        ? [`${startTime}`, `${endTime}`]
        : [value]

      const query = item.query
      const sitem = (name) => ({
        formType: ['orderDate', 'returnTime', 'returnDate', 'endTime'].includes(name) ? 'date' : 'datetime',
        name: name,
        type: 14,
        values: values
      })

      if (query.includes('endTime')) {
        params.searchList.push(sitem('endTime'))
      }

      if (query.includes('createTime')) {
        params.searchList.push(sitem('createTime'))
      }
      if (query.includes('receiveTime')) {
        params.searchList.push(sitem('receiveTime'))
      }
      if (query.includes('returnTime')) {
        params.searchList.push(sitem('returnTime'))
      }
      if (query.includes('returnDate')) {
        params.searchList.push(sitem('returnDate'))
      }
      if (query.includes('orderDate')) {
        params.searchList.push(sitem('orderDate'))
      }
      if (query.includes('lastTime')) {
        params.searchList.push(sitem('lastTime'))
      }
      if (query.includes('dealStatus')) {
        params.searchList.push({
          formType: 'dealStatus',
          name: 'dealStatus',
          type: 1,
          values: [1]
        })
      }
      if (query.includes('checkStatus')) {
        const cval = ['receivablesMoney', 'planMoney', 'contractMoney', 'allContract', 'endContract'].includes(item.field) ? [1, 10] : [1]

        params.searchList.push({
          formType: 'checkStatus',
          name: 'checkStatus',
          type: 1,
          values: cval
        })
      }
      if (query.includes('isEnd')) {
        params.searchList.push({
          formType: 'text',
          name: 'isEnd',
          type: 1,
          values: [item.field === 'endBusiness' ? 1 : 2]
        })
      }

      if (query.includes('isReceive')) {
        params.searchList.push({
          formType: 'text',
          name: 'isReceive',
          type: 1,
          values: [2]
        })
      }
      const dateFilters = this.getDateFilter()
      if (item.field === 'activityRealNum') {
        params.dateFilter = this.filterValue.timeLine.value
        this.reportData.request = crmIndexNoRecordCustomerListAPI
      } else if (item.field === 'activityNum') {
        params = {
          search: '',
          type: 2,
          category: 1,
          dataType: dataType,
          ...dateFilters
        }
        this.reportData.request = biCustomerFollowListAPI
      } else if (item.field === 'putInPoolNum') {
        this.reportData.request = biPoolDetailListAPI
        params.type = 9
      } else if (['expireContract', 'endContract'].includes(item.field)) {
        this.reportData.request = crmMessagEndContractAPI
        if (item.field == 'expireContract') {
          params = {
            search: '',
            type: 2,
            dataType: dataType,
            searchList: [{
              formType: 'checkStatus',
              name: 'checkStatus',
              type: 1,
              values: [1, 10]
            }],
            ...dateFilters
          }
        }
        params.data = params.searchList
        delete params.searchList
        params.type = item.field === 'expireContract' ? 1 : 2
      } else if (['endBusiness', 'loseBusiness'].includes(item.field)) {
        params = {
          search: '',
          type: item.field === 'endBusiness' ? 1 : 2,
          ...dateFilters
        }
        if (dataType) {
          params.dataType = dataType
        }

        this.reportData.request = biBusinessWinOrFailDetailListAPI
      } else if (item.field === 'planMoney') {
        // params = {
        //   search: '',
        //   dataType: dataType,
        //   ...dateFilters
        // }
        this.reportData.request = crmPlanReturnMoneyAPI
      } else if (item.field === 'allBusiness') {
        this.reportData.request = biBusinessDetailListAPI
      } else if (['allContract', 'contractMoney'].includes(item.field)) {
        this.reportData.request = biContractDetailListAPI
      } else if (['allCustomer', 'dealCustomer', 'receiveNum'].includes(item.field)) {
        this.reportData.request = biCustomerDetailListAPI
      } else {
        this.reportData.request = {
          receivables: biReceivablesDetailListAPI,
          customer: crmCustomerIndexAPI,
          contract: crmContractIndexAPI,
          business: crmBusinessIndexAPI
        }[crmType]
      }

      if (this.filterValue.users.length || this.filterValue.strucs.length) {
        params.userList = this.filterValue.users.map(item => item.userId)
        params.deptList = this.filterValue.strucs.map(item => item.deptId)
      }

      if (item.field == 'businessMoney') {
        this.reportData.request = biBusinessDetailListAPI
      }

      this.reportData = {
        ...this.reportData,
        params
      }

      this.reportListShow = true
    }
  }
}
</script>

<style scoped lang="scss">
  @import "style";

  .statistics-card {
    height: auto !important;
  }

  .content {
    width: 100%;
    margin-top: 24px;
    overflow-y: auto;

    .section {
      &__hd {
        overflow: hidden;

        /deep/ .el-divider--horizontal {
          height: 2px;
          margin: 12px 0;

          .el-divider__text.is-left {
            left: 0;
            padding-right: 8px;
            padding-left: 0;
            font-size: 16px;
          }
        }
      }

      &__bd {
        margin-top: 12px;
      }

      &.two-columns {
        flex: 0 0 50%;

        .section-item-wrap {
          flex: 0 0 50%;
        }
      }
    }

    .section-item-wrap {
      flex: 0 0 25%;
      width: 0;
    }

    .two-columns + .two-columns,
    .section-item-wrap + .section-item-wrap {
      padding-left: 16px;
    }

    .section-item {
      flex-shrink: 0;
      padding: 16px;
      margin-bottom: 16px;
      cursor: pointer;
      background-color: $--background-color-base;
      border-radius: $--border-radius-base;

      > .title {
        overflow: hidden;
        line-height: 20px;
        color: $--color-n300;
        white-space: nowrap;

        .el-tag {
          margin-left: 4px;
        }
      }

      > .value {
        min-height: 20px;
        margin-top: 8px;
        overflow: hidden;
        font-size: 20px;
        font-weight: bold;
        line-height: 1;
        white-space: nowrap;

        .value-unit {
          font-size: 14px;
        }
      }

      &:hover {
        background-color: $--color-n30;
      }
    }
  }
</style>
