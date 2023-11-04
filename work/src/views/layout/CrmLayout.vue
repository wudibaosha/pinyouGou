<template>
  <el-container>
    <el-header class="nav-container">
      <navbar
        v-if="menus && menus.length > 0"
        :menus="menus"
        title="CRM"
        @select="menuSelect"
      >
        <el-popover
          v-if="quickAddList.length"
          slot="left"
          placement="bottom"
          width="160"
          trigger="click"
          popper-class="no-padding-popover">
          <div class="drop-wrap is-small">
            <div class="drop-wrap__section">
              <div class="drop-wrap__content">
                <flexbox
                  v-for="(item, index) in quickAddList"
                  :key="index"
                  class="drop-cell is-small"
                  @click.native="addSkip(item)">
                  <flexbox class="drop-cell__hd" justify="center">
                    <i v-if="item.index ==='settlement'" :class="`iconfont ${item.icon}`" />
                    <i v-else :class="`wk wk-${item.icon}`" />
                  </flexbox>
                  <div class="drop-cell__bd">{{ item.label }}</div>
                </flexbox>
              </div>
            </div>
          </div>
          <el-button
            slot="reference"
            class="common-create-btn"
            type="primary">新建</el-button>
        </el-popover>
      </navbar>
    </el-header>
    <wk-container
      :menu="sideMenus"
      :header-obj="headerCellObj"
    >
      <el-main
        id="crm-main-container"
        style="padding: 0;">
        <app-main />
      </el-main>
    </wk-container>
    <c-r-m-all-create
      v-if="isCreate"
      :crm-type="createCRMType"
      :action="createAction"
      @save-success="createSaveSuccess"
      @close="isCreate=false"
    />
  </el-container>
</template>

<script>
import { Navbar, AppMain } from './components'
import WkContainer from './components/WkContainer'
import CRMAllCreate from '@/views/crm/components/CRMAllCreate'

import { mapGetters } from 'vuex'
import { getNavMenus } from './components/utils'
import path from 'path'

export default {
  name: 'CrmLayout',

  components: {
    Navbar,
    AppMain,
    CRMAllCreate,
    WkContainer
  },

  data() {
    return {
      isCreate: false,
      createAction: null,
      createCRMType: '',
      sideChildRouter: null, // 包含child的路由对象
      sideMenus: []
    }
  },

  computed: {
    ...mapGetters(['crm', 'crmRouters']),
    menus() {
      return getNavMenus(this.crmRouters || [], '/crm')
      console.log(getNavMenus(this.crmRouters || [], '/crm'))
    },
    // 快捷添加
    quickAddList() {
      var addItems = []
      if (this.crm.leads && this.crm.leads.save) {
        addItems.push({
          icon: 'leads-line',
          index: 'leads',
          label: '线索'
        })
      }
      if (this.crm.customer && this.crm.customer.save) {
        addItems.push({
          icon: 'customer-line',
          index: 'customer',
          label: '客户'
        })
      }
      if (this.crm.contacts && this.crm.contacts.save) {
        addItems.push({
          icon: 'contacts-line',
          index: 'contacts',
          label: '联系人'
        })
      }
      if (this.crm.business && this.crm.business.save) {
        addItems.push({
          icon: 'business-line',
          index: 'business',
          label: '商机'
        })
      }

      if (this.crm.contract && this.crm.contract.save) {
        addItems.push({
          icon: 'contract-line',
          index: 'contract',
          label: '合同'
        })
      }
      if (this.crm.receivables && this.crm.receivables.save) {
        addItems.push({
          icon: 'receivables-line',
          index: 'receivables',
          label: '回款'
        })
      }
      if (this.crm.invoice && this.crm.invoice.save) {
        addItems.push({
          icon: 'invoice-line',
          index: 'invoice',
          label: '发票'
        })
      }
      if (this.crm.visit && this.crm.visit.save) {
        addItems.push({
          icon: 'visit-line',
          index: 'visit',
          label: '回访'
        })
      }
      if (this.crm.product && this.crm.product.save) {
        addItems.push({
          icon: 'product-line',
          index: 'product',
          label: '产品'
        })
      }
      if (this.crm.settlement && this.crm.settlement.save) {
        addItems.push({
          icon: 'icon-jiesuanguanli',
          index: 'settlement',
          label: '确认结算金额'
        })
      }
      return addItems
    },
    headerCellObj() {
      const { path } = this.$route
      if (path.includes('customer')) {
        return {
          icon: 'wk wk-customer',
          label: '客户',
          des: '客户管理'
        }
      } else if (path.includes('receivables')) {
        return {
          icon: 'wk wk-receivables',
          label: '回款',
          des: '回款管理'
        }
      } else if (path.includes('message')) {
        return {
          icon: 'wk wk-todo-solid',
          label: '待办事项',
          des: '待办事项管理'
        }
      }
      return null
    }
  },

  watch: {},

  created() {
    this.getcrmMessagNum()
  },

  mounted() {},

  methods: {
    /**
     * 菜单选择
     */
    menuSelect(menu) {
      console.log(this.crmRouters[menu.index])
      const router = this.crmRouters[menu.index]
     
      if (router && router.children && router.children.length > 1) {
        this.sideChildRouter = router
        this.sideMenus = this.getSideMenus(router.path, router.children)
      } else {
        this.sideChildRouter = null
        this.sideMenus = []
      }
    },

    /**
     * 获取siderMenus
     */
    getSideMenus(mainPath, children) {
      const sideMenus = []
      children.forEach(item => {
        let auth = true
        if (item.permissions) {
          auth = this.$auth(item.permissions.join('.'))
        }
        if (!item.hidden && auth) {
          sideMenus.push({
            ...item,
            path: path.resolve(mainPath, item.path)
          })
        }
      })
      return sideMenus
    },

    navClick(index) {},

    addSkip(item) {
      this.createAction = {
        type: 'save',
        id: '',
        data: {}
      }
      this.createCRMType = item.index
      this.isCreate = true
    },

    /**
     * 获取消息数
     */
    getcrmMessagNum() {
      this.$store
        .dispatch('GetMessageNum')
    },

    /**
     * 新建客户同时新建联系人
     */
    createSaveSuccess(data) {
      if (data && data.createContacts) {
        if (data.type == 'customer') {
          this.createCRMType = 'contacts'
          this.createAction = {
            type: 'relative',
            crmType: 'customer',
            data: {
              customer: data.data
            }
          }
          this.isCreate = true
        }
      }
    }
  }
}
</script>

<style lang="scss" scoped>
@import "./components/style";
@import "./styles/common.scss";

.el-container {
  height: 100%;
  min-height: 0;
}

.nav-container {
  min-width: 1200px;
  padding: 0;
  box-shadow: 0 1px 2px #dbdbdb;
}

// 公共新建按钮
.common-create-btn {
  margin-left: #{$--interval-base * 2};
}
</style>
