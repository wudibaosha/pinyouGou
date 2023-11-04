<template>
  <el-container>
    <el-header class="nav-container">
      <navbar
        nav-index="/bi"
        title="BI"
        @nav-items-click="navClick" />
    </el-header>
    <wk-container
      :menu="biRouters"
      :header-obj="headerCellObj"
      side-type="normal"
    >
      <el-main>
        <app-main />
      </el-main>
    </wk-container>
  </el-container>
</template>

<script>
import { mapGetters } from 'vuex'
import { Navbar, AppMain } from './components'
import WkContainer from './components/WkContainer'

export default {
  name: 'BiLayout',
  components: {
    Navbar,
    WkContainer,
    AppMain
  },
  data() {
    return {
      headerCellObj: {
        icon: 'wk wk-results-solid2',
        label: '商业智能',
        des: '统计汇总'
      }
    }
  },
  computed: {
    ...mapGetters(['biRouters'])
  },
  methods: {
    navClick(index) {}
  }
}
</script>

<style lang="scss" scoped>
@import "./styles/common.scss";

.nav-container {
  z-index: 100;
  min-width: 1200px;
  padding: 0;
  box-shadow: 0 1px 2px #dbdbdb;
}

.el-container {
  height: 100%;
  overflow: hidden;
}

.el-main {
  padding: 0;
}
</style>
