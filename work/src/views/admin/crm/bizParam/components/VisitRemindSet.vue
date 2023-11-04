<template>
  <div v-loading="loading" class="visit-remind-set">
    <div class="content-header">
      <span>客户回访提醒设置<i
        class="wk wk-icon-fill-help wk-help-tips"
        data-type="24"
        data-id="222" /></span>
      <el-button
        type="primary"
        @click="save">保存</el-button>
    </div>
    <div class="content-body">
      <div class="tips">设置回访提醒后，到期会自动提醒，合同生效是指到达合同开始时间</div>
      <div class="set-content">
        <el-radio
          v-model="status"
          :label="0">不提醒</el-radio>
        <el-radio
          v-model="status"
          :label="1">提醒</el-radio>
        <div
          v-if="status == 1"
          class="time-set">
          <span>合同生效后</span>
          <el-input v-model="value" type="number" /><span>天提醒</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import {
  returnVisitConfigQueryAPI,
  returnVisitConfigSetAPI
} from '@/api/admin/crm'

export default {
  name: 'VisitRemindSet',

  components: {},

  data() {
    return {
      loading: false, // 展示加载中效果

      value: 0, // 天数
      status: 0 // 是否提醒 0、不提醒 1、提醒
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
      returnVisitConfigQueryAPI().then(res => {
        this.loading = false
        this.value = res.data.value
        this.status = parseInt(res.data.status)
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
      if (this.status == 1) {
        params.value = this.value
        params.status = 1
      } else {
        params.status = 0
      }
      returnVisitConfigSetAPI(params)
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
