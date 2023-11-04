<template>
  <slide-view
    :listener-ids="listenerIDs"
    :no-listener-ids="noListenerIDs"
    :no-listener-class="noListenerClass"
    :body-style="{padding: 0, height: '100%'}"
    class="d-view"
    @close="hideView">
    <flexbox class="t-section">
      <!-- <img
        :src="crmIcon"
        class="t-img" > -->
      <div class="t-name">跟进记录</div>
    </flexbox>
    <div
      :key="scrollKey"
      v-infinite-scroll="getList"
      class="t-content"
      infinite-scroll-disabled="scrollDisabled"
      infinite-scroll-distance="100">
      <log-cell
        v-for="(item, index) in list"
        :key="index"
        :item="item"
        :index="index"
        :can-delete="false"
        @crm-detail="checkRelationDetail">
        <div
          class="relate-cell"
          @click="checkRelationDetail(item.activityType, item.activityTypeId, true)">
          <i
            :class="item.activityType | crmIconClass"
            class="relate-cell-icon" />
          <span
            class="relate-cell-type">{{ item.activityType | crmName }}-</span>
          <span
            class="relate-cell-name">{{ item.activityTypeName }}</span>
        </div>
      </log-cell>
    </div>
    <p
      v-if="loading"
      class="scroll-bottom-tips">加载中...</p>
    <p
      v-if="noMore"
      class="scroll-bottom-tips">没有更多了</p>

    <c-r-m-full-screen-detail
      :id="relationID"
      :visible.sync="showFullDetail"
      :crm-type="relationCrmType" />

  </slide-view>
</template>

<script>
import LogCell from '@/views/crm/components/Activity/LogCell'
import SlideView from '@/components/SlideView'

import crmTypeModel from '@/views/crm/model/crmTypeModel'

export default {
  /** 跟进记录列表 */
  name: 'RecordList',

  components: {
    LogCell,
    SlideView,
    CRMFullScreenDetail: () =>
      import('@/components/CRMFullScreenDetail')
  },

  filters: {
    crmIconClass(type) {
      return `wk wk-${crmTypeModel.convertTypeToKey(type)}`
    },

    crmName(type) {
      return crmTypeModel.convertTypeToName(type)
    }
  },

  props: {
    crmType: String,
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
    },
    id: Number
  },

  data() {
    return {
      loading: false,

      // 判断是否发请求
      page: 1,
      noMore: false,
      list: [],
      scrollKey: Date.now(),

      showFullDetail: false, // 查看相关客户管理详情
      relationID: '', // 相关ID参数
      relationCrmType: '' // 相关类型
    }
  },

  computed: {
    crmIcon() {
      const crmType = this.crmType.replace('crm_', '')
      return require(`@/assets/img/crm/${crmType}.png`)
    },

    scrollDisabled() {
      return this.loading || this.noMore
    }
  },

  mounted() {
    this.page = 1
    this.list = []
    this.noMore = false
    this.scrollKey = Date.now()
  },

  methods: {

    /**
     * 获取列表
     */
    getList() {
      if (this.loading) return
      this.loading = true
      this.request({ ...this.params, limit: 5, page: this.page })
        .then(res => {
          if (!this.noMore) {
            this.page++
            this.list = this.list.concat(res.data.list)
          }
          this.noMore = res.data.lastPage
          this.loading = false
        })
        .catch(() => {
          this.noMore = true
          this.loading = false
        })
    },

    /**
     * 查看相关客户管理详情
     */
    checkRelationDetail(type, id, convert = false) {
      this.relationID = id
      this.relationCrmType = convert ? crmTypeModel.convertTypeToKey(type) : type
      this.showFullDetail = true
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
.t-section {
  position: relative;
  min-height: 60px;
  padding: 10px 17px;
  line-height: 40px;

  .t-img {
    display: block;
    width: 35px;
    height: 35px;
    margin-right: 10px;
  }

  .t-name {
    flex: 1;
    font-size: 20px;
  }

  .t-close {
    display: block;
    float: right;
    width: 40px;
    height: 40px;
    padding: 10px;
    margin-left: 20px;
    cursor: pointer;
  }
}

.d-view {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 950px;
  background-color: white;
}

.t-content {
  position: relative;
  height: calc(100% - 80px);
  margin: 0 30px;
  overflow: auto;
}

.relate-cell {
  position: relative;
  display: inline-block;
  width: auto;
  padding: 8px;
  margin-top: 10px;
  margin-left: 40px;
  font-size: 12px;
  color: $--color-text-primary;
  background-color: #f5f7fa;
  border-radius: 4px;

  &-icon {
    display: inline-block;
    margin-right: 5px;
    font-size: 14px;
    color: $--color-text-regular;
  }

  &-name {
    color: $--color-primary;
    cursor: pointer;
  }

  &-name:hover {
    text-decoration: underline;
  }
}

</style>
