<template>
  <div class="employee-dep-management main">
    <xr-header>
      <template slot="label">员工与部门管理<i
        class="wk wk-icon-fill-help wk-help-tips"
        data-type="21"
        data-id="170"
        @click.stop="" /></template>
      <el-input
        slot="ft"
        v-model="searchInput"
        placeholder="请输入员工名称/手机号"
        class="search-input"
        @keyup.enter.native="headerSearch"
        @blur="headerSearch">
        <el-button
          slot="suffix"
          type="icon"
          icon="wk wk-sousuo"
          @click.native="headerSearch" />
      </el-input>
      <el-button
        v-if="userSaveAuth"
        slot="ft"
        class="add-user-btn"
        type="primary"
        @click="addEmployee">添加员工</el-button>
      <el-dropdown
        v-if="userSaveAuth"
        slot="ft"
        class="add-user-btn"
        @command="createEmployeeClick">
        <el-button class="dropdown-btn" icon="el-icon-more" />
        <el-dropdown-menu slot="dropdown">
          <el-dropdown-item command="bulkImport">批量导入</el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>
    </xr-header>
    <div class="main-content-wrap">
      <!-- 左边导航栏 -->
      <div
        v-loading="depLoading"
        class="main-nav">
        <div class="main-nav__title">企业组织架构<i
          class="wk wk-icon-fill-help wk-help-tips"
          data-type="21"
          data-id="169"
          @click.stop="" />
          <el-button
            v-if="strucSaveAuth"
            type="text"
            class="add-btn"
            icon="el-icon-plus"
            @click="addStruc">创建部门</el-button></div>
        <div class="main-nav__content">
          <div class="nav-sections-wrap">
            <!-- <div class="nav-section">
              <div class="nav-section__title">员工</div>
              <div class="nav-section__content is-padding">
                <flexbox
                  v-for="(item, index) in employeeMenu"
                  :key="index"
                  :class="['menu-item', { 'is-select' : currentMenuData && currentMenuData.type == item.type}]"
                  justify="space-between"
                  @click.native="changeUserClick(item)">
                  <span class="menu-item__content">{{ item.label }}</span>
                  <span v-if="item.count" class="el-badge__content el-badge__content--undefined">{{ item.count }}</span>
                </flexbox>
              </div>
            </div> -->

            <div class="nav-section is-padding">
              <div class="nav-section__content is-top-padding">
                <el-tree
                  ref="tree"
                  :data="showDepData"
                  :expand-on-click-node="false"
                  :props="{
                    label: 'name'
                  }"
                  node-key="deptId"
                  highlight-current
                  default-expand-all
                  @node-click="changeDepClick">
                  <span
                    slot-scope="{ node, data }"
                  >
                    <i
                      v-if="node.level == 1"
                      style="margin-right: 4px;"
                      class="wk wk-customer" />{{ data.name }}
                  </span>
                </el-tree>
              </div>
            </div>
          </div>

        </div>
      </div>
      <!-- 右边内容 -->
      <div class="main-content flex-index">
        <flexbox
          v-if="selectionList.length === 0"
          justify="space-between"
          class="table-top">
          <div class="table-top__title">
            <span>{{ `${currentMenuData ? currentMenuData.name : ''}` }}</span>
            <!-- <el-tooltip
              v-if="currentMenuData && currentMenuData.tips"
              :content="currentMenuData.tips"
              effect="dark"
              placement="top">
              <i class="wk wk-help wk-help-tips" />
            </el-tooltip> -->
            <!-- <reminder
              v-if="currentMenuData && currentMenuData.type && currentMenuData.type == 'all'"
              class="all-user-reminder"
              content="员工的默认角色权限为：日志、任务审批、日历，其中日志、任务/审批的数据权限默认为上级看下级" /> -->
            <span class="des">所有员工<span class="value">{{ userCountObj.allUserCount || 0 }}</span>人，已激活<span class="value">{{ userCountObj.activateCount || 0 }}</span>人，未激活<span class="value">{{ userCountObj.inactiveCount || 0 }}</span>人，停用<span class="value">{{ userCountObj.disableCount || 0 }}</span>人</span>
          </div>

          <div class="table-top__ft">
            <el-checkbox
              v-if="isDepUserShow"
              v-model="isNeedChild"
              :true-label="1"
              :false-label="0"
              @change="refreshUserList">包含子部门</el-checkbox>
            <el-select
              v-model="employeeType"
              mode="no-border"
              style="width: 120px;margin-left: 8px;"
              @change="refreshUserList">
              <el-option
                v-for="item in employeeMenu"
                :key="item.type"
                :label="item.label"
                :value="item.type" />
            </el-select>
            <el-select
              v-if="isApplyUser"
              v-model="applyType"
              mode="no-border"
              style="width: 120px;margin-left: 8px;"
              @change="refreshUserList">
              <el-option
                v-for="item in [{label: '待审核邀请', value: 1}, {label: '已审核邀请', value: 2}]"
                :key="item.value"
                :label="item.label"
                :value="item.value" />
            </el-select>
            <el-button
              v-if="strucSaveAuth && currentMenuData && currentMenuData.deptId"
              type="text"
              style="margin-left: 8px;"
              @click="appendStruc(currentMenuData)">创建子部门</el-button>
            <el-dropdown
              v-if="currentMenuData && currentMenuData.deptId && strucMoreOptions.length > 0"
              trigger="click"
              @command="strucMoreHandleClick">
              <el-button icon="el-icon-more" class="dropdown-btn" />
              <el-dropdown-menu slot="dropdown">
                <el-dropdown-item
                  v-for="(item, index) in strucMoreOptions"
                  :key="index"
                  :command="item.type">{{ item.name }}</el-dropdown-item>
              </el-dropdown-menu>
            </el-dropdown>
          </div>
        </flexbox>
        <flexbox
          v-else
          class="selection-bar">
          <div class="selected—title">已选中 <span class="selected—count">{{ selectionList.length }}</span> 项</div>
          <flexbox class="selection-items-box">
            <el-button
              v-for="(item, index) in selectionInfo"
              :key="index"
              :icon="item.icon | wkIconPre"
              size="medium"
              @click.native="selectionBarClick(item.type)">{{ item.name }}</el-button>
          </flexbox>
        </flexbox>
        <div class="flex-box">
          <el-table
            id="depTable"
            v-loading="loading"
            :data="tableData"
            :class="WKConfig.tableStyle.class"
            :stripe="WKConfig.tableStyle.stripe"
            :height="tableHeight"
            @selection-change="handleSelectionChange"
            @row-click="rowClick">
            <el-table-column
              v-if="tableUpdateAuth"
              type="selection"
              width="55" />
            <el-table-column
              v-if="call"
              prop="call"
              align="right"
              min-width="36">
              <template
                slot="header"
                slot-scope="slot">
                <i class="el-icon-phone" />
              </template>
              <template slot-scope="scope">
                <i v-if="scope.row.hisTable === 1" class="el-icon-phone" style="color: rgb(70, 205, 207);" />
              </template>
            </el-table-column>
            <el-table-column
              v-if="!isApplyUser"
              prop="status"
              min-width="80"
              show-overflow-tooltip
              label="状态">
              <template slot-scope="{ row, column }">
                <span :style="{'background-color' : getStatusColor(row.status)}" class="status-mark" />
                <span>{{ getStatusName(row.status) }}</span>
              </template>
            </el-table-column>
            <el-table-column
              prop="realname"
              min-width="150"
              show-overflow-tooltip
              label="姓名">
              <template slot-scope="{ row, column }">
                <span class="status-name">
                  <span>{{ row.realname }}</span>
                  <el-tag v-if="row.userIdentity === 0" disable-transitions type="warning">主账号</el-tag>
                  <el-tag v-if="row.userIdentity === 1" disable-transitions type="warning">负责人</el-tag>
                </span>
              </template>
            </el-table-column>
            <el-table-column
              v-for="(item, index) in currentFieldList"
              :key="index"
              :min-width="item.width"
              :prop="item.field"
              :label="item.value"
              :formatter="tableFormatter"
              show-overflow-tooltip />
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
      </div>
    </div>
    <!-- 导航新增部门 -->
    <el-dialog
      :visible.sync="depCreateDialog"
      :close-on-click-modal="false"
      :title="depCreateTitle"
      :before-close="depCreateClose"
      width="500px">
      <flexbox class="nav-dialog-div">
        <label>部门名称：</label>
        <el-input
          v-model="depCreateLabelValue"
          :maxlength="20"
          placeholder="请输入内容" />
      </flexbox>
      <flexbox
        v-if="depSelect != 0"
        class="nav-dialog-div">
        <label>上级部门：</label>
        <el-select
          v-model="depSelect"
          :clearable="false">
          <el-option
            v-for="item in superDepList"
            :key="item.deptId"
            :label="item.name"
            :value="item.deptId" />
        </el-select>
      </flexbox>
      <flexbox
        class="nav-dialog-div">
        <label>部门负责人：</label>
        <wk-user-dialog-select
          v-model="depOwnerUserId"
          radio
        />
      </flexbox>
      <span
        slot="footer"
        class="dialog-footer">
        <el-button
          type="primary"
          @click="submitDialog">确定</el-button>
        <el-button @click="depCreateDialog = false">取消</el-button>
      </span>
    </el-dialog>
    <!-- 详情 -->
    <employee-detail
      v-if="employeeDetailDialog"
      :data.sync="selectUserObj"
      :page-list="tableData"
      @edit="editBtn"
      @command="handleCommand"
      @hide-view="employeeDetailDialog=false" />
    <!-- 重置密码 -->
    <el-dialog
      v-loading="loading"
      :visible.sync="resetPasswordVisible"
      :close-on-click-modal="false"
      :modal-append-to-body="false"
      :before-close="resetPasswordClose"
      title="重置密码"
      width="500px">
      <el-form
        ref="passForm"
        :model="passForm"
        :rules="rules">
        <el-form-item
          label="密码"
          class="wk-form-item"
          prop="password">
          <el-input
            v-model="passForm.password"
            type="password" />
        </el-form-item>
      </el-form>
      <span
        slot="footer"
        class="dialog-footer">
        <el-button
          type="primary"
          @click="passSubmit(passForm)">确定</el-button>
        <el-button @click="resetPasswordClose">取消</el-button>
      </span>
    </el-dialog>

    <!-- 重置登录账号 -->
    <el-dialog
      v-loading="loading"
      :visible.sync="resetUserNameVisible"
      :close-on-click-modal="false"
      :modal-append-to-body="false"
      :before-close="()=>{resetUserNameVisible = false}"
      title="重置登录账号"
      width="500px">
      <div class="el-password">
        <el-form
          ref="resetUserNameForm"
          :model="resetUserNameForm"
          :rules="dialogRules">
          <el-form-item
            label="新账号（手机号）"
            prop="username"
            class="wk-form-item">
            <el-input v-model="resetUserNameForm.username" />
          </el-form-item>
          <el-form-item
            label="新密码"
            prop="password"
            class="wk-form-item">
            <el-input
              v-model="resetUserNameForm.password"
              type="password" />
          </el-form-item>

          <template v-if="isManageReset">
            <el-popover
              v-model="slideVerifyShow"
              :disabled="slideVerifyPass || !canSlideVerify"
              placement="top-start"
              width="332"
              popper-class="no-padding-popover"
              trigger="click">
              <slide-verify
                :phone="resetUserNameForm.username"
                slider-text="向右滑动"
                @success="sliderSuccess"
                @fail="sliderFail"
                @refresh="sliderRefresh"
                @close="slideVerifyShow = false" />
              <div
                slot="reference"
                :class="{success: slideVerifyPass}"
                class="verify-picture">
                <template v-if="!slideVerifyPass">
                  <img
                    src="~@/assets/login/verify_picture.png"
                    alt=""
                    class="icon">
                  <span class="text">点击完成验证</span>
                </template>
                <template v-else>
                  <img
                    src="~@/assets/login/verify_success.png"
                    alt=""
                    class="icon">
                  <span class="text">验证成功</span>
                </template>
              </div>
            </el-popover>

            <el-form-item class="wk-form-item">
              <div class="sms-box">
                <el-input
                  ref="smscode"
                  v-model.trim="resetUserNameForm.smscode"
                  placeholder="请输入短信验证码" />
                <el-button
                  :disabled="codeTime !== codeSecond"
                  @click="getSmsCode">
                  <div class="btn-content">
                    <template v-if="codeTime === codeSecond">
                      <!--<span class="icon wk wk-shouji" />-->
                      <span>获取验证码</span>
                    </template>
                    <template v-else>
                      <span>重新发送({{ codeSecond }}s)</span>
                    </template>
                  </div>
                </el-button>
              </div>
            </el-form-item>
          </template>
        </el-form>
        <div
          class="tips"
          style="margin-top: 20px;">重置登录帐号后，员工需用新账号登录。请及时告知员工，确保正常使用</div>
      </div>
      <span
        slot="footer"
        class="dialog-footer">
        <el-button
          type="primary"
          @click="passUserNameSubmit(resetUserNameForm)">确定</el-button>
        <el-button @click="()=>{resetUserNameVisible = false}">取消</el-button>
      </span>
    </el-dialog>

    <!-- 新建和编辑 -->
    <el-dialog
      v-if="employeeCreateDialog"
      v-loading="loading"
      :title="userEditTitle"
      :visible.sync="employeeCreateDialog"
      :close-on-click-modal="false"
      :modal-append-to-body="true"
      :append-to-body="true"
      :before-close="newHandleClose"
      width="700px">
      <el-form
        ref="dialogRef"
        class="wk-form"
        :model="userEditForm"
        :rules="dialogRules"
        label-position="top">
        <el-form-item
          v-for="(item, index) in tableList"
          :key="index"
          :label="item.value"
          :prop="item.field"
          class="wk-form-item">
          <span slot="label">{{ item.value }}</span>
          <i
            v-if="item.helpType"
            slot="label"
            class="wk wk-icon-fill-help wk-help-tips"
            :data-type="item.helpType"
            :data-id="item.helpId"
            @click.stop="" />
          <template v-if="item.type == 'select'">
            <el-select
              v-model="userEditForm[item.field]"
              filterable>
              <el-option
                v-for="optionItem in optionsList[item.field]"
                :key="optionItem.id"
                :label="optionItem.name"
                :value="optionItem.id" />
            </el-select>
          </template>
          <template v-else-if="item.type == 'user'">
            <wk-user-dialog-select
              v-model="userEditForm[item.field]"
              radio
            />
          </template>
          <template v-else-if="item.type == 'structure'">
            <wk-dept-dialog-select
              v-model="userEditForm[item.field]"
              radio
              @change="depChange"
            />
          </template>
          <template v-else-if="item.type == 'selectCheckout'">
            <el-select
              v-model="userEditForm[item.field]"
              :popper-append-to-body="false"
              :disabled="(selectUserObj && selectUserObj.userIdentity === 0) || item.disable"
              popper-class="select-popper-class"
              filterable
              multiple>
              <el-option-group
                v-for="group in groupsList"
                :key="group.parentId"
                :label="group.name">
                <el-option
                  v-for="item in group.list"
                  :key="item.roleId"
                  :label="item.roleName"
                  :value="item.roleId" />
              </el-option-group>
            </el-select>
          </template>
          <el-input
            v-else
            v-model="userEditForm[item.field]"
            :maxlength="100"
            :disabled="userEditType == 'userEdit' && item.field == 'username'" />
        </el-form-item>
      </el-form>
      <span
        slot="footer"
        class="dialog-footer">
        <el-button
          type="primary"
          @click="newDialogSubmit">保存</el-button>
        <el-button @click="employeeCreateDialog = false">取消</el-button>
      </span>
    </el-dialog>
    <el-dialog
      :visible.sync="callVisible"
      title="提示"
      width="500px">
      <span> 这些员工账号将被开启呼叫中心，是否继续?</span>
      <div style="margin-top: 20px;">
        <el-radio v-model="callType" :label="1">软呼</el-radio>
        <el-radio v-model="callType" :label="0">硬呼（单卡）</el-radio>
        <el-radio v-model="callType" :label="2">硬呼（多卡）</el-radio>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="setCall">确定</el-button>
        <el-button @click="callVisible=false">取消</el-button>
      </span>
    </el-dialog>
    <el-dialog
      :visible.sync="callInfoVisible"
      title="修改成功"
      width="500px">
      <template v-for="(item,index) in callInfo">
        <div :key="index">
          {{ `姓名：${item.realName}，座机号：${item.agent}` }}
        </div>
      </template>

      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="callInfoVisible = false">确 定</el-button>
      </span>
    </el-dialog>

    <!-- 批量导入 -->
    <bulk-import-user
      :show="bulkImportShow"
      @close="bulkImportShow=false"
      @success="addSuccess" />
    <!-- 角色编辑 -->
    <edit-role-dialog
      v-if="editRoleDialogShow"
      :user-show="editRoleType === 'copyRole'"
      :selection-list="selectionList"
      :visible.sync="editRoleDialogShow"
      @change="getUserList"
    />
    <!-- 重置部门 -->
    <edit-dep-dialog
      v-if="editDepDialogShow"
      :selection-list="selectionList"
      :visible.sync="editDepDialogShow"
      @change="getUserList"
    />
  </div>
