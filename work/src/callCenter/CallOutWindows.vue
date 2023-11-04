<template>
  <div
    v-if="isShow"
    id="call"
    @click="showDviews"
    @mouseup="mouseleave($event)"
    @mousedown="mousedown($event)">
    <!-- <img :src="closeImg" class="close" @click.stop="close">
    <img :src="timeUrl" class="time-piece"> -->
    <time-piece :is-handle="false" />
    <c-r-m-full-screen-detail
      :id="modelId"
      :visible.sync="showDview"
      :model-data="modelData"
      :crm-type="crmType"
      @close="showDview = false" />
  </div>
</template>

<script>
import TimePiece from './TimePiece'
import CRMFullScreenDetail from '@/components/CRMFullScreenDetail'
export default {
  name: 'CallOutWindows',
  components: { TimePiece, CRMFullScreenDetail },
  props: {
    isShow: {
      type: Boolean,
      default: false
    },
    modelData: {
      type: Object,
      default: () => {
        return {}
      }
    }
  },
  data() {
    return {
      showCall: false,
      rowID: 0,
      modelId: 0,
      customerId: 0,
      showDview: false,
      crmType: 'customer',
      url: require('@/assets/callCenter/ring.png'),
      handUpUrl: require('@/assets/callCenter/handUp.png'),
      onLineUrl: require('@/assets/callCenter/onLine.png'),
      closeImg: require('@/assets/callCenter/close.png')
    }
  },
  computed: {
    // 展示振铃
    showRing() {
      return this.$store.state.crm.showRing
    },
    // 展示通话
    showTime() {
      return this.$store.state.crm.showTimer
    },
    // 展示图片
    timeUrl() {
      if (this.showTime) {
        if (this.showRing) {
          return this.url
        } else if (!this.showRing) {
          return this.onLineUrl
        }
      }
      return this.handUpUrl
    }
  },
  watch: {
    isShow(val) {
      this.showCall = val
    },
    modelData: {
      handler(val) {
        this.modelId = val.modelId
        this.crmType = val.model
      },
      deep: true
    }
  },
  mounted() {
    window.onload = () => {
      let callOutData = localStorage.getItem('callOutData')
      callOutData = JSON.parse(callOutData)
      if (!callOutData) {
        this.$store.commit('SHOW_CALL_OUT', true)
      } else if (callOutData && !callOutData.inComing) {
        this.$store.commit('SHOW_CALL_OUT', true)
      } else {
        this.$store.commit('SHOW_CALL_OUT', false)
      }
    }
    // this.$nextTick(() => {
    //   setTimeout(() => {
    //     let callOutData = localStorage.getItem('callOutData')
    //     callOutData = JSON.parse(callOutData)
    //     if (callOutData && !callOutData.inComing) {
    //       this.$store.commit('SHOW_CALL_OUT', true)
    //     } else {
    //       this.$store.commit('SHOW_CALL_OUT', false)
    //     }
    //   }, 2000)
    // })
  },
  methods: {
    mouseleave(e) {
      document.onmousemove = null
    },
    mousedown(e) {
      const el = document.getElementById('call')
      const disx = e.pageX - el.offsetLeft
      const disy = e.pageY - el.offsetTop
      document.onmousemove = (e) => {
        el.style.left = e.pageX - disx + 'px'
        el.style.top = e.pageY - disy + 'px'
      }
    },
    close() {
      localStorage.removeItem('callOutData') // =关闭呼出弹框时清空弹框里面保留的信息
      this.$store.commit('SHOW_CALL_OUT', false)
      this.$emit('close')
    },
    showDviews() {
      const callOutData = localStorage.getItem('callOutData')
      if (callOutData && !callOutData.inComing && this.modelId) {
        this.showDview = true
      }
    }
  }
}
</script>

<style lang="scss" scoped>
  #call {
    position: fixed;
    top: 15px;
    right: 370px;
    z-index: 2000;
    width: 108px;
    height: 32px;
    text-align: center;
    cursor: pointer;

    .time {
      width: 108px;
    }
  }

  .close {
    position: absolute;
    top: 10px;
    right: 10px;
  }
</style>
