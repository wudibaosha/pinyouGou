<template>
  <slide-view
    v-loading="loading"
    :no-listener-class="noListenerClass"
    :body-style="{padding: 0, height: '100%'}"
    class="d-view"
    xs-empty-icon="nopermission"
    xs-empty-text="暂无权限"
    @afterEnter="viewAfterEnter"
    @close="hideView">
    <div
      v-if="list.length > 0"
      direction="column"
      align="stretch"
      class="main">
      <flexbox class="detail-header">
        <!-- <div class="header-icon">
          <i class="wk wk-log" />
        </div> -->
        <div class="header-name">日志列表</div>
      </flexbox>
      <div class="main__bd">
        <!-- 基本信息 -->
        <div class="main__bd--info">

          <flexbox
            v-for="(item, index) in list"
            :key="index"
            class="message-cell"
            align="stretch">
            <div class="message-cell__hd">
              <i class="wk wk-log" />
            </div>

            <div class="message-cell__bd">

              <div class="message-cell-des">
                <span>{{ item.leftContent }}</span>
                <span :class="['click-content']" @click="enterDetail(item)">《{{ item.createTime }}》</span>
                <span>{{ item.rightContent }}</span>
              </div>

              <div class="brief">
                <div class="text-one-line">日志内容 {{ item.content }}</div>
              </div>
            </div>
          </flexbox>
        </div>

      </div>

      <!-- CRM详情 -->
      <c-r-m-full-screen-detail
        :id="relationID"
        :visible.sync="showFullDetail"
        crm-type="log" />

    </div>

  </slide-view>
</template>

<script>
import {
  journalListAPI,
  journalHadCommentListAPI,
  journalNoCommentListAPI
} from '@/api/oa/journal'

import SlideView from '@/components/SlideView'

import { mapGetters } from 'vuex'

export default {
  // 日志列表
  name: 'LogList',
  components: {
    SlideView,
    CRMFullScreenDetail: () =>
      import('@/components/CRMFullScreenDetail')
  },
  props: {
    id: [String, Number],
    noListenerClass: {
      type: Array,
      default: () => {
        return ['el-table__body']
      }
    },
    params: {
      type: Object,
      default: () => {
        return {}
      }
    }
  },
  data() {
    return {
      loading: false,
      list: [],

      // 日志详情
      showFullDetail: false, // 查看相关客户管理详情
      relationID: '' // 相关ID参数
    }
  },
  computed: {
    ...mapGetters([
      'userInfo'
    ])
  },
  watch: {
    id() {
      this.viewAfterEnter()
    }
  },
  mounted() {},

  beforeDestroy() {},

  methods: {
    /**
     * 页面展示发请求
     */
    viewAfterEnter() {
      this.detail = null
      this.getDetail()
    },

    /**
     * 详情
     */
    getDetail() {
      this.loading = true
      const request = {
        count: journalListAPI,
        commentCount: journalHadCommentListAPI,
        unCommentCount: journalNoCommentListAPI
      }[this.id]

      let params = null
      const { createUserId, ...rest } = this.params
      if (this.id === 'count') {
        params = {
          createUserId: createUserId,
          deptIds: [],
          limit: 5,
          page: 1,
          search: '',
          type: rest.dateFilter
        }
      } else {
        params = {
          userList: [createUserId],
          ...rest
        }
        params.dataType = 0
      }

      request(params).then(res => {
        this.list = res.data.list
        this.loading = false
      }).catch(() => {
        this.loading = false
        this.hideView()
      })
    },

    /**
     * 查看详情
     */
    enterDetail(data) {
      this.relationID = data.logId
      this.showFullDetail = true
    },

    /**
     * 关闭页面
     */
    hideView() {
      this.$emit('close')
      this.$emit('hide-view')
    }

  }
}
</script>

<style lang="scss" scoped>
.main {
  position: relative;
  height: 100%;
  background: #f5f6f9;

  &__bd {
    height: calc(100% - 40px);
    overflow: auto;

    &--info {
      height: 100%;

      // padding: 0 20px 10px;
      background: white;
    }
  }
}

.d-view {
  position: fixed;
  top: $--detail-view-top;
  right: 0;
  bottom: 0;
  width: $--detail-width-base;
  min-width: 926px;
  padding: 15px;
  padding: 0 !important;
  background-color: white;
}

.detail-header {
  padding: 30px 20px;
  background: white;

  .header-icon {
    width: 40px;
    height: 40px;
    margin-right: 20px;
    line-height: 40px;
    text-align: center;
    background-color: #5864ff;
    border-radius: $--border-radius-base;

    .wk {
      font-size: 26px;
      color: white;
    }
  }

  .header-name {
    flex: 1;
    font-size: 24px;
    font-weight: 600;
  }
}

.send-list {
  padding: 8px 0;

  &__label {
    color: $--color-n200;
  }

  &__user {
    position: relative;
    display: inline-block;
  }

  &__user + &__user {
    margin-left: 7px;
  }
}

// 详情其他模块
.section {
  padding: 10px 0;

  &__hd {
    span {
      font-size: 16px;
      font-weight: 600;
    }

    .wk {
      margin-right: 5px;
      font-size: 15px;
      color: #363636;
    }
  }

  &__bd {
    padding-left: 0;
    margin-top: 15px;
  }
}

.message-cell {
  position: relative;
  padding: 16px 24px 8px;
  font-size: 14px;
  line-height: 1.5;

  &-title {
    color: $--color-text-regular;
  }

  &-des {
    margin-top: 4px;
    color: $--color-text-primary;
  }

  &__hd {
    flex-shrink: 0;
    width: 28px;
    height: 28px;
    margin-right: 16px;
    line-height: 28px;
    text-align: center;
    background-color: $--color-n90;
    border-radius: 14px;

    .wk {
      font-size: 13px;
      color: white;
    }
  }

  &__bd {
    flex: 1;
    overflow: hidden;
  }

  &__ft {
    position: relative;
    flex-shrink: 0;
    width: 100px;
    margin-left: 24px;
    color: $--color-text-regular;
    text-align: right;

    .delete-btn {
      padding: 0;
      visibility: hidden;
    }

    /deep/ .check-btn {
      display: flex;
      padding: 3px;
      cursor: auto;
      background-color: transparent;
      border-radius: 8px;

      span {
        display: inline-block;
        width: 8px;
        height: 8px;
        background-color: $--color-n90;
        border-radius: 4px;
      }

      &.is-unread {
        cursor: pointer;

        span {
          background-color: $--color-primary;
        }

        &:hover {
          background-color: rgba($color:$--color-b50, $alpha: 0.9);
        }
      }
    }
  }

  &:hover {
    background-color: #f7f8fa;

    .delete-btn {
      visibility: visible;
    }
  }
}

.click-content {
  color: $--color-primary;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
}

</style>
