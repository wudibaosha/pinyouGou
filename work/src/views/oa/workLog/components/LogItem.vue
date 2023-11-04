<template>
  <div class="log-item">
    <div class="main">
      <div class="user">
        <xr-avatar
          v-if="data.createUser"
          :id="data.createUser.userId"
          :name="data.createUser.realname"
          :size="32"
          :src="data.createUser.img"
          :disabled="false"
          class="user-img" />
        <div class="box">
          <div>
            <div class="username">
              {{ data.createUser.realname }}<span class="dept">{{ data.createUser.deptName }}</span>
            </div>
            <div class="time">
              {{ data.createTime }}<span class="tag">创建了新日志</span><!--{{ data.isRead === 1 ? '已读' : '未读' }}-->
            </div>
            <el-button
              v-if="showHistoryBtn"
              style="padding: 10px 0;"
              type="link"
              @click="checkHistoryClick">查看以往日志</el-button>
          </div>
          <div
            class="handle">
            <el-dropdown
              v-if="data.permission && (data.permission.isUpdate || data.permission.isDelete)"
              trigger="click"
              @command="handleCommand">
              <el-button
                icon="el-icon-more"
                class="more" />
              <el-dropdown-menu slot="dropdown">
                <el-dropdown-item
                  v-if="data.permission.isUpdate"
                  command="edit">编辑</el-dropdown-item>
                <el-dropdown-item
                  v-if="data.permission.isDelete"
                  command="delete">删除</el-dropdown-item>
              </el-dropdown-menu>
            </el-dropdown>
          </div>
          <!-- <div class="comment-status">
            <span class="icon wk wk-task" />
            <span>{{ getCategory(data.categoryId) }}-{{ data.replyNum === 0 ? '未点评' : '已点评' }}</span>
            <span :class="{active: data.replyNum !== 0}" class="dot" />
          </div> -->
        </div>
      </div>
      <div class="content" style="margin-top: 8px;">
        <div v-if="data.content" class="content-box">
          <div class="content-title">
            {{ logTitleName }}：
          </div>
          <div class="content-text">{{ data.content }}</div>
        </div>
        <div v-if="data.tomorrow" class="content-box">
          <div class="content-title">
            {{ logNextTitleName }}：
          </div>
          <div class="content-text">{{ data.tomorrow }}</div>
        </div>
        <div v-if="data.question" class="content-box">
          <div class="content-title">
            遇到的问题：
          </div>
          <div class="content-text">{{ data.question }}</div>
        </div>
      </div>

      <picture-list-view
        v-if="data.img && data.img.length !== 0"
        :list="data.img" />

      <!-- <file-list-view
        v-if="data.file && data.file.length !== 0"
        :list="data.file" /> -->
      <div
        v-if="data.file && data.file.length !== 0"
        class="content"
        style="margin-left: 45px;">
        <div class="content-box">
          <div class="content-title">
            附件
          </div>
          <file-cell :file-list="data.file" />
        </div>
      </div>

      <div
        v-if="allDataLen > 0"
        class="content"
        style="margin-left: 45px;">
        <div class="content-box">
          <div class="content-title">
            相关信息
          </div>
          <related-business
            ref="relatedBusiness"
            :margin-left="'0'"
            :all-data="allData"
            :show-add-btn="false" />
        </div>
      </div>
      <div v-if="data.getBulletin" class="content is-background">
        <div class="content-box">
          <div class="content-title">
            销售简报
          </div>
          <div class="content-text">
            <report-menu
              :list="reportList"
              @select="reportSelect" />
          </div>
        </div>
      </div>

      <flexbox v-if="(data.sendUserList && data.sendUserList.length > 0) || (data.sendDeptList && data.sendDeptList.length > 0)" class="send-list">
        <span class="send-list__label">发送给：</span>
        <span
          v-for="(item, sendIndex) in (data.sendUserList || []).concat(data.sendDeptList || [])"
          :key="sendIndex"
          class="send-list__user">
          <xr-avatar
            :name="item.realname || item.name"
            :size="32"
            :src="item.img" />
        </span>
      </flexbox>
    </div>

    <div class="footer">
      <el-button
        type="icon"
        icon="wk wk-message"
        class="replay-btn"
        @click="replayClick">{{ (replyTotal > 0 ? `${replyTotal}` : '评论') }}</el-button>
      <div style="flex: 1;">
        <fav-list
          :is-favour="data.isFavour"
          :data="data.favourUser"
          @fav="favourClick"
        />
      </div>
      <!-- <el-button
        ref="favBtn"
        :type="data.isFavour ? 'primary' : ''"
        style="margin-left: 10px;"
        icon="wk wk-good"
        class="fav-btn"
        @click="favourClick">赞{{ `${data.favourUser.length > 0 ? `(${data.favourUser.length})` : ''}` }}</el-button> -->
    </div>
    <div
      v-if="showReply"
      class="reply-wrapper-wrap">
      <div
        class="reply-wrapper">
        <flexbox align="stretch" class="reply-comment-wrap">
          <xr-avatar
            :name="userInfo.realname"
            :size="32"
            :src="userInfo.img"
            class="user-img" />
          <reply-comment
            ref="f_reply"
            v-loading="commentLoading"
            @toggle="closeOtherReply"
            @reply="handleReply" />
        </flexbox>
        <comment-list
          v-if="replyList.length > 0"
          ref="comment_list"
          :props="commentListProps"
          :list="replyList"
          @delete="deleteComment"
          @close-other-reply="$refs.f_reply.toggleFocus(true)" />
      </div>
    </div>
  </div>
