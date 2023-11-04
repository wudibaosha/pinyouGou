<template>
  <create-view :body-style="{maxHeight: '100%'}" :card-style="{maxHeight: '100%', height: 'auto'}">
    <div
      v-loading="loading"
      class="create-log">
      <el-tabs
        v-model="activeTab"
        @tab-click="handleTabToggle">
        <el-tab-pane
          v-if="showPaneType === 'all' || showPaneType === 'day'"
          label="日报"
          name="day" />
        <el-tab-pane
          v-if="showPaneType === 'all' || showPaneType === 'week'"
          label="周报"
          name="week" />
        <el-tab-pane
          v-if="showPaneType === 'all' || showPaneType === 'month'"
          label="月报"
          name="month" />
      </el-tabs>

      <span
        v-if="completeInfo.status !== 0"
        class="complete-btn"
        @click="completeClick">
        <!-- <i
        class="wk wk-log complete-btn__icon"
        style="color: #2362FB " /> -->
        <span class="complete-btn__name">{{ activeMap[activeTab] }}完成情况<span class="value">{{ completeInfo.completeNum }}</span>/<span class="value">{{ completeInfo.totalNum }}</span></span>
      </span>

      <template v-if="!showMore">
        <div class="content-box">
          <flexbox
            justify="flex-start"
            class="box"
            @click.native="showMore = true">
            <span class="wk wk-write icon" />
            <span class="info">请输入日志内容</span>
          </flexbox>
        </div>
      </template>
      <template v-else>
        <div :style="{ maxHeight: `${contentMaxHeight}px` }" class="create-log-content">
          <el-form>
            <el-form-item
              v-for="(item, index) in textFormKeyList"
              :key="index"
              :label="item.label">
              <el-input
                v-model="form[item.key]"
                :autosize="{
                  minRows: 2,
                  maxRows: 10
                }"
                :maxlength="1000"
                type="textarea"
                resize="none"
                placeholder="请输入内容" />
            </el-form-item>
            <span
              class="wk wk-close close-icon"
              @click="showMore = false" />
          </el-form>

          <add-image-list
            v-if="imgFiles.length > 0"
            :data="imgFiles"
            @delete="deleteImage"
            @delete-all="deleteAllFile(2)"
            @upload="uploadFile" />
          <!-- <add-file-list
            v-if="files.length > 0"
            :data="files"
            @delete="deleteFile"
            @delete-all="deleteAllFile(1)" /> -->
          <!-- 附件 -->
          <div v-if="files.length > 0" class="content-title">附件：({{ files.length }})</div>
          <div
            v-if="files.length > 0"
            class="affix-all">
            <file-cell
              :file-list="files"
              :show-delete="true"
              @delete="deleteFile" />
          </div>

          <div v-if="allDataLen" class="content-title">相关信息：({{ allDataLen }})</div>
          <div style="margin-bottom: 10px;">
            <related-business
              ref="relatedBusiness"
              :margin-left="'0'"
              :all-data="showRelateData"
              :show-add-btn="false"
              :show-foot="true"
              @unbind="deleteRelate" />
          </div>
          <!-- <add-relate-list
            v-for="(value, key, index) in showRelateData"
            :key="index"
            :data="value"
            :type="key"
            @delete="deleteRelate" /> -->

        </div>
        <div class="add-control">
          <div
            class="control-item"
            @click="barClick('img')">
            <span class="icon wk wk-picture" />
            <span>图片</span>
          </div>
          <div
            class="control-item"
            @click="barClick('file')">
            <span class="icon wk wk-file" />
            <span>附件</span>
          </div>
          <crm-relative
            v-if="showRelatePopover"
            ref="crmrelative"
            :visible.sync="showRelatePopover"
            :radio="false"
            :show-types="[
              'customer',
              'contacts',
              'business',
              'contract'
            ]"
            :selected-data="relateData"
            @close="showRelatePopover= false"
            @changeCheckout="relateDataChange" />
          <div
            class="control-item"
            @click="barClick('relate')">
            <span class="icon wk wk-associated" />
            <span>相关信息</span>
          </div>

          <div class="control-item">
            <span class="cursor-default">发送给：</span>
            <span
              v-for="(item, index) in showSendUserList"
              :key="index"
              class="send-user">
              <xr-avatar
                :name="item.realname || item.name"
                :size="32"
                :src="item.img" />
            </span>
            <members-dep
              :content-block="false"
              :user-checked-data="sendUserList"
              :dep-checked-data="sendDeptList"
              @popoverSubmit="sendUserChange">
              <span slot="membersDep">
                <el-tooltip
                  placement="bottom"
                  effect="light"
                  popper-class="tooltip-change-border">
                  <div slot="content">
                    <span>{{ sendUserDeptNames }}</span>
                  </div>
                  <i
                    v-show="(sendUserList.length + sendDeptList.length) > 5"
                    class="el-icon-more more-user-btn" />
                </el-tooltip>

                <i
                  class="el-icon-plus add-user-btn" />
              </span>

            </members-dep>

          </div>

          <span class="control-relevance">
            <span>关联销售简报</span>
            <el-switch
              v-model="getBulletin"
              :active-value="1"
              :inactive-value="0" />
            <span>是</span>
          </span>

          <div class="others">
            <el-button
              @click="close">
              取消
            </el-button>
            <el-button
              type="primary"
              @click="handleCreate">
              发布
            </el-button>
          </div>
        </div>
      </template>

      <!-- 附件 -->
      <input
        ref="fileInput"
        accept="*.*"
        type="file"
        class="file-input"
        multiple
        @change="uploadFile">
      <input
        ref="imgInput"
        accept="image/*"
        type="file"
        class="file-input"
        multiple
        @change="uploadFile">
    </div>
  </create-view>
