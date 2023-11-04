<template>
  <el-dialog
    :visible.sync="showDialog"
    :append-to-body="true"
    :show-close="showCancel"
    :close-on-click-modal="false"
    title="导入业绩目标"
    width="750px"
    @close="closeView">
    <div class="dialog-body">
      <el-steps
        :active="stepsActive"
        simple>
        <el-step
          v-for="(item, index) in stepList"
          :key="index"
          :title="item.title"
          :icon="item.icon"
          :status="item.status" />
      </el-steps>
      <div v-if="stepsActive == 1">

        <div class="sections">
          <div class="sections__title">一、请选择目标对象（必填）</div>
          <div class="content">
            <div class="user-cell">
              <el-select
                v-model="achievementType"
                placeholder="请选择">
                <el-option
                  v-for="(item, index) in [{name: '部门',value: 1},{name: '员工',value: 2}]"
                  :key="index"
                  :label="item.name"
                  :value="item.value" />
              </el-select>
            </div>
          </div>
        </div>

        <div class="sections">
          <div class="sections__title">二、请选择需要导入的文件</div>
          <div class="content">
            <flexbox class="file-select">
              <el-input
                v-model="file.name"
                :disabled="true" />
              <el-button
                type="primary"
                @click="selectFile">选择文件</el-button>
            </flexbox>
          </div>
          <div
            class="download"
            @click="download">
            点击下载《业绩目标导入模板》</div>
        </div>
      </div>

      <div
        v-else-if="stepsActive == 2"
        v-loading="loading"
        element-loading-text="数据导入中"
        element-loading-spinner="el-icon-loading"
        class="sections" />

      <div
        v-else-if="stepsActive == 3"
        v-loading="loading"
        class="sections">
        <div class="result-info">
          <i class="wk wk-success result-info__icon" />
          <p class="result-info__des">数据导入完成</p>
          <p class="result-info__detail">导入总数据<span class="result-info__detail--all">{{ resultData.totalSize }}</span>条，导入成功<span class="result-info__detail--suc"><template v-if="resultData">{{ resultData.totalSize - (resultData.errSize || 0) }}</template></span>条，导入失败<span class="result-info__detail--err">{{ resultData.errSize || 0 }}</span>条</p>
          <el-button
            v-if="resultData && resultData.errSize > 0"
            class="result-info__btn--err"
            type="primary-text"
            style="padding: 0;"
            @click="downloadErrData">下载错误数据</el-button>
        </div>
      </div>
      <input
        id="import-input-file"
        ref="userFileInput"
        type="file"
        @change="uploadFile">
    </div>
    <span
      slot="footer"
      class="dialog-footer">
      <el-button
        v-if="sureTitle"
        type="primary"
        @click="sureClick">{{ sureTitle }}</el-button>
      <el-button
        :class="{ 'is-hidden': !showCancel }"
        @click="closeView">取消</el-button>
    </span>
  </el-dialog>
</template>

<script>
import {
  biAchievementExcelImportAPI,
  biAchievementDownloadExcelAPI,
  biAchievementDownExcelAPI
} from '@/api/admin/crm'

import { downloadExcelWithResData, verifyFileTypeWithFileName } from '@/utils'

