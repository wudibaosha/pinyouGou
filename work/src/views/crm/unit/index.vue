<template>
  <div>
    <wk-page-header
      :title="config.showModuleName ? '发票抬头' : ''"
      :help="getHelpObj(crmType, 'index')"
      :dropdowns="getDefaultHeaderHandes()"
      @command="pageHeaderCommand">
      <template slot="right">
        <el-button
          v-if="saveAuth"
          type="primary"
          @click="createClick()">新建发票抬头</el-button>
      </template>
    </wk-page-header>
    <div
      v-empty="!indexAuth"
      xs-empty-icon="nopermission"
      xs-empty-text="暂无权限"
      class="crm-container">
      <wk-table-header
        :search.sync="search"
        :tabs="sceneList"
        :active-tab.sync="sceneId"
        :selection-list="tableSelectionList"
        :operations="handleOperations"
        :condition-type-fun="undefined"
        :fields="getFilterFields"

        :props="tableHeaderProps.props"
        :filter-header-props="tableHeaderProps.filterHeaderProps"
        :filter-form-props="tableHeaderProps.filterFormProps"
        :scene-set-props="tableHeaderProps.sceneSetProps"
        :scene-create-props="tableHeaderProps.sceneCreateProps"
        @tabs-change="sceneSelect"
        @operations-click="tableOperationsClick"
        @event-change="tableHeaderHandle"
        @filter-change="handleFilter"
      >
      </wk-table-header>
      <el-table
        id="crm-table"
        v-loading="loading"
        :row-height="rowHeight"
        :data="list"
        :height="tableHeight"
        :cell-class-name="cellClassName"
        :class="crmTableClass"

        :stripe="tableStyleObj.stripe"
        use-virtual
        highlight-current-row
        style="width: 100%;"
        @row-click="handleRowClick"
        @selection-change="handleSelectionChange">
        <el-table-column
          show-overflow-tooltip
        
          type="selection"
          fixed
          align="center"
          width="55" />


          
        <el-table-column
          v-for="(item, index) in fieldList"
          :key="index"
          :fixed="index==0"
          :prop="item.prop"
          :label="item.label"
          :formatter="titleFieldFormatter"
          :width="item.width"
         
          show-overflow-tooltip />
          
          
        <el-table-column />

       
        <!-- <el-table-column
          label="标记"
          width="200"
          fixed="right">>
          <template slot-scope="scope">
            <el-tag 
              v-if="scope.row.taxNumber.trim()!='' && scope.row.taxNumber!=null"
              closable
              :disable-transitions="false"
              @close="handleClose(scope.row)">
              {{scope.row}}
            </el-tag>  
            <el-input
              class="input-new-tag"
              v-if="inputVisible && scope.row.infoId == selectedInfoId "
              v-model="inputValue"
              ref="saveTagInput"
              size="small"
              @keyup.enter.native="handleInputConfirm"
              @blur="handleInputConfirm(scope.row)">
            </el-input>
            <el-button v-if="(scope.row.taxNumber=='' || scope.row.taxNumber==null) && (inputVisible == false || scope.row.infoId != selectedInfoId) " class="button-new-tag" size="small" @click="showInput(scope.row)">+ New Tag</el-button>
          </template>
        </el-table-column> -->
     

        <el-table-column
          label="操作"
          width="100"
          fixed="right">
          <template slot-scope="scope">
            <el-button
              type="primary-text"
              style="padding: 0;"
              @click="handleTitle('edit', scope)"
              
              >编辑</el-button>
            <el-button
              type="primary-text"
              style="padding: 0;"
              @click="handleTitle('delete', scope)">删除</el-button>
          </template>
        </el-table-column>


        <wk-empty
          slot="empty"
          :props="{
            buttonTitle: '新建发票抬头',
            showButton: saveAuth
          }"
          @click="createClick"
        />
      </el-table>
      <invoice-title-set
      :visible.sync="titleCreateShow"
     
      :detail="titleDetail"
      @change="getList" />
      <div class="p-contianer">
        <el-dropdown trigger="click" placement="top">
          <el-button class="dropdown-btn"><i class="el-icon-s-fold" /></el-button>
          <el-dropdown-menu slot="dropdown" class="wk-table-style-dropdown-menu">
            <el-dropdown-item>
              <span @click.stop><el-switch v-model="tableStyleObj.rightBorderShow" />显示竖向分割线</span>
            </el-dropdown-item>
            <el-dropdown-item>
              <span @click.stop><el-switch v-model="tableStyleObj.bottomBorderShow" />显示横向分割线</span>
            </el-dropdown-item>
            <el-dropdown-item>
              <span @click.stop><el-switch v-model="tableStyleObj.stripe" />显示斑马纹</span>
            </el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
        <el-pagination
          :current-page="currentPage"
          :page-sizes="pageSizes"
          :page-size.sync="pageSize"
          :total="total"
          :pager-count="5"
          class="p-bar"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange" />
      </div>
    </div>
    <create
      :action="action"
      :editUnitInfo="editUnitInfo"
      v-if="isCreate"
      @hiden-view="isCreate = false"
      @save-success="refreshList" />
    <!-- <detail
      v-if="showDview"
      :id.sync="rowID"
      :crm-type="rowType"
      :page-list="crmType == rowType ? list : []"
      :page-index.sync="rowIndex"
      @hide-view="showDview = false"
      @handle="handleHandle" /> -->
  </div>