</template>

<script>
import {
  depDeleteAPI,
  depEditAPI,
  depSaveAPI,
  userAddAPI,
  userEditAPI,
  crmCallAuthorizeAPI,
  adminRoleGetRoleListAPI,
  adminRoleQueryDefaultAPI,
  adminUsersUpdatePwdAPI,
  adminUsersUsernameEditAPI,
  adminUsersManagerUsernameEditAPI,
  usersEditStatusAPI,
  adminUserCountNumOfUserAPI
} from '@/api/admin/employeeDep'
import {
  adminSystemCallSetAPI
} from '@/api/admin/config'
import {
  userListAPI,
  depListAPI,
  queryPageByStatus,
  checkUserApply,
  deleteUserApply,
  deleteUserAccount
} from '@/api/common' // 直属上级接口
import { sendSmsAPI } from '@/api/login'

import { mapGetters } from 'vuex'

import BulkImportUser from './components/BulkImportUser'
import EmployeeDetail from './components/EmployeeDetail'
import XrHeader from '@/components/XrHeader'
// import Reminder from '@/components/Reminder'
import SlideVerify from '@/components/SlideVerify'
import EditRoleDialog from './components/EditRoleDialog'
import EditDepDialog from './components/EditDepDialog'
import WkUserDialogSelect from '@/components/NewCom/WkUserDialogSelect'
import WkDeptDialogSelect from '@/components/NewCom/WkDeptDialogSelect'

