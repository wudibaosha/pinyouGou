<template>
  <el-dialog
    ref="wkDialog"
    :visible.sync="visible"
    :title="title"
    :append-to-body="true"
    :close-on-click-modal="false"
    :before-close="close"
    width="550px">
    <div class="position-relative">
      <flexbox
        class="handle-item"
        align="stretch">
        <div
          class="handle-item-name"
          style="margin-top: 8px;">适用范围：</div>
        <wk-user-dep-dialog-select
          :user-value.sync="users"
          :dep-value.sync="strucs"
          style="width: 100%;"
        />
      </flexbox>
      <flexbox
        class="handle-item"
        align="stretch">
        <div
          class="handle-item-name"
          style="margin-top: 8px;">{{ valueLabel }}</div>
        <el-input-number v-model="customerNum" :controls="false" :min="0" step-strictly />
      </flexbox>
      <flexbox v-if="showDeal" class="handle-item">
        <div class="handle-item-name">{{ dealLabel }}</div>
        <el-radio-group v-model="customerDeal">
          <el-radio :label="1">是</el-radio>
          <el-radio :label="0">否</el-radio>
        </el-radio-group>
      </flexbox>
    </div>
    <span
      slot="footer"
      class="dialog-footer">
      <el-button
        v-debounce="sure"
        type="primary">确定</el-button>
      <el-button @click.native="close">取消</el-button>
    </span>
  </el-dialog>
</template>

<script>
import { crmSettingCustomerConfigSetAPI } from '@/api/admin/crm'

import WkUserDepDialogSelect from '@/components/NewCom/WkUserDepDialogSelect'

import ElDialogLoadingMixin from '@/mixins/ElDialogLoading'

export default {
  name: 'EditCustomerLimit',
  components: {
    WkUserDepDialogSelect
  },
  mixins: [ElDialogLoadingMixin],
  props: {
    types: [String, Number], // 1拥有客户上限2锁定客户上限

    visible: {
      type: Boolean,
      default: false
    },

    action: {
      type: Object,
      default: () => {
        return {
          type: 'save'
        }
      }
    }
  },
  data() {
    return {
      loading: false,
      customerDeal: 1,
      customerNum: '',
      users: [],
      strucs: []
    }
  },
  computed: {
    valueLabel() {
      return {
        1: '拥有客户数上限（个）',
        2: '锁定客户数上限（个）'
      }[this.types]
    },

    dealLabel() {
      return {
        1: '成交客户是否占有拥有客户数：',
        2: '成交客户是否占有锁定客户数：'
      }[this.types]
    },

    title() {
      return this.action.type == 'update' ? '编辑规则' : '添加规则'
    },

    // 展示是否
    showDeal() {
      return this.types == 1
    }
  },
  watch: {
    visible(val) {
      if (val) {
        if (this.action.type == 'save') {
          this.clearInfo()
        } else if (this.action.type == 'update') {
          const data = this.action.data
          this.customerDeal = data.customerDeal
          this.customerNum = data.customerNum
          this.$nextTick(() => {
            this.users = data.userIds ? data.userIds.map(item => item.userId) : []
            this.strucs = data.deptIds ? data.deptIds.map(item => item.id) : []
          })
        }
      }
    }
  },
  mounted() {
  },
  methods: {
    close() {
      this.$emit('update:visible', false)
    },

    sure() {
      if (this.customerNum <= 0) {
        this.$message.error('请输入正确的客户数')
      } else if ((!this.users.length && !this.strucs.length)) {
        this.$message.error('请完善信息')
      } else {
        this.loading = true
        const params = {
          userIds: this.users.map(item => {
            return { userId: item }
          }),
          deptIds: this.strucs.map(item => {
            return { id: item }
          }),
          customerNum: this.customerNum,
          type: this.types
        }

        if (this.showDeal) {
          params.customerDeal = this.customerDeal
        }

        if (this.action.type == 'update') {
          params.settingId = this.action.data.settingId
        }

        crmSettingCustomerConfigSetAPI(params)
          .then(res => {
            this.$emit('success')
            this.$message.success(`${this.title}成功`)
            this.close()
            this.loading = false
          })
          .catch(() => {
            this.loading = false
          })
      }
    },

    clearInfo() {
      this.users = []
      this.strucs = []
      this.customerDeal = 1
      this.customerNum = ''
    }
  }
}
</script>

<style scoped lang="scss">
.position-relative {
  position: relative;
}

.handle-box {
  font-size: 12px;
  color: $--color-text-primary;
}

.handle-item {
  position: relative;
  padding-bottom: 15px;

  .handle-item-name {
    flex-shrink: 0;
    width: 150px;
  }

  .handle-item-content {
    flex: 1;
  }
}
</style>
