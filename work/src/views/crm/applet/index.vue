<template>
  <div>
    <c-r-m-list-head
      :crm-type="crmType"
      title="名片线索管理"
      @on-handle="listHeadHandle"
      @on-export="exportInfos">
      <el-menu
        v-if="menuItems.length > 1"
        slot="icon"
        ref="elMenu"
        :default-active="crmType"
        mode="horizontal"
        active-text-color="#2362FB"
        @select="menuSelect">
        <el-menu-item
          v-for="(item, index) in menuItems"
          :key="index"
          :index="item.path">
          <img :src="item.icon">
          <span>{{ item.title }}</span>
        </el-menu-item>
      </el-menu>
    </c-r-m-list-head>
    <div
      v-empty="!indexAuth"
      xs-empty-icon="nopermission"
      xs-empty-text="暂无权限"
      class="crm-container">
      <c-r-m-table-head
        ref="crmTableHead"
        :crm-type="crmType"
        :search.sync="search"
        placeholder="手机号/微信名称"
        @on-search="crmSearch"
        @filter="handleFilter"
        @handle="handleHandle"
        @scene="handleScene">
        <template slot="custom">
          <div>场景：</div>
          <el-select v-model="appletType" @change="selectApplet">
            <el-option
              v-for="item in appletOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value" />
          </el-select>
        </template>
      </c-r-m-table-head>
      <el-table
        id="crm-table"
        v-loading="loading"
        :data="list"
        :height="tableHeight"
        :class="crmTableClass"
        class="n-table--border"
        stripe
        border
        highlight-current-row
        style="width: 100%;"
        @row-click="handleRowClick"
        @sort-change="sortChange"
        @header-dragend="handleHeaderDragend"
        @selection-change="handleSelectionChange">
        <el-table-column
          show-overflow-tooltip
          type="selection"
          align="center"
          width="55" />
        <el-table-column
          v-for="(item, index) in fieldList"
          :key="index"
          :prop="item.prop"
          :label="item.label"
          :width="item.width"
          sortable="custom"
          show-overflow-tooltip>
          <template slot-scope="scope">
            <template v-if="item.prop == 'weixinImg'">
              <el-image :src="scope.row.weixinImg" class="image" />
            </template>
            <template v-else-if="item.prop == 'isTransform'">
              {{ scope.row[item.prop] == 1 ? '是' : '否' }}
            </template>
            <template v-else>
              {{ scope.row[item.prop] }}
            </template>
          </template>
        </el-table-column>
        <el-table-column />
      </el-table>
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
          layout="prev, pager, next, sizes, total, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange" />
      </div>
    </div>
    <applet-detail
      v-if="showDview"
      :id="rowID"
      class="d-view"
      @handle="handleHandle"
      @hide-view="showDview=false" />
  </div>
</template>

<script>
import AppletDetail from './Detail'
import TableMixin from '../mixins/Table'

export default {
  /** 客户管理 的 线索列表 */
  name: 'AppletIndex',
  components: {
    AppletDetail
  },
  mixins: [TableMixin],
  data() {
    return {
      crmType: 'applet',
      appletType: 0, // 小程序筛选字段
      appletOptions: [
        { label: '全部线索', value: 0 },
        { label: '我负责的线索', value: 1 },
        { label: '下属负责的线索', value: 2 }
      ]
    }
  },
  computed: {
    menuItems() {
      const temp = []
      if (this.crm && this.crm.leads) {
        temp.push({
          title: '线索管理',
          path: 'leads',
          icon: require('@/assets/img/crm/leads_not.png')
        })
      }

      if (this.crm && this.crm.applet) {
        temp.push({
          title: '名片线索',
          path: 'applet',
          icon: require('@/assets/img/crm/applet.png')
        })
      }

      return temp
    }
  },
  mounted() {},
  deactivated: function() {
    if (this.$refs.elMenu) {
      this.$refs.elMenu.activeIndex = this.crmType
    }
  },
  methods: {
    /**
     * 左侧菜单选择
     */
    menuSelect(key, keyPath) {
      this.$emit('menu-select', key, keyPath)
    },

    /**
     * 小程序场景
     */
    selectApplet(val) {
      this.appletType = val
      this.currentPage = 1
      this.getList()
    }
  }
}
</script>

<style lang="scss" scoped>
@import "../styles/table.scss";

.image {
  width: 35px;
  height: 35px;
  margin-top: 2px;
  border-radius: 50%;
}
</style>
