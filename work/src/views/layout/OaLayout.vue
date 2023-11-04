<template>
  <el-container>
    <el-header class="nav-container">
      <navbar
        :menus="menus"
        :title="title"
        @select="menuSelect"
      />
    </el-header>
    <wk-container
      :menu="sideMenus"
      :header-obj="headerCellObj"
    >
      <el-main style="padding-top: 24px;">
        <app-main />
      </el-main>
    </wk-container>
  </el-container>
</template>

<script>
import { Navbar, AppMain } from './components'
import WkContainer from './components/WkContainer'

import { mapGetters } from 'vuex'
import { getNavMenus } from './components/utils'
import path from 'path'

export default {
  name: 'OaLayout',

  components: {
    Navbar,
    AppMain,
    WkContainer
  },

  data() {
    return {
      sideChildRouter: null, // 包含child的路由对象
      sideMenus: []
    }
  },

  computed: {
    ...mapGetters([
      'oa', 'oaRouters',
      'crmRouters', 'messageNum']),
    menus() {
      const { query } = this.$route
      if (query.module === 'crm') {
        const navs = getNavMenus(this.crmRouters || [], '/crm')
        const messageObj = navs.find(item => item.path.includes('/message'))
        if (messageObj) {
          messageObj.num = this.messageNum.totalNum
        }
        return navs
      } else if (query.module === 'bi' ||
      query.module === 'manage') {
        return []
      }
      const navs = getNavMenus(this.oaRouters || [], '/oa')
      return navs
    },

    title() {
      const { query } = this.$route
      if (query.module === 'crm') {
        return 'CRM'
      } else if (query.module === 'bi') {
        return 'BI'
      } else if (query.module === 'manage') {
        return '系统设置'
      }
      return 'OA'
    },
    headerCellObj() {
      const { path } = this.$route
      if (path.includes('oa/task')) {
        return {
          icon: 'wk wk-task',
          label: '任务',
          des: '任务管理'
        }
      } else if (path.includes('oa/examine')) {
        return {
          icon: 'wk wk-approve',
          label: '审批',
          des: '审批管理'
        }
      } else if (path.includes('oa/log')) {
        return {
          icon: 'wk wk-log',
          label: '日志',
          des: '日志管理'
        }
      }
      return null
    }
  },

  watch: {
  },

  created() {
  },

  mounted() {},

  methods: {
    /**
     * 菜单选择
     */
    menuSelect(menu, isOa) {
      if (isOa) {
        const router = this.oaRouters[menu.index]
        if (router && router.children && router.children.length > 1) {
          this.sideChildRouter = router
          this.sideMenus = this.getSideMenus(router.path, router.children)
        } else {
          this.sideChildRouter = null
          this.sideMenus = []
        }
      }
    },

    /**
     * 获取siderMenus
     */
    getSideMenus(mainPath, children) {
      const { module } = this.$route.query
      const query = module ? `?module=${module}` : ''
      const sideMenus = []
      children.forEach(item => {
        let auth = true
        if (item.permissions) {
          auth = this.$auth(item.permissions.join('.'))
        }

        if (item.permissionList) {
          let hasAuth = false
          for (let index = 0; index < item.permissionList.length; index++) {
            const element = item.permissionList[index]
            const childAuth = this.$auth(element.join('.'))
            if (childAuth) {
              hasAuth = childAuth
              break
            }
          }
          if (!hasAuth) {
            auth = hasAuth
          }
        }

        if (!item.hidden && auth) {
          sideMenus.push({
            ...item,
            path: path.resolve(mainPath, item.path) + query
          })
        }
      })
      return sideMenus
    },

    navClick(index) {},
    /**
     * 菜单钢鞭
     */
    handleSelect() {
      this.$store.dispatch('GetMessageNum')
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

.el-main {
  padding-right: 0;
  padding-left: 0;
}
</style>
