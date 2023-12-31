<template>
  <div
    v-loading="loading"
    class="preview"
    element-loading-text="资源载入中...">
    <el-empty
      v-if="!canPreview"
      style="padding-top: 75px;"
      :image-size="300"
      :image="require('@/assets/img/empty/unknown.png')"
      description="该文件类型系统暂时不支持预览">
      <el-button type="primary" @click="download">下载文件</el-button>
    </el-empty>
    <iframe
      v-if="canPreview && path && iframePath"
      :src="iframePath"
      style="width: 100%; height: 100%;"
      frameborder="0" />
  </div>
</template>

<script>
import { adminFilePreviewAPI } from '@/api/admin/file'

import axios from 'axios'
import { canPreviewFile, downloadFile, isRAR } from '@/utils'

export default {
  // 预览
  name: 'Perview',

  components: {},

  props: {
    path: String, // 和 query 中的path 作用一致
    name: String // 通过名称后缀判断是否可预览
  },

  data() {
    return {
      loading: false,
      iframePath: ''
    }
  },

  computed: {
    showType() {
      return this.path ? 'component' : 'page' // 组件方式  或者 页面路由方式
    },

    // 判断是否能预览
    canPreview() {
      const name = this.name || this.$route.query.name
      return canPreviewFile(name)
    }
  },

  watch: {},

  created() {
    const path = this.path || this.$route.query.path
    if (path && this.canPreview) {
      this.requestFileUrl(path)
    }
  },

  mounted() {},

  beforeDestroy() {},

  methods: {
    /**
     * @description: 请求预览资源
     * @param {*} path
     * @return {*}
     */
    requestFileUrl(path) {
      this.loading = true

      // 一部分脏数据，如果包含附件名称删除掉
      const specialName = '?fullfilename='
      if (path.indexOf(specialName) !== -1) {
        path = path.split(specialName)[0]
      }

      let fileUrl = `${path}?c=${axios.defaults.headers['Admin-Token']}`
      fileUrl = fileUrl.replace(/\/\//g, '/') // 去拼接过程中的双斜线
      let convertType = 0 // 默认 0
      const filename = this.name || this.$route.query.name

      const temps = filename ? filename.split('.') : []
      var ext = ''
      if (temps.length > 0) {
        ext = temps[temps.length - 1]
      } else {
        ext = ''
      }

      if (['xlsx', 'xls', 'xlt', 'xltx'].includes(ext)) {
        convertType = 0
      } else if (['doc', 'docx', 'dot', 'dotx'].includes(ext)) {
        convertType = 0
      } else if (ext === 'pdf') {
        convertType = 20
      } else if (['ppt', 'pptx', 'pot', 'potx'].includes(ext)) {
        convertType = 0
      } else if (['txt', 'text', 'rtf'].includes(ext)) {
        convertType = 0
      } else if (['html'].includes(ext)) {
        convertType = 0
      } else if (['jpg', 'png', 'jpeg', 'bmp', 'ico', 'gif'].includes(ext)) {
        convertType = 42
      } else if (isRAR(ext)) {
        convertType = 19
      }
      adminFilePreviewAPI({
        convertType: convertType,
        fileUrl,
        showFooter: 0 // 去掉底部信息
      }).then(res => {
        const resData = res.data || {}
        this.checkUrl(resData.viewUrl)
        this.loading = false
      }).catch(error => {
        if (error.errorcode === 0) {
          const resData = error.data || {}
          this.checkUrl(resData.viewUrl)
        }
        this.loading = false
      })
    },

    /**
     * @description: 查看资源
     * @param {*}
     * @return {*}
     */
    checkUrl(viewUrl) {
      if (this.showType === 'component') {
        this.iframePath = viewUrl
      } else {
        location.href = viewUrl
      }
    },

    /**
     * @description: 下载
     * @param {*}
     * @return {*}
     */
    download() {
      downloadFile({
        path: this.path || this.$route.query.path,
        name: this.name || this.$route.query.name
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.preview {
  position: relative;
  height: 100%;
}
</style>
