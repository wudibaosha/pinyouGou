<template>
  <flexbox align="stretch" class="log-add">
    <xr-avatar
      :name="userInfo.realname"
      :size="32"
      :src="userInfo.img"
      class="user-img" />
    <div v-if="isUnfold" style="flex: 1;">
      <div class="mix-content">
        <flexbox
          class="mix-content-select">
          <el-select
            v-if="showContacts"
            v-model="selectContactsId"
            clearable
            no-border
            multiple
            collapse-tags
            class="interval-line is-contacts"
            placeholder="联系人">
            <el-option
              v-for="item in contacts"
              :key="item.contactsId"
              :label="item.name"
              :value="item.contactsId" />
          </el-select>
          <el-select
            v-model="followType"
            clearable
            no-border
            class="interval-line"
            placeholder="跟进方式">
            <el-option
              v-for="item in followTypes"
              :key="item.value"
              :label="item.label"
              :value="item.value" />
          </el-select>
          <el-date-picker
            v-model="nextTime"
            :editable="false"
            class="interval-line is-date-picker"
            type="datetime"
            placeholder="下次联系时间"
            value-format="yyyy-MM-dd HH:mm:ss" />
          <!--wk-no-border-backgroud-->
          <!--<time-Select
            :width="230"
            :default-type="nextTime"
            :options="timeOptions"
            @change="timeChange" />-->
          <i v-if="helpObj" class="wk wk-icon-fill-help wk-help-tips" :data-type="helpObj.type" :data-id="helpObj.id" />

          <span class="interval-line interval-line-wrap" style="padding: 0 0 0 16px;">
            <el-button
              type="subtle"
              class="handle-button"
              icon="wk wk-picture"
              @click="barClick('img')" />
            <el-button
              type="subtle"
              class="handle-button"
              icon="wk wk-file"
              @click="barClick('file')" />
            <el-button
              v-if="showBusiness"
              type="subtle"
              class="handle-button "
              icon="wk wk-associate"
              style="margin-left: 10px;"
              @click="barClick('business')" />
          </span>

          <common-words
            style="margin-left: 16px;"
            :help-obj="commonHelpObj"
            :props="commonWordsProps"
            :set-props="commonWordsSetProps"
            @select="commonWordsSelect" />
        </flexbox>
        <el-input
          ref="textarea"
          v-model="content"
          :autosize="autosize"
          :maxlength="800"
          type="textarea"
          class="wk-no-border-backgroud"
          clearable
          resize="none"
          placeholder="写跟进..."
          @focus="inputFocus" />

        <add-image-list
          v-if="imgFiles.length > 0"
          :data="imgFiles"
          @delete="deleteImage"
          @delete-all="deleteAllFile(2)"
          @upload="uploadFile" />
        <add-file-list
          v-if="files.length > 0"
          :data="files"
          @delete="deleteFile"
          @delete-all="deleteAllFile(1)" />
        <add-relate-list
          v-if="business.length > 0"
          :data="business"
          type="business"
          @delete="deleteRelate" />

        <div
          class="bar-cont">
          <crm-relative
            v-if="showBusiness"
            :visible.sync="showBusinessPopover"
            :radio="false"
            :action="businessAction"
            :selected-data="{ 'business': business }"
            crm-type="business"
            @close="showBusinessPopover=false"
            @changeCheckout="checkRelativeInfos" />
        </div>
        <div class="min-bar">
          <span class="interval-line">
            <el-button
              type="subtle"
              class="handle-button"
              icon="wk wk-picture"
              @click="barClick('img')" />
            <el-button
              type="subtle"
              class="handle-button"
              icon="wk wk-file"
              @click="barClick('file')" />
            <el-button
              v-if="showBusiness"
              type="subtle"
              class="handle-button "
              icon="wk wk-associate"
              style="margin-left: 10px;"
              @click="barClick('business')" />
          </span>

          <common-words
            style="margin-left: 16px;"
            :props="commonWordsProps"
            :set-props="commonWordsSetProps"
            :help-obj="commonHelpObj"
            @select="commonWordsSelect" />
        </div>
      </div>
      <div class="send-bar">
        <el-button
          v-debounce="sendClick"
          type="primary">发布</el-button>
        <el-button
          v-debounce="close">取消</el-button>
      </div>

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
    <div v-else style="flex: 1;" class="mix-content wk-no-border-backgroud-form unfold">
      <div class="i-cont unfold" @click="inputFocus">
        <!-- <i
          class="wk wk-write" /> -->
        <span>{{ content || '写跟进...' }}</span>
      </div>
    </div>
  </flexbox>
</template>

<script>
import { crmFileDeleteAPI, crmFileRemoveByBatchIdAPI } from '@/api/common'
import {
  sysConfigQueryPhraseAPI,
  sysConfigSetPhraseAPI
} from '@/api/crm/common'

import AddImageList from '@/components/QuickAdd/AddImageList'
import AddFileList from '@/components/QuickAdd/AddFileList'
import AddRelateList from '@/components/QuickAdd/AddRelateList'
import CommonWords from '@/components/CommonWords'