</template>

<script>
// API
import {
  journalDeleteAPI,
  journalSetReadAPI,
  oaLogFavourOrCancelAPI
} from '@/api/oa/journal'
import {
  setCommentAPI,
  deleteCommentAPI,
  queryCommentListAPI
} from '@/api/oa/common'

import PictureListView from '@/components/PictureListView'
import RelatedBusiness from '@/components/RelatedBusiness'
import ReplyComment from '@/components/ReplyComment'
import FileCell from '@/components/FileCell'
import CommentList from '@/components/CommentList'
import ReportMenu from './ReportMenu'
import FavList from './FavList'

import { mapGetters } from 'vuex'
import { separator } from '@/filters/vueNumeralFilter/filters'
import { isArray } from '@/utils/types'

export default {
  name: 'LogItem',
  components: {
    PictureListView,
    RelatedBusiness,
    CommentList,
    ReplyComment,
    ReportMenu,
    FavList,
    FileCell
  },
  props: {
    data: {
      type: Object,
      required: true
    },
    index: {
      type: Number,
      default: 0
    },
    showHistoryBtn: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      isWaiting: false,
      showReply: false,
      commentLoading: false,
      replyList: [],

      // 简报信息
      reportList: [
        {
          type: 'customer',
          key: 'customerCount',
          info: '今日新增客户',
          iconClass: 'wk wk-customer-line',
          count: 0,
          name: '今日新增客户 0'
        },
        {
          type: 'business',
          key: 'businessCount',
          info: '今日新增商机',
          iconClass: 'wk wk-business-line',
          count: 0,
          name: '今日新增商机 0'
        },
        {
          type: 'contract',
          key: 'contractCount',
          info: '今日新增合同',
          iconClass: 'wk wk-contract-line',
          count: 0,
          name: '今日新增合同 0'
        },
        {
          type: 'receivables',
          key: 'receivablesMoney',
          info: '今日新增回款',
          iconClass: 'wk wk-receivables-line',
          count: 0,
          name: '今日新增回款 0'
        },
        {
          type: 'record',
          key: 'recordCount',
          info: '今日新增跟进记录',
          iconClass: 'wk wk-icon-message-line',
          count: 0,
          name: '今日新增跟进记录 0'
        }
      ]
    }
  },
  computed: {
    ...mapGetters([
      'userInfo'
    ]),
    allData() {
      return {
        business: this.data ? this.data.businessList : [],
        contacts: this.data ? this.data.contactsList : [],
        contract: this.data ? this.data.contractList : [],
        customer: this.data ? this.data.customerList : []
      }
    },
    allDataLen() {
      let res = 0
      if (!this.data) return res
      const keys = ['businessList', 'contactsList', 'contractList', 'customerList']
      keys.forEach(key => {
        res += (isArray(this.data[key]) ? this.data[key].length : 0)
      })
      return res
    },
    replyTotal() {
      let num = 0
      this.replyList.forEach(item => {
        num++
        num += item.childCommentList.length || 0
      })
      return num || this.data.replyNum
    },
    // 日志标题
    logTitleName() {
      return {
        1: '今日',
        2: '本周',
        3: '本月'
      }[this.data.categoryId] + '工作内容'
    },
    logNextTitleName() {
      return {
        1: '明日',
        2: '下周',
        3: '下月'
      }[this.data.categoryId] + '工作内容'
    },

    // 评论列表配置
    commentListProps() {
      return {
        addRequest: setCommentAPI, // 添加请求和参数
        addParams: { typeId: this.data ? this.data.logId : '', type: '2' }, // 3 知识库 2 日志 1 任务
        replyKey: 'pid', // 日志 任务 pid  阶段 replyId
        replyValueKey: 'userId', // 获取值的keys 日志 任务 userId  阶段 user.userId
        deleteRequest: deleteCommentAPI, // 删除请求和参数
        deleteParams: null
      }
    }
  },
  created() {
    // this.$nextTick(() => {
    //   if (this.data.isRead === 1) return
    //   this.$bus.on('load-more-work-log', clientHeight => {
    //     if (this.isWaiting) return
    //     if (this.calcVisible(clientHeight)) {
    //       this.isWaiting = true
    //       setTimeout(() => {
    //         this.isWaiting = false
    //         if (this.calcVisible(clientHeight)) {
    //           this.readLog()
    //         }
    //       }, 3000)
    //     }
    //   })
    // })

    if (this.data.getBulletin) {
      const data = this.data.bulletin || {}
      this.reportList = this.reportList.map(item => {
        if (item.key == 'receivablesMoney') {
          data.receivablesMoney = separator(data.receivablesMoney || 0)
        }
        item.count = data[item.key]
        item.name = `${item.info} ${item.count}`
        return item
      })
    }
  },
  beforeDestroy() {
    // this.$bus.off('load-more-work-log')
  },
  methods: {
    getCategory(categoryId) {
      const map = {
        1: '日报',
        2: '周报',
        3: '月报'
      }
      return map[categoryId]
    },
    /**
     * 编辑/删除
     * @param action
     * @param index
     */
    handleCommand(action, index) {
      if (action === 'delete') {
        this.$confirm('确定删除?', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          journalDeleteAPI({ logId: this.data.logId }).then(() => {
            this.$message.success('删除成功!')
            this.$emit('delete', index)
          })
        }).catch(() => {
          this.$message.info('已取消删除')
        })
      } else {
        this.$emit('edit', this.index, this.data)
      }
    },

    /**
     * 判断当前组件是否完全可见
     */
    calcVisible(boxHeight) {
      if (this.data.isRead === 1) return false
      const domRect = this.$el.getBoundingClientRect()
      return boxHeight > (domRect.top + domRect.height)
    },

    /**
     * 日志标记为已读
     */
    readLog() {
      if (this.data.isRead === 1) return
      this.$emit('read')
      journalSetReadAPI({
        logId: this.data.logId
      }).then(() => {
        this.$bus.off('load-more-work-log')
      }).catch()
    },

    /**
     * 日志评论
     */
    handleReply(data) {
      this.commentLoading = true
      setCommentAPI({
        content: data,
        ...this.commentListProps.addParams
      }).then(res => {
        res.data.user = {
          userId: this.userInfo.userId,
          realname: this.userInfo.realname,
          img: this.userInfo.img
        }
        res.data.childCommentList = []
        // this.$emit('add-comment', {
        //   data: res.data,
        //   index: this.index
        // })
        this.replyList.push(res.data)
        this.commentLoading = false
        this.showReply = false
        this.$nextTick(() => {
          this.showReply = true
        })
      }).catch(() => {
        this.commentLoading = false
      })
    },

    deleteComment(index) {
      this.replyList.splice(index, 1)
    },

    closeOtherReply(flag) {
      if (!flag && this.$refs.comment_list) {
        this.$refs.comment_list.closeReply()
      }
    },

    /**
     * 相关信息点击
     */
    relatedClick(type, data) {
      this.$emit('relate-detail', type, data)
    },

    /**
     * 回复点击
     */
    replayClick() {
      this.showReply = !this.showReply
      if (this.replyList.length == 0) {
        this.getCommentList()
      }
    },

    /**
     * 获取回复列表
     */
    getCommentList() {
      queryCommentListAPI({
        typeId: this.data.logId,
        type: 2 // 任务1 日志2
      })
        .then(res => {
          const list = res.data || []
          this.replyList = list
          // this.replyList = list.sort((a, b) => {
          //   return new Date(b.createTime) - new Date(a.createTime)
          // }) || []
        })
        .catch(() => {})
    },

    /**
     * 简报详情
     */
    reportSelect(item) {
      this.$emit('report-detail', item, this.data)
    },

    /**
     * 查看历史
     */
    checkHistoryClick() {
      this.$emit('check-history', this.data.createUser)
    },

    /**
     * 点赞
     *
     */
    favourClick() {
      oaLogFavourOrCancelAPI({
        isFavour: !this.data.isFavour,
        logId: this.data.logId
      }).then(res => {
        const resData = res.data || {}
        this.data.isFavour = resData.isFavour
        this.data.favourUser = resData.favourUser
      })
        .catch(() => {})
    }
  }
}
</script>

