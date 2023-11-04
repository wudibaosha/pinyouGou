<template>
  <div class="role-authorization main">
    <xr-header
      ref="xrHeader"
      label="角色权限控制" />
    <div
      :class="{'is-tabs' : roleTabShow}"
      class="main-content-wrap">
      <!-- 左边导航 -->
      <div
        v-loading="roleMenuLoading"
        class="main-nav">
        <div class="main-nav__title">
          {{ title }}<i
            v-if="roleHelpObj"
            class="wk wk-icon-fill-help wk-help-tips"
            :data-type="roleHelpObj.type"
            :data-id="roleHelpObj.id" />
          <el-button
            type="text"
            class="add-btn"
            icon="el-icon-plus"
            @click="newRoleBtn">创建角色</el-button>
        </div>
        <div class="main-nav__content">
          <!-- 角色列表 -->
          <div class="nav-sections-wrap">
            <el-tabs
              v-if="roleTabShow"
              v-model="tabType"
              @tab-click="roleTabChange">
              <el-tab-pane label="管理员" name="91" />
              <el-tab-pane label="上级" name="92">
                <template slot="label">
                  上级<i
                    class="wk wk-icon-fill-help wk-help-tips"
                    data-type="22"
                    data-id="259" />
                </template>
              </el-tab-pane>
            </el-tabs>
            <div class="nav-section">
              <div
                v-for="(item, index) in roleList"
                :key="index"
                :class="{'is-select' : item.roleId == roleActive.roleId}"
                class="menu-item"
                @click="roleMenuSelect(item)">
                <div class="menu-item__content">{{ item.roleName }}</div>
                <div
                  v-if="item.remark != 'admin' && item.remark != 'project'"
                  class="icon-close"
                  :class="{'is-visible': item.visible}"
                  @click.stop>
                  <el-dropdown
                    v-model="item.visible"
                    trigger="click"
                    @command="roleHandleClick">
                    <el-button
                      class="dropdown-btn menu-edit-btn"
                      icon="wk wk-manage"
                      size="small"
                      @click="roleDropdownClick(item)" />
                    <el-dropdown-menu slot="dropdown">
                      <el-dropdown-item command="copy">复制</el-dropdown-item>
                      <el-dropdown-item command="edit">编辑</el-dropdown-item>
                      <el-dropdown-item command="delete">删除</el-dropdown-item>
                    </el-dropdown-menu>
                  </el-dropdown>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 角色编辑 -->
      <el-dialog
        :title="newRoleTitle"
        :visible.sync="newRoleVisible"
        :before-close="newRoleClose"
        :close-on-click-modal="false"
        width="30%">
        <label class="label-title">角色名称</label>
        <el-input
          v-model="role.title"
          :maxlength="100"
          class="input-role" />
        <span
          slot="footer"
          class="dialog-footer">
          <el-button
            type="primary"
            @click="newRoleSubmit">确定</el-button>
          <el-button @click="newRoleClose">取消</el-button>
        </span>
      </el-dialog>

      <!-- 右边内容 -->
      <div class="main-content">
        <el-tabs v-model="mainMenuIndex" style="height: 100%;">
          <el-tab-pane
            v-if="showRoleUser"
            label="角色员工"
            name="user">
            <div
              v-loading="userLoading"
              class="content-table">
              <flexbox class="content-table-header">
                <el-input
                  v-model="searchInput"
                  placeholder="请输入内容"
                  style="width: 240px;"
                  @keyup.enter.native="headerSearch"
                  @blur="headerSearch">
                  <el-button
                    slot="suffix"
                    type="icon"
                    icon="wk wk-sousuo"
                    @click.native="headerSearch" />
                </el-input>
                <div class="content-table-header-reminder">
                  <reminder
                    v-if="showReminder"
                    :content="getReminderContent()" />
                </div>
                <el-button
                  :disabled="roleList.length === 0"
                  @click="addEmployees"> 关联员工 </el-button><i
                    class="wk wk-icon-fill-help wk-help-tips"
                    data-type="22"
                    data-id="183" />
              </flexbox>
              <el-table
                :data="tableData"
                :class="WKConfig.tableStyle.class"
                :stripe="WKConfig.tableStyle.stripe"
                :height="tableHeight"
                style="width: 100%;">
                <el-table-column
                  prop="realname"
                  width="150"
                  show-overflow-tooltip
                  label="姓名">
                  <template slot-scope="{ row, column }">
                    <span class="status-name">
                      <span>{{ row.realname }}</span>
                      <el-tag v-if="row.userIdentity === 0" disable-transitions type="warning">主账号</el-tag>
                    </span>
                  </template>
                </el-table-column>
                <el-table-column
                  v-for="(item, index) in tableList"
                  :key="index"
                  :prop="item.field"
                  :label="item.label"
                  show-overflow-tooltip />
                <el-table-column
                  width="160"
                  label="操作">
                  <template slot-scope="scope">
                    <!-- <span class="el-icon-edit table-edit-btn"
                      @click="editBtn(scope.row)"></span> -->
                    <el-button
                      :disabled="scope.row.userIdentity === 0"
                      type="primary-text"
                      class="table-edit-btn"
                      title="编辑"
                      @click="employeeHandleClick('editRole',scope.row)">编辑</el-button>
                    <el-button
                      type="primary-text"
                      class="table-edit-btn"
                      title="复制"
                      @click="employeeHandleClick('copyRole',scope.row)">复制</el-button>
                    <!-- userIdentity 0 是主账号 -->
                    <el-button
                      :disabled="scope.row.userIdentity === 0"
                      type="primary-text"
                      class="table-edit-btn"
                      title="删除"
                      @click="employeeHandleClick('delete',scope.row)">删除</el-button>
                  </template>
                </el-table-column>
              </el-table>
              <div class="p-contianer">
                <el-pagination
                  :current-page="currentPage"
                  :page-sizes="pageSizes"
                  :page-size.sync="pageSize"
                  :total="total"
                  :pager-count="5"
                  class="p-bar"
                  background
                  layout="prev, pager, next, sizes, total, jumper"
                  @size-change="handleSizeChange"
                  @current-change="handleCurrentChange" />
              </div>
            </div>
          </el-tab-pane>
          <el-tab-pane
            v-if="roleActive && showRuleSet"
            name="rule">
            <template slot="label">角色权限<i
              class="wk wk-icon-fill-help wk-help-tips"
              data-type="22"
              data-id="179" /></template>
            <!-- 权限管理 -->
            <div
              v-loading="ruleLoading"
              class="jurisdiction-box">
              <div class="jurisdiction-box-bar">
                <el-button
                  v-for="item in ruleMenuList"
                  :key="item.index"
                  :type="ruleMenuIndex === item.index ? 'selected' : null"
                  @click="ruleMenuIndex = item.index">{{ item.label }}
                </el-button>
                <el-button
                  v-if="roleActive"
                  :disabled="roleList.length === 0"
                  size="medium"
                  type="primary"
                  class="jurisdiction-edit"
                  @click="ruleSubmit"> 保存 </el-button>
              </div>
              <template
                v-for="(item, index) in ruleMenuList">
                <div
                  v-if="item.type == 'tree'"
                  v-show="ruleMenuIndex === item.index"
                  :key="index"
                  :style="{ height: treeHeight + 'px'}"
                  class="jurisdiction-content">
                  <div class="jurisdiction-content-checkbox">
                    <el-tree
                      :ref="'tree' + item.index"
                      :data="tabType == '92' ? superTree : item.data"
                      :indent="0"
                      :expand-on-click-node="false"
                      :props="defaultProps"
                      show-checkbox
                      node-key="menuId"
                      style="height: 0;"
                      empty-text=""
                      default-expand-all>

                      <span
                        slot-scope="{ node }"
                        :class="{
                          'node-label': node.level == 1 || node.level == 2,
                          'common-node-label': node.data.menuId == '935'} ">{{ node.label }}<el-button
                            v-if="node.level == 2 && canSetField(node.data.realm)"
                            icon="wk wk-manage"
                            type="primary-text"
                            @click.stop.prevent="fieldSetClick(node)">字段授权</el-button><!-- 下是系统管理的配置  上是客户管理的配置 --><el-button
                              v-else-if="node.data.menuId == '935'"
                              icon="wk wk-manage"
                              type="primary-text"
                              @click.stop.prevent="checkRangeSetClick(node)">配置查看范围</el-button></span>
                    </el-tree>
                  </div>
                </div>
                <div
                  v-if="item.type !== 'tree'"
                  v-show="ruleMenuIndex === item.index"
                  :key="index"
                  class="jurisdiction-content">
                  <div class="data-radio">
                    <el-radio-group v-model="item.value">
                      <el-radio v-if="!roleTabShow" :label="1">本人</el-radio>
                      <el-radio :label="2">本人及下属</el-radio>
                      <el-radio :label="3">本部门</el-radio>
                      <el-radio :label="4">本部门及下属部门</el-radio>
                      <el-radio :label="5">全部</el-radio>
                    </el-radio-group>
                  </div>
                </div>

              </template>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
    <!-- 关联员工 -->
    <relate-empoyee
      :visible.sync="relateEmpoyeeShow"
      :role-id="roleId"
      @save="employeesSave" />
    <!-- 字段授权 -->
    <field-set-dialog
      :visible.sync="setFieldShow"
      :role-id="roleId"
      :label="setFieldLabel"
    />
    <!-- 角色编辑 -->
    <edit-role-dialog
      v-if="editRoleDialogShow"
      :user-show="editRoleType === 'copyRole'"
      :selection-list="selectionList"
      :visible.sync="editRoleDialogShow"
      @change="getUserList"
    />
    <role-range-set-dialog
      v-if="setRoleRangeShow"
      :visible.sync="setRoleRangeShow"
      :role-id="roleId"
    />

  </div>
