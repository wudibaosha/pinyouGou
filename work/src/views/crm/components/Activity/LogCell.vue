<template>
  <div class="fl-c">
    <flexbox class="fl-h" align="stretch">
      <xr-avatar
        :id="item.createUserId"
        :name="item.createUser.realname"
        :size="32"
        :src="item.createUser.img"
        :disabled="false"
        class="fl-h-img" />
      <div class="fl-h-b">
        <div class="fl-h-name">
          <span class="realname">{{ item.createUser.realname }}</span>
          <template v-if="showControl">
            <el-tag>{{ getActivityTypeName(item.activityType) + getRecordLogTypeName(item.type) }}</el-tag>
            <el-tag
              v-if="item.category"
              type="info">{{ item.category }}</el-tag>
          </template>
          <span v-else class="dynamic-name">{{ getDynamicName() }}</span>
        </div>
        <div class="fl-h-time">{{ item.createTime }}</div>
      </div>

      <!-- 编辑下不能是外勤签到 -->
      <el-dropdown
        v-if="canDelete && showControl && (hasDeleteAuth || (hasEditAuth && item.type !== 4))"
        v-model="dropdownShow"
        class="more-drop"
        style="top: 12px;"
        trigger="click"
        @command="handleCommand">
        <el-button
          :type="dropdownShow ? 'selected' : 'subtle'"
          style="padding: 4px;"
          icon="el-icon-more" />
        <el-dropdown-menu slot="dropdown">
          <el-dropdown-item
            v-if="hasEditAuth && item.type !== 4 && item.type !== 5"
            command="edit">编辑</el-dropdown-item>
          <el-dropdown-item
            v-if="hasDeleteAuth"
            command="delete">删除</el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>
    </flexbox>

    <div class="fl-b">
      <slot name="content" />
      <div
        v-if="!$slots.content"
        class="fl-b-content">{{ logContent }}</div>

      <flexbox
        v-if="item.img && item.img.length > 0"
        class="fl-b-images"
        wrap="wrap">
        <div
          v-for="(file, fileIndex) in item.img"
          :key="file.url"
          v-src:background-image="file.url"
          class="fl-b-img-item"
          @click="previewImg(item.img, fileIndex)" />
      </flexbox>

      <div v-if="item.file && item.file.length > 0">
        <flexbox
          v-for="(file, fileIndex) in item.file"
          :key="fileIndex"
          class="cell">
          <div class="cell-hd first-show">
            <i class="wk wk-file" />
          </div>
          <div class="cell-hd cell-label first-show" style="flex-shrink: 0;margin-right: 0;">
            附件：
          </div>
          <div class="cell-bd cell-label text-one-line">
            {{ file.name }}
          </div>
          <div class="cell-ft">
            <span class="des">（{{ file.size | getFileSize }}）</span>
            <a @click="previewImg(item.file, fileIndex)">预览</a>
            <a @click="downloadFile(file)">下载</a>
          </div>
        </flexbox>
      </div>

      <div v-if="item.contactsList && item.contactsList.length > 0">
        <flexbox
          align="stretch"
          class="cell">
          <div class="cell-hd ">
            <i class="wk wk-contacts" />
          </div>
          <div class="cell-bd cell-label">
            相关联系人：
          </div>
          <div class="cell-ft">
            <div
              v-for="(contactsItem, contactsIndex) in item.contactsList"
              :key="contactsIndex"
              class="cell-ft__item text-one-line">
              <a @click="checkRelationDetail('contacts', contactsItem.id)">{{ contactsItem.name }}</a>
            </div>
          </div>
        </flexbox>
      </div>

      <div v-if="item.businessList && item.businessList.length > 0">
        <flexbox
          align="stretch"
          class="cell">
          <div class="cell-hd">
            <i class="wk wk-business" />
          </div>
          <div class="cell-bd cell-label">
            相关商机：
          </div>
          <div class="cell-ft">
            <div
              v-for="(businessItem, businessIndex) in item.businessList"
              :key="businessIndex"
              class="cell-ft__item text-one-line">
              <a @click="checkRelationDetail('business', businessItem.id)">{{ businessItem.name }}</a>
            </div>
          </div>
        </flexbox>
      </div>

      <div v-if="item.nextTime" class="cell-top">
        <flexbox
          align="stretch"
          class="cell">
          <div class="cell-hd">
            <i class="wk wk-time" />
          </div>
          <div class="cell-bd cell-label text-one-line">
            下次联系时间：{{ item.nextTime }}
          </div>
        </flexbox>
      </div>

      <div v-if="item.type == 4" class="cell-top">
        <flexbox
          align="stretch"
          class="cell">
          <div class="cell-hd is-address">
            <i class="wk wk-icon-location" />
          </div>
          <div
            class="cell-bd text-one-line can-visit--underline"
            @click="checkMapView(item)"
          >{{ addressContent }}</div>
        </flexbox>
      </div>
      <div v-if="(item.activityType === 13 || item.type === 5) && item.callRecord">
        <div class="cell">
          通话状态： {{ typeArr[item.callRecord.type] }}-{{ stateArr[item.callRecord.state] }}
        </div>
        <div class="cell">
          摘机时长：{{ item.callRecord.dialTime }}
        </div>
        <div class="cell">
          呼出对象：{{ item.callRecord.number }}
        </div>
        <div class="cell">
          <audios
            :props="audiosProps"
            :duration="item.talkTime"
            class="audios" />
          <el-button type="text" @click="download(item.callRecord.callRecordId, item.callRecord.fileName)">下载</el-button>
          <!-- <el-popover
              placement="left"
              width="500"
              trigger="click"
              @show="popoverShow(item.callRecord)">
              <div style="max-height: 50vh; overflow-y: auto; line-height: 1.5;">{{ item.callRecord.recordContent }}
                <div v-loading="toStrLoading" element-loading-spinner="el-icon-loading" style="height: 40px;"/>
              </div>
              <el-button slot="reference" type="text" >转文字</el-button>
            </el-popover> -->
        </div>
      </div>
    </div>

    <map-view
      v-if="showMapView"
      :title="mapViewInfo.title"
      :lat="mapViewInfo.lat"
      :lng="mapViewInfo.lng"
      @hidden="showMapView=false" />

    <slot />
  </div>
