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
      v-if="detail"
      direction="column"
      align="stretch"
      class="main">
      <flexbox class="detail-header">
        <!-- <div class="header-icon">
          <i class="wk wk-log" />
        </div> -->
        <div class="header-name">日志</div>
      </flexbox>
      <div class="main__bd">
        <!-- 基本信息 -->
        <div class="main__bd--info">
          <div class="content">
            <div
              v-if="detail.content"
              class="content-box">
              <div class="content-title">
                {{ logTitleName }}：
              </div>
              <div class="content-text">{{ detail.content }}</div>
            </div>
            <div
              v-if="detail.tomorrow"
              class="content-box">
              <div class="content-title">
                {{ logNextTitleName }}：
              </div>
              <div class="content-text">{{ detail.tomorrow }}</div>
            </div>
            <div
              v-if="detail.question"
              class="content-box">
              <div class="content-title">
                遇到的问题：
              </div>
              <div class="content-text">{{ detail.question }}</div>
            </div>
          </div>

          <picture-list-view
            v-if="detail.img.length !== 0"
            :list="detail.img" />

          <flexbox v-if="detail.sendUserList && detail.sendUserList.length" class="send-list">
            <span class="send-list__label">发送给：</span>
            <span
              v-for="(item, index) in detail.sendUserList"
              :key="index"
              class="send-list__user">
              <xr-avatar
                :id="item.userId"
                :name="item.realname"
                :size="32"
                :src="item.img"
                :disabled="false"
                trigger="hover" />
            </span>
          </flexbox>

          <!-- 附件 -->
          <div v-if="detail.file.length" class="section">
            <div class="section__hd">
              <!-- <i class="wukong wukong-file" /> -->
              <span>附件</span>
              <span>({{ detail.file.length }})</span>
            </div>
            <div class="section__bd">
              <file-cell :file-list="detail.file" />
            </div>
          </div>

          <!-- 相关信息 -->
          <div
            v-if="Object.keys(relatedListData).length > 0"
            class="section">
            <div class="section__hd">
              <!-- <i class="wukong wukong-relevance" /> -->
              <span>相关信息</span>
            </div>
            <div class="section__bd">
              <related-business
                ref="relatedBusiness"
                :margin-left="'0'"
                :all-data="relatedListData"
                :show-add-btn="false" />
            </div>
          </div>

          <div v-if="detail.getBulletin == 1" class="section">
            <div class="section__hd">
              <!-- <i class="wk wk-icon-briefing" /> -->
              <span>销售简报</span>
            </div>
            <div class="section__bd">
              <report-menu
                :list="reportList"
                @select="reportSelect" />
            </div>
          </div>

          <fav-list
            :is-favour="detail.isFavour"
            :data="detail.favourUser"
            @fav="favourClick"
          />
        </div>

        <!-- 回复 -->
        <el-tabs
          value="commont"
          type="border-card"
          class="commont">
          <el-tab-pane
            label="回复"
            name="commont">
            <reply-comment
              ref="f_reply"
              v-loading="commentLoading"
              @toggle="closeOtherReply"
              @reply="handleReply" />
            <comment-list
              v-if="replyList.length > 0"
              ref="comment_list"
              :props="commentListProps"
              :list="replyList"
              @delete="deleteComment"
              @close-other-reply="$refs.f_reply.toggleFocus(true)" />
          </el-tab-pane>
        </el-tabs>

      </div>
    </div>
    <!-- 销售简报列表 -->
    <report-list
      :show.sync="reportListShow"
      :title="reportData.title"
      :placeholder="reportData.placeholder"
      :crm-type="reportData.crmType"
      :request="reportData.request"
      :params="reportData.params"
      :record-request="reportData.recordRequest"
      :field-list="fieldReportList"
      :paging="reportData.paging"
      :sortable="reportData.sortable" />

  </slide-view>
</template>

<script>
import {
  journalQueryByIdAPI,
  journalQueryRecordCountAPI,
  journalQueryBulletinByTypeAPI,
  oaLogFavourOrCancelAPI
} from '@/api/oa/journal'
import {
  setCommentAPI,
  deleteCommentAPI,
  queryCommentListAPI
} from '@/api/oa/common'

