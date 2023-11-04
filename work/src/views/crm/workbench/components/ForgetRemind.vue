<template>
  <statistics-card
    v-loading="loading"
    fixed-today="true"
    icon="wk wk-icon-remind">
    <template slot="title-left">客户遗忘提醒<i class="wk wk-icon-fill-help wk-help-tips" data-type="4" data-id="23" /></template>
    <div class="content">
      <flexbox
        :gutter="0"
        wrap="wrap"
        align="stretch">
        <div
          v-for="(item, index) in showData"
          :key="index"
          class="brief-wrap">
          <div
            class="brief"
            @click="reportClick(item)">
            <div class="title">
              {{ item.label }}<el-tag v-if="item.tagType" disable-transitions :type="item.tagType">{{ item.tagContent }}</el-tag>
            </div>
            <div v-fit-text="{ fontSize: 20 }" class="value">{{ item.value }}<span class="value-unit">
              个
            </span>
            </div>
          </div>
        </div>
      </flexbox>
    </div>

    <!-- 销售简报列表 -->
    <report-list
      :show.sync="reportListShow"
      :title="reportData.title"
      :placeholder="reportData.placeholder"
      :crm-type="reportData.crmType"
      :request="reportData.request"
      :params="reportData.params"
      :paging="reportData.paging"
      :sortable="reportData.sortable" />
  </statistics-card>
</template>

<script>
import {
  crmIndexForgottenCustomerAPI,
  crmIndexForgottenCustomerListAPI,
  crmIndexUnContactCustomerAPI
} from '@/api/crm/workbench'

import ReportList from './ReportList'
import ChartMixin from './ChartMixin'
import FitText from '@/directives/fitText'

export default {
  name: 'RankingStatistics',
  directives: {
    FitText
  },
  components: {
    ReportList
  },
  mixins: [ChartMixin],
  data() {
    return {
      data: [
        {
          label: '超过7天未联系',
          value: 0,
          key: 'sevenDays',
          hidden: false
        },
        {
          label: '超过15天未联系',
          value: 0,
          key: 'fifteenDays',
          hidden: false
        },
        {
          label: '超过30天未联系',
          value: 0,
          key: 'oneMonth',
          hidden: false
        },
        {
          label: '超过3个月未联系',
          value: 0,
          key: 'threeMonth',
          hidden: false,
          tagType: 'warning',
          tagContent: '警告'
        },
        {
          label: '超过6个月未联系',
          value: 0,
          key: 'sixMonth',
          hidden: false,
          tagType: 'warning',
          tagContent: '警告'
        },
        {
          label: '逾期未联系',
          value: 0,
          key: 'unContactCustomerCount',
          hidden: false,
          tagType: 'danger',
          tagContent: '已逾期'
        }
      ],
      loading: false,

      reportListShow: false,
      reportData: {
        title: '',
        placeholder: '',
        crmType: '',
        request: null,
        params: null,
        paging: true,
        sortable: 'custom'
      }
    }
  },
  computed: {
    showData() {
      return this.data.filter(item => {
        return !item.hidden
      })
    }
  },
  methods: {
    getData() {
      this.loading = true
      const presult = this.getBaseParams()
      presult.dateFilter = 'today'
      crmIndexForgottenCustomerAPI(presult)
        .then(res => {
          this.loading = false
          this.data = this.data.map(item => {
            item.hidden = !res.data.hasOwnProperty(item.key)
            item.value = res.data[item.key]
            return item
          })
        })
        .catch(() => {
          this.loading = false
        })
    },

    /**
     * 查看
     */
    reportClick(item) {
      this.reportData.title = item.label
      this.reportData.placeholder = '客户联系人/手机/电话'
      this.reportData.crmType = 'customer'

      // 逾期未联系的客户
      if (item.key == 'unContactCustomerCount') {
        this.reportData.params = {
          ...this.getBaseParams(),
          isSub: 1
        }
        this.reportData.request = crmIndexUnContactCustomerAPI
      } else {
        const day = {
          sevenDays: 7,
          fifteenDays: 15,
          oneMonth: 30,
          threeMonth: 90,
          sixMonth: 180
        }[item.key]
        this.reportData.params = {
          ...this.getBaseParams(),
          type: day
        }
        this.reportData.request = crmIndexForgottenCustomerListAPI
      }
      this.reportData.params.dateFilter = 'today'
      this.reportData.paging = true
      this.reportData.sortable = 'custom'
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
  margin-top: 16px;
}

.brief-wrap {
  flex: 0 0 33%;
  width: 0;

  &:nth-child(4) {
    padding-left: 0 !important;
  }
}

.brief-wrap + .brief-wrap {
  padding-left: 16px;
}

.brief {
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
</style>
