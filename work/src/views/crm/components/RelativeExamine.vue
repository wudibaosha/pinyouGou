<template>
  <div class="main">
    <flexbox
      justify="space-between"
      class="hd">
      <div class="hd-total">
        <span>
          费用项<i
            class="wk wk-icon-fill-help wk-help-tips"
            data-type="8"
            data-id="276" />
          ：{{ examineCount }}
        </span>
        <span>费用总金额：{{ examineMoney }}元</span>
      </div>
      <div class="hd-time">
        费用申请时间
        <el-date-picker
          v-model="timeSelect"
          value-format="yyyy-MM-dd"
          type="date"
          placeholder="选择日期"
          @change="refreshList" />
      </div>
    </flexbox>
    <div
      class="cell-section">
      <examine-cell
        v-for="(item, index) in list"
        :key="index"
        :data="item"
        :index="index"
        @handle="cellHandle" />
      <p
        ref="scrollBottomTips2"
        class="scroll-bottom-tips">{{ loading ? '加载中...' : noMore ? '没有更多了' : '加载更多...' }}</p>
    </div>
    <!-- 审批详情 -->
    <examine-detail
      v-if="showDview"
      :id="rowID"
      :detail-index="detailIndex"
      :no-listener-class="['examine-content']"
      class="d-view"
      @hide-view="showDview=false" />
  </div>
</template>

<script>
import {
  crmCustomerQueryApplyExamineAPI
} from '@/api/crm/customer'

import ExamineDetail from '@/views/oa/examine/components/ExamineDetail' // 审批详情
import ExamineCell from '@/views/oa/taskExamine/examine/components/ExamineCell' // 行
import { separator } from '@/filters/vueNumeralFilter/filters'

import { isEleVisible } from '@/utils'

export default {
  name: 'RelativeExamine', // 相关费用审批
  components: {
    ExamineCell,
    ExamineDetail
  },
  props: {
    // 模块ID
    id: [String, Number],
    // 首要联系人ID
    contactsId: [String, Number],
    // 客户类型
    crmType: {
      type: String,
      default: ''
    },
    // 是公海 默认是客户
    isSeas: {
      type: Boolean,
      default: false
    },
    // 联系人人下 新建商机 需要联系人里的客户信息  合同下需要客户和商机信息
    detail: {
      type: Object,
      default: () => {
        return {}
      }
    }
  },
  data() {
    return {
      loading: false,
      noMore: false,
      page: 1,
      timeSelect: '',
      // scrollKey: Date.now(),
      list: [],

      // 控制详情展示
      // 目前选中单元格(从cell 回调中 获取)
      detailIndex: 0,
      rowID: '',
      showDview: false,

      examineCount: 0,
      examineMoney: '0.00'
    }
  },
  inject: ['rootTabs'],
  watch: {
    id(val) {
      this.refreshList()
    },
    'rootTabs.currentName'(val) {
      if (val === 'RelativeExamine') {
        this.refreshList()
      }
    }
  },
  mounted() {
    this.refreshList()
  },
  methods: {
    /**
     * 父容器滚动
     */
    scroll() {
      const scrollBottomTips = this.$refs.scrollBottomTips2
      if (!this.loading && isEleVisible(scrollBottomTips) && !this.noMore) {
        this.getList()
      }
    },

    /**
     * 刷新列表
     */
    refreshList() {
      this.page = 1
      this.list = []
      this.noMore = false
      // this.scrollKey = Date.now()
      this.getList()
    },
    /**
     * 获取数据列表
     */
    getList() {
      if (this.loading) {
        return
      }
      this.loading = true
      const params = {
        page: this.page,
        limit: 4,
        customerId: this.id,
        applyTime: this.timeSelect
      }
      const request = crmCustomerQueryApplyExamineAPI
      request(params)
        .then(res => {
          this.loading = false
          const data = res.data

          this.examineCount = data.totalRow
          const examineMoney = data.extraData ? data.extraData.examineMoney || 0 : 0
          this.examineMoney = separator(examineMoney)

          if (!this.noMore) {
            this.list = this.list.concat(data.list)
            this.page++
          }

          this.noMore = data.list.length === 0

          // 如果还有更多
          if (!this.noMore) {
            this.$nextTick(() => {
              this.scroll()
            })
          }
        })
        .catch(() => {
          this.noMore = true
          this.loading = false
        })
    },
    /**
     * cell 操作
     */
    cellHandle(type, data, index) {
      this.detailIndex = index
      if (type == 'detail') {
        this.rowID = data.examineId
        this.showDview = true
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.main {
  position: relative;
  width: 100%;

  .hd {
    padding: 15px !important;

    .hd-total {
      span:nth-child(2) {
        margin-left: 15px;
      }
    }
  }
}

/deep/ .el-date-editor {
  width: 136px;
}
</style>
