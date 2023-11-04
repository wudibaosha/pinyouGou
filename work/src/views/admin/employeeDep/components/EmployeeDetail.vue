<template>
  <slide-view
    :listener-ids="['manager-main-container']"
    :no-listener-class="['el-table__body']"
    :body-style="{padding: '0', height: '100%'}"
    class="d-view"
    @close="hideView">
    <flexbox
      orient="vertical"
      class="main">
      <div class="detail-body">
        <div class="content-header">
          <flexbox class="dialog-top">
            <xr-avatar
              :key="data.realname"
              :name="data.realname"
              :size="48"
              :src="data.img"
              class="user-img" />
            <div class="user-name">{{ data.realname }}<el-button-group v-if="pageList && pageList.length > 1" class="wk-header-page-btn">
              <el-button type="subtle" icon="el-icon-arrow-left" @click="pageChange('left')" />
              <el-button type="subtle" icon="el-icon-arrow-right" @click="pageChange('right')" />
            </el-button-group></div>
            <div class="dialog-btn-group">
              <el-button
                v-if="userUpdateAuth"
                type="primary"
                @click="editBtn"> 编辑 </el-button>
              <el-dropdown
                v-if="userUpdateAuth || userEnablesAuth"
                trigger="click"
                @command="handleCommand">
                <el-button class="dropdown-btn" icon="el-icon-more" />
                <el-dropdown-menu slot="dropdown">
                  <el-dropdown-item
                    v-if="userUpdateAuth"
                    command="reset">重置密码</el-dropdown-item>
                  <el-dropdown-item
                    v-if="userEnablesAuth"
                    command="status">{{ data.status === 0 ? '激 活' : '禁 用' }}</el-dropdown-item>
                </el-dropdown-menu>
              </el-dropdown>
            </div>
          </flexbox>
          <div class="dialog-remark">
            <p><span>账号状态：</span>{{ userStatusName }}</p>
            <p><span>创建时间：</span>{{ data.createTime }}</p>
          </div>
        </div>
        <div class="dialog-content">
          <flexbox
            v-for="(item, index) in detailList"
            :key="index"
            class="content-items"
            align="stretch">
            <div class="content-items-name">{{ item.value }}</div>
            <div class="content-items-value">{{ data|formatedInfo(item.field) }}</div>
          </flexbox>
        </div>
      </div>
    </flexbox>
  </slide-view>
</template>

<script>
import SlideView from '@/components/SlideView'
import { mapGetters } from 'vuex'

export default {
  /** 审批详情 */
  name: 'EmployeeDetail',
  components: {
    SlideView
  },
  filters: {
    formatedInfo(data, field) {
      if (field == 'sex') {
        return { 1: '男', 2: '女' }[data.sex]
      }
      return data[field]
    }
  },
  props: {
    pageList: Array,
    // 详情信息
    data: Object
  },
  data() {
    return {
      pageIndex: 0,
      detailList: [
        { field: 'username', value: '手机号（登录名）' },
        { field: 'realname', value: '姓名' },
        { field: 'sex', value: '性别', type: 'select' },
        { field: 'email', value: '邮箱' },
        { field: 'deptName', value: '部门', type: 'select' },
        { field: 'post', value: '岗位' },
        { field: 'parentName', value: '直属上级', type: 'select' },
        { field: 'roleName', value: '角色', type: 'selectCheckout' }
      ]
    }
  },
  computed: {
    ...mapGetters(['manage']),
    // 员工编辑操作权限
    userUpdateAuth() {
      return this.manage && this.manage.users && this.manage.users.userUpdate
    },
    // 员工禁用启用权限
    userEnablesAuth() {
      return this.manage && this.manage.users && this.manage.users.userEnables
    },
    // 员工状态名称
    userStatusName() {
      if (!this.data) {
        return ''
      }
      return { '0': '禁用', '1': '激活', '2': '未激活' }[this.data.status]
    }
  },
  watch: {
    data: {
      handler() {
        if (this.data) {
          this.$nextTick(() => {
            for (let index = 0; index < this.pageList.length; index++) {
              const element = this.pageList[index]
              if (element.userId === this.data.userId) {
                this.pageIndex = index
                break
              }
            }
          })
        }
      },
      immediate: true
    }
  },
  mounted() {},
  methods: {
    editBtn() {
      this.$emit('edit')
    },

    handleCommand(command) {
      this.$emit('command', command)
    },

    //* * 点击关闭按钮隐藏视图 */
    hideView() {
      this.$emit('hide-view')
    },

    /**
     * 详情页面切换
     */
    pageChange(type) {
      if (type === 'left') {
        if (this.pageIndex > 0) {
          --this.pageIndex
          this.$emit('update:data', this.pageList[this.pageIndex])
        } else {
          this.$message.error('没有更多了')
        }
      } else {
        if (this.pageIndex < this.pageList.length - 1) {
          ++this.pageIndex
          this.$emit('update:data', this.pageList[this.pageIndex])
        } else {
          this.$message.error('没有更多了')
        }
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.main {
  height: 100%;
}

.dialog-top {
  .user-img {
    margin-right: #{$--interval-base * 3};
  }

  .user-name {
    display: box;
    flex: 1;
    margin-right: 8px;
    overflow: hidden;
    font-size: 24px;
    text-overflow: ellipsis;
    word-break: break-all;
    word-wrap: break-word;
    white-space: pre-wrap;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
  }
}

.content-header {
  padding: 40px 40px 20px;
  background-color: $--color-n10;
}

.dialog-btn-group {
  flex-shrink: 0;
}

.dialog-remark {
  padding-left: 80px;
  margin-top: #{$--interval-base * 2};

  span {
    color: $--color-text-regular;
  }

  p + p {
    margin-top: 5px;
  }
}

.dialog-content {
  padding-top: 20px;

  .content-items {
    padding: 10px 40px;
    overflow: hidden;

    .content-items-name {
      flex-shrink: 0;
      width: 132px;
      color: $--color-text-regular;
    }

    .content-items-value {
      flex: 1;
      word-break: break-all;
      word-wrap: break-word;
      white-space: pre-wrap;
    }
  }
}

.detail-body {
  flex: 1;
  width: 100%;
  overflow-y: auto;
}

.d-view {
  position: fixed;
  top: $--detail-view-top;
  right: 0;
  bottom: 0;
  width: 500px;
  background-color: white;
}
</style>

