<template>
  <flexbox justify="flex-start" class="filtrate-content">
    <flexbox justify="flex-start" class="title-box">
      <div class="icon-box">
        <span class="wk wk-my-task icon" />
      </div>
      <span class="text">{{ title }}</span>
    </flexbox>

    <template v-if="showFilterView">
      <!-- 时间范围筛选 -->
      <time-type-select
        v-if="!showYearSelect"
        @change="timeTypeChange" />

      <!-- 年份筛选 -->
      <el-date-picker
        v-if="showYearSelect"
        v-model="yearValue"
        :clearable="false"
        :picker-options="pickerOptions"
        type="year"
        value-format="yyyy"
        placeholder="选择年" />

      <slot name="after-time" />

      <!-- 单独选择员工和部门 -->
      <template v-if="showSimpleChoose">
        <el-select
          v-if="showUserSelect && showDeptSelect"
          v-model="simpleChooseType">
          <el-option
            v-for="item in simpleOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value" />
        </el-select>
        <wk-dept-dialog-select
          v-if="simpleChooseType === 1 && showDeptSelect"
          v-model="structuresSelectValue"
          radio
          placeholder="选择部门（默认为本部门及下属部门）"
          class="wk-dep-select" />

        <wk-user-dialog-select
          v-if="simpleChooseType === 2 && showUserSelect"
          v-model="userSelectValue"
          radio
          class="wk-user-select"
          placeholder="选择员工（默认为本人及下属）" />
      </template>
      <!-- 同时选择员工和部门 -->
      <xr-radio-menu
        v-else
        v-model="filterDataType"
        :show-default="false"
        :options="dataTypeOptions"
        :user-checked-data="filterValue.userList"
        :dep-checked-data="filterValue.deptList"
        :width="250"
        @select="radioMenuSelect">
        <el-input
          slot="reference"
          v-model="avatarData.realname"
          class="el-input--no-bg"
          :readonly="true">
          <i
            slot="suffix"
            class="el-icon-arrow-up" />
        </el-input>
      </xr-radio-menu>

      <!-- 商机状态筛选 -->
      <el-select
        v-if="showBusinessSelect"
        v-model="businessStatusValue"
        placeholder="商机组">
        <el-option
          v-for="item in businessOptions"
          :key="item.flowId"
          :label="item.flowName"
          :value="item.flowId" />
      </el-select>

      <!-- 产品类别 -->
      <el-cascader
        v-if="showProductSelect"
        v-model="productValue"
        :options="productOptions"
        :show-all-levels="false"
        :props="{
          children: 'children',
          label: 'label',
          value: 'categoryId'
        }"
        style="width: 100%;"
        change-on-select />

      <!-- 自定义下拉条件 -->
      <el-select
        v-if="showCustomSelect"
        v-model="customValue"
        @change="customSelectChange">
        <el-option
          v-for="item in customOptions"
          :key="item.value"
          :label="item.name"
          :value="item.value" />
      </el-select>

      <slot name="append" />

      <el-button
        type="primary"
        @click.native="emitFilter">搜索</el-button>

      <slot />
    </template>
  </flexbox>
</template>

<script>
import { crmBusinessStatusListAPI } from '@/api/crm/business'
import { productCategoryIndexAPI } from '@/api/admin/crm'

import TimeTypeSelect from '@/components/TimeTypeSelect'
import WkDeptDialogSelect from '@/components/NewCom/WkDeptDialogSelect'
import WkUserDialogSelect from '@/components/NewCom/WkUserDialogSelect'
import XrRadioMenu from '@/components/Menu/XrRadioMenu'

import { mapGetters } from 'vuex'

