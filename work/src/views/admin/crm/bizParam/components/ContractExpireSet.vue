<template>
  <div v-loading="loading">
    <div class="content-header">
      <span>合同到期提醒设置<i
        class="wk wk-icon-fill-help wk-help-tips"
        data-type="24"
        data-id="219" /></span>
      <el-button
        type="primary"
        @click="save">保存</el-button>
    </div>
    <div class="content-body">
      <div class="tips">设置提前提醒天数之后，根据合同的”合同到期时间”计算提醒时间</div>
      <div class="set-content">
        <el-radio
          v-model="contractConfig"
          :label="0">不提醒</el-radio>
        <el-radio
          v-model="contractConfig"
          :label="1">提前提醒天数</el-radio>
        <div
          v-if="contractConfig == 1"
          class="time-set">
          <el-input-number v-model="contractDay" :controls="false" :min="0" step-strictly /><span>天</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { crmSettingContractDayAPI } from '@/api/admin/crm'

export default {
  name: 'ContractExpireSet',

  components: {},

  data() {
    return {
      loading: false, // 展示加载中效果

      contractDay: 0, // 合同到期提醒天数
      contractConfig: 0 // 是否提醒 0、不提醒 1、提醒
    }
  },

  created() {
    this.getDetail()
  },

  methods: {
    /**
     * 获取详情
     */
    getDetail() {
      this.loading = true
      this.$store
        .dispatch('CRMSettingConfig')
        .then(res => {
          this.loading = false
          this.contractDay = res.data.contractDay
          this.contractConfig = parseInt(res.data.contractConfig)
        })
        .catch(() => {
          this.loading = false
        })
    },

    /**
     * 保存操作
     */
    save() {
      this.loading = true
      const params = {}
      if (this.contractConfig == 1) {
        params.contractDay = this.contractDay
        params.status = 1
      } else {
        params.status = 0
      }
      crmSettingContractDayAPI(params)
        .then(res => {
          this.loading = false
          this.$message.success('操作成功')
        })
        .catch(() => {
          this.loading = false
        })
    }
  }
}
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
@import "./index.scss";

.tips {
  color: $--color-text-secondary;
}

.el-radio {
  display: block;
  padding: 10px 0;
}

.set-content {
  margin-top: 20px;
}

.time-set {
  padding-left: 20px;
  margin-top: 5px;

  .el-input {
    width: 200px;
  }

  span {
    margin-left: 5px;
  }
}
</style>
