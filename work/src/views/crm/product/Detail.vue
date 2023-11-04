<template>
  <slide-view
    v-empty="!canShowDetail"
    :listener-ids="listenerIDs"
    :no-listener-ids="noListenerIDs"
    :no-listener-class="noListenerClass"
    :body-style="{padding: 0, height: '100%'}"
    xs-empty-icon="nopermission"
    xs-empty-text="暂无权限"
    @afterEnter="viewAfterEnter"
    @close="hideView">
    <div
      ref="crmDetailMain"
      v-loading="loading"
      class="detail-main no-padding">
      <flexbox
        v-if="canShowDetail && detailData"
        direction="column"
        align="stretch"
        class="d-container">
        <wk-detail-header
          subtitle="产品"
          :class="{'is-shadow': bodyIsScroll}"
          :title="detailData.name"
          :page-list="pageList"
          :dropdowns="handleOperations"
          @command="headerRightClick"
          @pageChange="pageChange"
        >

          <template slot="right">
            <time-piece v-if="showTimer && isCall" />
            <el-button
              v-if="showTransfer"
              class="head-handle-button"
              @click="headerRightClick('transfer')">转移</el-button>
            <el-button
              v-if="showEdit"
              class="head-handle-button"
              type="primary"
              @click="headerRightClick('edit')">编辑</el-button>
          </template>
        </wk-detail-header>

        <!-- 标签 -->
        <flexbox
          v-if="tagInfo"
          wrap="wrap"
          class="wk-tags-content">
          <tag-view
            :value="tagInfo.value"
            :max-length="Infinity"
            wrap="wrap">
            <wk-tag
              v-model="tagInfo.value"
              :disabled="tagInfo.disabled"
              :placeholder="tagInfo.placeholder"
              :data="tagInfo"
              :options="tagInfo.setting"
              @change="tagChange($event)">
              <el-tooltip
                slot="reference"
                content="编辑标签"
                effect="dark"
                placement="top">
                <el-button type="icon" size="small" icon="wk wk-icon-label-solid" />
              </el-tooltip>
            </wk-tag>
          </tag-view>
        </flexbox>

        <div class="d-container-body" @scroll="bodyScroll">
          <detail-head-base :list="headDetails" />
          <relative-stage-records
            :id="id"
            :crm-type="crmType"
            :detail="detailData"
            @handle="detailHeadHandle"
          />
          <el-tabs
            v-model="tabCurrentName"
            nav-mode="more"
            class="top-padding">
            <el-tab-pane
              v-for="(item, index) in tabNames"
              :key="index"
              :label="item.label"
              :name="item.name"
              lazy>
              <template slot="label">
                <el-badge
                  :value="item.num"
                  :hidden="item.num <= 0"
                  type="undefined">
                  {{ item.label }}
                </el-badge>
              </template>
              <c-r-m-edit-base-info
                :is="item.name"
                v-if="item.name === 'CRMEditBaseInfo'"
                :id="id"
                :ref="item.name"
                :detail="detailData"
                :crm-type="crmType"
                :ignore-fields="['status']"
                @handle="detailHeadHandle">
                <sections
                  class="b-cells"
                  title="图片信息"
                  content-height="auto">
                  <div class="image">
                    <div v-if="mainFileList.length > 0" class="image-info">
                      <div class="image-info__label">产品图片</div>
                      <div class="image-info__list">
                        <img
                          v-for="(item, index) in mainFileList"
                          :key="index"
                          v-src="item.url"
                          class="main-img"
                          @click="previewImage(mainFileList, index)">
                      </div>
                    </div>
                    <div v-if="detailFileList.length > 0" class="image-info">
                      <div class="image-info__label">产品详情图片</div>
                      <div class="image-info__list">
                        <img
                          v-for="(item, index) in detailFileList"
                          :key="index"
                          v-src="item.url"
                          class="detial-img"
                          @click="previewImage(detailFileList, index)">
                      </div>
                    </div>
                    <div v-if="detailFileList.length == 0 && mainFileList.length == 0" class="no-img">暂无图片</div>
                  </div>
                </sections>
              </c-r-m-edit-base-info>
              <component
                :is="item.name"
                v-else
                :id="id"
                :detail="detailData"
                :crm-type="crmType"
                @handle="detailHeadHandle" />
            </el-tab-pane>
          </el-tabs>
        </div>
      </flexbox>
    </div>

    <!-- 新建编辑 -->
    <c-r-m-all-create
      v-if="crmCreateShow"
      :action="createActionInfo"
      :crm-type="crmType"
      @save-success="editSaveSuccess"
      @close="crmCreateShow=false" />

    <!-- 转移 -->
    <transfer-handle
      v-if="transferDialogShow"
      :props="transferHandleProps"
      :dialog-visible.sync="transferDialogShow"
      @handle="detailHeadHandle({type: 'transfer'})" />
  </slide-view>
</template>

<script>
import {
  crmProductReadAPI,
  crmProductDeleteAPI,
  crmProductStatusAPI
} from '@/api/crm/product'

import SlideView from '@/components/SlideView'
import TransferHandle from '@/components/Page/SelectionHandle/TransferHandle' // 转移
import RelativeStageRecords from '../components/RelativeStageRecords' // 阶段记录
import CRMEditBaseInfo from '../components/CRMEditBaseInfo' // 产品基本信息
import RelativeFiles from '../components/RelativeFiles' // 相关附件
import RelativeHandle from '../components/RelativeHandle' // 相关操作

