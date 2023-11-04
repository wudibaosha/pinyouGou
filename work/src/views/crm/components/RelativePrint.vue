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
        show-overflow-tooltip />
      <el-table-column prop="down" label="操作" width="80px">
        <template slot-scope="scope">
          <el-button
            type="primary-text"
            style="padding: 0;"
            @click="print(scope.row)">打印预览</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script type="text/javascript">
import { printQueryPrintRecordAPI } from '@/api/admin/crm'
import crmTypeModel from '@/views/crm/model/crmTypeModel'

export default {
  name: 'RelativePrint', // 相关打印
  components: {
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
        { prop: 'createTime', label: '打印时间', width: '115px' },
        { prop: 'templateName', label: '打印模板', width: '115px' }
      ],
      tableHeight: '450px'
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
      if (val === 'RelativePrint') {
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
      printQueryPrintRecordAPI({
        crmType: crmTypeModel.convertKeyToType(this.crmType),
        typeId: this.id
      })
        .then(res => {
          this.nopermission = false
          this.loading = false
          this.list = res.data
        })
        .catch(res => {
          if (res.code == 102) {
            this.nopermission = true
          }
          this.loading = false
        })
    },

    print(data) {
      const routeData = this.$router.resolve(`/print/?&type=history&recordId=${data.recordId}`)
      window.open(routeData.href, '_blank')
    }
  }
}
</script>
<style lang="scss" scoped>
@import "../styles/relativecrm.scss";
</style>