</template>

<script>
import {
  crmActivityDeleteAPI,
  crmActivityOutworkSignDeleteAPI
} from '@/api/crm/common'
import {
  crmCallDownloadAPI
  // crmCallAudioToStrAPI
} from '@/api/bi/callCenter'

import MapView from '@/components/MapView' // 地图详情
import Audios from '@/components/Audios'

import { downloadFile, fileSize, downloadFileWithBuffer } from '@/utils'
import XrSystemIconMixin from '@/mixins/XrSystemIcon'
import ActivityTypeMixin from './ActivityType'
import { mapGetters } from 'vuex'

export default {
  /** 客户管理 的 客户详情 的 跟进记录cell*/
  name: 'LogCell',
  components: {
    MapView,
    Audios
  },
  filters: {
    getFileSize(size) {
      return fileSize(size)
    }
  },
  mixins: [XrSystemIconMixin, ActivityTypeMixin],
  props: {
    item: {
      type: Object,
      default: () => {
        return {}
      }
    },
    // 块
    section: [String, Number],
    // 行
    index: [String, Number],
    canDelete: {
      type: Boolean,
      default: true
    },
    showControl: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      // 控制展示地图详情
      showMapView: false,
      // 地图详情信息
      mapViewInfo: {},
      dropdownShow: false,
      toStrLoading: false,
      stateArr: ['未振铃', '未接通', '接通', '呼入未接通'],
      typeArr: ['呼出', '呼入']
    }
  },
  computed: {
    ...mapGetters(['crm']),
    hasEditAuth() {
      return this.crm && this.crm.followRecord && this.crm.followRecord.update
    },

    hasDeleteAuth() {
      return this.crm && this.crm.followRecord && this.crm.followRecord.delete
    },

    activityIcon() {
      return this.getXrIcon(this.getActivityType(this.item.activityType))
    },

    activityIconColor() {
      return this.getXrIconColor(this.getActivityType(this.item.activityType))
    },

    // 跟进内容
    logContent() {
      if (!this.item) return ''
      // 外勤签到
      if (this.item.type == 4) {
        return (this.item.content || {}).content
      }
      return this.item.content
    },

    // 外勤签到的地址
    addressContent() {
      if (!this.item && this.item.type != 4) return ''
      const address = (this.item.content || {}).address || ''
      return address.replace(/\,|，/g, '')
    },

    // 录音加载props
    audiosProps() {
      return {
        fileRequest: crmCallDownloadAPI, // 添加请求和参数
        fileParams: { id: this.item.callRecordId }
      }
    }
  },
  mounted() {},
  methods: {
    previewImg(list, index) {
      this.$wkPreviewFile.preview({
        index: index,
        data: list
      })
    },
    /**
     * 转文字框展示
     */
    // popoverShow(data) {
    //   this.$set(data, 'recordContent', '')
    //   this.getRecordContent({
    //     id: data.callRecordId
    //   }, data)
    // },
    // /**
    //  * 转文字
    //  */
    // getRecordContent(params, data, paramsArray, paramsIndex) {
    //   const postParams = { ...params }
    //   if (paramsArray) {
    //     postParams.fileStr = paramsArray[paramsIndex]
    //   }
    //   this.toStrLoading = true
    //   crmCallAudioToStrAPI(postParams).then(res => {
    //     const resData = res.data || {}
    //     const { dataStr, fileStr } = resData
    //     if (dataStr !== null) {
    //       data.recordContent = data.recordContent + dataStr.join('')
    //       this.toStrLoading = false
    //       if (paramsArray && paramsArray.length > paramsIndex + 1) {
    //         this.getRecordContent(params, data, paramsArray, paramsIndex + 1)
    //       }
    //     } else {
    //       const fileStrs = fileStr || []
    //       this.toStrLoading = false
    //       if (fileStrs.length > 0) {
    //         this.getRecordContent(params, data, fileStrs, 0)
    //       }
    //     }
    //   }).catch(() => {
    //     this.toStrLoading = false
    //   })
    // },
    /**
     * 音频下载
     */
    download(id, fileName) {
      crmCallDownloadAPI({ id: id }).then(res => {
        downloadFileWithBuffer(res.data, fileName)
      }).catch(() => {})
    },
    downloadFile(file) {
      downloadFile({ path: file.url, name: file.name })
    },
    /**
     * 删除跟进记录
     */
    handleCommand(command) {
      if (command == 'delete') {
        this.$confirm('确定删除?', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
          .then(() => {
            const request = this.item.type == 4 ? crmActivityOutworkSignDeleteAPI : crmActivityDeleteAPI
            request({
              id: this.item.id
            })
              .then(res => {
                this.$emit('delete', this.item, this.index, this.section)
                // 刷新待办
                this.$store.dispatch('GetMessageNum')

                this.$message.success('操作成功')
              })
              .catch(() => {})
          })
          .catch(() => {})
      } else if (command == 'edit') {
        this.$emit('edit', this.item, this.index, this.section)
      }
    },

    /**
     * 查看相关客户管理详情
     */
    checkRelationDetail(type, id) {
      this.$emit('crm-detail', type, id)
    },

    /**
     * 查看地图详情
     */
    checkMapView(item) {
      if (item.content) {
        this.mapViewInfo = {
          title: this.addressContent,
          lat: item.content.lat,
          lng: item.content.lng
        }
        this.showMapView = true
      }
    },

    /**
     * 获取动态操作
     */
    getDynamicName(data) {
      const { type, activityType } = this.item
      if (type == 2) {
        return `创建了${this.getActivityTypeName(activityType)}`
      } else if (type == 3) {
        return `${this.getActivityTypeName(activityType)}阶段更改`
      }
      return ''
    }
  }
}
</script>

