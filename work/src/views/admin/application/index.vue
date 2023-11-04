<template>
  <flexbox
    class="main"
    direction="column"
    align="stretch">
    <xr-header
      label="应用管理" />
    <div
      v-loading="loading"
      class="body">
      <div
        v-for="(bigItem, bigIndex) in allList"
        :key="bigIndex"
        class="section">
        <flexbox class="section-header">
          <span class="section-header-title">{{ bigItem.name }}</span><i
            v-if="bigItem.helpType"
            class="wk wk-icon-fill-help wk-help-tips"
            :data-type="bigItem.helpType"
            :data-id="bigItem.helpId"
            @click.stop="" />
        </flexbox>
        <flexbox
          wrap="wrap"
          class="section-body">
          <flexbox
            v-for="(item, index) in bigItem.sublist"
            :key="index"
            class="section-item">
            <div class="item-content">
              <flexbox
                v-if="item.icon"
                :class="item.icon"
                align="center"
                justify="center"
                class="item-icon radio-box" />
              <img
                :src="getModuleIcon(item.status, item.module)"
                class="item-icon">
              <el-button
                v-if="['enterprise','call'].includes(item.module)"
                type="text"
                class="detail-button">
                <span
                  class="wk-premium-info"
                  :data-type="item.premiumType"
                  :data-force="1">{{ item.name }}</span>
              </el-button>
              <span v-else class="item-name">{{ item.name }}</span>
            </div>

            <div class="menu-button">
              <!-- 常规模块 -->
              <el-button
                v-if="item.canEdit && configSetAuth"
                type="primary-text"
                @click="handleMoreCommand(item.status ? 'disable' : 'enable',item)">{{ item.status ? '停用' : '启用' }}
              </el-button>
              <!-- <el-button
                v-if="item.premium && item.status === 3"
                type="text"
                class="detail-button">
                <span
                  class="wk-premium-info"
                  :data-type="item.premiumType"
                  :data-force="1">了解详情</span>
                <i class="el-icon-arrow-right el-icon--right" />
              </el-button> -->
            </div>
          </flexbox>
        </flexbox>
      </div>
    </div>

    <call-detail
      :visible.sync="callDetailShow"
      :call-switch="callSwitch" />
    <card-detail
      :visible.sync="cardDetailShow" />

    <!-- 电话提示 -->
    <contact-dialog
      :title="phoneDialogTitle"
      :visible.sync="phoneDialogVisible"
    />

  </flexbox>
</template>

<script>
import {
  adminConfigsetUpdateAPI
} from '@/api/admin/application'

import CallDetail from './components/CallDetail'
import CardDetail from './components/CardDetail'
import XrHeader from '@/components/XrHeader'
import ContactDialog from '@/components/ContactDialog'

import { mapGetters } from 'vuex'
import { timeToFormatTime } from '@/utils'

