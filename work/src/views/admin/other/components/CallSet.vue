<template>
  <el-popover
    v-model="visible"
    placement="right"
    width="400"
    trigger="click">
    <div>
      <div class="content-title">
        <span>话机设置</span>
        <el-button
          type="primary"
          class="rt"
          size="medium"
          @click="save">保存</el-button>
      </div>
      <div class="content-body">
        <span class="label">自动换卡</span><el-checkbox v-model="data.open">开启</el-checkbox>
        <span class="label">拨打次数</span><el-input-number v-model="data.num" :disabled="!data.open" :controls="false" :min="1" :max="200" />
        <el-button type="primary" @click="changeNext">手动换卡</el-button>
      </div>
    </div>
    <el-button slot="reference" type="info">话机设置</el-button>
  </el-popover>
</template>

<script>
import Lockr from 'lockr'
import callCenter from '@/callCenter/callWebSokets'

export default {
  name: 'CallSet',

  components: {
  },

  data() {
    return {
      loading: false,
      data: {
        open: false,
        num: 0
      },
      visible: false
    }
  },
  watch: {
    visible(val) {
      this.getDetail()
    }
  },
  created() {
    this.getDetail()
    // callCenter.message((data) => {
    //   this.callMessage(data)
    // })
  },

  methods: {
    /**
     * 获取详情
     */
    getDetail() {
      const data = Lockr.get('wkCallLimitSet')
      if (data) {
        this.data = data
      }
    },

    /**
     * 换卡
     */
    changeNext() {
    //   this.loading = true
      callCenter.OnSwitchNext()
    },

    /**
     * 换卡结果
     */
    // callMessage(data) {
    //   if (data && data.type === 'CommandResponse') {
    //     const dataResult = data.data || {}
    //     if (dataResult.invoke_command && dataResult.invoke_command.toLowerCase() == 'cbswitchnext_multi') {
    //       this.loading = false
    //   if (dataResult.invoke_command.toLowerCase() == 'cbswitchnext_multi' && dataResult.state) {
    //     this.$message.success('操作成功')
    //     this.loading = false
    //   } else {
    //     this.$message.error('操作失败')
    //     this.loading = false
    //   }
    //     }
    //   }
    // },

    /**
     * 保存操作
     */
    save() {
      Lockr.set('wkCallLimitSet', this.data)
      this.$message.success('保存成功')
      this.visible = false
    }
  }
}
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
.content-title {
  padding: 0 10px 5px;
  border-bottom: 1px solid #e6e6e6;
}

.content-title > span {
  display: inline-block;
  height: 36px;
  line-height: 36px;
}

.content-body {
  height: calc(100% - 57px);
  padding: 20px 10px 10px;
  overflow-y: auto;

  .label {
    margin-right: 5px;
  }

  .el-input-number {
    width: 80px;
    margin-right: 15px;
  }
}

</style>