</template>

<script>
import {
  journalAddAPI,
  oaLogCompleteStatsAPI
} from '@/api/oa/journal'
import { crmFileDeleteAPI, crmFileRemoveByBatchIdAPI } from '@/api/common'

import {
  fileSize,
  getFileTypeIcon,
  guid,
  getImageData,
  objDeepCopy,
  getFileIconWithFileName
} from '@/utils/index'

import AddImageList from '@/components/QuickAdd/AddImageList'
import AddFileList from '@/components/QuickAdd/AddFileList'
import CrmRelative from '@/components/CreateCom/CrmRelative'
import AddRelateList from '@/components/QuickAdd/AddRelateList'
import MembersDep from '@/components/SelectEmployee/MembersDep'
import CreateView from '@/components/CreateView'
import FileCell from '@/components/FileCell'
import RelatedBusiness from '@/components/RelatedBusiness'

export default {
  name: 'CreateLog',
  components: {
    AddImageList,
    AddFileList,
    CrmRelative,
    AddRelateList,
    MembersDep,
    CreateView,
    FileCell,
    RelatedBusiness
  },
  props: {
    formData: Object,
    // 附件
    accessoryFileList: {
      type: Array,
      default: () => {
        return []
      }
    },
    imgFileList: {
      type: Array,
      default: () => {
        return []
      }
    }
  },
  data() {
    return {
      form: {}, // 文本内容
      // 关联简报
      getBulletin: 1,
      textFormKeyList: [],
      activeTab: 'day',
      activeMap: {
        day: '日报',
        week: '周报',
        month: '月报'
      },
      loading: false,
      contentMaxHeight: document.documentElement.clientHeight - 200,
      categoryIdMap: {
        day: 1, // 日报
        week: 2, // 周报
        month: 3 // 月报
      },
      // 用于在图片类型下不上传附件
      showRelativeType: '',
      imgFiles: [],
      files: [],
      // 批次ID
      batchId: guid(),
      showRelatePopover: false, // 关联业务信息框
      relateData: {},
      sendUserList: [], // 发送人
      sendDeptList: [], // 发送部门
      showMore: true,
      completeInfo: {
        completeNum: 0,
        totalNum: 0
      } // 完成信息
    }
  },
  computed: {
    // 展示的pane all 全部
    showPaneType() {
      if (this.formData && this.formData.categoryId) {
        return this.activeTab
      }
      return 'all'
    },

    /**
     * 是编辑
     */
    isEdit() {
      return !!this.formData
    },
    allDataLen() {
      let res = 0
      if (!this.relateData) return res
      const keys = ['business', 'contacts', 'contract', 'customer']
      keys.forEach(key => {
        if (this.relateData[key]) {
          res += this.relateData[key].length
        }
      })
      return res
    },
    showRelateData() {
      const tempsData = {}
      Object.keys(this.relateData).forEach(key => {
        const list = this.relateData[key]
        if (list && list.length) {
          tempsData[key] = list
        }
      })
      return tempsData
    },

    showSendUserList() {
      const sendUserList = this.sendUserList || []
      const sendDeptList = this.sendDeptList || []
      return sendUserList.concat(sendDeptList).slice(0, 5)
    },

    sendUserDeptNames() {
      const sendUserName = this.sendUserList && this.sendUserList.length > 0 ? `${this.sendUserList.length}个员工` : ''
      const sendDeptName = this.sendDeptList && this.sendDeptList.length > 0 ? `${this.sendDeptList.length}个部门` : ''
      const names = []
      if (sendUserName) {
        names.push(sendUserName)
      }
      if (sendDeptName) {
        names.push(sendDeptName)
      }

      return `等${names.join('和')}`
    }
  },
  watch: {
    activeTab: {
      handler() {
        this.getCompelteInfo()
      },
      immediate: true
    }
  },
  created() {
    this.handleTabToggle()

    // 是编辑
    if (this.formData) {
      this.initEditInfo()
    }

    window.onresize = () => {
      this.contentMaxHeight = document.documentElement.clientHeight - 200
    }
  },
  mounted() {
    document.body.appendChild(this.$el)
  },
  destroyed() {
    // remove DOM node after destroy
    if (this.$el && this.$el.parentNode) {
      this.$el.parentNode.removeChild(this.$el)
    }
  },
  methods: {
    /**
     * 初始化编辑数据
     */
    initEditInfo() {
      const editFormData = objDeepCopy(this.formData)
      // 确定显示哪一种日志
      if (editFormData.categoryId) {
        switch (editFormData.categoryId) {
          case 1:
            this.activeTab = 'day'
            break
          case 2:
            this.activeTab = 'week'
            break
          case 3:
            this.activeTab = 'month'
            break
        }
      }

      // 文本内容
      const form = {}
      this.textFormKeyList.forEach(item => {
        form[item.key] = editFormData[item.key]
      })
      this.form = form

      if (editFormData.batchId) {
        this.batchId = editFormData.batchId
      }

      // 编辑时引用 - 自动勾选
      var allData = {}
      allData.business = (editFormData.businessList || []).map(item => {
        if (item.id) {
          item.businessId = item.id
        }
        return item
      })
      allData.contacts = (editFormData.contactsList || []).map(item => {
        if (item.id) {
          item.contactsId = item.id
        }
        return item
      })
      allData.contract = (editFormData.contractList || []).map(item => {
        if (item.id) {
          item.contractId = item.id
        }
        return item
      })
      allData.customer = (editFormData.customerList || []).map(item => {
        if (item.id) {
          item.customerId = item.id
        }
        return item
      })
      this.relateData = allData

      // 图片 附件
      this.imgFiles = objDeepCopy(this.imgFileList)
      for (let index = 0; index < this.imgFiles.length; index++) {
        this.setImageList(this.imgFiles[index], index)
      }
      this.files = objDeepCopy(this.accessoryFileList).map(item => {
        item.icon = getFileIconWithFileName(item.name)
        return item
      })

      // 发送人
      this.sendUserList = editFormData.sendUserList || []
      this.sendDeptList = editFormData.sendDeptList || []

      // 简报
      this.getBulletin = editFormData.getBulletin
    },

    /**
     * 获取图片内容
     */
    setImageList(item, index) {
      getImageData(item.url).then((data) => {
        item.url = data.src
        this.imageFileList.splice(index, 1, item)
      }).catch(() => {})
    },

    /**
     * 日志类型 tab 切换
     */
    handleTabToggle() {
      const map = {
        day: ['今日', '明日'],
        week: ['本周', '下周'],
        month: ['本月', '下月']
      }
      const arr = map[this.activeTab]
      this.textFormKeyList = [
        { label: `${arr[0]}工作的内容：`, key: 'content' },
        { label: `${arr[1]}工作的内容：`, key: 'tomorrow' },
        { label: '遇到的问题：', key: 'question' }
      ]
    },

    /**
     * 保存日志
     */
    handleCreate() {
      if (!this.form.content && !this.form.tomorrow && !this.form.question) {
        this.$message.error('请填写日志内容')
        return
      }

      this.loading = true
      const relateData = {}
      for (const key in this.relateData) {
        relateData[`${key}Ids`] = this.relateData[key].map(item => item[`${key}Id`]).join(',')
      }

      const params = {
        ...this.form,
        batchId: this.batchId,
        sendUserIds: this.sendUserList.map(item => item.userId).join(','),
        sendDeptIds: this.sendDeptList.map(item => item.id || item.deptId).join(','),
        ...relateData,
        categoryId: this.categoryIdMap[this.activeTab]
      }

      params.getBulletin = this.getBulletin // 1为关联销售简报

      if (this.isEdit) {
        params.logId = this.formData.logId
      }

      journalAddAPI(params)
        .then(() => {
          this.loading = false
          this.resetData()
          this.$emit('update')
          this.$message.success(this.isEdit ? '编辑成功' : '添加成功')
          this.close()
        })
        .catch(() => {
          this.loading = false
        })
    },

    /**
     * 重置信息
     */
    resetData() {
      this.form = {}
      this.getBulletin = true
      this.batchId = guid()
      this.imgFiles = []
      this.files = []
      this.sendUserList = []
      this.sendDeptList = []
      this.relateData = {}
    },

    /**
     * 图片和关联按钮事件
     */
    barClick(type) {
      this.showRelativeType = type
      if (type == 'relate') {
        this.showRelatePopover = true
      } else if (type == 'file') {
        this.$refs.fileInput.click()
      } else if (type == 'img') {
        this.$refs.imgInput.click()
      }
    },

    /**
     * 图片选择出发
     */
    uploadFile(event) {
      var files = event.target.files
      if (files.length) {
        for (let index = 0; index < files.length; index++) {
          const file = files[index]
          if (
            file.type.indexOf('image') == -1 &&
            this.showRelativeType == 'img'
          ) {
            this.$message.error('请上传正确的文件类型')
            return
          }
        }

        var type = event.target.accept == 'image/*' ? 'img' : 'file'
        for (let index = 0; index < files.length; index++) {
          const file = files[index]
          this.uploadFileRequest(file, type)
        }
        event.target.value = ''
      }
    },

    /**
     * 文件上传
     */
    uploadFileRequest(file, type, result) {
      this.$wkUploadFile.upload({
        file: file,
        params: {
          type: type,
          batchId: this.batchId
        }
      }).then(({ res }) => {
        const data = res.data || {}
        if (type == 'img') {
          this.imgFiles.push(data)
        } else {
          data['icon'] = getFileTypeIcon(file)
          this.files.push(data)
        }
        if (result) {
          result()
        }
      }).catch(() => {})
    },

    /**
     * 图片附件删除
     */
    deleteImage(item, index) {
      this.deleteImgOrFile('image', item, index)
    },

    deleteFile(item, index) {
      // this.deleteImgOrFile('file', item, index)
      this.files.splice(index, 1)
    },

    deleteImgOrFile(type, item, index) {
      this.$confirm('确定删除?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
        .then(() => {
          crmFileDeleteAPI({
            id: item.fileId
          })
            .then(res => {
              if (type == 'image') {
                this.imgFiles.splice(index, 1)
              } else {
                this.files.splice(index, 1)
              }
              this.$message.success('操作成功')
            })
            .catch(() => {})
        })
        .catch(() => {})
    },

    /**
     * 删除全部 type 1 是附件 2 是图片
     */
    deleteAllFile(type) {
      if (this.batchId) {
        this.$confirm('确定删除?', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
          .then(() => {
            crmFileRemoveByBatchIdAPI({
              batchId: this.batchId,
              type
            })
              .then(res => {
                if (type == 2) {
                  this.imgFiles = []
                } else {
                  this.files = []
                }
                this.$message.success('操作成功')
              })
              .catch(() => {})
          })
          .catch(() => {})
      }
    },

    /**
     * 关联业务选择
     */
    relateDataChange(val) {
      this.showRelatePopover = false
      this.relateData = val.data
    },

    /**
     * 删除相关
     */
    deleteRelate(type, data, index) {
      this.relateData[type].splice(index, 1)
    },

    /**
     * 发送人选择
     */
    sendUserChange(users, depts) {
      this.sendUserList = users
      this.sendDeptList = depts
    },

    /**
     * 完成情况点击
     */
    completeClick() {
      this.$emit('completeSelect', this.categoryIdMap[this.activeTab])
    },

    /**
     * 获取完成概要
     */
    getCompelteInfo() {
      oaLogCompleteStatsAPI({
        type: this.categoryIdMap[this.activeTab]
      })
        .then(res => {
          this.completeInfo = res.data
        })
        .catch(() => {})
    },

    /**
     * 关闭
     */
    close() {
      this.$emit('close')
    }
  }
}
</script>

<style scoped lang="scss">
/deep/ .el-tabs__header {
  margin: 0;
}

/deep/ .el-tabs__nav-wrap {
  padding: 0;
}

.create-log {
  position: relative;

  .content-box {
    padding: 15px 0;

    > .box {
      height: 35px;
      padding: 0 10px;
      cursor: pointer;
      border: 2px solid $--border-color-base;
      border-radius: 3px;

      .icon {
        font-size: 15px;
        color: $--border-color-base;
      }

      .info {
        margin-left: 5px;
        color: #c0c4cc;
      }

      &:hover {
        border-color: #c0c4cc;

        .icon {
          color: $--color-primary;
        }
      }
    }
  }

  &-content {
    overflow-y: auto;
  }

  .el-form {
    position: relative;
    margin-top: 16px;

    /deep/ .el-form-item {
      margin-bottom: 10px;
      font-size: 14px;

      .el-form-item__label {
        margin-bottom: $--interval-base;
        font-weight: bold;
        line-height: 1.5;
      }
    }

    /deep/ .el-textarea {
      .el-textarea__inner {
        padding: 0 5px;
        background-color: white;
        border: 0 none;
      }
    }

    .close-icon {
      position: absolute;
      top: 0;
      right: 20px;
      font-size: 18px;
      color: #d9d9d9;
      cursor: pointer;

      &:hover {
        color: $--color-primary;
      }
    }
  }

  .add-control {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    min-height: 50px;

    .control-item {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 20px;
      cursor: pointer;

      .icon {
        margin-right: 5px;
      }

      .add-user-btn {
        padding: 6px 5.5px 5px;
        margin-left: 7px;
        font-size: 12px;
        border: 2px dotted $--border-color-base;
        border-radius: 50%;
        transform: scale(0.8);
      }

      &:hover {
        color: $--color-primary;

        .add-user-btn {
          border-color: $--color-primary;
        }
      }
    }

    .control-relevance {
      .el-switch {
        margin: 0 8px;
      }
    }

    .others {
      display: flex;
      flex: 1;
      align-items: center;
      justify-content: flex-end;

      .el-button--small {
        padding: 7px 14px;
      }
    }
  }
}

.file-input {
  display: none;
}

// 参与人
.send-user {
  position: relative;
  display: inline-block;
}

.send-user + .send-user {
  margin-left: 7px;
}

.more-user-btn {
  padding: 5px;
  margin-left: 7px;
  font-size: 12px;
  background-color: #f3f7ff;
  border-radius: 50%;

  &:hover {
    color: white;
    background-color: $--color-primary;
  }
}

.cursor-default {
  cursor: default;
}

// 完成情况
.complete-btn {
  position: absolute;
  top: 8px;
  right: 0;
  display: inline-block;
  padding: 5px 10px;
  cursor: pointer;
  background-color: $--background-color-base;
  border-radius: 13px;

  &__icon {
    font-size: 12px;
  }

  &__name {
    margin-left: 3px;

    .value {
      color: $--color-primary;
    }
  }

  &:hover {
    background-color: #ecf1ff;
  }
}

.content-title {
  margin-bottom: $--interval-base;
  font-weight: bold;
  color: $--color-text-secondary;
}

.affix-all {
  margin-right: 1px;
  margin-bottom: 30px;
  margin-left: 1px;
}

</style>
