<template>
  <xr-create
    :loading="loading"
    :title="title"
    @close="close"
    @save="onSubmit">
    <wk-form
      ref="wkFrom"
      :model="formData"
      :rules="rules"
      :field-from="formData"
      :field-list="formList"
      label-position="top"
    >
      <template slot-scope="{ data, index }">
        <wk-user-dep-dialog-select
          v-if="data && data.formType == 'userDep'"
          :user-value.sync="formData[data.field].staff"
          :dep-value.sync="formData[data.field].dep"
          style="width: 100%;"
        />
        <template v-else>
          <slot :data="data" />
        </template>
      </template>
    </wk-form>
  </xr-create>
</template>

<script>
// API
import { noticeAddOrUpateAPI } from '@/api/oa/notice'
import { formatTimeToTimestamp } from '@/utils/index'

import XrCreate from '@/components/XrCreate'
import WkUserDepDialogSelect from '@/components/NewCom/WkUserDepDialogSelect'
import WkForm from '@/components/NewCom/WkForm'

export default {
  components: {
    XrCreate,
    WkUserDepDialogSelect,
    WkForm
  },
  props: {
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
    var validateTime = (rule, value, callback) => {
      if (
        (rule.field == 'startTime' &&
          !this.formData.startTime &&
          this.formData.endTime) ||
        (rule.field == 'endTime' &&
          !this.formData.endTime &&
          this.formData.startTime)
      ) {
        callback(new Error('请完善时间'))
      } else if (this.formData.startTime && this.formData.endTime) {
        if (
          formatTimeToTimestamp(this.formData.startTime) >=
          formatTimeToTimestamp(this.formData.endTime)
        ) {
          callback(new Error('开始时间必须小于结束时间'))
        }
      }
      callback()
    }
    return {
      formList: [
        { name: '公告标题', field: 'title', formType: 'text' },
        { name: '通知范围', field: 'dep', formType: 'userDep' },
        // { name: '开始时间', field: 'startTime', formType: 'date' },
        // { name: '结束时间', field: 'endTime', formType: 'date' },
        { name: '公告正文', field: 'content', formType: 'textarea' }
      ],
      formData: { dep: { staff: [], dep: [] }},
      rules: {
        title: [
          { required: true, message: '公告标题不能为空', trigger: 'blur' },
          { max: 50, message: '公告标题长度最多为50个字符', trigger: 'blur' }
        ],
        content: [
          { required: true, message: '公告正文不能为空', trigger: 'blur' }
        ],
        startTime: [
          { required: true, message: '不能为空', trigger: 'blur' },
          { validator: validateTime, trigger: 'blur' }
        ],
        endTime: [
          { required: true, message: '不能为空', trigger: 'blur' },
          { validator: validateTime, trigger: 'blur' }
        ]
      },
      loading: false
    }
  },

  computed: {
    title() {
      return this.action.type == 'save' ? '新建公告' : '编辑公告'
    }
  },

  created() {
    if (this.action.type == 'update') {
      const actionData = this.action.data
      this.formData = {
        title: actionData.title,
        content: actionData.content,
        dep: { staff: (actionData.ownerUserList || []).map(item => item.userId), dep: (actionData.deptList || []).map(item => item.id) }
      }
    }
  },

  methods: {
    onSubmit() {
      this.$refs.wkFrom.instance.validate(valid => {
        if (valid) {
          this.loading = true
          const params = {
            title: this.formData.title,
            content: this.formData.content,
            // startTime: this.formData.startTime,
            // endTime: this.formData.endTime,
            deptIds: this.formData.dep.dep
              .join(','),
            ownerUserIds: this.formData.dep.staff
              .join(',')
          }

          if (this.action.type == 'update') {
            params.announcementId = this.action.id
          }

          noticeAddOrUpateAPI(params)
            .then(res => {
              this.$message.success(`${this.title}成功`)
              // if (this.$route.query.routerKey == 1) {
              //   this.$router.push('notice')
              // } else {
              this.$emit('onSubmit')
              this.close()
              // }
              this.loading = false
            })
            .catch(() => {
              this.$message.error(`${this.title}失败`)
              this.loading = false
            })
        } else {
          return false
        }
      })
    },
    close() {
      // if (this.$route.query.routerKey == 1) {
      //   this.$router.go(-1)
      // } else {
      this.$emit('close')
      // }
    }
  }
}
</script>

<style scoped lang="scss">
.details-box {
  height: 100%;

  .header {
    height: 40px;
    padding: 0 10px;
    line-height: 40px;

    .el-icon-close {
      display: block;
      padding: 10px;
      margin-right: -10px;
      font-size: 24px;
      color: #909399;
      cursor: pointer;
    }

    .el-icon-close:hover {
      color: $--color-primary;
    }

    .text {
      font-size: 17px;
      font-weight: bold;
    }
  }

  /deep/ .el-form-item {
    .el-form-item__content {
      line-height: $--input-height;
    }
  }

  .btn-box {
    padding-right: 20px;
    text-align: right;
  }
}

</style>