import { fileSize, getFileTypeIcon, guid } from '@/utils/index'
import EmitterMixin from '@/mixins/Emitter'
import { mapGetters } from 'vuex'

export default {
  /** 跟进记录 下的 添加 有添加框的都需要*/
  name: 'LogAdd',
  components: {
    CrmRelative: () => import('@/components/CreateCom/CrmRelative'),
    AddImageList,
    AddFileList,
    AddRelateList,
    CommonWords
  },
  mixins: [EmitterMixin],
  props: {
    // 展示相关商机关联
    showBusiness: {
      type: Boolean,
      default: false
    },
    // 展示相关商机关联
    showContacts: {
      type: Boolean,
      default: false
    },
    contacts: Array,
    // 首要联系人ID
    contactsId: [String, Number],
    // 跟进类型
    followTypes: Array,
    // 模块ID
    id: [String, Number],
    // 没有值就是全部类型 有值就是当个类型
    crmType: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      isUnfold: false, // 默认闭合
      /** 输入法 */
      content: '',
      /** 图片信息 */
      imgFiles: [],
      businessAction: {}, // 关联商机注入的客户信息
      /** 图片信息 */
      files: [],
      /** 关联商机信息 */
      showBusinessPopover: false,
      business: [],
      /** 关联联系人信息 */
      selectContactsId: [],
      followType: '',
      // 下次联系时间
      // nextTime: {},
      nextTime: '',
      timeOptions: [
        { label: '30分钟后', value: 1 },
        { label: '1小时后', value: 2 },
        { label: '2小时后', value: 3 },
        { label: '1天后', value: 4 },
        { label: '2天后', value: 5 },
        { label: '3天后', value: 6 },
        { label: '5天后', value: 7 },
        { label: '7天后', value: 8 },
        { label: '14天后', value: 9 }
      ],
      /** 展示关联弹窗 */
      showRelativeType: '',
      batchId: guid() // 批次ID
    }
  },
  computed: {
    ...mapGetters([
      'userInfo'
    ]),
    autosize() {
      if (this.isUnfold) {
        return { minRows: 3, maxRows: 6 }
      }
      return { minRows: 1, maxRows: 1 }
    },
    // 帮助信息
    helpObj() {
      return {
        leads: {
          type: '7',
          id: '49'
        }, customer: {
          type: '8',
          id: '153'
        }, business: {
          type: '10',
          id: '154'
        }, contract: {
          type: '11',
          id: '63'
        }
      }[this.crmType] || null
    },
    // 常用语帮助
    commonHelpObj() {
      return {
        leads: {
          type: '7',
          id: '89'
        }, customer: {
          type: '8',
          id: '90'
        }, contacts: {
          type: '9',
          id: '91'
        }, business: {
          type: '10',
          id: '92'
        }, contract: {
          type: '11',
          id: '93'
        }
      }[this.crmType] || null
    },

    // 常用语配置
    commonWordsProps() {
      return {
        request: sysConfigQueryPhraseAPI // 添加请求和参数
      }
    },

    // 常用语设置配置
    commonWordsSetProps() {
      return {
        request: sysConfigSetPhraseAPI // 添加请求和参数
      }
    }
  },
  watch: {
    followTypes() {
      this.getDefalutFollowType()
    },

    content(val) {
      const value = !!(val && val.length > 0)
      this.dispatch('SlideView', 'setEditClose', [value])
    },

    contactsId() {
      this.selectContactsId = this.contactsId ? [this.contactsId] : []
    },

    id: {
      handler() {
        this.businessAction = { type: 'condition', data: { moduleType: this.crmType, customerId: this.id }}
      },
      immediate: true
    }
  },
  created() {
    this.selectContactsId = this.contactsId ? [this.contactsId] : []
    this.getDefalutFollowType()
  },

  beforeDestroy() {},
  methods: {
    /**
     * 选择下次联系时间
     */
    timeChange(data) {
      this.nextTime = data
    },
    /**
     * 跟进类型初始值
     */
    getDefalutFollowType() {
      if (this.followTypes && this.followTypes.length > 0) {
        this.followType = this.followTypes[0].value
      } else {
        this.followType = ''
      }
    },

    /**
     * 重置数据
     */
    resetInfo() {
      // this.nextTime = {}
      this.nextTime = ''
      this.isUnfold = false
      // 输入法
      this.content = ''
      this.dispatch('SlideView', 'setEditClose', [false])
      // 图片信息
      this.imgFiles = []
      // 图片信息
      this.files = []
      // 关联商机信息
      this.business = []
      // 关联联系人信息
      this.selectContactsId = this.contactsId ? [this.contactsId] : []
      // 展示关联弹窗
      this.showRelativeType = ''
      this.batchId = guid()
      this.getDefalutFollowType()
    },

    /**
     * 常用语选择
     */
    commonWordsSelect(data) {
      if (this.content) {
        this.$confirm('您选中的常用语将覆盖当前填写内容?', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
          customClass: 'is-particulars'
        })
          .then(() => {
            this.content = data
          })
          .catch(() => {})
      } else {
        this.content = data
      }
    },

    /**
     * 快捷添加按钮
     */
    checkRelativeInfos(data) {
      if (this.showRelativeType == 'business') {
        this.business = data.data
      }
    },
    barClick(type) {
      this.showRelativeType = type
      if (type == 'business') {
        this.showBusinessPopover = true
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
        data.size = fileSize(file.size)
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
      this.deleteImgOrFile('file', item, index)
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
     * 删除相关
     */
    deleteRelate(data, index) {
      this.business.splice(index, 1)
    },

    inputFocus() {
      this.isUnfold = true
      this.$nextTick(() => {
        if (this.$refs.textarea) {
          this.$refs.textarea.focus()
        }
        this.$emit('focus')
      })
    },

    /**
     * 发布
     */
    sendClick() {
      const params = {
        id: this.id,
        content: this.content,
        files: this.files,
        images: this.imgFiles,
        business: this.business,
        contactsId: this.selectContactsId,
        batchId: this.batchId,
        followType: this.followType,
        nextTime: this.nextTime
        // timeType: this.nextTime.type === 'default' ? this.nextTime.value : this.nextTime.type === 'custom' ? 10 : ''
        //  sendUserIds: this.sendUserList.map(item => item.userId).join(','), //发送人员
        // sendDeptIds: this.sendDeptList.map(item => item.id || item.deptId).join(','), //发送部门
      }
      // const timeFormate = {
      //   1: moment().add(30, 'm').format('YYYY-MM-DD HH:mm:ss'),
      //   2: moment().add(1, 'h').format('YYYY-MM-DD HH:mm:ss'),
      //   3: moment().add(2, 'h').format('YYYY-MM-DD HH:mm:ss'),
      //   4: moment().add(24, 'h').format('YYYY-MM-DD HH:mm:ss'),
      //   5: moment().add(48, 'h').format('YYYY-MM-DD HH:mm:ss'),
      //   6: moment().add(72, 'h').format('YYYY-MM-DD HH:mm:ss'),
      //   7: moment().add(120, 'h').format('YYYY-MM-DD HH:mm:ss'),
      //   8: moment().add(168, 'h').format('YYYY-MM-DD HH:mm:ss'),
      //   9: moment().add(336, 'h').format('YYYY-MM-DD HH:mm:ss')
      // }
      // if (this.nextTime.type === 'custom') {
      //   params.nextTime = this.nextTime.value
      // } else if (this.nextTime.type === 'default') {
      //   params.nextTime = timeFormate[this.nextTime.value]
      // }
      this.$emit('send', params)
    },

    /**
     * 关闭
     */
    close() {
      this.isUnfold = false
      this.$emit('close')
    }
  }
}
</script>

