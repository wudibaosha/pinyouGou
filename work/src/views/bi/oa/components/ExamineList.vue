<template>
  <slide-view
    :listener-ids="listenerIDs"
    :no-listener-ids="noListenerIDs"
    :no-listener-class="noListenerClass"
    :body-style="{padding: 0, height: '100%'}"
    class="d-view"
    @close="hideView">
    <div
      class="examine-list-main">
      <div
        class="t-section">
        <span class="t-name">{{ name }}</span><span class="t-des">({{ name }}申请：<span class="t-value">{{ totalCount }}次</span></span>
        <span
          v-if="showDes"
          style="margin-left: 4px;"
          class="t-des">{{ desInfo }}：<span class="t-value">{{ sumData + desUnit }}</span></span><span class="t-des">) </span>
      </div>
      <div
        :key="scrollKey"
        v-infinite-scroll="getList"
        class="t-content"
        infinite-scroll-distance="100"
        infinite-scroll-disabled="scrollDisabled">

        <examine-cell
          v-for="(item, index) in list"
          :key="index"
          :data="item"
          :show-handle="false"
          @on-handle="examineCellHandle" />
        <p
          v-if="loading"
          class="scroll-bottom-tips">加载中...</p>
        <p
          v-if="noMore"
          class="scroll-bottom-tips">没有更多了</p>
      </div>
    </div>

    <!-- CRM详情 -->
    <c-r-m-full-screen-detail
      :id="relatedID"
      :visible.sync="showRelatedDetail"
      :crm-type="relatedCRMType"
      @handle="refreshList" />
  </slide-view>
</template>

<script>
import SlideView from '@/components/SlideView'
import ExamineCell from '@/views/oa/examine/components/ExamineCell'
import { separator } from '@/filters/vueNumeralFilter/filters'

export default {
  /** 审批统计 列表 */
  name: 'ExamineList',

  components: {
    SlideView,
    ExamineCell,
    CRMFullScreenDetail: () =>
      import('@/components/CRMFullScreenDetail')
  },

  props: {
    type: [String, Number], // 审批类型
    name: String,
    request: Function,
    params: Object,
    // 监听的dom 进行隐藏详情
    listenerIDs: {
      type: Array,
      default: () => {
        return ['crm-main-container']
      }
    },
    // 不监听
    noListenerIDs: {
      type: Array,
      default: () => {
        return []
      }
    },
    noListenerClass: {
      type: Array,
      default: () => {
        return ['el-table__body']
      }
    }
  },

  data() {
    return {
      totalCount: 0,
      sumData: '',
      // 判断是否发请求
      loading: false,
      noMore: false,
      page: 1,
      list: [],
      // 相关详情的查看
      relatedID: '',
      relatedCRMType: '',
      showRelatedDetail: false,
      scrollKey: Date.now()
    }
  },

  computed: {
    // 展示说明信息
    showDes() {
      return this.type > 1 && this.type <= 6
    },
    // 说明信息
    desInfo() {
      if (this.type == 2) {
        return '请假总天数'
      } else if (this.type == 3) {
        return '出差总天数'
      } else if (this.type == 4) {
        return '加班总天数'
      } else if (this.type == 5) {
        return '报销总金额'
      } else if (this.type == 6) {
        return '借款总金额'
      }
      return ''
    },
    // 说明单位
    desUnit() {
      if (this.dayType) {
        return '天'
      }
      return '元'
    },

    // 单位为天的类型
    dayType() {
      return this.type > 1 && this.type <= 4
    },

    // 无线滚动控制
    scrollDisabled() {
      return this.loading || this.noMore
    }
  },

  watch: {
    params() {
      this.refreshList()
    }
  },

  mounted() {},

  methods: {
    refreshList() {
      this.sumData = ''
      this.totalCount = 0

      this.page = 1
      this.list = []
      this.noMore = false
      this.scrollKey = Date.now()
    },

    /**
     * 获取列表
     */
    getList() {
      this.loading = true
      this.request({ page: this.page, limit: 15, ...this.params })
        .then(res => {
          const extraData = res.data.extraData || {}
          this.sumData =
            this.dayType ? (extraData.duration || 0) : separator(extraData.money || 0)

          if (!this.noMore) {
            this.list = this.list.concat(res.data.list)
            this.page++
          }

          this.totalCount = res.data.totalRow

          this.loading = false
          this.noMore = !(res.data.list && res.data.list.length == 15)
        })
        .catch(() => {
          this.noMore = true
          this.loading = false
        })
    },

    /**
     * 操作
     */
    examineCellHandle(data) {
      // 编辑
      if (data.type == 'view') {
        this.relatedID = data.data.item.examineId
        this.relatedCRMType = 'examine'
        this.showRelatedDetail = true
      }
    },

    /**
     * 点击关闭按钮隐藏视图
     */
    hideView() {
      this.$emit('hide')
    }
  }
}
</script>

<style lang="scss" scoped>
.examine-list-main {
  position: relative;
  height: 100%;
}

.t-section {
  position: relative;
  min-height: 60px;
  padding: 10px 17px;
  line-height: 40px;

  .t-name {
    margin-right: 4px;
    font-size: 16px;
    color: $--color-text-primary;
  }

  .t-des {
    color: $--color-text-secondary;

    .t-value {
      color: #f3a633;
    }
  }
}

.d-view {
  position: fixed;
  top: $--detail-view-top;
  right: 0;
  bottom: 0;
  width: 926px;
  background-color: white;
}

.t-content {
  height: calc(100% - 80px);
  margin: 0 30px;
  overflow-y: auto;
}
</style>
