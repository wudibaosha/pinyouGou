<template>
  <div class="wk-filter-header">
    <flexbox
      v-show="!selectionList || selectionList.length === 0"
      class="filter-wrap">
      <el-input
        v-if="config.showSearch"
        v-model.trim="inputContent"
        :placeholder="config.searchPlaceholder"
        class="search-input"
        @input="inputChange"
        @keyup.enter.native="searchInput">
        <el-button
          slot="suffix"
          type="icon"
          icon="wk wk-sousuo"
          @click="searchInput" />
      </el-input>

      <div style="padding-left: 30px;" v-if="config.searchPlaceholder=='产品名称'">
        <span>产品类型：</span>
        <el-cascader
          ref="cascaderHandle"
          v-model="treeValue"
          :options="treeData"
          :props="{
              checkStrictly: true,
              expandTrigger: 'hover',
              value: 'categoryId',
              label: 'name'
            }"
          @change="handleChange"
          clearable>
        </el-cascader>
      </div>
      <slot name="left-start" />

      <div ref="filterTabs" class="tabs">
        <template v-if="showTabs && showTabs.length > 0">
          <span class="tabs-label">显示:</span>
          <el-button
            v-for="(item, index) in showTabs"
            :key="index"
            :title="item.label"
            :type="item.value === currentActiveTab ? 'selected' : null"
            :icon="item.icon"
            @click="tabsClick(item)">{{ item.label }}</el-button>
        </template>
        <el-dropdown
          v-if="config.tabSetShow || otherTabs.length > 0"
          trigger="click"
          @command="otherClick">
          <el-button
            :type="!!otherActiveTabName ? 'selected' : null"
            class="dropdown-btn">
            <span>{{ otherActiveTabName }}</span>
            <i style="margin-left: 0;" class="el-icon-arrow-down" />
          </el-button>
          <el-dropdown-menu slot="dropdown">
            <el-dropdown-item
              v-for="(tab, index) in otherTabs"
              :key="index"
              :command="tab.value"
              :class="{'is-select': currentActiveTab === tab.value}">
              {{ tab.label }}
            </el-dropdown-item>
            <el-dropdown-item
              v-if="config.tabSetShow"
              :divided="otherTabs.length > 0"
              :command="config.tabSetCommand">
              <span class="wk-filter-btn">
                <i class="wk wk-manage" />{{ config.tabSetLabel }}
              </span>
            </el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
        <slot name="left-end" />
      </div>
      <div class="filter-right">
        <slot name="right" />
      </div>
    </flexbox>

    <!-- 操作 -->
    <flexbox
      v-if="selectionList && selectionList.length > 0"
      class="selection-bar">
      <div class="selected—title">已选中 <span class="selected—count">{{ selectionList.length }}</span> 项</div>
      <flexbox class="selection-items-box">
        <el-button
          v-for="(item, index) in operations"
          :key="index"
          :icon="item.icon"
          size="medium"
          @click="selectionBarClick(item.type)">{{ item.name }}</el-button>
      </flexbox>
    </flexbox>

    <slot />
  </div>
</template>

<script>
import config from '@/config'
import merge from '@/utils/merge'
import { debounce } from 'throttle-debounce'
import {
  productCategoryIndexAPI
} from '@/api/admin/crm'

