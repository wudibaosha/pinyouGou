<template>
  <div v-loading="loading">
    <div class="content-header">
      <span>阶段流程设置<i
        class="wk wk-icon-fill-help wk-help-tips"
        data-type="24"
        data-id="217" /></span>
      <el-button
        type="primary"
        @click="addStage">添加阶段流程</el-button>
    </div>
    <div class="stage-content">
      <div class="stage-filter">
        <el-select
          v-model="status"
          class="el-select"
          clearable
          placeholder="选择状态"
          @change="getStageList">
          <el-option
            v-for="item in [{label:'启用',value:1},{label:'停用',value:2}]"
            :key="item.value"
            :label="item.label"
            :value="item.value" />
        </el-select>
        <el-select
          v-model="label"
          class="el-select"
          clearable
          placeholder="选择关联对象"
          @change="getStageList">
          <el-option
            v-for="item in crmModelList"
            :key="item.value"
            :label="item.label"
            :value="item.value" />
        </el-select>
      </div>
      <div class="customer-table">
        <el-table
          :data="stageData"
          :height="tableHeight"
          :class="WKConfig.tableStyle.class"
          :stripe="WKConfig.tableStyle.stripe"
          style="width: 100%;">
          <el-table-column
            v-for="(item, index) in stageList"
            :key="index"
            :prop="item.field"
            :label="item.label"
            :formatter="fieldFormatter"
            show-overflow-tooltip />
          <el-table-column
            fixed="right"
            label="操作"
            width="220">
            <template slot-scope="scope">
              <el-button
                type="primary-text"
                style="padding: 0;"
                @click="stageEdit(scope.row,false)">编辑</el-button>
              <el-button
                v-if="scope.row.status != 1"
                type="primary-text"
                style="padding: 0;"
                @click="stageDelect(scope)">删除</el-button>
              <el-button
                type="primary-text"
                style="padding: 0;"
                @click="stageStatus(scope)">{{ scope.row['status'] === 2 ? '启用' : '停用' }}</el-button>
              <el-button
                type="primary-text"
                style="padding: 0;"
                @click="stageEdit(scope.row,true)">复制并新建</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="p-contianer">
          <el-pagination
            :current-page="currentPage"
            :page-sizes="pageSizes"
            :page-size.sync="pageSize"
            :total="total"
            class="p-bar"
            background
            layout="prev, pager, next, sizes, total, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange" />
        </div>
      </div>
    </div>
    <stage-dialog
      :info-data="stageObj"
      :visible.sync="stageDialogVisible"
      :edit-type="stageEditType"
      :crm-model-list="crmModelList"
      @update-status="updateStageStatus"
      @submit="stageSubmit" />
  </div>
</template>

<script>
import {
  crmFlowQueryListAPI,
  crmFlowFlowInfoAPI,
  crmFlowUpdateStatusAPI
} from '@/api/admin/crm'

import StageDialog from '@/views/admin/components/StageDialog'

import crmTypeModel from '@/views/crm/model/crmTypeModel'

