<template>
  <el-dialog
    v-loading="loading"
    :visible="visible"
    :append-to-body="true"
    :close-on-click-modal="false"
    title="关联员工"
    width="600px"
    @close="handleCancel">
    <div class="handle-box">
      <flexbox
        class="handle-item"
        align="stretch">
        <div
          class="handle-item-name"
          style="margin-top: 8px;">选择员工：</div>
        <wk-user-dialog-select
          v-model="selectUsers"
          :radio="false"
          class="handle-item-content" />
      </flexbox>
    </div>
    <span
      slot="footer"
      class="dialog-footer">
      <el-button
        type="primary"
        @click.native="handleConfirm">保存</el-button>
      <el-button @click.native="handleCancel">取消</el-button>
    </span>
  </el-dialog>
</template>

<script>
import { adminRoleRelatedUserAPI } from '@/api/admin/role'
import WkUserDialogSelect from '@/components/NewCom/WkUserDialogSelect'

export default {
  /** 关联员工*/
  name: 'RelateEmpoyee',
  components: {
    WkUserDialogSelect
  },
  mixins: [],
  props: {
    visible: {
      type: Boolean,
      required: true,
      default: false
    },
    roleId: [Number, String]
  },
  data() {
    return {
      loading: true,
      selectUsers: []
    }
  },
  computed: {},
  watch: {
    visible(val) {
      if (val) {
        this.selectUsers = []
      }
    }
  },
  mounted() {},
  methods: {
    /**
     * 取消选择
     */
    handleCancel() {
      this.$emit('update:visible', false)
    },

    /**
     * 点击确定
     */
    handleConfirm() {
      if (this.selectUsers.length == 0) {
        this.$message.error('请选择员工')
      } else {
        adminRoleRelatedUserAPI({
          userIds: this.selectUsers,
          roleIds: [this.roleId]
        })
          .then(res => {
            this.$message.success('操作成功')
            this.$emit('save')
          })
          .catch(() => {})
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.handle-item {
  padding-bottom: 15px;

  .handle-item-name {
    flex-shrink: 0;
    width: 90px;
  }

  .handle-item-content {
    flex: 1;
  }
}

.handle-bar {
  position: relative;
  height: 30px;
  margin-top: 10px;

  button {
    float: right;
    margin-right: 10px;
  }
}
</style>