<style lang="scss" scoped>
.mix-content {
  position: relative;
  padding: 8px #{$--interval-base * 3} #{$--interval-base * 3};
  border: 2px solid $--border-color-base;
  border-radius: $--border-radius-base;

  .interval-line {
    position: relative;

    &::after {
      position: absolute;
      top: 4px;
      right: -8px;
      bottom: 4px;
      width: 1px;
      content: " ";
      background-color: $--color-n30;
      border-radius: 1px;
    }

    &.is-date-picker {
      &::after {
        right: -25px;
      }
    }
  }

  .interval-line-wrap {
    display: inline-block;
    height: 32px;
    line-height: 32px;
  }

  &-select {
    .el-select {
      width: 100px;
      margin-right: #{$--interval-base * 2};

      &.is-contacts {
        width: 180px;
      }
    }

    .el-date-editor {
      width: 200px;
    }
  }

  .i-cont {
    padding: $--interval-base 0;

    .wk-write {
      color: $--input-placeholder-color;
    }
  }

  .el-textarea {
    padding: #{$--interval-base * 2} 0;
  }
}

.mix-content.unfold {
  padding: 0;
  color: $--input-placeholder-color;
  cursor: text;

  .i-cont {
    padding: 0 #{$--interval-base * 3};
    line-height: 40px;
  }
}

.i-cont /deep/ .el-textarea__inner {
  padding: 0;
  border: none;
}

.i-cont.unfold {
  /deep/ .el-textarea {
    width: calc(100% - 50px);
  }

  /deep/ .el-textarea__inner {
    overflow: hidden;
  }
}

/** 底部bar  */
.handle-button {
  padding: 4px;
}

.file-input {
  display: none;
}

.send-bar {
  margin-top: #{$--interval-base * 2};
}

.user-img {
  flex-shrink: 0;
  margin-top: 5px;
  margin-right: $--interval-base;
}

// 小操作bar
.min-bar {
  display: none;
}

@media screen and (max-width: 1630px) {
  .mix-content {
    padding-bottom: 8px;

    .is-date-picker::after {
      display: none;
    }
  }

  .mix-content-select {
    .common-words,
    .interval-line-wrap {
      display: none;
    }
  }

  .min-bar {
    display: block;
  }
}
</style>
