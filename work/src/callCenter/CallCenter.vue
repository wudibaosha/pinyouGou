<template>
  <div v-if="scope.row.callShow" v-loading="loading">
    <h2 style="padding: 10px 20px; font-weight: 400;">选择呼出号码</h2>
    <div v-if="list.length" class="scoll">
      <p v-for="(item, index) in list" :key="index" style="padding: 10px 20px;">
        <el-button class="el-button--primary" @click="callDailout(item.modelId, item.model, item.phoneNumber)">呼出
        </el-button>
        <span>{{ item.phoneNumber }} ( {{ item.name }} )</span>
      </p>
    </div>
    <p v-else style="padding: 10px 20px;">
      <span>暂无电话( 快去添加吧! )</span>
    </p>
  </div>
</template>

<script>
import callCenter from './callWebSokets'
import { crmCallQueryPhoneNumberAPI } from '@/api/bi/callCenter'

export default {
  name: 'CallCenter',
  props: {
    scope: {
      type: Object,
      default: () => {
        return {}
      }
    },
    show: {
      type: Boolean,
      default: false
    },
    crmType: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      list: [],
      loading: true
    }
  },
  watch: {
    show(val) {
      if (val) {
        this.loading = true
        crmCallQueryPhoneNumberAPI({ model: this.crmType, modelId: this.scope.row[`${this.crmType}Id`] }).then(res => {
          this.list = res.data
          this.loading = false
        }).catch(() => {
          this.loading = false
        })
      }
    }
  },
  mounted() {
  },
  methods: {
    callCheckClick(e, scope) {
      this.list.forEach(item => {
        this.$set(item, 'callShow', false)
      })
      this.$set(scope.row, 'callShow', !scope.row.callShow)
      const popoverEl = e.target.parentNode
      popoverEl.__vue__.showPopper = !scope.row.callShow
    },
    callClose(e, scope) {
      const popoverEl = e.parentNode
      popoverEl.__vue__.showPopper = false
      this.$set(scope.row, 'callShow', false)
    },
    // 呼出
    callDailout(id, model, phone) {
      const phoneNumber = phone.replace(/-/g, '')
      if (callCenter.CheckCallState()) {
        const data = {}
        if (model === 'leads') {
          data.id = id
          data.type = 'leads'
          this.$emit('changeType', data)
          this.$bus.emit('call-message', data)
        } else if (model === 'customer') {
          data.id = id
          data.type = 'customer'
          this.$emit('changeType', data)
          this.$bus.emit('call-message', data)
        } else {
          data.id = id
          data.type = 'contacts'
          this.$emit('changeType', data)
          this.$bus.emit('call-message', data)
        }
        const stringData = JSON.stringify(data)

        localStorage.setItem('callPhone', phoneNumber)
        localStorage.setItem('callOutData', stringData) // 呼出信息保存,确保刷新页面时信息不丢失
        this.$store.commit('SHOW_CALL_OUT', false) // 呼出关闭上一次的呼出弹窗
        callCenter.OnDailout(phoneNumber)
      }
    }
  }
}
</script>

<style lang="scss" scoped>
  .scoll {
    max-height: 300px;
    overflow-y: auto;
  }
</style>