import SlideView from '@/components/SlideView'
import PictureListView from '@/components/PictureListView'
import FileCell from '@/components/FileCell'
import RelatedBusiness from '@/components/RelatedBusiness'
import ReportMenu from './ReportMenu'
import ReportList from '@/views/crm/workbench/components/ReportList'
import ReplyComment from '@/components/ReplyComment'
import CommentList from '@/components/CommentList'
import FavList from './FavList'

import { mapGetters } from 'vuex'
import { separator } from '@/filters/vueNumeralFilter/filters'
import { getReportFieldList } from '../utils'

export default {
  // 日志详情
  name: 'LogDetail',
  components: {
    SlideView,
    PictureListView,
    FileCell,
    RelatedBusiness,
    ReportMenu,
    ReportList,
    ReplyComment,
    CommentList,
    FavList
  },
  props: {
    id: [String, Number],
    noListenerClass: {
      type: Array,
      default: () => {
        return ['el-table__body']
      }
    }
  },
  data() {
    return {
      loading: false,
      detail: null,
      // 简报信息
      reportList: [
        {
          type: 'customer',
          key: 'customerCount',
          info: '今日新增客户',
          count: 0,
          name: '今日新增客户 0'
        },
        {
          type: 'business',
          key: 'businessCount',
          info: '今日新增商机',
          count: 0,
          name: '今日新增商机 0'
        },
        {
          type: 'contract',
          key: 'contractCount',
          info: '今日新增合同',
          count: 0,
          name: '今日新增合同 0'
        },
        {
          type: 'receivables',
          key: 'receivablesMoney',
          info: '今日新增回款',
          count: 0,
          name: '今日新增回款 0'
        },
        {
          type: 'record',
          key: 'recordCount',
          info: '今日新增跟进记录',
          count: 0,
          name: '今日新增跟进记录 0'
        }
      ],

      // 简报预览
      reportListShow: false,
      fieldReportList: null,
      reportData: {
        title: '',
        placeholder: '',
        crmType: '',
        request: null,
        recordRequest: journalQueryBulletinByTypeAPI,
        params: null,
        paging: true,
        sortable: false
      },

      // 回复
      commentLoading: false,
      replyList: []
    }
  },
  computed: {
    ...mapGetters([
      'userInfo'
    ]),
    /**
     * 相关信息
     */
    relatedListData() {
      const tempsData = {}
      const keys = ['contacts', 'customer', 'business', 'contract']
      for (let index = 0; index < keys.length; index++) {
        const key = keys[index]
        const list = this.detail[`${key}List`] || []
        if (list.length > 0) {
          tempsData[key] = list
        }
      }
      return tempsData
    },
    // 日志标题
    logTitleName() {
      return {
        1: '今日',
        2: '本周',
        3: '本月'
      }[this.detail.categoryId] + '工作内容'
    },
    logNextTitleName() {
      return {
        1: '明日',
        2: '下周',
        3: '下月'
      }[this.detail.categoryId] + '工作内容'
    },

    // 评论列表配置
    commentListProps() {
      return {
        addRequest: setCommentAPI, // 添加请求和参数
        addParams: { typeId: this.id, type: '2' }, // 3 知识库 2 日志 1 任务
        replyKey: 'pid', // 日志 任务 pid  阶段 replyId
        replyValueKey: 'userId', // 获取值的keys 日志 任务 userId  阶段 user.userId
        deleteRequest: deleteCommentAPI, // 删除请求和参数
        deleteParams: null
      }
    }
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
      this.getCommentList()
    },

    /**
     * 详情
     */
    getDetail() {
      this.loading = true
      journalQueryByIdAPI({ logId: this.id })
        .then(res => {
          this.detail = res.data
          if (this.detail.getBulletin == 1) {
            const data = this.detail.bulletin || {}
            this.reportList = this.reportList.map(item => {
              if (item.key == 'receivablesMoney') {
                data.receivablesMoney = separator(data.receivablesMoney || 0)
              }
              item.count = data[item.key]
              item.name = `${item.info} ${item.count}`
              return item
            })
          }
          this.loading = false
        })
        .catch(() => {
          this.loading = false
          this.hideView()
        })
    },

    /**
     * 关闭页面
     */
    hideView() {
      this.$emit('close')
      this.$emit('hide-view')
    },

    /**
     * 简报预览
     */
    reportSelect(item, data) {
      data = this.detail

      if (item.type) {
        this.reportData.title = `销售简报-${item.info}`
        this.reportData.placeholder = {
          customer: '请输入客户联系人',
          business: '请输入商机名称',
          contract: '请输入合同名称',
          receivables: '请输入回款编号',
          record: ''
        }[item.type]

        this.reportData.crmType = item.type
        // data 存在 是已添加日志预览  不存在为页面顶部 销售简报预览
        this.reportData.params = data ? { logId: data.logId } : { today: 1 }

        // type   1 客户 2 商机 3 合同 4 回款 5 跟进记录
        this.reportData.params.type = {
          customer: 1,
          business: 2,
          contract: 3,
          receivables: 4,
          record: 5
        }[item.type]

        if (item.type == 'record') {
          this.fieldReportList = [
            {
              label: '模块',
              prop: 'crmType',
              width: 300
            },
            {
              label: '新增跟进记录数',
              prop: 'count'
            }
          ]
          this.reportData.request = journalQueryRecordCountAPI
          this.reportData.paging = false
          this.reportData.sortable = false
        } else {
          this.fieldReportList = getReportFieldList(item.type)
          this.reportData.request = journalQueryBulletinByTypeAPI
          this.reportData.paging = true
          this.reportData.sortable = 'custom'
        }

        this.reportListShow = true
      }
    },

    /**
     * 评论逻辑
     */
    getCommentList() {
      queryCommentListAPI({
        typeId: this.id,
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

    closeOtherReply(flag) {
      if (!flag && this.$refs.comment_list) {
        this.$refs.comment_list.closeReply()
      }
    },

    deleteComment(index) {
      this.replyList.splice(index, 1)
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
        this.$refs.f_reply.commentsTextarea = ''
        this.replyList.push(res.data)
        this.commentLoading = false
      }).catch(() => {
        this.commentLoading = false
      })
    },

    /**
     * 点赞
     */
    favourClick() {
      oaLogFavourOrCancelAPI({
        isFavour: !this.detail.isFavour,
        logId: this.detail.logId
      }).then(res => {
        const resData = res.data || {}
        this.detail.isFavour = resData.isFavour
        this.detail.favourUser = resData.favourUser
      })
        .catch(() => {})
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
      padding: 0 20px 10px;
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

// 日志内容
.content {
  padding-top: 30px;

  .content-box {
    margin-bottom: 16px;
    font-size: 14px;

    &:last-child {
      margin-bottom: 16px;
    }

    .content-title {
      margin-bottom: 8px;
      color: $--color-n200;
    }

    .content-text {
      line-height: 1.5;
      word-wrap: break-word;
      white-space: pre-wrap;
    }
  }
}

.detail-header {
  padding: 30px 20px 0;
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

// 销售简报
.report-menu {
  padding: $--interval-base;
  background-color: $--background-color-base;
  border-radius: $--border-radius-base;
}

// 详情
.commont {
  margin-bottom: 50px;
  box-shadow: none;

  /deep/ .el-tabs__item {
    top: 2px;
    margin-top: -2px;
    font-size: 12px;
  }

  /deep/ .el-tabs__nav-scroll {
    min-height: 39px;
  }

  /deep/ .el-tabs__item.is-active {
    border-top: 2px solid $--color-primary;
  }

  /deep/ .el-tabs {
    height: calc(100% - 15px) !important;
  }

  // /deep/ .el-tabs__content {
  //   height: calc(100% - 40px) !important;
  //   padding: 0;
  //   overflow: hidden;
  //   position: relative;

  //   .el-tab-pane {
  //     height: 100%;
  //     overflow: hidden;
  //   }
  // }
}

</style>