</template>

<script>
import {crmUnitExcelExportAPI} from '@/api/crm/unit'
import { objDeepCopy } from '@/utils'
import {
  crmUnitDeleteAPI
} from '@/api/crm/unit'
import {
  crmUnitFormPageAPI
} from '@/api/admin/crm'
import { crmInvoiceDeleteInvoiceInfoAPI } from '@/api/crm/unit'
import Create from './components/Create'
import Detail from './Detail'
import TableMixin from '../mixins/Table'
import InvoiceTitleSet from '@/views/crm/invoice/components/InvoiceTitleSet'

export default {
  /** 客户管理 的 活动列表 */
  name: 'UnitIndex',
  
  components: {
    Create,
    Detail,
    InvoiceTitleSet
  },

  mixins: [TableMixin],

  data() {
    return {
      selectedInfoId:'',
      buttonShow: false,
      tagShow:  true,
      
      inputValue: '',
      action:{id:'',type:''},
      editUnitInfo:{},
      crmType: 'unit',
      selectOption: [],
      // marketingCrmType: '', // 类型
      isCreate: false, // 是创建
      titleCreateShow: false,
      titleDetail: null,
    }
  },

  computed: {
    // 可操作选项
    handleOperations() {
      return this.getOperations([
        'export',
        'state_disable',
        'delete'
      ])
    }
  },

  created() {
    //this.getCustomFormList()
    this.fieldList = [
      {
        prop: 'titleType',
        label: '抬头类型',
        width: '150'
      },
      {
        prop: 'invoiceTitle',
        label: '客户单位',
        width: '150'
      },
      {
        prop: 'taxNumber',
        label: '纳税人识别号',
        width: '150'
      },
      {
        prop: 'depositBank',
        label: '开户行',
        width: '200'
      },
      {
        prop: 'depositAccount',
        label: '开户账号',
        width: '150'
      },
      
     
      {
        prop: 'depositAddress',
        label: '开票地址',
        width: '200'
      },
      {
        prop: 'telephone',
        label: '电话',
        width: '150'
      },
      // {
      //   prop: 'ownerUserName',
      //   label: '创建人',
      //   width: '150'
      // },
      {
        prop: 'createTime',
        label: '创建时间',
        width: '150'
      },
      {
        prop: 'updateTime',
        label: '更新时间',
        width: '150'
      },
    ]
  },

  methods: {
    titleFieldFormatter(row, column) {
      if (column.property === 'titleType') {
        return {
          1: '单位',
          2: '个人'
        }[row[column.property]]
      }
      return row[column.property] === '' || row[column.property] === null ? '--' : row[column.property]
    },
    handleClose(scope) {
        alert(scope.row.infoId)
    },

      showInput(row,index) {
        this.inputVisible = true;
         this.selectedInfoId = row.infoId
        this.$nextTick(_ => {
          this.$refs.saveTagInput.$refs.input.focus();
        });
      },

      handleInputConfirm(row) {
        let inputValue = this.inputValue;
        if (inputValue == "") {
          this.inputVisible = false;
         
          this.inputValue = '';
        }else{
          this.inputVisible = false;
         
         this.inputValue = '';
          row.taxNumber = inputValue   
        }
        
        
      },



    createClick(){
      this.titleDetail = null
      this.titleCreateShow = true
    },
   
    
    /**
     * 编辑操作
     */
    /*
    handleTitle(type,row) {
      if(type == 'update'){
        this.action.id = row.unitId
        this.action.type = type
        this.editUnitInfo = objDeepCopy(row)
        this.isCreate=true
      }else if (type == 'delete') {
        this.$confirm('您确定要删除吗?', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        .then(() => {
          // this.selectionList.push(row.unitId)
          let selectionList = []
          selectionList.push(row.unitId)
          crmUnitDeleteAPI(selectionList)
            .then(res => {
              this.loading = false
              this.$message({
                type: 'success',
                message: '删除成功'
              })
              this.handleHandle({ type })
            }).catch(() => {
             
            })
        })
        .catch(() => {
          
        })
      }else if(type == 'create'){
        this.action.type = type
        this.isCreate = true
      }
    },*/

    handleTitle(type, item) {
      if (type == 'edit') {
        this.titleDetail = item.row
        this.titleCreateShow = true
      } else if (type == 'delete') {
        this.$confirm('您确定要删除吗?', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
          .then(() => {
            crmInvoiceDeleteInvoiceInfoAPI({
              infoId: item.row.infoId
            })
              .then(res => {
                // this.titleList.splice(item.$index, 1)
                this.$message.success('删除成功')
                this.getList()
              })
              .catch(() => {})
          })
          .catch(() => {})
      }
    },

    //table.js里有这个函数

    // getList() {
    //   alert(111)
    //   this.loading = true
    //   crmUnitFormPageAPI({
    //     page: this.currentPage,
    //     limit: this.pageSize
    //   })
    //     .then(res => {
    //       this.list = res.data.list
          
    //       this.total = res.data.totalRow

    //       this.loading = false
    //     })
    //     .catch(() => {
    //       this.loading = false
    //     })
    // },
    /**
     * @description: 表头事件
     * @param {*} type
     * @return {*}
     */
    tableOperationsClick(type) {
      if (type === 'delete') {
        console.log(this.selectionList)
        this.$confirm(`确定删除选中的${this.selectionList.length}项吗？`, '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
          .then(() => {
            this.loading = true
            crmUnitDeleteAPI(this.selectionList.map(item => item.infoId))
              .then(res => {
                this.loading = false
                this.$message({
                  type: 'success',
                  message: '删除成功'
                })
                this.handleHandle({ type })
              })
              .catch(() => {
                // 批量沟通 可能部分删除成功，需要刷新列表
                this.handleHandle({ type })
                this.loading = false
              })
          })
          .catch(() => {})
      }else if(type === 'export'){
        this.$wkExport.export(this.crmType, {
          // params: { ids: this.selectionList.map(item => item[`${this.crmType}Id`]) },
          params: { ids: this.selectionList.map(item => item.infoId) },
          request: crmUnitExcelExportAPI
        })
      }
    },

    /**
     * 获取自定义数组
     */
    getCustomFormList() {
      // crmMarketingFormListAPI({
      //   page: this.currentPage,
      //   limit: this.pageSize,
      //   pageType: 0
      // })
      //   .then(res => {
      //     const list = res.data || []
      //     this.selectOption = [{ name: '全部', value: '' }, { name: '客户', value: 2 }, { name: '线索', value: 1 }].concat(list.map(item => {
      //       return {
      //         name: item.title,
      //         value: item.id
      //       }
      //     }))
      //   })
      //   .catch(() => {
      //   })
    },

    /**
     * 新建操作
     */
    // createClick() {
    //   this.isCreate = true
    // },

    /**
     * 刷新数据
     */
    refreshList() {
      this.currentPage = 1
      this.getList()
    },

    /** 通过回调控制style */
    cellClassName({ row, column, rowIndex, columnIndex }) {
      if (column.property === 'marketingName') {
        return 'can-visit--underline'
      } else {
        return ''
      }
    },
    /** 格式化 */
    
  }
}
</script>

<style lang="scss" scoped>
@import "../styles/table.scss";

.type-select {
  width: 180px;
}
</style>