export default {
  name: 'FiltrateHandleView', // 筛选条件
  components: {
    TimeTypeSelect,
    WkDeptDialogSelect,
    WkUserDialogSelect,
    XrRadioMenu
  },
  props: {
    // 模块标题
    title: {
      type: String,
      default: ''
    },
    // 是否展示筛选条件
    showFilterView: {
      default: true,
      type: Boolean
    },
    // 是否展示年
    showYearSelect: {
      default: false,
      type: Boolean
    },
    // 是否展示商机状态筛选
    showBusinessSelect: {
      default: false,
      type: Boolean
    },
    // 是否展示产品类别选择
    showProductSelect: {
      default: false,
      type: Boolean
    },
    // 是否展示自定义选择
    showCustomSelect: {
      default: false,
      type: Boolean
    },
    // 自定义选项的默认值
    customDefault: {
      type: String,
      default: ''
    },
    // 自定义选项
    customOptions: {
      default: () => {
        return []
      },
      type: Array
    },

    // 单独控制是否展示员工选择
    showUserSelect: {
      default: undefined,
      type: Boolean
    },
    // 单独控制是否展示部门选择
    showDeptSelect: {
      default: undefined,
      type: Boolean
    }
  },
  data() {
    return {
      // 年筛选
      pickerOptions: {
        disabledDate(time) {
          return time.getTime() > Date.now()
        }
      },
      yearValue: '',

      // 员工部门筛选值
      filterDataType: 2,
      filterValue: {
        dataType: 2,
        userList: [],
        deptList: []
      },

      // 时间类型值
      timeTypeValue: {},

      // 商机状态
      businessOptions: [],
      businessStatusValue: '',

      // 产品类别
      productValue: [],
      productOptions: [],

      // 自定义选项的值
      customValue: '',

      dataTypeOptions: [
        { label: '仅本人', command: 1 },
        { label: '本人及下属', command: 2 },
        { label: '仅本部门', command: 3 },
        { label: '本部门及下属部门', command: 4 },
        { label: '自定义', command: 'custom' }
      ],

      simpleChooseType: 1,
      simpleOptions: [
        { label: '部门', value: 1 },
        { label: '员工', value: 2 }
      ],
      structuresSelectValue: '',
      userSelectValue: ''
    }
  },
  computed: {
    ...mapGetters([
      'userInfo'
    ]),

    showSimpleChoose() {
      return this.showUserSelect !== undefined && this.showDeptSelect !== undefined
    },
    // 如果只筛选一个人则头像显示当前被筛选人的头像，否则显示默认错误头像
    avatarData() {
      if (this.filterValue.dataType === 'custom') {
        const userNames = (this.filterValue.userList || [])
          .map(o => o.realname)
        const strucNames = (this.filterValue.deptList || [])
          .map(o => o.name)
        return {
          realname: userNames.concat(strucNames).join(','),
          img: ''
        }
      }

      if (this.filterValue.dataType == 1) {
        return this.userInfo
      }

      return {
        showIcon: true,
        realname: {
          1: '仅本人',
          2: '本人及下属',
          3: '仅本部门',
          4: '本部门及下属部门'
        }[this.filterValue.dataType]
      }
    }
  },
  mounted() {
    if (this.showYearSelect) {
      this.yearValue = this.$moment()
        .year()
        .toString()
    }

    if (
      this.showDeptSelect !== undefined &&
      !this.showDeptSelect
    ) {
      this.simpleChooseType = 2
    }

    // 自定义选择项 默认值
    if (this.showCustomSelect) {
      this.customValue = this.customDefault
    }

    this.$emit('load')

    if (this.showBusinessSelect) {
      // 如果显示商机状态组筛选，则先去获取商机状态数据
      this.getBusinessStatusList(() => {
        this.emitFilter()
      })
    } else {
      this.emitFilter()
    }

    if (this.showProductSelect) {
      this.getProductCategoryIndex()
    }
  },
  methods: {
    /**
     * 获取商机阶段
     * @param {function} callback
     */
    getBusinessStatusList(callback) {
      crmBusinessStatusListAPI()
        .then(res => {
          this.businessOptions = res.data || []
          if (this.businessOptions.length > 0) {
            this.businessStatusValue = this.businessOptions[0].flowId
          }
          callback(true)
        })
        .catch(() => {
          this.$emit('error')
        })
    },

    /**
     * 获取产品分类数据
     */
    getProductCategoryIndex() {
      productCategoryIndexAPI({
        type: 'tree'
      })
        .then(res => {
          this.productOptions = res.data
        })
        .catch(() => {})
    },

    /**
     * 员工部门 popover 选择
     */
    radioMenuSelect(val, data) {
      this.filterValue.dataType = this.filterDataType
      if (this.filterDataType != 'custom') {
        this.filterValue.userList = []
        this.filterValue.deptList = []
      } else {
        this.filterValue.userList = data.users
        this.filterValue.deptList = data.strucs
      }
    },

    /**
     * 时间范围修改
     */
    timeTypeChange(data) {
      this.timeTypeValue = data
    },

    /**
     * 自定义条件更改
     */
    customSelectChange() {
      this.$emit('typeChange', this.customValue)
    },

    /**
     * 触发筛选
     */
    emitFilter() {
      const params = {}

      if (this.showSimpleChoose) {
        if (this.simpleChooseType === 1) {
          // 部门
          params.deptList = (this.structuresSelectValue || '')
            .split(',')
            .filter(o => !!o)
        } else {
          // 员工
          params.userList = (this.userSelectValue || '')
            .split(',')
            .filter(o => !!o)
        }
      } else {
        if (this.filterValue.dataType !== 'custom') {
          params.dataType = this.filterValue.dataType
        } else {
          params.dataType = 0
          params.deptList = (this.filterValue.deptList || [])
            .map(item => item.deptId)
          params.userList = (this.filterValue.userList || [])
            .map(item => item.userId)
        }
      }

      // 展示年和展示时间段类型不同时出现
      if (this.showYearSelect) {
        params.dateFilter = 'custom'
        params.startDate = this.yearValue + '-01-01'
      } else {
        if (this.timeTypeValue.type === 'custom') {
          params.startDate = this.timeTypeValue.startTime
          params.endDate = this.timeTypeValue.endTime
          params.dateFilter = 'custom'
        } else {
          params.dateFilter = this.timeTypeValue.value
        }
      }

      // 展示商机状态 返回商机状态参数
      if (this.showBusinessSelect) {
        params.typeId = this.businessStatusValue
        params.businessItem = this.businessOptions.map(item => {
          if (item.flowId === this.businessStatusValue) {
            return item
          }
        })
      }

      if (this.showProductSelect) {
        params.categoryId =
          this.productValue.length > 0
            ? this.productValue[this.productValue.length - 1]
            : ''
      }

      this.$emit('change', params)
    }
  }
}
</script>

<style scoped lang="scss">
.filtrate-content {
  padding: 15px 20px 5px;

  .title-box {
    display: flex;
    width: auto;
    max-width: 250px;
    margin-right: #{$--interval-base * 2};

    .icon-box {
      width: 34px;
      height: 34px;
      margin-right: 10px;
      line-height: 34px;
      color: $--color-primary;
      text-align: center;
      background-color: #dfe8ff;
      border-radius: 50%;
    }

    .text {
      font-size: 20px;
      font-weight: bold;
    }
  }

  .xr-radio-menu-wrap,
  .time-type-select,
  .el-date-editor,
  .el-cascader,
  .el-select,
  .user-popover {
    margin-right: #{$--interval-base * 2};
  }

  .el-select {
    width: 120px;
  }

  .el-cascader {
    width: 130px !important;
  }
}

.el-icon-arrow-up {
  position: absolute;
  top: 9px;
  right: 5px;
  font-size: $--input-font-size;
  font-weight: bold;
  color: $--color-black;
  cursor: pointer;
  transition: transform 0.3s;
  transform: rotate(180deg);
}
</style>