export default {
  // 导入业绩目标
  name: 'ImportGoal',
  components: {},
  props: {
    show: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      loading: false,
      showDialog: false,
      achievementType: 1, // 目标对象
      file: { name: '' },
      stepsActive: 1,
      stepList: [
        {
          icon: 'wk wk-upload',
          title: '上传文件',
          status: 'wait'
        },
        {
          icon: 'wk wk-data-import',
          title: '导入数据',
          status: 'wait'
        },
        {
          icon: 'wk wk-success',
          title: '导入完成',
          status: 'wait'
        }
      ],
      resultData: null
    }
  },
  computed: {
    sureTitle() {
      return {
        1: '立即导入',
        2: '',
        3: '确定'
      }[this.stepsActive]
    },

    showCancel() {
      return this.stepsActive != 2
    }
  },
  watch: {
    show: function(val) {
      this.showDialog = val
      this.resetData()
    }
  },
  mounted() {},
  methods: {
    sureClick() {
      if (this.stepsActive == 1) {
        if (this.stepList[0].status == 'finish') {
          this.stepList[1].status = 'process'
          this.stepsActive = 2
          this.updateFile(res => {
            this.stepList[1].status = 'finish'
            this.stepsActive = 3
            if (res.data) {
              this.resultData = res.data
              if (res.data.errSize > 0) {
                this.stepList[2].status = 'error'
              } else {
                this.stepList[2].status = 'finish'
              }
            }
          })
        } else {
          this.$message.error('请选择导入文件')
        }
      } else if (this.stepsActive == 3) {
        this.closeView()
      }
    },

    updateFile(result) {
      if (!this.file.name) {
        this.$message.error('请选择导入文件')
      } else {
        this.loading = true
        biAchievementExcelImportAPI({
          file: this.file,
          type: this.achievementType
        })
          .then(res => {
            this.loading = false
            if (result) {
              result(res)
            }
            this.$emit('success')
          })
          .catch(() => {
            if (result) {
              result(false)
            }
            this.loading = false
          })
      }
    },

    /**
     * 下载错误
     */
    downloadErrData() {
      this.getImportError(this.resultData.token)
    },

    /**
     * 导入错误下载
     */
    getImportError(token) {
      this.loading = true
      biAchievementDownExcelAPI({
        token
      })
        .then(res => {
          downloadExcelWithResData(res)
          this.loading = false
        })
        .catch(() => {
          this.loading = false
        })
    },

    /**
     * 下载模板操作
     */
    download() {
      biAchievementDownloadExcelAPI({ type: this.achievementType })
        .then(res => {
          downloadExcelWithResData(res)
        })
        .catch(() => {})
    },

    /**
     * 选择文件选择文件
     */
    selectFile() {
      this.$refs.userFileInput.click()
    },

    /**
     * 选择触发
     */
    uploadFile(event) {
      var files = event.target.files
      const file = files[0]
      if (verifyFileTypeWithFileName(file.name)) {
        this.file = file
        this.stepList[0].status = 'finish'
      }
      event.target.value = ''
    },

    /**
     * 关闭
     */
    closeView() {
      this.$emit('close')
    },

    /**
     * 重置数据
     */
    resetData() {
      this.file = { name: '' }
      this.stepList = [
        {
          icon: 'wk wk-upload',
          title: '上传文件',
          status: 'wait'
        },
        {
          icon: 'wk wk-data-import',
          title: '导入数据',
          status: 'wait'
        },
        {
          icon: 'wk wk-success',
          title: '导入完成',
          status: 'wait'
        }
      ]
      this.stepsActive = 1
      this.resultData = null
    }
  }
}
</script>

<style scoped lang="scss">
.el-steps {
  margin-bottom: 15px;

  /deep/ .el-step__title {
    font-size: 14px;
  }

  /deep/ .el-step.is-simple .el-step__arrow::before,
  /deep/ .el-step.is-simple .el-step__arrow::after {
    width: 2px;
    height: 10px;
  }

  /deep/ .el-step.is-simple .el-step__arrow::after {
    transform: rotate(45deg) translateY(3px);
  }

  /deep/ .el-step.is-simple .el-step__arrow::before {
    transform: rotate(-45deg) translateY(-2px);
  }
}

.sections {
  margin-top: 10px;
  font-size: 14px;

  // min-height: 215px;
  .sections__title {
    font-size: 14px;
    font-weight: 600;
    color: $--color-text-primary;
  }

  .download {
    margin-bottom: 15px;
    color: #2362fb;
    cursor: pointer;
  }

  /deep/ .el-loading-spinner {
    top: 45%;

    .el-icon-loading {
      font-size: 40px;
      color: $--color-text-secondary;
    }

    .el-loading-text {
      color: $--color-text-primary;
    }
  }
}

.content {
  padding: 10px 0;

  .el-select {
    width: 400px;
  }

  .user-cell {
    width: 400px;
  }
}

#import-input-file {
  display: none;
}

.file-select {
  .el-input {
    width: 400px;
  }

  button {
    margin-left: 20px;
  }
}

.is-hidden {
  visibility: hidden;
}

// 结果信息
.result-info {
  padding-top: 30px;
  text-align: center;

  &__icon {
    font-size: 40px;
    color: $--color-primary;
  }

  &__des {
    margin-top: 15px;
    font-size: 14px;
    color: $--color-text-primary;
  }

  &__detail {
    margin-top: 15px;
    color: $--color-text-regular;

    &--all {
      font-weight: 600;
      color: $--color-text-primary;
    }

    &--suc {
      font-weight: 600;
      color: $--color-primary;
    }

    &--err {
      font-weight: 600;
      color: #f94e4e;
    }
  }

  &__btn--err {
    margin-top: 10px;
  }
}

/deep/ .el-date-editor {
  width: 400px;
}
</style>