<style scoped lang="scss">
.log-item {
  .main {
    .user {
      display: flex;
      align-items: flex-start;
      justify-content: flex-start;
      font-size: 14px;

      .user-img {
        margin-right: 12px;
      }

      .box {
        display: flex;
        flex: 1;
        align-items: center;
        justify-content: space-between;

        .username {
          .dept {
            margin-left: $--interval-base * 2;
            color: $--color-text-secondary;
          }
        }

        .time {
          margin-top: 2px;
          color: $--color-text-secondary;

          .tag {
            margin-left: $--interval-base;
          }
        }

        .handle {
          margin-left: 24px;

          .more {
            margin-left: $--interval-base;
          }
        }

        .comment-status {
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;

          .icon {
            margin-right: 5px;
            font-size: 14px;
            color: #2772ff;
          }

          .dot {
            display: inline-block;
            width: 7px;
            height: 7px;
            margin-left: 5px;
            background-color: #f95a5a;
            border-radius: 50%;

            &.active {
              background-color: #4ca824;
            }
          }
        }
      }
    }

    .content {
      margin: 0 0 0 45px;

      .content-box {
        margin-bottom: 20px;

        &:last-child {
          margin-bottom: 16px;
        }

        .content-title {
          margin-bottom: $--interval-base;
          font-weight: bold;
          color: $--color-text-secondary;
        }

        .content-text {
          line-height: 1.5;
          word-wrap: break-word;
          white-space: pre-wrap;
        }
      }

      // 背景风格
      &.is-background {
        padding: $--interval-base;
        background-color: $--color-n10;
        border-radius: $--border-radius-base;

        .content-box {
          margin-bottom: 0;
        }
      }
    }

    .picture-list-view {
      margin: 0 15px 10px 45px;
    }

    .file-list-view {
      width: 800px;
      margin: 0 15px 10px 45px;
    }

    .related-business-list {
      width: 800px;
      margin: 0 15px 10px 45px;
    }
  }

  .footer {
    display: flex;
    align-items: center;
    width: 100%;
    height: 38px;
    padding: 0 16px;
    padding-left: 45px;
    margin-top: $--interval-base;
    border-radius: $--border-radius-base;

    .fav-btn,
    .replay-btn {
      padding-left: 0;
    }
  }

  .reply-wrapper-wrap {
    padding-left: 40px;
    margin-top: $--interval-base;
  }

  .reply-wrapper {
    padding: 20px 20px 10px;
    border: $--border-base;
    border-radius: $--border-radius-base;
  }

  .reply-comment-wrap {
    .user-img {
      margin-top: 5px;
      margin-right: $--interval-base;
    }

    .reply-comment {
      flex: 1;
    }
  }

  .comment-list {
    margin-top: #{$--interval-base * 2};
  }
}

.send-list {
  padding: 8px 15px 8px 45px;

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

.section {
  padding: 10px 0;

  &__hd {
    span {
      font-weight: $--font-weight-semibold;
    }
  }

  &__bd {
    margin-top: #{$--interval-base * 2};
  }

  /deep/ &-add {
    width: 32px;
    height: 32px;
    line-height: 32px;
    color: $--color-n800;
    text-align: center;
    cursor: pointer;
    border-radius: $--border-radius-base;
    transform: translateY(-25%);

    &:hover {
      background-color: $--color-n20;
    }
  }
}

.affix-all {
  margin-right: 1px;
  margin-bottom: 30px;
  margin-left: 1px;
  border-radius: 4px;
  box-shadow: $--box-shadow-bottom-light;

  &:hover {
    box-shadow: $--box-shadow-hover-bottom-light;
  }
}
</style>
