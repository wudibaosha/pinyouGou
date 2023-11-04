<template>
  <div
    v-loading="loading"
    v-empty="nopermission"
    class="rc-cont"
    xs-empty-icon="nopermission"
    xs-empty-text="暂无权限">
    <el-table
      v-show="fieldList.length > 0"
      :data="list"
      :height="tableHeight"
      stripe>
      <el-table-column
        v-for="(item, index) in fieldList"
        :key="index"
        :prop="item.prop"
        :label="item.label"
        :width="item.width"
        show-overflow-tooltip />
      <el-table-column prop="type" label="通话状态" width="200px">
        <template slot-scope="scope">
          {{ typeArr[scope.row.type] }}-{{ stateArr[scope.row.state] }}
        </template>
      </el-table-column>
      <el-table-column prop="audio" label="录音播放" width="300px">
        <template slot-scope="{ row }">
          <audios
            :duration="row.talkTime"
            :props="getAudiosProps(row)" />
        </template>
      </el-table-column>
      <el-table-column prop="down" label="操作" width="80px">
        <template slot-scope="scope">
          <el-button type="primary-text" style="padding: 0;" @click="download(scope.row.callRecordId, scope.row.fileName)">下载</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script type="text/javascript">
import { crmCallDownloadAPI } from '@/api/bi/callCenter'
import { crmCustomerCallRecordAPI } from '@/api/crm/customer'

import Audios from '@/components/Audios'

import { downloadFileWithBuffer } from '@/utils'

export default {
  name: 'RelativeCallRecord', // 相关呼叫记录
  components: {
    Audios
  },
  mixins: [],
  props: {
    id: [String, Number],
    crmType: {
      type: String,
      default: ''
    },
    detail: {
      type: Object,
      default: () => {
        return {}
      }
    }
  },
  data() {
    return {
      loading: false,
      nopermission: false,
      list: [],
      fieldList: [
        { prop: 'ownerUserName', label: '姓名', width: '115px' },
        { prop: 'createTime', label: '通话时间', width: '115px' },
        { prop: 'number', label: '呼/被叫号码', width: '115px' },
        { prop: 'talkTime', label: '通话时长', width: '115px' },
        { prop: 'dialTime', label: '摘机时长', width: '115px' }
      ],
      tableHeight: '450px',
      stateArr: ['未振铃', '未接通', '接通', '呼入未接通'],
      typeArr: ['呼出', '呼入']
    }
  },
  inject: ['rootTabs'],
  computed: {},
  watch: {
    id(val) {
      this.list = []
      this.getDetail()
    },

    'rootTabs.currentName'(val) {
      if (val === 'RelativeCallRecord') {
        this.getDetail(false)
      }
    }
  },
  mounted() {
    this.getDetail()
  },
  methods: {
    /**
     * 获取数据
     */
    getDetail(loading = true) {
      this.loading = loading
      crmCustomerCallRecordAPI({
        pageType: 0,
        customerId: this.id
      })
        .then(res => {
          this.nopermission = false
          this.loading = false
          this.list = res.data.list
        })
        .catch(res => {
          if (res.code == 102) {
            this.nopermission = true
          }
          this.loading = false
        })
    },

    /**
     * @description: 获取录音文件的配置
     * @param {*}
     * @return {*}
     */
    getAudiosProps(item) {
      return {
        fileRequest: crmCallDownloadAPI, // 添加请求和参数
        fileParams: { id: item.callRecordId }
      }
    },

    /**
     * 音频下载
     */
    download(id, fileName) {
      crmCallDownloadAPI({ id: id }).then(res => {
        downloadFileWithBuffer(res.data, fileName)
      }).catch(() => {})
    }
  }
}
</script>
<style lang="scss" scoped>
@import "../styles/relativecrm.scss";
</style>
