<template>
  <keep-alive>
    <component
      :is="componentName"
      @menu-select="menuSelect" />
  </keep-alive>
</template>

<script>
import LeadsIndex from './index'
import AppletIndex from '../applet'

import { mapGetters } from 'vuex'
export default {
  name: 'LeadsAllIndex',
  components: {
    LeadsIndex,
    AppletIndex
  },
  props: {},
  data() {
    return {
      componentName: ''
    }
  },
  computed: {
    ...mapGetters(['crm'])
  },
  watch: {},
  mounted() {
    if (this.crm && this.crm.leads) {
      this.componentName = 'LeadsIndex'
    } else if (this.crm && this.crm.applet) {
      this.componentName = 'AppletIndex'
    }
  },

  beforeDestroy() {},
  methods: {
    /**
     * 左侧菜单选择
     */
    menuSelect(key, keyPath) {
      this.componentName = {
        leads: 'LeadsIndex',
        applet: 'AppletIndex'
      }[key]
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
