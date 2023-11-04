<template>
  <el-dialog
    ref="wkDialog"
    :visible="visible"
    :append-to-body="true"
    :close-on-click-modal="false"
    title="放入公海"
    width="450px"
    @close="handleCancel">
    <span slot="title" class="el-dialog__title">放入公海<i class="wk wk-icon-fill-help wk-help-tips" data-type="8" data-id="98" /></span>
    <el-form
      ref="fieldForm"
      :model="form"
      :rules="rules"
      :validate-on-rule-change="false"
      label-position="top">
      <el-form-item
        class="wk-form-item"
        label="公海"
        prop="selectId">
        <el-select
          v-model="form.selectId"
          style="width: 100%;">
          <el-option
            v-for="item in list"
            :key="item.poolId"
            :label="item.poolName"
            :value="item.poolId" />
        </el-select>
      </el-form-item>
    </el-form>
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
import {
  crmCustomerPoolNameListAPI,
  crmCustomerPutInPoolAPI
} from '@/api/crm/customer'

import ElDialogLoadingMixin from '@/mixins/ElDialogLoading'

export default {
  /**
   * 客户放入公海
   */
  name: 'PutPoolHandle',
  components: {
  },
  mixins: [ElDialogLoadingMixin],
  props: {
    visible: {
      type: Boolean,
      required: true,
      default: false
    },
    // 操作数据
    selectionList: {
      type: Array,
      default: () => {
        return []
      }
    }
  },
  data() {
    return {
      loading: false,
      form: {
        selectId: ''
      },
      rules: {
        selectId: [{ required: true, message: '请选择', trigger: 'change' }]
      },
      list: []
    }
  },
  computed: {},
  watch: {
    list: {
      handler() {
        this.form = {
          selectId: this.list && this.list.length > 0 ? this.list[0].poolId : ''
        }
      },
      immediate: true
    },
    visible(val) {
      if (val && this.list.length === 0) {
        this.getList()
      }
    }
  },
  mounted() {
  },
  methods: {
    /**
     * 获取数据源
     */
    getList() {
      this.loading = true
      crmCustomerPoolNameListAPI()
        .then(res => {
          this.list = res.data || []
          this.loading = false
        })
        .catch(() => {
          this.loading = false
        })
    },

    /**
     * 取消选择
     */
    handleCancel() {
      this.$emit('update:visible', false)
    },

    /**
     * 确定
     */
    handleConfirm() {
      this.$refs.fieldForm.validate((valid) => {
        if (valid) {
          this.loading = true
          crmCustomerPutInPoolAPI({
            ids: this.selectionList.map(item => item.customerId),
            poolId: this.form.selectId
          })
            .then(res => {
              this.$message({
                type: 'success',
                message: '操作成功'
              })
              this.loading = false
              this.$emit('handle', { type: 'put_seas' })
              this.handleCancel()
            })
            .catch(() => {
              this.loading = false
            })
        } else {
          return false
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
