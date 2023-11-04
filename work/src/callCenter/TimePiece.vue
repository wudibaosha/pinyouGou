<template>
  <div class="time" style="display: flex;">
    <call-set v-if="Show && !showTime" />
    <div v-if="showTime" class="time" style="display: flex;">
      <div v-if="!showRing" style="display: flex;" class="time_piece">
        <p class="time_piece--p1">通话中 :</p>
        <p class="time_piece--p2">{{ callinTime }}</p>
      </div>
      <div v-else-if="showRing" style="display: flex;" class="time_piece1">
        <p class="time_piece--p1">振铃中 :</p>
        <p class="time_piece--p2">{{ callinTime }}</p>
      </div>
      <el-button v-if="isHandle" type="danger" style="padding: 5px 15px;" class="handle" @click="handUp">挂断</el-button>
    </div>
    <el-tag v-else type="danger" size="medium" effect="dark" class="e-tab">空闲中</el-tag>
  </div>
</template>

<script>
import CallSet from '@/views/admin/other/components/CallSet'

import callCenter from './callWebSokets'
import Lockr from 'lockr'
export default {
  name: 'TimePiece',
  components: {
    CallSet
  },
  props: {
    isHandle: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      phones: '',
      webSocketData: {},
      timer: null,
      timePiece: {}
    }
  },
  computed: {

    isManyCard() {
      return this.$store.state.crm.isCall
    },
    Show() {
      const callData = Lockr.get('wkCallData')
      // hisUse 0 是默认硬呼单卡 1 是软乎 2是硬呼多卡
      if (this.$store.state.crm.isCall && callData && callData.hisUse == 2) {
        return true
      } else {
        return false
      }
    },
    // 接通再计时
    callinTime() {
      return this.$store.state.crm.callinTime
    },
    // 展示振铃
    showRing() {
      return this.$store.state.crm.showRing
    },
    // 展示通话
    showTime() {
      return this.$store.state.crm.showTimer
    }
  },
  watch: {
    phone(val) {
    },
    timerStatus(val) {
      this.starttimePiece(val)
    }
  },
  mounted() {
  },
  methods: {
    /**
       * 挂断
       */
    handUp() {
      callCenter.OnHungUp()
      // callCenter.clearWebSoketsInterval()
    }
  }
}
</script>

<style lang="scss" scoped>
  .time {
    width: 200px;
    height: 30px;
    font-size: 13px;
  }

  .time_piece {
    width: 115px;
    padding: 5px;
    margin: 0 7px;
    color: white;
    background-color: #3e84e9;
    border-radius: 3px;

    .time_piece--p1 {
      width: 60px;
      line-height: 16px;
    }

    .time_piece--p2 {
      line-height: 16px;
    }
  }

  .time_piece1 {
    width: 115px;
    padding: 5px;
    margin: 0 7px;
    color: white;
    background-color: #e6a23c;
    border-radius: 3px;

    .time_piece--p1 {
      width: 60px;
      line-height: 16px;
    }

    .time_piece--p2 {
      line-height: 16px;
    }
  }

  .handle {
    margin-right: 10px;
  }

  .e-tab {
    width: 108px;
    margin-left: 10px;
  }
</style>