export default {
  /** 系统管理 的 应用管理 */
  name: 'SystemModule',
  components: {
    CallDetail,
    CardDetail,
    XrHeader,
    ContactDialog
  },
  filters: {
    changeTime(val) {
      return timeToFormatTime(val, 'YYYY-MM-DD')
    }
  },
  mixins: [],
  data() {
    return {
      loading: false,
      allList: [
        {
          name: '已启用的应用',
          type: 1,
          status: 1,
          sublist: [],
          helpType: '19',
          helpId: '165'
        },
        {
          name: '已停用的应用',
          type: 1,
          status: 0,
          sublist: [],
          helpType: '19',
          helpId: '166'
        },
        {
          name: '增值服务应用',
          type: [3, 4],
          sublist: [],
          helpType: '19',
          helpId: '167'
        }
        // {
        //   name: '敬请期待',
        //   type: 2,
        //   sublist: []
        // }
      ],
      // 展示详情
      callDetailShow: false,
      callSwitch: false,
      // 名片详情
      cardDetailShow: false,
      phoneDialogTitle: '',
      phoneDialogVisible: false, // 联系我们提示框
      showPay: false,
      payProducts: '',
      formData: {},
      payStatus: null,
      residueList: [
        { name: 'enterprise', paidNumber: 1500, callNumber: 103 }
      ]
    }
  },
  computed: {
    ...mapGetters(['manage', 'userInfo']),
    configSetAuth() {
      return this.manage && this.manage.configSet && this.manage.configSet.update
    }
  },
  mounted() {
    this.getDetail()
  },
  methods: {
    /**
     * 详情
     */
    getDetail() {
      this.loading = true
      this.$store.dispatch('QueryModules')
        .then(res => {
          this.loading = false
          // status 状态 1:启用 0:停用 2:试用中 3:已过期,可用值:0,1,2,3
          // type 1:普通应用 2:增值应用 3:未发布应用,可用值:1,2,3
          const list = res.data || []
          list.forEach(item => {
            if (item.type == 1) {
              item.canEdit = item.module != 'crm'
            } else {
              item.canEdit = false
            }

            // 已开启应用的停用启用
            if (item.type == 1) {
              if (item.status === 1) {
                this.allList[0].sublist.push(item)
              } else {
                this.allList[1].sublist.push(item)
              }
            } else {
              // 特殊增值类型
              if (item.module === 'enterprise') {
                item.premium = true
                item.premiumType = 'BusinessInformation'
              } else if (item.module === 'call') {
                item.premium = true
                item.premiumType = 'Call'
              }
              this.allList[2].sublist.push(item)
            }
          })
        })
        .catch(() => {
          this.loading = false
        })
    },

    /**
     * 更多操作
     */
    handleMoreCommand(command, item, isTry = false) {
      console.log(item)
      this.getConfirmMessage(command, item, isTry, () => {
        this.loading = true
        adminConfigsetUpdateAPI({
          settingId: item.settingId,
          status: command == 'disable' ? 0 : 1
        })
          .then(res => {
            this.loading = false
            this.$message.success('设置成功')
            window.location.reload()
          })
          .catch(() => {
            this.loading = false
          })
      })
    },

    /**
     * 操作提示
     */
    getConfirmMessage(command, item, isTry, result) {
      if (command == 'enable') {
        result()
      } else {
        this.$confirm(`停用${item.name}后，企业所有员工将无法使用此功能。确定要停用吗？`, '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
          .then(() => {
            result()
          })
          .catch(() => {})
      }
    },

    getModuleIcon(status, moduleType) {
      if (moduleType == 'call') {
        return require('@/assets/img/system/app/call_enable.png')
      } else {
        const allModule = {
          oa: {
            disable: require('@/assets/img/system/app/oa_disable.png'),
            enable: require('@/assets/img/system/app/oa_enable.png')
          },
          crm: {
            disable: require('@/assets/img/system/app/crm_disable.png'),
            enable: require('@/assets/img/system/app/crm_enable.png')
          },
          project: {
            disable: require('@/assets/img/system/app/project_disable.png'),
            enable: require('@/assets/img/system/app/project_enable.png')
          },
          log: {
            disable: require('@/assets/img/system/app/log_disable.png'),
            enable: require('@/assets/img/system/app/log_enable.png')
          },
          book: {
            disable: require('@/assets/img/system/app/book_disable.png'),
            enable: require('@/assets/img/system/app/book_enable.png')
          },
          taskExamine: {
            disable: require('@/assets/img/system/app/taskExamine_disable.png'),
            enable: require('@/assets/img/system/app/taskExamine_enable.png')
          },
          bi: {
            disable: require('@/assets/img/system/app/bi_disable.png'),
            enable: require('@/assets/img/system/app/bi_enable.png')
          },
          applet: {
            disable: require('@/assets/img/system/app/mp_enable.png'),
            enable: require('@/assets/img/system/app/mp_disable.png')
          },
          calendar: {
            disable: require('@/assets/img/system/app/ce_disable.png'),
            enable: require('@/assets/img/system/app/ce_enable.png')
          },
          email: {
            disable: require('@/assets/img/system/app/email_disable.png'),
            enable: require('@/assets/img/system/app/email_enable.png')
          },
          knowledge: {
            disable: require('@/assets/img/system/app/knowledge_disable.png'),
            enable: require('@/assets/img/system/app/knowledge_enable.png')
          },
          hrm: {
            disable: require('@/assets/img/system/app/hrm_disable.png'),
            enable: require('@/assets/img/system/app/hrm_enable.png')
          },
          jxc: {
            disable: require('@/assets/img/system/app/jxc_disable.png'),
            enable: require('@/assets/img/system/app/jxc_enable.png')
          },
          finance: {
            disable: require('@/assets/img/system/app/finance_disable.png'),
            enable: require('@/assets/img/system/app/finance_enable.png')
          }
        }

        if (allModule[moduleType]) {
          return allModule[moduleType][status == 1 ? 'enable' : 'disable']
        } else {
          return {
            disable: require('@/assets/img/system/app/other_disable.png'),
            enable: require('@/assets/img/system/app/other_enable.png')
          }[status == 1 ? 'enable' : 'disable']
        }
      }
    },

    /**
     * @description: 购买
     * @param {*} val
     * @return {*}
     */
    payClick(val) {
    }
  }
}
</script>

<style lang="scss" scoped>
@import '../styles/index.scss';

.section {
  margin-bottom: 20px;
  .section-header {
    .section-header-title{
      font-weight: 600;
    }
  }

  .section-body {
    margin-top: #{$--interval-base * 2};
    .section-item {
      width: auto;
      min-width: 240px;
      position: relative;
      box-shadow: $--box-shadow-bottom;
      border-radius: $--border-radius-base;
      margin-right: #{$--interval-base * 2};
      margin-bottom: #{$--interval-base * 2};
      display: block;
      overflow: hidden;

      .item-content{
        margin: #{$--interval-base * 2};
        display: flex;
        align-items: center;
        justify-content: flex-start;
      }

      .item-icon {
        width: 40px;
        height: 40px;
        margin-right: 15px;

        &.radio-box {
          font-size: 18px;
          color: $--color-primary;
          border-radius: 6px;
          background-color: #EBECF0;
        }
      }

      // .item-name {
      //   color: $--color-primary;
      // }

      .label-menu{
        position: absolute;
        top: 0;
        right: 0;
        height: 24px;
        padding: 0 4px;
        color: $--color-primary;
        line-height: 24px;
        font-size: $--font-size-small;
        background-color: $--color-b50;
        &:before {
          content: '';
          position: absolute;
          top: 0;
          left: -12px;
          height: 0;
          width: 0;
          border: solid transparent;
          border-width: 12px 6px;
          border-right-color: $--color-b50;
          border-top-color: $--color-b50;
        }
      }

      .menu-button {
        height: 36px;
        margin-top: 15px;
        padding: 6px ;
        background: #f4f5f7;
        display:flex;
        justify-content: flex-end;
        font-size: 12px;
        &-residue {
          padding: 7px 6px 4px 10px;
          position: absolute;
          left: 0;
          color: $--color-n300;
          &-content {
            color: $--color-y300;
          }
        }
        .el-button {
          padding: 4px 6px;
          margin-left: 3px;
        }
      }
    }
  }
}

.tag-doing {
  line-height: 24px;
  height: 24px;
  margin-left: 6px;
}
.detail-button :hover {
  color: $--color-primary;
}
</style>