<style lang="scss" scoped>
/** 跟进记录相关的 日志 审批任务 日程 项目 公共css */
.fl-c {
  position: relative;
  padding: 12px 0 $--interval-base #{$--interval-base * 2};
  background-color: white;
}

/** 头部布局 名字 头像 */
.fl-h {
  .fl-h-img {
    margin-right: 8px;
  }

  .fl-h-b {
    .fl-h-name {
      font-weight: $--font-weight-primary;

      .realname {
        color: $--color-black;
      }

      .realname + .el-tag {
        margin-left: 16px;
      }

      .el-tag + .el-tag {
        margin-left: $--interval-base;
      }
    }

    .fl-h-time {
      margin-top: 2px;
      color: $--color-text-secondary;
    }
  }
}

/** 头部 右侧 布局 */
.fl-h-handle {
  width: auto;

  .fl-h-handle-name {
    margin-right: 6px;
  }
}

/** 内容区域 */
.fl-b {
  margin-top: 8px;
  margin-left: 40px;

  .fl-b-content {
    line-height: 18px;
    letter-spacing: 0.5px;
    word-wrap: break-word;
    white-space: pre-wrap;
  }

  .fl-b-images {
    width: 310px;
    margin-top: $--interval-base;

    .fl-b-img-item {
      position: relative;
      display: inline-block;
      width: 98px;
      height: 98px;
      margin: 0 4px 4px 0;
      cursor: pointer;
      background-repeat: no-repeat;
      background-position: center;
      background-size: contain;
    }
  }
}

.dynamic-name {
  margin-left: 8px;
  color: $--color-text-regular;
}

/** 附件 */
.fl-b-files {
  margin-top: 10px;
}

/** 关联附件 联系人 客户 行布局 */
.cell-top {
}

.cell {
  padding-top: $--interval-base;

  &-hd {
    margin-right: $--interval-base;

    i {
      color: $--color-n500;
    }
  }

  &-hd.is-address {
    margin-top: -3px;

    i {
      font-size: 17px !important;
    }
  }

  &-hd.first-show {
    opacity: 0;

    .audios {
      width: 255px;
    }
  }

  &-label {
    color: $--color-n500;
  }

  &-ft {
    flex-shrink: 0;

    .des {
      color: $--color-text-secondary;
    }

    &__item {
      margin-bottom: 3px;

      a {
        color: $--color-primary;
      }

      a:hover {
        text-decoration: underline;
      }
    }

    &__item + &__item {
      margin-bottom: 5px;
    }

    a {
      color: $--color-primary;
    }

    a:hover {
      text-decoration: underline;
    }
  }
}

.cell:first-child {
  .first-show {
    opacity: 1;
  }
}

// .follow {
//   margin-left: $--interval-base;
//   .follow-info {
//     padding: 3px 8px;
//     background-color: $--color-n40;
//     color: $--color-n500;
//     border-radius: $--border-radius-base;
//     margin-right: 10px;
//     display: inline-block;
//   }
// }

// 更多操作
// .log-mark,
.more-drop {
  position: absolute;
  top: 15px;
  right: 0;
}

.el-icon-more {
  margin-left: 8px;
}

// 类型标示
// .log-mark {
//   &__label {
//     font-size: $--font-size-small;
//     color: $--color-text-secondary;
//   }
// }
</style>
