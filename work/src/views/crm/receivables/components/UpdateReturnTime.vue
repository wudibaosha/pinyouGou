<template>
  <el-dialog
   
    :visible="visible"
    :append-to-body="true"
    :close-on-click-modal="false"
    :title="title"
    width="405px"
    @close="handleCancel">
    <div class="handle-box">
      <el-form ref="form" :model="detail" :rules="rules" label-width="105px">
        <el-form-item label="回款日期" prop="returnTime">
         

          <el-date-picker
            value-format="yyyy-MM-dd"
            v-model="detail.returnTime"
            type="date"
            placeholder="选择回款日期">
          </el-date-picker>

        </el-form-item>

      </el-form>
    </div>
    <span
      slot="footer"
      class="dialog-footer">
      <el-button
        v-debounce="handleConfirm"
        type="primary">保存</el-button>
      <el-button @click.native="handleCancel">取消</el-button>
    </span>
  </el-dialog>
</template>

<script>
import { crmReceivablesUpdateReturnTimeAPI } from '@/api/crm/receivables'

import ElDialogLoadingMixin from '@/mixins/ElDialogLoading'
import { objDeepCopy } from '@/utils'

export default {
  name: 'UpdateReturnTime', // 填写报账信息
  components: {
  },
  mixins: [ElDialogLoadingMixin],
  props: {
    visible: {
      type: Boolean,
      required: true,
      default: false
    },
    detail: Object
  },
  data() {
    return {
      asd:"",
      form: {
        receivablesId: '',
        returnTime: ''
      },
      rules: {
        returnTime: [
          { required: true, message: '请选择回款日期', trigger: 'change' }
        ],
      }
    }
  },
  computed: {
    title() {
      return '更新回款日期'
    }
  },
  watch: {},
  mounted() {},
  methods: {
    /**
     * 取消选择
     */
    handleCancel() {
      // 重置状态
      this.form = {
        receivalbesId: '',
        returnTime: ''
      }
      this.$emit('update:visible', false)
    },

    /**
     * 点击确定
     */
    handleConfirm() {
      this.$refs.form.validate((valid) => {
        //console.log(this.detail.receivablesId)
        if (valid) {
          
          this.form.receivablesId = this.detail.receivablesId
          // this.form.returnTime = this.detail.return_time
          this.form.returnTime = this.detail.returnTime
          
         
          this.loading = true
      
         // console.log(crmReceivablesUpdateReturnTimeAPI())
          crmReceivablesUpdateReturnTimeAPI(this.form).then(res => {
            this.handleCancel()
              this.$message({
                type: 'success',
                message: '操作成功'
              })
              this.loading = false
              this.detail.rentStatus = 1
              this.handleCancel()
              this.$emit('change')
            })
            .catch(() => {
              this.loading = false
            })
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.handle-box {
  font-size: 12px;
  color: blue;
}

.handle-item {
  padding-bottom: 15px;

  
}
.handle-item-name {
    flex-shrink: 0;
    width: 110px;
  }

.handle-item-content {
  flex: 1;
}
.handle-bar {
  position: relative;
  height: 30px;
  margin-top: 10px;

  
}

.handler-bar button {
    float: right;
    margin-right: 10px;
  }
</style>