import {crmProductIndexAPI} from '@/api/crm/product'
export default {
  // 筛选头部 包含场景 高级筛选 其他
  name: 'WkFilterHeader',

  components: {},

  props: {
    // 展示筛选 暂时用 selectionList
    // filterShow: {
    //   type: Boolean,
    //   default: true
    // },
    props: Object, // 配置
    search: String,
    selectionList: Array,
    // 当前tab
    activeTab: [String, Number],
    tabs: Array,
    // 操作按钮
    operations: {
      type: Array,
      default: () => {
        return []
      }
    }
  },

  data() {
    return {
      treeValue:[],
      treeData:[],
      inputContent: '',
      currentActiveTab: '',
      currentMaxTabCount: 5 // 最大展示数
    }
  },

  computed: {
    // 合并 props
    config() {
      return merge({
        showSearch: true,
        searchPlaceholder: '',
        maxTabCount: 5,
        tabSetShow: false,
        tabSetLabel: '设置',
        tabSetCommand: 'set'
      }, this.props || {})
    },

    showTabs() {
      if (this.tabs && this.tabs.length > this.currentMaxTabCount) {
        return this.tabs.slice(0, this.currentMaxTabCount)
      }
      return this.tabs
    },

    otherTabs() {
      if (this.tabs && this.tabs.length > this.currentMaxTabCount) {
        return this.tabs.slice(this.currentMaxTabCount)
      }
      return []
    },

    otherActiveTabName() {
      if (!this.tabs || !this.tabs.length || !this.otherTabs.length) return ''
      const findRes = this.otherTabs.find(o => o.value === this.currentActiveTab)
      if (findRes) return findRes.label
      return ''
    }
  },

  watch: {
    activeTab: {
      handler() {
        if (this.activeTab !== undefined && this.activeTab !== null && this.currentActiveTab !== this.activeTab) {
          this.currentActiveTab = this.activeTab
        }
      },
      immediate: true
    },

    tabs: {
      handler() {
        this.changeTabsSize()
      },
      immediate: true
    },

    search: {
      handler() {
        if (this.inputContent !== this.search) {
          this.inputContent = this.search
        }
      },
      immediate: true
    }
  },

  created() {
    this.debounceResizeWindow = debounce(300, this.resizeWindow)
  },

  mounted() {
    this.debounceResizeWindow()
    window.addEventListener('resize', this.debounceResizeWindow)

   if(this.config.searchPlaceholder == '产品名称'){
    
    productCategoryIndexAPI({
        type: 'tree'
      }).then(res=>{
      console.log(res.data)
      this.treeData = res.data
    })
   }
  },

  beforeDestroy() {
    window.removeEventListener('resize', this.debounceResizeWindow)
  },

  methods: {
    handleChange (val) {
      if(val[val.length-1] != null){
        this.treeValue[0] = val[val.length-1]
      }
      
      console.log(val)
      this.$refs.cascaderHandle.dropDownVisible = false // 监听值发生变化就关闭它
      this.$emit('event-change', 'treeDataSelected', this.treeValue)

    },
    resizeWindow() {
      this.currentMaxTabCount = this.config.maxTabCount
      this.changeTabsSize()
    },

    /**
     * 监听容器校准宽度
     */
    changeTabsSize() {
      this.$nextTick(() => {
        const filterTabs = this.$refs.filterTabs
        if (filterTabs) {
          const parentRect = filterTabs.getBoundingClientRect()
          const width = parentRect.x + parentRect.width
          const children = Array.from(filterTabs.childNodes || []).filter(item => ['DIV', 'BUTTON', 'SPAN'].includes(item.tagName))
          for (let i = children.length - 1; i >= 0; i--) {
            const item = children[i]
            const itemRect = item.getBoundingClientRect()
            const itemWidth = itemRect.x + itemRect.width
            if (itemWidth > width) {
              this.currentMaxTabCount--
            } else {
              break
            }
          }
        }
      })
    },

    /**
     * 搜索
     */
    searchInput() {
      this.$emit('event-change', 'search', this.inputContent)
    },

    /**
     * 搜索改变
     */
    inputChange() {
      this.$emit('update:search', this.inputContent)
      this.$emit('event-change', 'searchUpdate', this.inputContent)
    },

    /**
     * other 点击
     */
    otherClick(value) {
      if (value === this.config.tabSetCommand) {
        this.$emit('event-change', value)
      } else {
        this.tabsClick(this.tabs.find(item => item.value === value))
      }
    },

    /**
     * tabsClick 事件
     */
    tabsClick(item) {
      this.currentActiveTab = item.value
      this.$emit('update:activeTab', this.currentActiveTab)
      this.$emit('tabs-change', item)
    },

    /**
     * 操作点击
     */
    selectionBarClick(command) {
      this.$emit('operations-click', command)
    }
  }
}
</script>

<style lang="scss">
.el-dropdown-menu__item.is-select {
  color: $--color-primary;
  background-color: #e9efff;
}

.wk-filter-btn {
  color: $--color-primary;
}
</style>

<style lang="scss" scoped>
.wk-filter-header {
  min-height: 34px;
  line-height: 32px;
  background: white;

  .filter-wrap {
    .el-dropdown-link {
      display: inline-block;
      margin-top: 2px;
      margin-left: 20px;
      font-size: 14px;
      cursor: pointer;
    }

    .filter-left {
      flex: 1;
    }
  }

  // 搜索
  /deep/ .search-input {
    width: 220px;

    .el-input__inner {
      padding-right: 36px;
    }
  }

  // 按钮切换
  .tabs {
    display: flex;
    flex: 1;
    overflow-x: auto;
    white-space: nowrap;

    &-label {
      margin-right: $--interval-base;
    }

    /deep/ .el-button {
      span {
        max-width: 110px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
  }

  .search-input + .tabs {
    margin-left: #{$--interval-base * 3};
  }

  // 右
  .filter-right {
    display: flex;
    flex-shrink: 0;
  }

  .dropdown-btn {
    padding: 8px;
    margin-left: $--interval-base;
  }

  // 勾选操作
  .selection-bar {
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
  }
}
</style>