import { chinaMobileRegex, objDeepCopy } from '@/utils'
import { isArray } from '@/utils/types'

export default {
  /** 系统管理 的 员工部门管理 */
  name: 'EmployeeDep',
  components: {
    EmployeeDetail,
    BulkImportUser,
    XrHeader,
    // Reminder,
    SlideVerify,
    EditRoleDialog,
    EditDepDialog,
    WkUserDialogSelect,
    WkDeptDialogSelect
  },
  data() {
    return {
      userCountObj: {},
      employeeType: 'all',
      employeeMenu: [
        {
          icon: 'wk wk-employees', // icon
          label: '所有员工',
          type: 'all',
          field: 'allUserCount', // count数量对应的字段
          count: 0,
          tips: '' // 解释
        },
        {
          icon: 'wk wk-new-employee',
          label: '新加入的员工',
          type: 'new',
          field: 'addNewlyCount',
          count: 0,
          tips: '入职7天内的员工'
        },
        {
          icon: 'wk wk-active-employee',
          label: '激活员工',
          type: 'active',
          field: 'activateCount',
          count: 0,
          tips: '已经登录系统的员工'
        },
        {
          icon: 'wk wk-inactive-employee',
          label: '未激活员工',
          type: 'inactive',
          field: 'inactiveCount',
          count: 0,
          tips: '未登录过系统的员工'
        },
        {
          icon: 'wk wk-disable-employees',
          label: '停用员工',
          type: 'disable',
          field: 'disableCount',
          count: 0,
          tips: '已禁用的员工，无法登录系统'
        },
        {
          icon: '',
          label: '邀请成员审核',
          type: 'applyUser',
          field: 'applyUserCount',
          count: 0,
          tips: ''
        }
      ],
      applyType: 1, // 邀请人激活的tabs 默认1
      isStartCall: true, // 需要控制权限调整这里
      // 右边导航
      depCreateType: 'depCreate',
      depCreateDialog: false, // 控制部门新增 编辑 数据
      depSelect: '',
      // 上级部门
      superDepList: [],
      depCreateLabelValue: '',
      depOwnerUserId: '', // 部门负责人
      allDepData: [], // 包含全部部门信息
      showDepData: [],
      depLoading: false, // 左侧部门loading效果
      // 列表
      loading: false, // 表的加载动画
      searchInput: '', // 搜索
      // selectModel: '', // 状态值 用于筛选
      // 列表
      fieldList: [
        { field: 'username', value: '手机号（登录名）', width: '150' },
        { field: 'sex', value: '性别', type: 'select', width: '50' },
        { field: 'email', value: '邮箱', width: '150' },
        { field: 'deptName', value: '部门', type: 'select', width: '100' },
        { field: 'post', value: '岗位', width: '150' },
        {
          field: 'parentName',
          value: '直属上级',
          type: 'select',
          width: '150'
        },
        {
          field: 'roleName',
          value: '角色',
          type: 'selectCheckout',
          width: '150'
        }

      ],
      selectionList: [], // 批量勾选数据
      tableData: [],
      tableHeight: document.documentElement.clientHeight - 240, // 表的高度
      // 分页逻辑
      currentMenuData: null,
      // structureValue: '', // 左侧列表选中的值 用于筛选
      currentPage: 1,
      isNeedChild: 1, // 是否展示子级部门 0不需要 1 需要
      pageSize: 15,
      pageSizes: [15, 30, 45, 60],
      total: 0,
      // userTotal: 0, // 当前下总数
      employeeDetailDialog: false,
      selectUserObj: {},
      // 新建和编辑
      employeeCreateDialog: false,
      userEditType: 'userCreate', // userEdit
      userEditForm: {},
      // 编辑部门时id
      treeEditId: '',
      optionsList: {
        sex: [
          { id: 0, name: '请选择' },
          { id: 1, name: '男' },
          { id: 2, name: '女' }
        ]
      },
      groupsList: [],
      groupsIdList: [], // 保存id 用来验证是否存
      // 重置密码
      resetPasswordVisible: false,
      rules: {
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' },
          {
            pattern: /^(?=.*[a-zA-Z])(?=.*\d).{6,20}$/,
            message: '密码由6-20位字母、数字组成'
          }
        ],
        username: [
          { required: true, message: '手机号不能为空', trigger: 'blur' }
        ]
      },
      passForm: {},
      dialogRules: {
        realname: [
          { required: true, message: '姓名不能为空', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '密码不能为空', trigger: 'blur' },
          {
            pattern: /^(?=.*[a-zA-Z])(?=.*\d).{6,20}$/,
            message: '密码由6-20位字母、数字组成'
          }
        ],
        username: [
          { required: true, message: '手机号码不能为空', trigger: 'blur' },
          {
            pattern: chinaMobileRegex,
            message: '目前只支持中国大陆的手机号码',
            trigger: 'blur'
          }
        ],
        email: [
          {
            pattern: /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/,
            message: '请输入正确的邮箱格式',
            trigger: 'blur'
          }
        ],
        // parentId: [
        //   { required: true, message: '直属上级不能为空', trigger: 'change' }
        // ],
        deptId: [
          { required: true, message: '部门不能为空', trigger: 'change' }
        ],
        // roleId: [{ required: true, message: '角色不能为空', trigger: 'change' }]
        num: [{ required: true, message: '员工编号不能为空', trigger: 'change' }]
      },
      // 重置登录账号
      resetUserNameVisible: false,
      resetUserNameForm: {
        username: '',
        password: ''
      },
      isManageReset: false, // 是管理员重置密码
      slideVerifyShow: false,
      slideVerifyPass: false,
      codeTime: 60,
      codeSecond: 60,
      codeTimer: null,
      // 批量导入
      bulkImportShow: false,
      // 角色操作
      editRoleType: '',
      editRoleDialogShow: false,
      // 重置部门
      editDepDialogShow: false,
      callVisible: false, // 开启呼叫中心
      callType: 1,
      callInfoVisible: false,
      callInfo: [], // 软乎信息

      defaultRole: null // 默认角色
    }
  },
  computed: {
    ...mapGetters(['manage', 'call']),
    // 员工创建权限
    userSaveAuth() {
      return this.manage && this.manage.users && this.manage.users.userSave
    },
    // 员工编辑操作权限
    userUpdateAuth() {
      return this.manage && this.manage.users && this.manage.users.userUpdate
    },
    // 员工禁用启用权限
    userEnablesAuth() {
      return this.manage && this.manage.users && this.manage.users.userEnables
    },
    // 员工列表的勾选编辑 角色操作在里面 userUpdateRoleAuth
    tableUpdateAuth() {
      return this.userEnablesAuth || this.userUpdateAuth || this.userUpdateRoleAuth
    },
    // 邀请员工列表 不展示状态
    isApplyUser() {
      return this.employeeType === 'applyUser'
    },
    // 部门新建权限
    strucSaveAuth() {
      return this.manage && this.manage.users && this.manage.users.deptSave
    },
    // 部门编辑权限
    strucUpdateAuth() {
      return this.manage && this.manage.users && this.manage.users.deptUpdate
    },
    // 部门删除权限
    strucDeleteAuth() {
      return this.currentMenuData && this.currentMenuData.parentId != '0' && this.manage && this.manage.users && this.manage.users.deptDelete
    },
    // 员工编辑角色权限
    userUpdateRoleAuth() {
      return this.manage && this.manage.permission
    },
    /**
     * 部门更多操作
     */
    strucMoreOptions() {
      const moreList = []
      if (this.strucUpdateAuth) {
        moreList.push({ type: 'edit', name: '编辑部门', icon: 'edit' })
      }

      if (this.strucDeleteAuth) {
        moreList.push({ type: 'delete', name: '删除部门', icon: 'delete' })
      }

      return moreList
    },

    /**
     * 过滤table表头
     */
    currentFieldList() {
      let temps = []
      if (this.isApplyUser) {
        temps.push({
          field: 'username',
          value: '手机号（登录名）',
          width: '150'
        })
        temps.push({
          field: 'inviteUserName',
          value: '邀请人',
          width: '150'
        })
      } else {
        temps = this.fieldList
      }
      return temps
    },

    selectionInfo: function() {
      let temps = []
      let call = []
      if (this.isApplyUser) {
        temps = [
          {
            name: '通过',
            type: 'pass',
            icon: 'wk wk-success'
          },
          {
            name: '拒绝',
            type: 'refuse',
            icon: 'wk wk-close'
          }
        ]
      } else {
        if (this.userEnablesAuth) {
          temps = [
            {
              name: '禁用',
              type: 'lock',
              icon: 'wk wk-remove'
            },
            {
              name: '激活',
              type: 'unlock',
              icon: 'wk wk-activation'
            }
          ]
        }
        if (this.isStartCall) {
          call = [
            {
              name: '启用呼叫中心',
              type: 'setCall',
              icon: 'wk wk-activation'
            },
            {
              name: '停用呼叫中心',
              type: 'stopCall',
              icon: 'wk wk-remove'
            }
          ]
          temps = temps.concat(call)
        }
        if (this.userUpdateAuth) {
          if (this.selectionList.length === 1) {
            temps = temps.concat([
              {
                name: '编辑',
                type: 'edit',
                icon: 'wk wk-edit'
              },
              {
                name: '重置密码',
                type: 'reset',
                icon: 'wk wk-circle-password'
              }
            ])
          } else {
            temps = temps.concat([
              {
                name: '重置密码',
                type: 'reset',
                icon: 'wk wk-circle-password'
              }
            ])
          }
        }

        if (this.userUpdateRoleAuth) {
          if (this.selectionList.length === 1) {
            temps.push({
              name: '复制角色',
              type: 'copyRole',
              icon: 'wk wk-icon-double-note'
            })
          }

            

          const hasMianAccount = this.selectionList.filter(item => item.userIdentity === 0)
          if (hasMianAccount.length === 0) {
            temps.push({
              name: '编辑角色',
              type: 'editRole',
              icon: 'wk wk-edit'
            })

            temps.push({
              name: '删除',
              type: 'delete',
              icon: 'wk wk-icon-delete-line'
            })
          }
        }

        if (this.userUpdateAuth) {
          temps.push({
            name: '重置部门',
            type: 'editDep',
            icon: 'wk wk-employees'
          })
        }
      }

      return temps
    },
    /** 添加列表 */
    tableList: function() {
      const arr = [
        { field: 'realname', value: '姓名' },
        { field: 'sex', value: '性别', type: 'select' },
        { field: 'email', value: '邮箱' },
        { field: 'deptId', value: '部门', type: 'structure' },
        { field: 'post', value: '岗位' },
        { field: 'parentId', value: '直属上级', type: 'user' },
        { field: 'roleId', value: '角色', type: 'selectCheckout', helpType: '21', helpId: '171', disable: !this.userUpdateRoleAuth },
        { field: 'num', value: '员工编号', type: 'num' }
      ]
      if (this.userEditType === 'userCreate') {
        return [
          { field: 'username', value: '手机号（登录名）', helpType: '21', helpId: '263' },
          { field: 'password', value: '登录密码' },
          ...arr
        ]
      } else {
        return [
          {
            field: 'username',
            value: '手机号（登录名）',
            helpType: '21', helpId: '171'
          },
          ...arr
        ]
      }
    },

    /**
     * 能进行滑动验证
     */
    canSlideVerify() {
      return chinaMobileRegex.test(this.resetUserNameForm.username)
    },

    /**
     * 是查看部门员工
     */
    isDepUserShow() {
      return this.currentMenuData && this.currentMenuData.deptId
    },

    // 滑动验证配置项
    slideVerifyProps() {
      return {
        verifyRequest: verfyCodeAPI
      }
    },

    // 部门编辑弹框标题
    depCreateTitle() {
      return this.depCreateType === 'depCreate' ? '新建部门' : '编辑部门'
    },

    // 员工编辑弹框标题
    userEditTitle() {
      return this.depCreateType === 'userCreate' ? '新建员工' : '编辑员工'
    }
  },
  mounted() {
    /** 控制table的高度 */
    window.onresize = () => {
      this.tableHeight = document.documentElement.clientHeight - 240
    }

    // 部门树形列表
    // this.currentMenuData = this.employeeMenu[0]
    this.enterDefaultMenu()
    this.getUserList()
    this.getCallAuth()
    this.getUserCount()
  },
  methods: {
    /**
     * 到默认第一个数据行
     */
    enterDefaultMenu() {
      this.getDepTreeList().then(() => {
        if (this.showDepData.length > 0) {
          this.changeDepClick(this.showDepData[0])
          this.$nextTick(() => {
            this.$refs.tree.setCurrentNode(this.showDepData[0])
          })
        }
      })
    },

    /**
     * 员工数量
     */
    getUserCount() {
      this.depLoading = true
      adminUserCountNumOfUserAPI().then(res => {
        this.depLoading = false
        const resData = res.data || {}
        this.employeeMenu.forEach(item => {
          item.count = resData[item.field]
        })
        this.userCountObj = resData
        // this.userTotal = this.currentMenuData.count
      }).catch(() => {
        this.depLoading = false
      })
    },

    /**
     * 选择部门
     */
    changeDepClick(data) {
      this.currentMenuData = data
      // this.userTotal = this.currentMenuData.currentNum
      // this.structureValue = data.id
      this.refreshUserList()
    },

    // /**
    //  * 选择员工
    //  */
    // changeUserClick(data) {
    //   // this.structureValue = ''
    //   this.currentMenuData = data
    //   // this.userTotal = this.currentMenuData.count
    //   this.refreshUserList()
    // },

    /**
     * 刷新员工列表
     */
    refreshUserList() {
      this.currentPage = 1
      this.getUserList()
    },

    /**
     * 用户列表
     */
    getUserList() {
      this.loading = true
      const params = {
        page: this.currentPage,
        limit: this.pageSize,
        realname: this.searchInput
      }
      let reuqest = userListAPI
      if (this.isDepUserShow) {
        params.isNeedChild = this.isNeedChild
      }

      // 员工类型筛选
      if (this.employeeType !== 'all') {
        if (this.employeeType == 'active') {
          params.status = 1
        } else if (this.isApplyUser) {
          params.type = this.applyType // 1.待审核邀请 2.已审核邀请
          reuqest = queryPageByStatus
        } else {
          params.label = {
            all: 0,
            new: 1,
            inactive: 2,
            disable: 3
          }[this.employeeType]
        }
      }

      // 部门筛选
      if (this.currentMenuData && this.currentMenuData.deptId) {
        params.deptId = this.currentMenuData.deptId
      }
      reuqest(params)
        .then(res => {
          this.tableData = res.data.list
          this.total = res.data.totalRow
          this.loading = false
        })
        .catch(() => {
          this.loading = false
        })
    },

    /**
     * 头部搜索
     */
    headerSearch() {
      this.refreshUserList()
    },

    /**
     * 批量导入
     */
    bulkImportClick() {
      this.bulkImportShow = true
    },

    // /**
    //  * 展开闭合操作
    //  */
    // handleExpand(type, node, data) {
    //   if (type == 'close') {
    //     if (data.children) {
    //       node.expanded = false
    //     }
    //   } else if (type == 'open') {
    //     node.expanded = true
    //   }
    // },
    handleClose() {
      this.employeeDetailDialog = false
    },

    /**
     * 第一列点击事件
     */
    rowClick(row, column, event) {
      this.selectUserObj = row
      if (column.property == 'realname') {
        this.employeeDetailDialog = true
      }
    },

    /**
     * 新建和编辑
     */
    newHandleClose() {
      this.employeeCreateDialog = false
    },

    /**
     * 新建用户
     */
    addEmployee() {
      this.getHandleEmployeeRelateData()
      this.userEditType = 'userCreate'
      this.userEditForm = {
        roleId: [],
        deptId:
          this.currentMenuData && this.currentMenuData.deptId
            ? this.currentMenuData.deptId
            : '',
        parentId: this.currentMenuData && this.currentMenuData.ownerUserId && this.currentMenuData.ownerUserId != '0'
          ? this.currentMenuData.ownerUserId
          : ''
      }

      this.selectUserObj = null // 清除编辑数据 防止影响角色是否可编辑
      this.employeeCreateDialog = true
    },

    /**
     * 编辑员工单选change
     */
    depChange(_, data) {
      const obj = data && data.length > 0 ? data[0] : null
      this.$set(this.userEditForm, 'parentId', obj ? obj.ownerUserId : '')
    },

    /**
     * 选择或者新建员工
     */
    createEmployeeClick(command) {
      if (command === 'bulkImport') {
        this.bulkImportClick()
      }
    },

    /**
     * addSuccess
     */
    addSuccess() {
      this.$store.dispatch('GetUserDepMap')
      this.refreshUserList()
    },

    /**
     * 新建或编辑员工 需要获取的信息
     */
    getHandleEmployeeRelateData() {
      this.getRoleList()
    },

    // 详情 -- 编辑用户
    async editBtn() {
      this.userEditType = 'userEdit'
      await this.getRoleList()
      var detail = {}
      for (let index = 0; index < this.tableList.length; index++) {
        const element = this.tableList[index]
        if (element.field !== 'password') {
          if (element.field === 'roleId') {
            const allRoleIds = this.selectUserObj.roleId
              ? this.selectUserObj.roleId
                .split(',')
              : []

            const otherRoleIds = [] // 因为有可查看角色权限，把不能查看的权限，存入otherRoleIds，保存时候拼入
            const roleIds = []
            allRoleIds.forEach(roleId => {
              if (this.groupsIdList.includes(roleId)) {
                roleIds.push(roleId)
              } else {
                otherRoleIds.push(roleId)
              }
            })
            detail.otherRoleIds = otherRoleIds
            detail[element.field] = roleIds
          } else if (element.field === 'parentId') {
            detail.parentId = this.selectUserObj.parentId && this.selectUserObj.parentId != '0' ? this.selectUserObj.parentId
              : ''
          } else if (element.field === 'deptId') {
            detail.deptId = this.selectUserObj.deptId
          } else {
            detail[element.field] = this.selectUserObj[element.field]
          }
        }
      }
      detail['userId'] = this.selectUserObj.userId
      this.userEditForm = detail
      this.employeeCreateDialog = true
    },

    /**
     * 获取角色列表
     */
    getRoleList() {
      // 角色列表
      return Promise.all([
        adminRoleGetRoleListAPI(), // 全部角色
        adminRoleQueryDefaultAPI() // 系统默认角色
      ]).then(resArr => {
        this.groupsList = resArr[0].data || []
        const groupsIdList = []
        this.groupsList.forEach(group => {
          if (group.list) {
            group.list.forEach(item => {
              groupsIdList.push(item.roleId)
            })
          }
        })
        this.groupsIdList = groupsIdList

        this.defaultRole = resArr[1].data
        if (this.defaultRole) {
          this.groupsList.push({
            name: '默认',
            parentId: -1,
            list: [this.defaultRole]
          })
        }
      }).catch(() => {})
    },

    /**
     * 创建部门
     */
    addStruc() {
      const id =
        this.allDepData && this.allDepData.length ? this.allDepData[0].deptId : ''
      if (id) {
        this.depCreateLabelValue = ''
        this.depCreateType = 'depCreate'
        this.depSelect = id
        this.getStructuresListBySuperior({ id: id, type: 'save' })
        this.depCreateDialog = true
      }
    },

    /**
     * 部门更多操作
     */
    strucMoreHandleClick(command) {
      if (command == 'edit') {
        this.editStruc(this.currentMenuData)
      } else if (command == 'delete') {
        this.deleteStruc(this.currentMenuData)
      }
    },

    /**
     * 新增部门
     */
    appendStruc(data) {
      this.depCreateLabelValue = ''
      this.depCreateType = 'depCreate'
      this.depSelect = data.deptId
      this.depOwnerUserId = ''
      this.getStructuresListBySuperior({ id: data.deptId, type: 'save' })
      this.depCreateDialog = true
    },

    /**
     * 获取新增部门 上级部门信息
     */
    getStructuresListBySuperior(data) {
      this.superDepList = []
      depListAPI(data)
        .then(response => {
          this.superDepList = response.data
        })
        .catch(() => {})
    },

    /**
     * 编辑部门
     */
    editStruc(data) {
      this.depCreateLabelValue = data.name
      this.treeEditId = data.deptId
      this.depSelect = data.parentId
      this.depOwnerUserId = data.ownerUserId
      this.depCreateType = 'depUpdate'
      this.getStructuresListBySuperior({ id: data.deptId, type: 'update' })
      this.depCreateDialog = true
    },

    /**
     * 删除部门
     */
    deleteStruc(data) {
      this.$confirm(`此操作将删除${data.name}部门，是否继续？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
        .then(() => {
          this.loading = true
          depDeleteAPI({ id: data.deptId })
            .then(res => {
              this.enterDefaultMenu()
              // this.currentMenuData = this.employeeMenu[0]
              this.$message.success('删除成功')
              this.loading = false
            })
            .catch(() => {
              this.loading = false
            })
        })
        .catch(() => {
          this.$message({
            type: 'info',
            message: '已取消删除'
          })
        })
    },
    // 关闭新增或编辑
    depCreateClose() {
      this.depCreateDialog = false
    },
    // 新增或编辑确定按钮
    submitDialog() {
      if (this.depCreateLabelValue === '') {
        this.$message.error('部门名称不能为空!')
        return
      }
      if (this.depCreateType === 'depCreate') {
        depSaveAPI({
          name: this.depCreateLabelValue,
          parentId: this.depSelect,
          ownerUserId: this.depOwnerUserId
        }).then(
          res => {
            this.$store.dispatch('GetUserDepMap')
            this.getDepTreeList()
            this.depCreateClose()
          }
        )
      } else {
        depEditAPI({
          name: this.depCreateLabelValue,
          deptId: this.treeEditId,
          parentId: this.depSelect,
          ownerUserId: this.depOwnerUserId
        }).then(res => {
          this.$store.dispatch('GetUserDepMap')
          this.$message.success('操作成功')
          this.getDepTreeList()
          this.depCreateClose()
        })
      }
    },
    // 获取树形列表
    getDepTreeList() {
      return new Promise((resolve) => {
        this.depLoading = true
        depListAPI({ type: 'tree' })
          .then(response => {
            this.allDepData = response.data
            this.showDepData = response.data || []
            this.depLoading = false
            resolve()
          })
          .catch(() => {
            this.depLoading = false
          })
      })
    },

    // 用户新建
    newDialogSubmit() {
      this.$refs.dialogRef.validate(valid => {
        if (valid) {
          if (this.userEditType == 'userCreate') {
            this.loading = true
            const userEditForm = objDeepCopy(this.userEditForm)
            userEditForm.roleId = userEditForm.roleId.join(',')
            userAddAPI(userEditForm)
              .then(res => {
                this.$message.success('新增成功')
                this.employeeCreateDialog = false
                this.refreshUserList()
                this.getUserCount()
                this.loading = false

                this.$store.dispatch('GetUserDepMap')
              })
              .catch(() => {
                this.loading = false
              })
          } else {
            const userEditForm = objDeepCopy(this.userEditForm)
            if (isArray(userEditForm.otherRoleIds)) {
              const roleIds = Array.from(new Set(userEditForm.roleId.concat(userEditForm.otherRoleIds)))
              userEditForm.roleId = roleIds.join(',')
              delete userEditForm.otherRoleIds
            } else {
              userEditForm.roleId = userEditForm.roleId.join(',')
            }
            if (!userEditForm.roleId) {
              this.$confirm('您没有为该员工添加角色，系统将自动给该员工添加一个默认角色, 是否继续?', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
              }).then(() => {
                userEditForm.roleId = this.defaultRole.roleId
                this.updateUserReq(userEditForm)
              }).catch(() => {})
            } else {
              this.updateUserReq(userEditForm)
            }
          }
        } else {
          // 提示第一个error
          if (this.$refs.dialogRef.fields) {
            for (
              let index = 0;
              index < this.$refs.dialogRef.fields.length;
              index++
            ) {
              const ruleField = this.$refs.dialogRef.fields[index]
              if (ruleField.validateState == 'error') {
                this.$message.error(ruleField.validateMessage)
                break
              }
            }
          }
          return false
        }
      })
    },

    updateUserReq(params) {
      this.loading = true
      userEditAPI(params)
        .then(res => {
          if (this.employeeDetailDialog) {
            this.employeeDetailDialog = false
          }
          this.employeeCreateDialog = false
          this.$message.success('编辑成功')
          this.getUserList()
          this.loading = false
        })
        .catch(() => {
          this.loading = false
        })
    },

    setCall() {
      this.loading = true
      const userIds = this.selectionList
        .map(item => item.userId)
      crmCallAuthorizeAPI({
        userIds,
        state: 1,
        hisUse: this.callType
      })
        .then(res => {
          this.loading = false
          this.callVisible = false
          if (res.data.length > 0) {
            this.callInfo = res.data
            this.callInfoVisible = true
          } else {
            this.$message.success('修改成功')
          }
          this.usersListFun()
        })
        .catch(() => {
          this.loading = false
        })
    },
    // 详情里面点击事件
    handleCommand(command) {
      switch (command) {
        case 'reset':
          // 当前登录用户ID
          this.passForm = {
            password: ''
          }
          this.resetPasswordVisible = true
          break
        case 'status':
          usersEditStatusAPI({
            ids: [this.selectUserObj.userId],
            status: this.selectUserObj.status === 0 ? 1 : 0
          }).then(res => {
            this.employeeDetailDialog = false
            this.$message.success('修改成功')
            this.getUserList()
          })
          break
      }
    },

    /** 操作 */
    async selectionBarClick(type) {
      var ids = this.selectionList
        .map(function(item, index, array) {
          if (type === 'pass' || type === 'refuse') {
            return item.id
          } else {
            return item.userId
          }
        })
        .join(',')
      if (type === 'lock' || type === 'unlock') {
        var message = type === 'lock' ? '禁用' : '激活'
        this.$confirm('这些员工账号将被' + message + ', 是否继续?', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
          .then(() => {
            this.loading = true
            usersEditStatusAPI({
              ids: ids.split(','),
              status: type === 'unlock' ? 1 : 0
            })
              .then(res => {
                this.loading = false
                this.$message.success('修改成功')
                this.getUserCount()
                this.getUserList()
              })
              .catch(() => {
                this.loading = false
              })
          })
          .catch(() => {
            this.$message({
              type: 'info',
              message: '已取消删除'
            })
          })
      } else if (type === 'reset') {
        this.resetPasswordVisible = true
      } else if (type === 'edit') {
        this.selectUserObj = this.selectionList[0]

        this.userEditType = 'userEdit'
        await this.getRoleList()
        var detail = {}
        for (let index = 0; index < this.tableList.length; index++) {
          const element = this.tableList[index]
          if (element.field !== 'password') {
            if (element.field === 'roleId') {
              const allRoleIds = this.selectUserObj.roleId
                ? this.selectUserObj.roleId
                  .split(',')
                : []

              const otherRoleIds = [] // 因为有可查看角色权限，把不能查看的权限，存入otherRoleIds，保存时候拼入
              const roleIds = []
              allRoleIds.forEach(roleId => {
                if (this.groupsIdList.includes(roleId)) {
                  roleIds.push(roleId)
                } else {
                  otherRoleIds.push(roleId)
                }
              })
              detail.otherRoleIds = otherRoleIds
              detail[element.field] = roleIds
            } else if (element.field === 'parentId') {
              detail.parentId = this.selectUserObj.parentId && this.selectUserObj.parentId != '0' ? this.selectUserObj.parentId : ''
            } else if (element.field === 'deptId') {
              detail.deptId = this.selectUserObj.deptId
            } else {
              detail[element.field] = this.selectUserObj[element.field]
            }
          }
        }
        detail['userId'] = this.selectUserObj.userId
        this.userEditForm = detail
        this.employeeCreateDialog = true
      } else if (type === 'setCall') {
        this.callVisible = true
      } else if (type === 'stopCall') {
        var callSet = type === 'setCall' ? '启用呼叫中心' : '禁用呼叫中心'
        this.$confirm('这些员工账号将被' + callSet + ', 是否继续?', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          this.loading = true
          let userIds = []
          if (ids) {
            userIds = ids.split(',')
          } else {
            userIds = []
          }
          crmCallAuthorizeAPI({
            userIds,
            state: type === 'setCall' ? 1 : 0
          })
            .then(res => {
              this.loading = false
              this.$message.success('修改成功')
              this.usersListFun()
            })
            .catch(() => {
              this.loading = false
            })
        })
          .catch(() => {
            this.$message({
              type: 'info',
              message: '已取消操作'
            })
          })
      } else if (type === 'editRole' || type === 'copyRole') {
        this.editRoleType = type
        this.editRoleDialogShow = true
      } else if (type === 'editDep') {
        this.editDepDialogShow = true
      }else if (type == 'delete'){
        this.$confirm('您确定删除' + '' + this.selectionList.length + '个成员吗?', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then( () => {
          let params =this.selectionList.map(item=>item.userId)
          
          deleteUserAccount(params).then(res => {
              this.loading = false
              this.$message.success('删除成功')
              this.getUserCount()
              this.refreshUserList()
            }).catch(() => {
              this.loading = false
            })
        })
      }else if (type === 'pass' || type === 'refuse') {
        var message = type === 'pass' ? '通过' : '拒绝'
        this.$confirm('您确定' + message + '' + this.selectionList.length + '个成员吗?', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
          .then(() => {
            const request = type === 'pass' ? checkUserApply : deleteUserApply
            const params = {
              ids: ids.split(',')
            }
            params.status = type === 'pass' ? 1 : 4
            this.loading = true
            request(params).then(res => {
              this.loading = false
              this.$message.success('修改成功')
              this.getUserCount()
              this.refreshUserList()
            }).catch(() => {
              this.loading = false
            })
          })
          .catch(() => {
            this.$message({
              type: 'info',
              message: `已取消${message}`
            })
          })
      }
    },
    // 重置密码 -- 关闭按钮
    resetPasswordClose() {
      this.resetPasswordVisible = false
    },
    // 重置密码 -- 确定按钮
    passSubmit(val) {
      this.$refs.passForm.validate(valid => {
        if (valid) {
          var ids = []
          if (this.selectionList.length > 0) {
            ids = this.selectionList
              .map(function(item, index, array) {
                return item.userId
              })
          } else {
            ids.push(this.selectUserObj.userId)
          }
          val.ids = ids
          this.loading = true
          adminUsersUpdatePwdAPI(val)
            .then(res => {
              this.$message.success('重置成功')
              this.resetPasswordClose()
              this.loading = false
            })
            .catch(() => {
              this.loading = false
            })
        } else {
          return false
        }
      })
    },
    /**
     * 重置登录账号
     */
    passUserNameSubmit(val) {
      this.$refs.resetUserNameForm.validate(valid => {
        if (valid) {
          if (this.selectionList.length > 0) {
            val.id = this.selectionList[0].userId
            if (this.isManageReset) {
              if (!this.resetUserNameForm.smscode) {
                this.$message.error('请输入验证码')
                return
              }
              this.loading = true
              adminUsersManagerUsernameEditAPI(val)
                .then(res => {
                  this.$message.success('重置成功')
                  this.resetUserNameVisible = false
                  this.loading = false
                  this.refreshUserList()
                })
                .catch(() => {
                  this.loading = false
                })
            } else {
              this.loading = true
              adminUsersUsernameEditAPI(val)
                .then(res => {
                  if (res.status === 3) {
                    this.$message.error('当前为系统注册账号（手机号），重置需要获取新手机号验证码')
                    this.isManageReset = true
                  } else {
                    this.$message.success('重置成功')
                    this.resetUserNameVisible = false
                    this.refreshUserList()
                  }
                  this.loading = false
                })
                .catch(() => {
                  this.loading = false
                })
            }
          }
        } else {
          return false
        }
      })
    },

    sliderSuccess() {
      setTimeout(() => {
        this.slideVerifyPass = true
        this.slideVerifyShow = false
      }, 500)
    },

    sliderFail() {},
    sliderRefresh() {},

    getSmsCode() {
      if (!this.canSlideVerify) {
        this.$message.error('请输入正确的手机号')
        return
      }

      if (!this.slideVerifyPass) {
        this.$message.error('请先进行滑动验证')
        return
      }

      sendSmsAPI({
        telephone: this.resetUserNameForm.username,
        type: 1 // 注册
      })
        .then(() => {
          this.startTimer()
        })
        .catch()
    },

    /**
     * 发送短信倒计时
     */
    startTimer() {
      if (this.codeSecond === this.codeTime) {
        this.codeSecond--
      }
      this.codeTimer = setTimeout(() => {
        this.codeSecond--
        if (this.codeSecond >= 0) {
          this.startTimer()
        } else {
          clearTimeout(this.codeTimer)
          this.codeTimer = null
          this.codeSecond = this.codeTime
        }
      }, 1000)
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
    // 勾选
    handleSelectionChange(val) {
      this.selectionList = val // 勾选的行
    },

    // 获取状态颜色 0 禁用 1 启用 2未激活
    getStatusColor(status) {
      if (status == 0) {
        return '#FF6767'
      } else if (status == 1) {
        return '#46CDCF'
      } else if (status == 2) {
        return '#CCCCCC'
      }
    },
    getStatusName(status) {
      if (status == 0) {
        return '禁用'
      } else if (status == 1) {
        return '已激活'
      } else if (status == 2) {
        return '未激活'
      }
    },
    // 列表信息格式化
    tableFormatter(row, column) {
      if (column.property == 'sex') {
        return { 1: '男', 2: '女' }[row.sex]
      }
      return row[column.property]
    },
    /** 查看有无呼叫中心的权限 */
    getCallAuth() {
      adminSystemCallSetAPI().then(res => {
        const data = res.data || {}
        this.isStartCall = data.status == 1
      }).catch(() => {})
    }
  }
}
</script>

<style lang="scss" scoped>
@import "../styles/index.scss";
@import "@/styles/wk-form.scss";

@mixin center() {
  display: flex;
  align-items: center;
  justify-content: center;
}

// 图片验证码
.verify-picture {
  position: relative;
  width: 100%;
  height: 50px;
  margin-top: 20px;
  margin-bottom: 14px;
  font-size: 14px;
  line-height: 16px;
  cursor: pointer;
  background-color: #eef7ff;
  border-radius: $--border-radius-base;

  @include center;

  .icon {
    width: 42px;
    margin-left: -10px;
  }

  .slide-verify {
    position: absolute;
    top: -200px;
    left: 0;
    z-index: 100;
  }

  // @media screen and (max-width: 1550px) {
  //   height: 50px;
  //   .icon {
  //     width: 42px;
  //   }
  // }
}

// 导航
.main-nav {
  &__title {
    position: relative;

    .add-btn {
      position: absolute;
      top: 7px;
      right: $--interval-base;
      padding: 0;
    }
  }
}

.main-nav__content {
  background-color: $--color-white;
  border-radius: $--border-radius-base;
}

.search-input {
  width: 200px;
}

.add-user-btn {
  margin-left: 8px;
}

.main-content-wrap {
  margin-top: 16px;
}

.sms-box {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: flex-start;
  width: 100%;

  .el-input {
    width: 210px;
  }

  .el-button {
    flex: 1;
    padding: 0;
    margin-left: 20px;
    font-size: 12px;
    color: white;
    background-color: #3e6bea;
    border: 0 none;
    border-radius: $--border-radius-base;

    .btn-content {
      width: 100%;
      height: 42px;

      @include center;

      .icon {
        margin-right: 5px;
        font-size: 16px;
      }
    }

    &:hover,
    &.is-disabled,
    &.is-disabled:hover {
      color: white;
      background-color: #517aec;
      border-color: #517aec;
    }
  }
}

// 菜单
.nav-section__content {
  padding-bottom: $--interval-base;

  &.is-user {
    padding: 0 $--interval-base;
  }
}

.table-top {
  margin-bottom: 16px;
  line-height: 34px;

  &__title {
    font-size: 16px;

    .des {
      margin-left: 14px;
      color: $--color-text-secondary;

      .value {
        color: $--color-black;
      }
    }
  }

  .el-dropdown {
    margin-left: 7px;
  }
}

.all-user-reminder {
  display: inline-block;
  width: auto;
  margin-left: 5px;
}

.el-table /deep/ .el-table-column--selection .cell {
  padding-left: 14px;
}

// .status {
//   display: inline-block;
//   margin-left: 50px;
// }
// .status > span {
//   margin-right: 10px;
// }

.status-mark {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 3px;
}

.status-name {
  color: $--color-primary;
  cursor: pointer;
}

/* 详情 */
.employee-dep-management /deep/ .el-dialog__wrapper {
  margin-top: 60px !important;
}

/* 新建和编辑 */
.wk-form {
  display: flex;
  flex-wrap: wrap;
  margin: 0 -8px;
  overflow-y: auto;

  .wk-form-item {
    flex: 0 0 50%;
    padding: 0 8px 8px;
    margin-right: 0;
    margin-bottom: 4px;
  }

  .el-select {
    width: 100%;
  }
}

.nav-dialog-div {
  margin-bottom: 20px;

  label {
    display: block;
    width: 90px;
  }
}

.nav-dialog-div {
  .el-input,
  .el-select,
  .wk-user-select {
    flex: 1;
  }
}

// el-tree
/deep/ .el-tree {
  position: absolute;
  min-width: 208px;
  overflow-x: auto;

  .el-tree-node__content {
    height: 40px;
    border-radius: $--border-radius-base;
  }

  .el-tree-node__children {
    overflow: visible;
  }

  .el-tree--highlight-current,
  .el-tree-node.is-current > .el-tree-node__content {
    color: $--color-primary;
    background-color: $--color-n30;
  }
}

// 设置flex布局
.flex-index {
  display: flex;
  flex-direction: column;
}

// 设置占位
.flex-box {
  flex: 1;

  // border-bottom: 1px solid $--border-color-base;
}

// 勾选操作
.selection-bar {
  margin-bottom: 16px;
  line-height: 34px;

  .selected—title {
    flex-shrink: 0;
    padding-right: 20px;
    font-weight: $--font-weight-semibold;

    .selected—count {
      color: $--color-primary;
    }
  }
}

.selection-items-box {
  padding: 0 15px;
  overflow-x: auto;
  overflow-y: hidden;

  /deep/ .el-button {
    i {
      margin-right: 5px;
    }
  }
}

// 提示
// 提示标志
.wk-help-tips {
  margin-left: 3px;
  font-size: 14px;
  cursor: pointer;
}

.el-dialog__wrapper /deep/.el-dialog__body {
  padding: 20px;
}

.tips {
  font-size: 13px;
  color: $--color-text-secondary;
}

@import "../styles/table.scss";
</style>