export default {
  name: 'StageFlowSet',
  components: {
    StageDialog
  },
  data() {
    return {
      loading: false, // 展示加载中效果
      tableHeight: document.documentElement.clientHeight - 344, // 表的高度

      // 组设置
      /** 组每行的信息 */
      stageObj: { type: 'save', flowName: '', label: '', userIdList: [], deptIdList: [], settingList: '' },
      stageData: [],
      stageList: [
        { label: '阶段流程名称', field: 'flowName' },
        { label: '关联对象', field: 'label' },
        { label: '适用范围', field: 'stageUserDep' },
        { label: '最后修改时间', field: 'updateTime' },
        { label: '最后修改人', field: 'updateUserName' },
        { label: '创建时间', field: 'createTime' },
        { label: '创建人', field: 'createUserName' },
        { label: '状态', field: 'status' }
      ],
      // 添加阶段
      stageEditType: 'create',
      stageDialogVisible: false,
      currentPage: 1,
      pageSize: 10,
      pageSizes: [10, 20, 30, 40],
      total: 0,

      /** 筛选信息 */
      status: '', // 状态
      label: '' // 模块
    }
  },
  computed: {
  /**
    * crm模块列表
    */
    crmModelList() {
      const typeToNameData = crmTypeModel.typeToNameData
      const arr = []
      Object.keys(typeToNameData).forEach(item => {
        arr.push({ label: typeToNameData[item], value: Number(item) })
      })
      return arr.filter(item => item.value !== 9) // 9 是公海
    }
  },
  created() {
    /** 控制table的高度 */
    window.onresize = () => {
      this.tableHeight = document.documentElement.clientHeight - 344
    }
    this.getStageList()
  },
  methods: {
    /**
     * 更改每页展示数量
     */
    handleSizeChange(val) {
      this.pageSize = val
      this.getStageList()
    },

    /**
     * 更改当前页数
     */
    handleCurrentChange(val) {
      this.currentPage = val
      this.getStageList()
    },

    /**
     * 阶段列表
     */
    getStageList() {
      this.loading = true
      crmFlowQueryListAPI({
        page: this.currentPage,
        pageType: 1,
        limit: this.pageSize,
        label: this.label,
        status: this.status
      })
        .then(res => {
          this.loading = false
          this.stageData = res.data.list
          this.total = res.data.totalRow
        })
        .catch(() => {
          this.loading = false
        })
    },

    /**
     * 列表格式化
     */
    fieldFormatter(row, column, value) {
      // 如果需要格式化
      if (column.property == 'label') {
        return crmTypeModel.typeToNameData[value] || ''
      } else if (column.property == 'stageUserDep') {
        // 格式员工、部门
        const deptList = row.deptNameList || []
        const userList = row.userNameList || []
        return deptList.concat(userList).join('、') || '全公司'
      } else if (column.property === 'status') {
        if (row[column.property] == 1) {
          return '启用'
        }
        return '停用'
      }
      return row[column.property]
    },

    /**
     * 阶段编辑、复制新建
     */
    stageEdit(data, isCopy = false) {
      crmFlowFlowInfoAPI({
        flowId: data.flowId
      })
        .then(res => {
          res.data.settingList.forEach(item => { // 审批流 键名调整
            if (item.examinePreviewList) {
              item.examinePreviewList.dataList = item.examinePreviewList.examineFlowList || []
              delete item.examinePreviewList.examineFlowList
              item.examineSaveBO = item.examinePreviewList
              delete item.examinePreviewList
            } else {
              item.examineSaveBO = null
              delete item.examinePreviewList
            }
          })
          this.stageObj = {
            type: 'edit',
            flowName: res.data.flowName,
            flowId: res.data.flowId,
            userIdList: res.data.userList || [],
            deptIdList: res.data.deptList || [],
            label: res.data.label,
            successName: res.data.successName,
            failedName: res.data.failedName,
            settingList: res.data.settingList || [],
            status: data.status
          }
          this.stageEditType = isCopy ? 'create' : 'update'
          this.stageDialogVisible = true
        })
        .catch(() => {})
    },

    /**
     * 阶段删除
     */
    stageDelect(scope) {
      this.$confirm('确定删除?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
        .then(() => {
          crmFlowUpdateStatusAPI({
            flowId: scope.row.flowId,
            status: 3
          })
            .then(res => {
              this.stageData.splice(scope.$index, 1)
              this.$message.success('删除成功')
            })
            .catch(() => {})
        })
        .catch(() => {
          this.$message({
            type: 'info',
            message: '已取消删除'
          })
        })
    },
    /**
   * 状态更改
   */
    stageStatus(scope) {
      console.log(scope)
      // 启用停用
      this.$confirm(
        '您确定要' +
            (scope.row.status === 2 ? '启用' : '停用') +
            '该阶段流程?',
        '提示',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
        .then(() => {
          this.updateStageStatus(scope.row)
        })
        .catch(() => {
          this.$message({
            type: 'info',
            message: '已取消删除'
          })
        })
    },

    updateStageStatus(data) {
      this.loading = true
      crmFlowUpdateStatusAPI({
        flowId: data.flowId,
        status: data.status === 1 ? 2 : 1
      }).then(res => {
        // data['status'] = data['status'] === 1 ? 2 : 1
        // this.$message.success('操作成功')
        this.getStageList()
        this.stageDialogVisible = false
      }).catch(() => {
        this.loading = false
      })
    },

    /**
     * 展示阶段添加弹窗
     */
    addStage() {
      this.stageObj = { type: 'save', flowName: '', label: '', stageUserDep: '', userIdList: [], deptIdList: [], settingList: [] }
      this.stageEditType = 'create'
      this.stageDialogVisible = true
    },

    /**
     * 阶段添加成功
     */
    stageSubmit() {
      this.getStageList()
      this.stageDialogVisible = false
    }
  }
}
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
@import "./index.scss";

.customer-table {
  margin-top: #{$--interval-base * 2};
}

.el-button--small {
  padding: 0;
}

/* 阶段列表 */
.stage-content {
  .stage-filter {
    margin: 20px 0;

    .el-select + .el-select {
      margin-left: 8px;
    }
  }
}

</style>