</template>

<script>
import { userListAPI } from '@/api/common'
import {
  systemRuleByTypeAPI,
  roleAddAPI,
  roleDeleteAPI,
  roleCopyAPI,
  roleUpdateAPI,
  updateRoleMenuAPI,
  unbindingUserAPI,
  systemRoleByTypeAPI
} from '@/api/admin/role'

import RelateEmpoyee from './components/RelateEmpoyee'
import FieldSetDialog from './components/FieldSetDialog'
import RoleRangeSetDialog from './components/RoleRangeSetDialog'
import Reminder from '@/components/Reminder'
import XrHeader from '@/components/XrHeader'
import EditRoleDialog from '../employeeDep/components/EditRoleDialog'

import crmTypeModel from '@/views/crm/model/crmTypeModel'
import { objDeepCopy } from '@/utils'

export default {
  components: {
    RelateEmpoyee,
    FieldSetDialog,
    RoleRangeSetDialog,
    Reminder,
    XrHeader,
    EditRoleDialog
  },

  data() {
    return {
      parentId: '',
      title: '',
      searchInput: '',
      tableData: [], // 与角色关联的员工
      tableHeight: document.documentElement.clientHeight - 300, // 表的高度
      treeHeight: document.documentElement.clientHeight - 230, // 表的3度
      currentPage: 1,
      pageSize: 15,
      pageSizes: [15, 30, 45, 60],
      total: 0,
      tableList: [
        { label: '部门', field: 'deptName' },
        { label: '职位', field: 'post' },
        { label: '角色', field: 'roleName' }
      ],

      // 新建角色
      newRoleType: 'create', // create update
      newRoleVisible: false,
      role: {}, // 操作角色的框 关联的信息
      roleList: [], // 角色列表 list属性 是信息
      allRoleList: [], // 全部 用于区分管理员和上级

      mainMenuIndex: 'user', // 角色员工  角色权限 切换 默认左边
      // 权限管理
      ruleMenuIndex: 'data', // 默认模块 工作台
      ruleMenuList: [],
      defaultProps: {
        children: 'childMenu',
        label: 'menuName',
        disabled: false
      },
      relateEmpoyeeShow: false,
      // 选中的角色
      roleActive: null,
      dropdownHandleRole: null, // 下拉操作编辑角色
      //   加载
      roleMenuLoading: false,
      // 权限加载中
      ruleLoading: false,
      // 员工列表加载中
      userLoading: false,

      // 字段授权
      setFieldLabel: '',
      setFieldShow: false,

      // 角色操作
      selectionList: [],
      editRoleType: '',
      editRoleDialogShow: false,

      // 人资角色类型
      tabType: '91',
      superTree: [],

      // 角色范围设置
      setRoleRangeShow: false
    }
  },

  computed: {
    roleId() {
      if (this.roleActive) {
        return this.roleActive.roleId
      }
      return ''
    },

    // 展示角色权限
    showRuleSet() {
      if (this.roleActive) {
        return (
          this.roleActive.remark != 'admin' &&
          this.roleActive.remark != 'project'
        )
      }

      return false
    },

    // 展示提示问题
    showReminder() {
      if (this.roleActive) {
        return this.roleActive.remark == 'project'
      }

      return false
    },

    // 人资角色tab
    roleTabShow() {
      return this.parentId == 9
    },

    showRoleUser() {
      return Number(this.parentId) !== 4
    },

    // 帮助信息
    roleHelpObj() {
      // 1 系统管理角色 2客户管理角色 4财务管理角色 7办公管理角色 9人力资源管理角色
      return {
        '1': {
          type: '22',
          id: '172'
        }, '2': {
          type: '22',
          id: '176'
        }, '4': {
          type: '22',
          id: '178'
        }, '7': {
          type: '22',
          id: '173'
        }, '9': {
          type: '22',
          id: '177'
        }
      }[this.parentId] || null
    },

    newRoleTitle() {
      return this.newRoleType === 'create' ? '新建角色' : '编辑角色'
    }
  },

  watch: {
    showRoleUser: {
      handler() {
        if (!this.showRoleUser) {
          this.mainMenuIndex = 'rule'
        } else {
          this.mainMenuIndex = 'user'
        }
      },
      deep: true
    }
  },

  mounted() {
    /** 控制table的高度 */
    window.onresize = () => {
      this.tableHeight = document.documentElement.clientHeight - 300
      this.treeHeight = document.documentElement.clientHeight - 230
    }
    /** 获取权限信息 */
    this.parentId = this.$route.params.parentId
    this.title = this.$route.params.title
    this.getRulesList()
    this.getRoleList()
  },

  beforeRouteUpdate(to, from, next) {
    this.tabType = '91'
    this.parentId = to.params.parentId
    this.title = to.params.title
    this.roleActive = null
    this.roleList = []
    this.mainMenuIndex = 'user'
    this.currentPage = 1
    this.total = 0
    this.tableData = []
    if (this.$refs.xrHeader) {
      this.$refs.xrHeader.search = ''
      this.searchInput = ''
    }
    this.getRulesList()
    this.getRoleList()
    next()
  },

  methods: {
    /**
     * 获取权限规则信息
     */
    getRulesList() {
      systemRuleByTypeAPI(this.parentId).then(res => {
        const resData = res.data || {}

        if (resData.data) {
          const dataTree = [resData.data]
          this.ruleMenuList = [
            {
              label: '模块功能',
              index: 'data',
              type: 'tree',
              value: [],
              data: dataTree
            }
          ]

          if (this.roleTabShow) {
            const copyTree = objDeepCopy(dataTree)
            this.addDisabledToTree(copyTree)
            this.superTree = copyTree
          }
          if (resData.bi) {
            this.ruleMenuList.push({
              label: '数据分析',
              index: 'bi',
              type: 'tree',
              value: [],
              data: [resData.bi]
            })
          }
        } else {
          this.ruleMenuList = []
        }

        this.getRoleRulesInfo()
      })
    },

    /**
     * tree 增加disabled
     */
    addDisabledToTree(tree) {
      tree.forEach(item => {
        item.disabled = item.remarks !== 'label-92'
        if (item.childMenu) {
          this.addDisabledToTree(item.childMenu)
        }
      })
    },

    /**
     * 财务管理中的系统默认角色禁止删除
     */
    getDisabledDeleteStatus(item) {
      const flag = item.roleType === 4 && item.remark === '1'
      return !flag
    },

    /**
     * 获取角色列表
     */
    getRoleList() {
      this.roleMenuLoading = true
      systemRoleByTypeAPI(this.parentId)
        .then(res => {
          const resData = res.data || []
          if (this.roleTabShow) {
            this.allRoleList = resData
            this.roleList = this.allRoleList.filter(item => item.label == this.tabType)
          } else {
            this.roleList = resData
          }
          /** 判断数据是否存在 */
          let hasActive = false
          if (this.roleActive) {
            for (let index = 0; index < this.roleList.length; index++) {
              const item = this.roleList[index]
              if (item.roleId == this.roleActive.roleId) {
                this.roleActive = item
                this.getRoleRulesInfo()
                hasActive = true
                break
              }
            }
          }
          if (!hasActive && this.roleList.length) {
            this.roleActive = this.roleList[0]
            this.getRoleRulesInfo()
          }
          this.refreshUserList()
          this.roleMenuLoading = false
        })
        .catch(() => {
          this.roleMenuLoading = false
        })
    },

    /**
     * 关联员工
     */
    addEmployees() {
      this.relateEmpoyeeShow = true
    },

    /**
     * 关联员工确定
     */
    employeesSave(val) {
      this.relateEmpoyeeShow = false
      this.getUserList()
    },

    /**
     * 删除
     */
    employeeHandleClick(type, val) {
     
      if (type === 'delete') {
        this.$confirm('此操作将永久删除是否继续?', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
          .then(() => {
            this.userLoading = true
            unbindingUserAPI({
              userId: val.userId,
              roleId: this.roleActive.roleId
            }).then(res => {
              this.userLoading = false
              this.getUserList()
              this.$message.success('删除成功')
            }).catch(() => {
              this.userLoading = false
            })
          })
          .catch(() => {
            this.$message({
              type: 'info',
              message: '已取消删除'
            })
          })
      } else if (type === 'editRole' || type === 'copyRole') {
        this.selectionList = [val]
        this.editRoleType = type
        this.editRoleDialogShow = true
      }
    },

    /**
     * 角色切换
     */
    roleTabChange() {
      this.roleList = this.allRoleList.filter(item => item.label == this.tabType)
      if (this.roleList.length) {
        this.roleActive = this.roleList[0]
        this.getRoleRulesInfo()
      } else {
        this.roleActive = null
      }
      this.refreshUserList()
    },

    /**
     * 新建角色
     */
    newRoleClose() {
      this.newRoleVisible = false
    },
    newRoleBtn() {
      this.newRoleType = 'create'
      this.role = {}
      this.newRoleVisible = true
    },

    /**
     * 角色操作
     */
    roleDropdownClick(value) {
      this.dropdownHandleRole = value
    },
    roleHandleClick(command) {
      if (command == 'edit') {
        this.roleEditBtn(this.dropdownHandleRole)
      } else if (command == 'copy') {
        this.ticketsBtn(this.dropdownHandleRole)
      } else if (command == 'delete') {
        this.roleDelect(this.dropdownHandleRole)
      }
    },

    /**
     * 角色说明文字
     */
    getReminderContent() {
      if (this.roleActive && this.roleActive.remark == 'project') {
        return '项目管理员拥有“项目管理”模块所有权限，能看到并维护所有项目信息'
      }
      return ''
    },

    /**
     * 角色编辑
     */
    roleEditBtn(val) {
      this.newRoleType = 'update'
      this.role = {
        title: val.roleName,
        parentId: val.roleType,
        id: val.roleId
      }
      this.newRoleVisible = true
    },

    /**
     * 复制
     */
    ticketsBtn(val) {
      this.$confirm('确定此操作?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
        .then(() => {
          roleCopyAPI({ roleId: val.roleId }).then(res => {
            this.$message.success('复制成功')
            this.getRoleList()
          })
        })
        .catch(() => {
          this.$message({
            type: 'info',
            message: '已取消删除'
          })
        })
    },

    /**
     * 删除
     */
    roleDelect(val) {
      this.$confirm('此操作将永久删除是否继续?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
        .then(() => {
          roleDeleteAPI({ roleId: val.roleId }).then(res => {
            if (this.roleList.length) {
              this.roleActive = this.roleList[0]
              // 点击角色 复制权限 用于编辑操作
              this.getRoleRulesInfo()
            }
            this.getRoleList()
            this.$message.success('删除成功')
          })
        })
        .catch(() => {
          this.$message({
            type: 'info',
            message: '已取消删除'
          })
        })
    },
    newRoleSubmit() {
      if (!this.role.title) {
        this.$message.error('角色名称不能为空')
      } else {
        if (this.newRoleType == 'create') {
          const params = {
            roleName: this.role.title,
            roleType: this.parentId
          }
          if (this.roleTabShow) {
            params.label = this.tabType
          }

          roleAddAPI(params).then(res => {
            this.getRoleList()
            this.$message.success('添加成功')
            this.newRoleClose()
          })
        } else {
          roleUpdateAPI({
            roleName: this.role.title,
            roleType: this.role.parentId,
            roleId: this.role.id
          }).then(res => {
            this.getRoleList()
            this.$message.success('编辑成功')
            this.newRoleClose()
          })
        }
      }
    },

    /**
     * 角色列表点击
     */
    roleMenuSelect(val) {
      this.roleActive = val

      if (this.mainMenuIndex == 'rule' && !this.showRuleSet) {
        this.mainMenuIndex = 'user'
      }

      this.getRoleRulesInfo()

      this.refreshUserList()
    },

    /**
     * 获取权限信息 需在roleActive获取之后
     */
    getRoleRulesInfo() {
      if (this.roleActive && this.ruleMenuList.length) {
        if (this.parentId == 2 || this.parentId == 10 || (this.parentId == 9 && this.tabType == '92')) {
          const lastItem = this.ruleMenuList[this.ruleMenuList.length - 1]
          if (lastItem.type != 'data') {
            this.ruleMenuList.push({
              label: '数据权限',
              index: 'info',
              type: 'data',
              value: this.roleActive.dataType
            })
          }
        } else if (this.parentId == 9 && this.tabType == '91') {
          // 管理员
          const lastItem = this.ruleMenuList[this.ruleMenuList.length - 1]
          if (lastItem.type != 'tree') {
            this.ruleMenuList = [this.ruleMenuList[0]]
          }
          this.ruleMenuIndex = 'data'
        }

        for (let index = 0; index < this.ruleMenuList.length; index++) {
          const element = this.ruleMenuList[index]
          if (element.type == 'tree') {
            element.rules = this.getRoleRules(
              this.roleActive.rules[element.index],
              element.data[0]
            )
            this.$nextTick(() => {
              const treeRefs = this.$refs['tree' + element.index]
              if (treeRefs) {
                if (
                  Object.prototype.toString.call(treeRefs) == '[object Array]'
                ) {
                  treeRefs.length && treeRefs[0].setCheckedKeys(element.rules)
                } else {
                  treeRefs.setCheckedKeys(element.rules)
                }
                this.setDisabledAuth()
              }
            })
          } else {
            element.value = this.roleActive.dataType
          }
        }
      }
    },

    /**
     * 设置节点禁用状态(财务管理角色)
     */
    setDisabledAuth() {
      if (Number(this.parentId) !== 4) {
        this.$set(this.defaultProps, 'disabled', false)
      } else {
        // 财务管理中查看者权限需特殊处理
        const that = this
        this.$set(this.defaultProps, 'disabled', function(data, node) {
          // console.log('setDisabledAuth: ', data, node)
          if (that.roleActive.label !== 4) return false
          return !['read', 'export', 'print'].includes(data.realm)
        })
      }
    },

    /**
     * 获得check的实际数据
     */
    getRoleRules(array, tree) {
      if (!array) {
        array = []
      }

      var hasRemove = false
      var copyArray = this.copyItem(array)
      for (
        let firstIndex = 0;
        firstIndex < tree.childMenu.length;
        firstIndex++
      ) {
        const firstItem = tree.childMenu[firstIndex]

        if (!firstItem.hasOwnProperty('children')) {
          if (firstItem.length + 1 != copyArray.length) {
            this.removeItem(copyArray, tree.id)
          }
          return copyArray
        }

        for (let index = 0; index < array.length; index++) {
          const element = array[index]
          var temps = []
          for (
            let secondIndex = 0;
            secondIndex < firstItem.childMenu.length;
            secondIndex++
          ) {
            const secondItem = firstItem.childMenu[secondIndex]
            if (secondItem.id == element) {
              temps.push(secondItem)
            }
          }
          if (temps.length != firstItem.childMenu.length) {
            hasRemove = true
            this.removeItem(copyArray, firstItem.id)
          }
        }
      }

      if (hasRemove) {
        this.removeItem(copyArray, tree.id)
      }

      var checkedKey = []
      for (let index = 0; index < copyArray.length; index++) {
        const element = copyArray[index]
        if (element) {
          checkedKey.push(parseInt(element))
        }
      }

      return checkedKey
    },
    copyItem(array) {
      var temps = []
      for (let index = 0; index < array.length; index++) {
        temps.push(array[index])
      }
      return temps
    },
    removeItem(array, item) {
      var removeIndex = -1
      for (let index = 0; index < array.length; index++) {
        if (item == array[index]) {
          removeIndex = index
          break
        }
      }
      if (removeIndex > 0) {
        array.splice(removeIndex, 1)
      }
    },
    containItem(array, item) {
      for (let index = 0; index < array.length; index++) {
        if (item == array[index]) {
          return true
        }
      }
      return false
    },

    /**
     * 头部搜索
     */
    headerSearch() {
      this.refreshUserList()
    },

    /**
     * 刷新员工列表
     */
    refreshUserList() {
      this.currentPage = 1
      this.getUserList()
    },

    /**
     * 员工列表
     */
    getUserList() {
      if (!this.roleActive) {
        this.tableData = []
        this.total = 0
        return
      }

      this.userLoading = true
      userListAPI({
        page: this.currentPage,
        limit: this.pageSize,
        roleId: this.roleActive.roleId,
        realname: this.searchInput
      })
        .then(res => {
          this.tableData = res.data.list
          this.total = res.data.totalRow
          this.userLoading = false
        })
        .catch(() => {
          this.userLoading = false
        })
    },
    /**
     * 更改每页展示数量
     */
    handleSizeChange(val) {
      this.pageSize = val
      this.refreshUserList()
    },

    /**
     * 更改当前页数
     */
    handleCurrentChange(val) {
      this.currentPage = val
      this.getUserList()
    },

    // 权限提交
    ruleSubmit() {
      this.ruleLoading = true

      let rules = []
      let infoData = ''
      for (let index = 0; index < this.ruleMenuList.length; index++) {
        const element = this.ruleMenuList[index]
        if (element.type == 'tree') {
          const treeRefs = this.$refs['tree' + element.index]
          if (treeRefs) {
            if (Object.prototype.toString.call(treeRefs) == '[object Array]') {
              rules = rules.concat(treeRefs[0].getCheckedKeys())
            } else {
              rules = rules.concat(treeRefs.getCheckedKeys())
            }
          }
        } else {
          infoData = element.value
        }
      }

      updateRoleMenuAPI({
        menuIds: rules,
        dataType: infoData,
        roleId: this.roleActive.roleId,
        roleName: this.roleActive.roleName
      })
        .then(res => {
          this.getRoleList()
          this.$message.success('编辑成功')
          this.ruleLoading = false
        })
        .catch(() => {
          this.ruleLoading = false
        })
    },

    /**
     * 是否能字段设置
     */
    canSetField(type) {
      if (this.parentId == 10) return false
      return ['leads', 'customer', 'contacts', 'business', 'contract', 'receivables', 'receivablesPlan', 'product', 'visit', 'invoice', 'settlement', 'project'].includes(type) &&
      this.ruleMenuIndex === 'data'
    },

    /**
     * 权限设置
     */
    fieldSetClick(node) {
      this.setFieldLabel = crmTypeModel[node.data.realm]
      this.setFieldShow = true
    },

    /**
     * 权限设置
     */
    checkRangeSetClick(node) {
      this.setRoleRangeShow = true
    },

    /**
     * 获取状态颜色 0 禁用 1 启用 2未激活
     */
    getStatusColor(status) {
      if (status == 0) {
        return '#FF6767'
      } else if (status == 1) {
        return '#46CDCF'
      } else if (status == 2) {
        return '#CCCCCC'
      }
    }
  }
}
</script>

<style lang="scss" scoped>
@import "../styles/index.scss";
@import "../styles/table.scss";

.add-btn {
  position: absolute;
  right: #{$--interval-base * 2};
  padding: 0;
}

.main-content-wrap {
  margin-top: 16px;

  &.is-tabs {
    .role-nav-box {
      height: calc(100% - 100px);
      padding-top: 0;
    }
  }
}

.table-edit-btn {
  padding: 0;
}

.content-table {
  overflow: hidden;
}

.content-table > .xr-btn--orange {
  float: right;
  margin-right: 30px;
  margin-bottom: 15px;
}

.content-table-header {
  padding-bottom: 16px;

  .content-table-header-reminder {
    flex: 1;
    margin-right: 5px;
  }
}

/* 权限管理 */
.jurisdiction-content {
  position: relative;
  height: calc(100% - 61px);
  overflow: hidden;
}

.content-left {
  height: 100%;
  margin-right: 250px;
  overflow: hidden;
}

.content-right {
  position: absolute;
  top: 0;
  right: 0;
  width: 250px;
  height: 100%;
}

.jurisdiction-box {
  position: relative;
  height: calc(100% - 61px);
  overflow: hidden;

  &-bar {
    margin-bottom: 16px;
  }
}

.jurisdiction-content-checkbox {
  height: calc(100% - 25px);
  overflow-y: scroll;
  border-right: 1px dashed $--border-color-base;

  /deep/ .el-tree-node__content:hover {
    color: $--color-primary;
    background-color: white;
  }

  /deep/ .el-tree {
    .el-tree-node {
      margin-bottom: 5px;
      white-space: inherit;

      > .el-tree-node__content {
        width: 150px;
        margin-bottom: $--interval-base;

        > span:not(.node-label) {
          font-weight: normal;
        }
      }

      &:focus > .el-tree-node__content {
        background-color: white;
      }
    }

    > .el-tree-node > .el-tree-node__children > .is-expanded > .el-tree-node__children > .is-expanded {
      display: inline-block;
    }

    .el-tree-node__expand-icon {
      display: none;
    }
  }
}

.data-radio {
  .el-radio {
    display: block;
  }

  .el-radio + .el-radio {
    margin-top: 16px;
  }
}

/* 新建角色 */
.input-role {
  width: 100%;
  padding: 10px 0 20px;
}

.role-nav-box {
  height: calc(100% - 50px);
  padding: 20px 0;
  overflow-y: auto;
  line-height: 30px;
}

// 菜单
.nav-sections-wrap {
  padding: $--interval-base;
}

.menu-item {
  .icon-close {
    flex-shrink: 0;
    visibility: hidden;

    &.is-visible {
      visibility: visible;
    }
  }

  &:hover {
    .icon-close {
      visibility: visible;
    }
  }

  .menu-edit-btn {
    padding: 3px;
    background-color: transparent;
  }
}

.jurisdiction-edit {
  position: absolute;
  top: 0;
  right: 20px;
  z-index: 3;
  padding: 10px 30px;
  text-align: right;
}

// .el-tabs /deep/ .el-tabs__nav-wrap::after {
//   display: none !important;
// }

.el-tabs /deep/ .el-tabs__header {
  margin: 0 0 16px !important;
}

.node-label {
  position: relative;
  font-size: 16px;
  font-weight: bold;

  .el-button {
    position: absolute;
    top: -8px;
    right: -90px;
    padding-left: 0;
  }
}

.common-node-label {
  position: relative;

  .el-button {
    position: absolute;
    top: -8px;
    right: -120px;

    /deep/ span {
      margin-left: 4px;
    }
  }
}
</style>