import CRMAllCreate from '../components/CRMAllCreate' // 新建页面
import DetailImg from './components/DetailImg'
import Sections from '../components/Sections'

import DetailMixin from '../mixins/Detail'
import { separator } from '@/filters/vueNumeralFilter/filters'

export default {
  // 客户管理 的 产品详情
  name: 'ProductDetail',
  components: {
    SlideView,
    TransferHandle,
    RelativeStageRecords,
    DetailImg,
    CRMEditBaseInfo,
    RelativeFiles,
    RelativeHandle,
    CRMAllCreate,
    Sections
  },
  mixins: [DetailMixin],
  props: {
    // 详情信息id
    id: [String, Number],
    // 监听的dom 进行隐藏详情
    listenerIDs: {
      type: Array,
      default: () => {
        return ['crm-main-container']
      }
    },
    // 不监听
    noListenerIDs: {
      type: Array,
      default: () => {
        return []
      }
    },
    noListenerClass: {
      type: Array,
      default: () => {
        return ['el-table__body']
      }
    }
  },
  data() {
    return {
      // 展示加载loading
      loading: false,
      crmType: 'product',
      headDetails: [],
      tabCurrentName: 'CRMEditBaseInfo'
    }
  },
  computed: {
    // 可操作选项
    handleOperations() {
      return this.getOperations(['delete', 'start', 'disable'])
    },

    // tabs
    tabNames() {
      const tempsTabs = [
        { label: '详细资料', name: 'CRMEditBaseInfo' },
        { label: '附件', num: this.tabsNumber.fileCount, name: 'RelativeFiles' },
        { label: '操作记录', name: 'RelativeHandle' }
      ]
      return tempsTabs
    },
    mainFileList() {
      if (this.detailData && this.detailData.mainFileList) {
        return this.detailData.mainFileList
      }

      return []
    },

    detailFileList() {
      if (this.detailData && this.detailData.detailFileList) {
        return this.detailData.detailFileList
      }

      return []
    }
  },
  mounted() {},
  methods: {
    /**
     * 详情
     */
    getDetial() {
      this.loading = true
      crmProductReadAPI({
        productId: this.id
      })
        .then(res => {
          this.loading = false
          const resData = res.data || {}
          this.detailData = resData

          this.headDetails = [
            { title: '产品类别', value: resData.categoryName },
            { title: '产品单位', value: resData.unit },
            { title: '产品价格', value: separator(resData.price || 0) },
            { title: '产品编码', value: resData.num }
          ]
        })
        .catch(() => {
          this.loading = false
          this.hideView()
        })
    },

    /**
     * 关闭
     */
    hideView() {
      this.$emit('hide-view')
    },

    /**
     * 预览图片
     */
    previewImage(list, index) {
      this.$wkPreviewFile.preview({
        index: index,
        data: list
      })
    },

    /* ------------------------ 头部事件 ------------------------ */
    /**
     * @description: 头部右侧点击事件
     * @param {*}
     * @return {*}
     */
    headerRightClick(type) {
      if (type === 'transfer') {
        this.transferDialogShow = true
      } else if (type === 'edit') {
        this.createCRMType = this.crmType
        this.createActionInfo = {
          type: 'update',
          id: this.id,
          batchId: this.detailData.batchId,
          editDetail: this.detailData
        }
        this.crmCreateShow = true
      } else if (type == 'delete') {
        this.$confirm('确定删除?', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
          .then(() => {
            crmProductDeleteAPI([this.id])
              .then(res => {
                this.$message({
                  type: 'success',
                  message: '删除成功'
                })
                this.detailHeadHandle({ type })
              })
              .catch(() => {})
          })
          .catch(() => {})
      } else if (type === 'start' || type === 'disable') {
        this.$confirm({
          start: '确定要上架该产品吗?',
          disable: '确定要下架该产品吗?'
        }[type], '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
          .then(() => {
            crmProductStatusAPI({
              ids: [this.id],
              status: type === 'start' ? '1' : '0'
            })
              .then(res => {
                this.$message({
                  type: 'success',
                  message: '操作成功'
                })
                this.detailHeadHandle({ type })
              })
              .catch(() => {})
          })
          .catch(() => {})
      }
    }
  }
}
</script>

<style lang="scss" scoped>
@import "../styles/crmdetail.scss";

.d-container-body {
  margin-top: 8px;
}

.image {
  color: $--color-text-primary;

  &-info {
    margin: 10px 25px 0;

    &__label {
      font-size: 13px;
    }

    &__list {
      overflow-x: auto;
      white-space: nowrap;

      img {
        margin-top: 15px;
        cursor: pointer;
        border-radius: $--border-radius-base;
      }

      img + img {
        margin-left: 20px;
      }

      .main-img {
        width: 100px;
        height: 76px;
        object-fit: contain;
        vertical-align: top;
      }

      .detial-img {
        width: 100px;
        height: 80px;
        object-fit: contain;
        vertical-align: top;
      }
    }
  }

  .no-img {
    margin: 50px 0;
    color: $--color-text-regular;
    text-align: center;
  }
}
</style>
