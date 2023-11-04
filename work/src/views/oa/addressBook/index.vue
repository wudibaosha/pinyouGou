<template>
  <div class="address-book-index main">
    <flexbox class="main-header" justify="space-between">
      <div class="main-header__left">
        <span class="title">通讯录</span>
      </div>
    </flexbox>

    <div class="main-content-wrap">
      <!-- 左边导航栏 -->
      <div
        class="main-nav">
        <div class="main-nav__title">企业组织架构</div>
        <div class="main-nav__content">
          <div class="nav-sections-wrap">
            <div class="nav-section">
              <div class="nav-section__content is-padding">
                <el-tree
                  ref="tree"
                  :data="depTree"
                  :expand-on-click-node="false"
                  :props="{
                    label: 'name'
                  }"
                  highlight-current
                  default-expand-all
                  node-key="deptId"
                  @node-click="deptClick">
                  <span slot-scope="{ node, data }">
                    <i
                      v-if="node.level == 1"
                      style="margin-right: 4px;"
                      class="wk wk-customer" />
                    {{ data.name }}
                  </span>
                </el-tree>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右边内容 -->
      <div class="main-content">
        <wk-filter-header
          :tabs="tabs"
          :props="{
            searchPlaceholder: '请输入员工姓名/手机号'
          }"
          :active-tab.sync="bookType"
          @tabs-change="refreshList"
          @event-change="filterHeaderHandle"
        />

        <div class="letters">
          筛选:
          <span
            v-for="item in letters"
            :key="item.label"
            class="letter"
            :class="{'is-current': letter === item.value}"
            @click="letterClick(item)">
            {{ item.label }}
          </span>
        </div>

        <el-table
          v-loading="loading"
          :data="list"
          :height="tableHeight"
          stripe
          @sort-change="sortTableList">
          <el-table-column
            label="字母"
            align="center"
            prop="initial"
            sortable
            width="90" />
          <el-table-column
            prop="name"
            label="关注"
            align="center"
            width="120">
            <template slot-scope="scope">
              <span
                :class="{active: scope.row.status === 1}"
                class="wk wk-focus-on focus-icon"
                @click="toggleStar(scope.$index, scope.row.status)" />
            </template>
          </el-table-column>
          <el-table-column
            show-overflow-tooltip
            prop="realname"
            label="姓名">
            <template slot-scope="scope">
              <flexbox
                class="user-box">
                <xr-avatar
                  :id="scope.row.userId"
                  :name="scope.row.realname"
                  :size="30"
                  :src="scope.row.img"
                  class="user-img" />
                <span>{{ scope.row.realname }}</span>
              </flexbox>
            </template>
          </el-table-column>
          <el-table-column
            v-for="(item, index) in tableMap"
            :key="index"
            :prop="item.key"
            :label="item.label"
            show-overflow-tooltip />
        </el-table>
        <div class="p-contianer">
          <el-pagination
            :current-page.sync="currentPage"
            :page-sizes="pageSizes"
            :page-size.sync="pageSize"
            :pager-count="5"
            :total="total"
            class="p-bar"
            background
            layout="prev, pager, next, sizes, total, jumper"
            @size-change="refreshList"
            @current-change="getList" />
        </div>
      </div>
    </div>

  </div>
</template>

<script>
import {
  addressListAPI,
  toggleAttentionAPI
} from '@/api/oa/addressBook'
import { depListAPI } from '@/api/common'

import WkFilterHeader from '@/components/NewCom/WkFilterHeader'

import TableMixin from '@/mixins/Table'
const AlphabetMap = 'A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z,#'.split(',')

export default {
  name: 'AddressBookIndex',
  components: {
    WkFilterHeader
  },
  mixins: [TableMixin],
  data() {
    return {
      bookType: 'all', // all 全部 attention 关注的
      deptIdValue: '', // 切换我的 和 我关注的 重置选择的值
      depTree: [], // 部门树
      search: '', // 输入搜索
      initialOrder: 1, // 1正序 2 倒序
      letter: '',
      letters: [],
      tabs: [{
        label: '全部',
        value: 'all'
      }, {
        label: '我关注的',
        value: 'attention'
      }],
      list: [],
      tableMap: [
        { label: '手机', key: 'mobile' },
        { label: '部门', key: 'deptName' },
        { label: '岗位', key: 'post' }
      ],

      loading: false
    }
  },
  created() {
    // 混入逻辑
    this.otherTableHeight = 300
    this.rowHeight = 47
    const letters = [{
      label: '全部',
      value: ''
    }]

    AlphabetMap.forEach(item => {
      letters.push({
        label: item,
        value: item
      })
    })

    this.letters = letters

    this.getDepTreeList()
    this.getList()
  },

  methods: {
    /**
     * 获取树形列表
     */
    getDepTreeList() {
      this.loading = true
      depListAPI({ type: 'tree' })
        .then(res => {
          this.depTree = res.data || []
          this.loading = false
        })
        .catch(() => {
          this.loading = false
        })
    },

    /**
     * 部门点击
     */
    deptClick(data) {
      if (this.deptIdValue !== data.deptId) {
        this.deptIdValue = data.deptId
        this.refreshList()
      } else {
        this.$refs.tree.setCurrentKey()
        this.deptIdValue = ''
        this.refreshList()
      }
    },

    /**
     * 索引点击
     */
    letterClick(item) {
      this.letter = item.value
      this.refreshList()
    },

    /**
     * filter header 操作
     */
    filterHeaderHandle(commond, value) {
      if (commond === 'searchUpdate') {
        this.search = value
        this.refreshList()
      }
    },

    /**
     * 列表
     */
    getList() {
      const params = {
        page: this.currentPage,
        limit: this.pageSize,
        search: this.search || '',
        initial: this.initialOrder || 1, // 1正序 2 倒序
        deptId: this.deptIdValue
      }

      params.acronym = this.letter
      console.log('this.bookType---', this.bookType)
      if (this.bookType == 'attention') {
        params.status = 1
      }

      this.loading = true
      addressListAPI(params).then(res => {
        this.loading = false
        const resData = res.data || {}
        this.total = resData.totalRow
        this.list = resData.list || []

        this.updateTableHeight()
      }).catch(() => {
        this.loading = false
      })
    },

    /**
     * 排序
     */
    sortTableList(sortObj) {
      if (sortObj.order === 'ascending') {
        this.initialOrder = 1
      } else if (sortObj.order === 'descending') {
        this.initialOrder = 2
      } else {
        this.initialOrder = null
      }
      this.refreshList()
    },

    /**
     * 切换关注状态
     * @param index
     * @param status
     */
    toggleStar(index, status) {
      this.loading = true
      toggleAttentionAPI({
        userId: this.list[index].userId
      }).then(() => {
        this.loading = false
        this.list[index].status = status === 0 ? 1 : 0
        this.$set(this.list, index, this.list[index])
      }).catch(() => {
        this.loading = false
      })
    },

    /**
     * 刷新
     */
    refreshList() {
      this.currentPage = 1
      this.getList()
    }
  }
}
</script>

<style scoped lang="scss">
  @import "./style";

  .main-header__left {
    display: flex;
  }

  .wk-dep-select {
    margin-left: $--interval-base;
  }

  .wk-filter-header {
    margin-bottom: 20px;
    line-height: 32px;
  }
</style>
