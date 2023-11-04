<template>
  <slide-view
    v-loading="loading"
    :no-listener-class="noListenerClass"
    :body-style="{padding: 0, height: '100%'}"
    class="d-view"
    xs-empty-icon="nopermission"
    xs-empty-text="暂无权限"
    @close="hideView">
    <div
      v-if="detail"
      direction="column"
      align="stretch"
      class="main">
      <flexbox class="detail-header">
        <div class="header-icon">
          <i class="wk wk-log" />
        </div>
        <div class="header-name">公告</div>
        <el-dropdown
          v-if="moreTypes.length > 0"
          trigger="click"
          @command="handleTypeDrop">
          <el-button icon="el-icon-more" />
          <el-dropdown-menu slot="dropdown">
            <el-dropdown-item
              v-for="(item, index) in moreTypes"
              :key="index"
              :icon="item.icon | wkIconPre"
              :command="item.type">{{ item.name }}</el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
      </flexbox>
      <div class="detail-title">{{ detail.title }}</div>
      <div class="detail-time">{{ detail.updateTime }}</div>
      <div class="main__bd">{{ detail.content }}</div>
    </div>

    <new-dialog
      v-if="announcementAddShow"
      :action="{type: 'update', id: id, data: detail}"
      @onSubmit="getDetail"
      @close="announcementAddShow = false" />
  </slide-view>
</template>

<script>
import { noticeQueryByIdAPI, noticeDeleteAPI } from '@/api/oa/notice'

import SlideView from '@/components/SlideView'
import NewDialog from './NewDialog'

import { mapGetters } from 'vuex'

export default {
  // 公告详情
  name: 'NoticeDetail',
  components: {
    SlideView,
    NewDialog
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
      announcementAddShow: false
    }
  },
  computed: {
    ...mapGetters(['oa']),
    permissionUpdate() {
      return this.oa && this.oa.announcement && this.oa.announcement.update
    },
    permissionDelete() {
      return this.oa && this.oa.announcement && this.oa.announcement.delete
    },
    moreTypes() {
      const list = []
      if (this.permissionUpdate) {
        list.push({ type: 'edit', name: '编辑', icon: 'edit' })
      }
      if (this.permissionDelete) {
        list.push({ type: 'delete', name: '删除', icon: 'delete' })
      }
      return list
    }
  },
  watch: {
    id: function(val) {
      this.detail = null
      this.getDetail()
    }
  },
  mounted() {
    this.getDetail()
  },

  beforeDestroy() {},
  methods: {
    /**
     * 详情
     */
    getDetail() {
      this.loading = true
      noticeQueryByIdAPI(this.id)
        .then(res => {
          this.detail = res.data
          this.loading = false
        })
        .catch(() => {
          this.loading = false
          this.hideView()
        })
    },

    /**
     * 操作
     */
    handleTypeDrop(command) {
      if (command == 'delete') {
        this.deleteDetail()
      } else {
        this.announcementAddShow = true
      }
    },

    /**
     * 删除操作
     */
    deleteDetail() {
      this.$confirm('确定删除?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
        .then(() => {
          noticeDeleteAPI(this.id).then(res => {
            this.$emit('delete')
            this.$message({
              type: 'success',
              message: '删除成功!'
            })
            this.hideView()
          }).catch(() => {})
        })
        .catch(() => {
          this.$message({
            type: 'info',
            message: '已取消删除'
          })
        })
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

  &__bd {
    height: calc(100% - 138px);
    overflow: auto;
    font-size: 14px;
    line-height: 1.5;
    color: $--color-text-primary;
    word-break: break-all;
    word-wrap: break-word;
    white-space: pre-wrap;
  }
}

.detail-header {
  .header-icon {
    width: 40px;
    height: 40px;
    margin-right: 16px;
    line-height: 40px;
    text-align: center;
    background-color: $--color-primary;
    border-radius: $--border-radius-base;

    .wk {
      font-size: 26px;
      color: white;
    }
  }

  .header-name {
    flex: 1;
    font-size: 20px;
    font-weight: 600;
    color: $--color-text-primary;
  }
}

.detail-title {
  margin: 30px 0 15px;
  font-size: 18px;
  font-weight: 600;
}

.detail-time {
  margin: 5px 0 15px;
  color: $--color-text-regular;
}

.d-view {
  position: fixed;
  top: $--detail-view-top;
  right: 0;
  bottom: 0;
  width: $--detail-width-base;
  min-width: 926px;
  padding: 15px;
  background-color: white;
}

</style>
