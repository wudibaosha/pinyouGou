<template>
  <div v-loading="loading" class="b-cont">
    <wk-head-section
      label="活动信息"
      :props="{
        headBgColor: '#FAFBFC',
        arrows: 'left',
        border: false,
        bodyPadding: '0'
      }"
      class="b-cells">
      <flexbox class="info-card-container">
        <flexbox
          align="center"
          class="info-card">
          <img src="@/assets/img/browse_count.png">
          <div>
            <div class="title is-green">{{ submitCount }}</div>
            <div class="detail">提交总数</div>
          </div>
        </flexbox>
        <flexbox
          align="center"
          class="info-card">
          <img src="@/assets/img/submit_count.png">
          <div>
            <div class="title is-orange">{{ browseCount }}</div>
            <div class="detail">浏览量</div>
          </div>
        </flexbox>
      </flexbox>
    </wk-head-section>
    <wk-head-section
      label="发布信息"
      :props="{
        headBgColor: '#FAFBFC',
        arrows: 'left',
        border: false,
        bodyPadding: '0'
      }"
      class="b-cells">
      <i slot="otherLabel" class="wk wk-icon-fill-help wk-help-tips" data-type="16" data-id="149" />
      <div style="padding-left: 12px;">
        <flexbox class="publish-container" align="stretch">
          <div class="publish-info">
            <div class="publish-info-title">分享二维码后可直接填写信息并提交</div>
            <flexbox align="flex-end">
              <div
                id="canvas"
                class="publish-info-content" />
              <div class="publish-info-button" style="margin-left: 16px;">
                <el-button @click="handleClick('download')">下载二维码</el-button>
              </div>
            </flexbox>
          </div>
          <div class="web-info publish-info">
            <div class="publish-info-title">访问地址</div>
            <div class="publish-info-content">
              <a
                href="javascript:void(0);"
                @click="previewVisible = true">{{ path }}</a>
            </div>
            <div class="publish-info-button">
              <el-button
                :data-clipboard-text="path"
                class="copyBtn"
                @click="handleClick('copy')">复制地址</el-button>
            </div>
          </div>
        </flexbox>
      </div>
    </wk-head-section>

    <wk-phone-preview
      :visible.sync="previewVisible"
      :src="path"
    />
  </div>
</template>

<script>
import WkHeadSection from '@/components/NewCom/WkHeadSection'
import WkPhonePreview from '@/components/WkPhonePreview'

import Clipboard from 'clipboard'
import QRCode from 'qrcodejs2'

export default {
  /** 活动管理 的 概览*/
  name: 'Overview',
  components: {
    WkHeadSection,
    WkPhonePreview
  },
  mixins: [],
  props: {
    /** 详情 */
    detail: Object,
    /** 没有值就是全部类型 有值就是当个类型 */
    crmType: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      loading: false,
      // 提交数 浏览量
      name: '',
      submitCount: 0,
      browseCount: 0,
      // 路径
      path: '',
      // 二维码
      qrcode: null,
      // 复制
      clipboard: null,
      previewVisible: false
    }
  },
  computed: {},
  watch: {
    detail: function() {
      this.getDetail()
    }
  },
  mounted() {
    if (this.detail) {
      this.getDetail()
    }

    this.clipboard = new Clipboard('.copyBtn')
    this.clipboard.on('success', e => {
      this.$message.success('复制成功')
      e.clearSelection()
    })

    this.clipboard.on('error', e => {
      this.$message.success('复制失败')
    })
  },
  beforeDestroy() {
    this.clipboard.destroy()
  },
  activated: function() {},
  deactivated: function() {},
  methods: {
    // 获取基础信息
    getDetail() {
      this.name = this.detail.marketingName
      this.submitCount = this.detail.submitNum
      this.browseCount = this.detail.browse
      this.path = `${WKConfig.getLocationOrigin()}/72marketing/#/?marketingId=${this.detail.enMarketingId}&currentUserId=${this.detail.currentUserId}`
      this.loading = false

      if (this.qrcode) {
        this.qrcode.clear()
        this.qrcode.makeCode(this.path)
      } else {
        this.qrcode = new QRCode(document.getElementById('canvas'), {
          text: this.path,
          width: 500,
          height: 500,
          colorDark: '#000000',
          colorLight: '#ffffff',
          correctLevel: QRCode.CorrectLevel.M
        })
      }
    },

    handleClick(type) {
      if (type == 'download') {
        // 获取base64的图片节点
        var img = document.getElementById('canvas').getElementsByTagName('img')[0]
        // 构建画布
        var canvas = document.createElement('canvas')
        canvas.width = 500
        canvas.height = 500
        canvas.getContext('2d').drawImage(img, 0, 0)
        // 构造url
        const url = canvas.toDataURL('image/png')
        // 构造a标签并模拟点击
        var downloadLink = document.createElement('a')
        downloadLink.setAttribute('href', url)
        downloadLink.setAttribute('download', '二维码.png')
        document.body.appendChild(downloadLink)
        downloadLink.click() // 点击下载
        document.body.removeChild(downloadLink)
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.b-cont {
  position: relative;
  height: 100%;
  overflow-y: auto;
}

// 活动信息
.info-card-container {
  padding: 0 12px;
  margin: 16px 0;
}

.info-card + .info-card {
  margin-left: #{$--interval-base * 2};
}

.info-card {
  width: 250px;
  padding: 15px 20px;
  border: 1px solid $--border-color-base;
  border-radius: 3px;

  img {
    width: 40px;
    margin-right: 20px;
  }

  .title {
    margin-bottom: 5px;
    font-size: 24px;
  }

  .is-green {
    color: #63ba3b;
  }

  .is-orange {
    color: #ffab00;
  }

  .detail {
    color: $--color-text-secondary;
  }
}

// 发布信息
.publish-container {
  // padding: #{$--interval-base * 2} #{$--interval-base * 3};
  position: relative;
  margin-top: 10px;
  overflow: hidden;
  background-color: $--background-color-base;
  border: 1px solid $--border-color-base;
  border-radius: $--border-radius-base;

  .publish-info {
    display: inline-block;
    padding: #{$--interval-base * 2} #{$--interval-base * 3};

    .publish-info-title {
      margin-bottom: 10px;
    }

    .publish-info-content {
      max-width: 300px;
      color: $--color-primary;
      word-wrap: break-word;
      white-space: pre-wrap;
    }
  }

  .web-info {
    flex: 1;
    background: $--color-white;

    .el-button {
      margin-top: 12px;
    }
  }
}

#canvas {
  width: 109px;
  height: 109px;

  /deep/ img {
    width: 109px;
  }
}
</style>
