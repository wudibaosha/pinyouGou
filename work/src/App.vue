<template>
  <div id="app">
    <wk-system-alert v-if="systemAlertShow" />
    <router-view class="router-view" />
    <incoming-windows @sendMsg="getInfo" />
    <call-out-windows
      :is-show="showOutCall"
      :model-data="modelData"
      @close="showCall = false" />
  </div>
</template>

<script>
import WkSystemAlert from '@/components/WkSystemAlert'

import { mapGetters } from 'vuex'
import IncomingWindows from './callCenter/IncomingWindows'
import CallOutWindows from './callCenter/CallOutWindows'
import cache from '@/utils/cache'
// import Lockr from 'lockr'

export default {
  name: 'App',
  components: {
    IncomingWindows,
    CallOutWindows,
    WkSystemAlert
  },
  mixins: [],
  data() {
    return {
      showCall: false,
      modelData: {}
    }
  },
  computed: {
    ...mapGetters([
      'addRouters',
      'userInfo',
      'systemAlertShow',
      'moduleData'
    ]),
    showOutCall() {
      if (this.$store.state.crm.isCall) {
        return this.$store.state.crm.showCallOut
      }
      return false
    },

    hideBottomAlert() {
      // 如果是注册 link 不展示底部弹框
      return this.$route.name === 'register' || this.$route.name === 'link'
    }
  },
  watch: {
    $route(to, from) {
      const { meta, params, name } = to
      let title = this.WKConfig.companyName
      if (meta.title) {
        title += ' - ' + meta.title
      } else if (params && params.title) {
        title += ' - ' + params.title
      }
      document.title = title

      this.$wkPreviewFile.closeViewer() // 切换页面隐藏图片预览
    },

    addRouters() {
    }
  },
  mounted() {
    this.addDocumentVisibilityChange()
  },
  methods: {
    /**
     * @description: 当前标签再次显现进行的处理逻辑
     * @param {*}
     * @return {*}
     */
    addDocumentVisibilityChange() {
      // 网页当前状态判断
      // hidden,
      var state, visibilityChange
      if (typeof document.hidden !== 'undefined') {
        // hidden = 'hidden'
        visibilityChange = 'visibilitychange'
        state = 'visibilityState'
      } else if (typeof document.mozHidden !== 'undefined') {
        // hidden = 'mozHidden'
        visibilityChange = 'mozvisibilitychange'
        state = 'mozVisibilityState'
      } else if (typeof document.msHidden !== 'undefined') {
        // hidden = 'msHidden'
        visibilityChange = 'msvisibilitychange'
        state = 'msVisibilityState'
      } else if (typeof document.webkitHidden !== 'undefined') {
        // hidden = 'webkitHidden'
        visibilityChange = 'webkitvisibilitychange'
        state = 'webkitVisibilityState'
      }
      // 添加监听器，在title里显示状态变化
      document.addEventListener(visibilityChange, () => {
        if (document[state] == 'visible') {
          if (cache.updateAxiosHeaders() && this.$route.name === 'login') {
            window.location.reload()
          }
        }
        this.$bus.emit('document-visibility', document[state])
      }, false)
    },

    /**
     * @description: 获取呼出信息
     * @param {*} data
     * @return {*}
     */
    getInfo(data) {
      this.modelData = data
    }
  }
}
</script>

<style lang="scss">
#app {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 1200px;
  height: 100%;
  min-height: 605px;

  .system-alert {
    position: fixed;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 4;
    min-height: 48px;
    line-height: 48px;
    text-align: center;
    pointer-events: none;
    background-color: rgba($color: #0065ff, $alpha: 0.17);
    border-radius: 0;

    &__content {
      pointer-events: auto;

      .el-button {
        margin-left: 8px;
      }

      .is-primary {
        color: $--color-primary;
      }
    }
  }
}
</style>
