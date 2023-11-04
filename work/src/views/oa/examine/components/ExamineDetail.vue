<template>
  <slide-view
    v-loading="loading"
    :listener-ids="['workbench-main-container']"
    :no-listener-class="noListenerClass"
    class="d-view"
    @afterEnter="viewAfterEnter"
    @close="hideView">
    <div
      v-if="detail"
      orient="vertical"
      class="detail-main">
      <flexbox class="detail-header">
        <div
          :style="{ backgroundColor: detailIcon.color }"
          class="header-icon">
          <i :class="['wk', 'wk-' + detailIcon.icon]" />
        </div>
        <div class="header-name">{{ categoryName }}</div>
        <el-dropdown
          v-if="moreHandles && moreHandles.length > 0"
          trigger="click"
          @command="moreHandlesClick">
          <el-button
            icon="el-icon-more"
            class="dropdown-btn" />
          <el-dropdown-menu slot="dropdown">
            <el-dropdown-item
              v-for="(item, index) in moreHandles"
              :key="index"
              :command="item.value">{{ item.label }}</el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
      </flexbox>
      <el-form class="detail-body">
        <!-- 基本信息 -->
        <flexbox
          class="main-wrap"
          :class="{'is-hidden-right': !detail.examineRecordId }"
          align="stretch">
          <div class="left-wrap">
            <div class="b-cells">
              <div
                v-for="(item, index) in list"
                v-show="item.formType !== 'examine_cause' && item.formType !== 'business_cause'"
                :key="index"
                :span="0.5"
                :class="[{'is-block': isBlockShowField(item)}, `is-${item.formType}`]"
                class="b-cell">
                <div
                  class="b-cell-b">
                  <div class="b-cell-name">{{ item.name }}</div>
                  <div class="b-cell-value">
                    <wk-field-view
                      :props="item"
                      :form-type="item.formType"
                      :value="item.value"
                    >
                      <template slot-scope="{ data }">
                        {{ getCommonShowValue(item) }}
                      </template>
                    </wk-field-view>
                  </div>
                </div>
              </div>
            </div>

            <!-- 图片 附件 -->
            <div
              v-if="imgList.length > 0"
              class="img-box">
              <div
                v-for="(imgItem, k) in imgList"
                :key="k"
                class="img-list"
                @click="imgZoom(imgList, k)">
                <img
                  :key="imgItem.url"
                  v-src="imgItem.url"
                  style="object-fit: contain; vertical-align: top;">
              </div>
            </div>

            <!-- 附件 -->
            <div v-if="fileList.length" class="section">
              <div class="section__hd">
                <span>附件</span>
                <span>({{ fileList.length }})</span>
              </div>
              <div class="section__bd">
                <file-cell :file-list="fileList" />
              </div>
            </div>

            <!-- 行程 报销 -->
            <div
              v-if="type && type == 3 && travelList && travelList.length > 0"
              class="section">
              <div class="section__hd"><span>行程</span></div>
              <el-table
                :data="travelList"
                style="margin-top: 16px;"
                align="center"
                header-align="center"
                stripe>
                <el-table-column
                  v-for="(item, index) in travelField"
                  :key="index"
                  :prop="item.prop"
                  :label="item.label"
                  show-overflow-tooltip />
              </el-table>
            </div>

            <div
              v-if="type && type == 5 && travelList && travelList.length > 0"
              class="section">
              <div class="section__hd">
                <span>报销</span></div>
              <el-table
                :data="travelList"
                style="margin-top: 16px;"
                align="center"
                header-align="center"
                stripe>
                <el-table-column
                  v-for="(item, index) in expensesField"
                  :key="index"
                  :prop="item.prop"
                  :label="item.label"
                  show-overflow-tooltip />
                <el-table-column
                  label="发票"
                  width="50">
                  <template slot-scope="scope">
                    <flexbox justify="center">
                      <el-button
                        type="text"
                        @click.native="handleFile('preview', scope.row.img, 0)">{{ scope.row.img ? scope.row.img.length : 0 }}张</el-button>
                    </flexbox>
                  </template>
                </el-table-column>
              </el-table>
            </div>
            <!-- 相关信息 -->
            <div
              v-if="Object.keys(relatedListData).length > 0"
              class="section">
              <div class="section__hd">
                <span>相关信息</span>
              </div>
              <div class="section__bd ">
                <related-business
                  ref="relatedBusiness"
                  :margin-left="'0'"
                  :all-data="relatedListData"
                  :show-add-btn="false" />
              </div>
            </div>
          </div>
          <div class="right-wrap">
            <examine-info-section
              v-if="detail.examineRecordId"
              :id="id"
              :record-id="detail.examineRecordId"
              examine-type="oa_examine"
              @on-handle="examineHandle" />
          </div>
        </flexbox>
      </el-form>
    </div>
    <examine-create-view
      v-if="isCreate"
      :category-id="createInfo.categoryId"
      :type="createInfo.type"
      :category-title="createInfo.categoryTitle"
      :action="createAction"
      @hiden-view="isCreate = false"
      @save-success="saveSuccess" />
  </slide-view>
</template>

<script>
import { oaExamineReadAPI, oaExamineDeleteAPI, oaExamineGetFieldAPI } from '@/api/oa/examine'

import SlideView from '@/components/SlideView'
import RelatedBusiness from '@/components/RelatedBusiness'

import FileCell from '@/components/FileCell'
import WkFieldView from '@/components/NewCom/WkForm/WkFieldView'
import ExamineCreateView from '@/views/oa/examine/components/ExamineCreateView'

import { downloadFile, fileSize } from '@/utils'
import ExamineMixin from '@/views/oa/taskExamine/examine/components/ExamineMixin'
import { getFormFieldShowName } from '@/components/NewCom/WkForm/utils'
import CustomFieldsMixin from '@/mixins/CustomFields'
import ExamineInfoSection from '@/components/Examine/ExamineInfoSection'

export default {
  /** 审批详情 */
  name: 'ExamineDetail',
  components: {
    SlideView,
    RelatedBusiness,
    FileCell,
    WkFieldView,
    ExamineCreateView,
    ExamineInfoSection
  },
  filters: {
    fileName(file) {
      const name = file.name && file.name.length > 10 ? (file.name.substring(0, 10) + '...') : file.name
      return name + '(' + fileSize(file.size) + ')'
    }
  },
  mixins: [ExamineMixin, CustomFieldsMixin],
  props: {
    // 详情信息id
    id: [String, Number],
    // 列表索引
    detailIndex: [String, Number],
    detailSection: [String, Number],
    noListenerClass: {
      type: Array,
      default: () => {
        return ['list-box']
      }
    }
  },
  data() {
    return {
      loading: false,
      categoryId: '',
      type: '', // 区分 3 是行程 5 是报销
      detail: null,
      list: [], // 基本信息
      categoryName: '',

      fileList: [],
      imgList: [],

      travelList: [],
      travelField: [
        { prop: 'vehicle', label: '交通工具' },
        { prop: 'trip', label: '单程往返' },
        { prop: 'startAddress', label: '出发城市' },
        { prop: 'endAddress', label: '目的城市' },
        { prop: 'startTime', label: '开始时间' },
        { prop: 'endTime', label: '结束时间' },
        { prop: 'duration', label: '时长（天）' },
        { prop: 'description', label: '备注' }
      ],
      expensesField: [
        { prop: 'startAddress', label: '出发城市' },
        { prop: 'endAddress', label: '目的城市' },
        { prop: 'startTime', label: '开始时间' },
        { prop: 'endTime', label: '结束时间' },
        { prop: 'traffic', label: '交通费（元）' },
        { prop: 'stay', label: '住宿费（元）' },
        { prop: 'diet', label: '餐饮费（元）' },
        { prop: 'other', label: '其他费用（元）' },
        { prop: 'description', label: '费用明细描述' }
      ],

      // 编辑
      isCreate: false, // 是创建
      createAction: { type: 'save' },
      createInfo: {} // 创建所需要的id 标题名信息
    }
  },
  computed: {
    /**
     * 相关信息
     */
    relatedListData() {
      const tempsData = {}
      const keys = ['contacts', 'customer', 'business', 'contract', 'receivables']
      for (let index = 0; index < keys.length; index++) {
        const key = keys[index]
        const list = this.detail[`${key}List`] || []
        if (list.length > 0) {
          tempsData[key] = list.map(item => {
            if (item.id) {
              item[`${key}Id`] = item.id
            }
            return item
          })
        }
      }
      return tempsData
    },

    /**
     * 详情logo
     */
    detailIcon() {
      return this.getCategoryIcon(this.detail.examineIcon)
    },

    /**
     * 更多操作
     */
    moreHandles() {
      const moreHandles = []
      const permission = this.detail ? this.detail.permission : null
      if (permission) {
        if (permission.isUpdate === 1) {
          moreHandles.push({
            label: '编辑',
            value: 'edit'
          })
        }

        if (permission.isDelete === 1) {
          moreHandles.push({
            label: '删除',
            value: 'delete'
          })
        }
      }
      return moreHandles
    }
  },
  watch: {
    id: function(val) {
      this.detail = null
      this.getDetail()
    }
  },
  mounted() {},
  methods: {
    /**
     * 编辑 删除
     */
    moreHandlesClick(command) {
      if (command === 'edit') {
        this.editClick()
      } else if (command === 'delete') {
        this.$confirm('确定删除?', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
          .then(() => {
            oaExamineDeleteAPI({
              examineId: this.id
            }).then(res => {
              this.$message({
                type: 'success',
                message: '删除成功!'
              })
              this.$emit('handle', {
                type: 'delete'
              })
              this.hideView()
            })
          })
          .catch(() => {
          })
      }
    },

    /**
     * 编辑
     */
    editClick() {
      this.detail.title = this.detail.categoryTitle
      this.createInfo = this.detail
      this.createAction = { type: 'update', id: this.detail.examineId, data: this.detail }
      this.isCreate = true
    },

    /**
     * 保存成功
     */
    saveSuccess() {
      this.isCreate = false
      this.detail = null
      this.getDetail()

      this.$emit('handle', {
        type: 'edit'
      })
    },

    /**
     * 动画完成方法
     */
    viewAfterEnter() {
      this.getDetail()
    },

    /**
     * 获取基础信息
     */
    getBaseInfo() {
      this.loading = true
      oaExamineGetFieldAPI({
        examineId: this.id,
        isDetail: 1, // 1详情 2 编辑
        type: 1 // 一维数组
      })
        .then(res => {
          const list = res.data || []
          console.log('list', list)
          list.forEach(item => {
            if (item.formType === 'examine_cause') {
              this.type = 5
            } else if (item.formType === 'business_cause') {
              this.type = 3
            }
            if (item.formType === 'detail_table') {
              this.getFormItemDefaultProperty(item, false)
              item.value = this.getItemValue(item, null, 'update')
            }
            if (item.fieldName === 'customer_id') {
              item.value = item.value[0].customerName
            }
            if (item.fieldName === 'contract_id' || item.fieldName === 'into_contract_id') {
              item.value = item.value[0].contractNum
            }
          })
          this.list = list
          this.loading = false
        })
        .catch(() => {
          this.loading = false
        })
    },

    getDetail() {
      this.loading = true
      oaExamineReadAPI(this.id)
        .then(res => {
          this.loading = false
          this.categoryId = res.data.categoryId
          this.type = res.data.type
          this.getBaseInfo()
          this.detail = res.data
          this.categoryName = this.detail.categoryTitle

          this.fileList = this.detail.file
          this.imgList = this.detail.img

          this.travelList = this.detail.examineTravelList
        })
        .catch(() => {
          this.loading = false
          this.hideView()
        })
    },

    /**
     * 点击关闭按钮隐藏视图
     */
    hideView() {
      this.$emit('hide-view')
    },

    /**
     * 附件查看
     */
    handleFile(type, files, index) {
      if (type === 'preview') {
        if (files && files.length > 0) {
          this.$wkPreviewFile.preview({
            index: index,
            data: files
          })
        }
      } else if (type === 'download') {
        downloadFile({ path: files.url, name: files.name })
      }
    },

    /**
     * 放大图片
     */
    imgZoom(images, k) {
      this.$wkPreviewFile.preview({
        index: k,
        data: images
      })
    },
    downloadFile(file) {
      downloadFile({ path: file.url, name: file.name })
    },

    /**
     * 审批操作
     */
    examineHandle(data) {
      this.getDetail()
      // this.$store.dispatch('GetOAMessageNum', 'examine')
      this.$emit('on-examine-handle', data, this.detailIndex)
      this.$emit('handle', data, this.detailIndex)
    },

    /**
     * 获取非附件类型的展示值
     */
    getCommonShowValue(item) {
      return getFormFieldShowName(item.formType, item.value, '', item)
    },

    /**
     * 是整行展示字段
     */
    isBlockShowField(item) {
      return [
        'map_address',
        'file',
        'detail_table'].includes(item.formType)
    }
  }
}
</script>

<style lang="scss" scoped>
@import "../../styles/content.scss";

.detail-main {
  height: 100%;
  overflow-y: auto;
  overflow-y: overlay;
}

.d-view {
  position: fixed;
  top: $--detail-view-top;
  right: 0;
  bottom: 0;
  width: 926px;
  padding: 24px;
  background-color: white;

  /deep/ .el-card__body {
    height: 100%;
  }
}

.detail-header {
  .header-icon {
    width: 36px;
    height: 36px;
    margin-right: 8px;
    line-height: 36px;
    text-align: center;
    border-radius: $--border-radius-base;

    .wk {
      font-size: 26px;
      color: white;
    }
  }

  .header-name {
    flex: 1;
    font-size: 16px;
    font-weight: 600;
  }
}

.related-business {
  margin: 15px 0;

  .label {
    margin-bottom: 7px;
    font-size: 13px;
  }

  p {
    padding-left: 7px;
    margin-bottom: 5px;
    font-size: 13px;
    line-height: 30px;
    color: #2362fb;
    cursor: pointer;
    background: #f5f7fa;
    border-radius: 2px;

    img {
      width: 16px;

      @include v-align;
    }
  }
}

.b-cell {
  .b-cell-b {
    width: auto;

    .b-cell-name {
      flex-shrink: 0;
      width: 100px;
      margin-right: 10px;
      color: $--color-text-secondary;
    }

    .b-cell-value {
      min-height: 20px;
      margin-top: 4px;
      margin-bottom: #{$--interval-base * 2};
      line-height: 1.5;
    }

    .b-cell-foot {
      display: block;
      flex-shrink: 0;
      width: 15px;
      height: 15px;
      margin-left: 8px;
    }
  }
}

.f-item {
  height: 25px;
  padding: 3px 0;

  .f-img {
    position: block;
    margin-right: 8px;
    font-size: 12px;
    color: $--color-primary;
  }

  .f-name {
    margin-right: 10px;
    font-size: 12px;
    color: $--color-text-regular;
  }
}

// 图片 附件
.img-box {
  margin: 10px 0;

  .img-list {
    position: relative;
    display: inline-block;
    width: 80px;
    height: 60px;
    margin-right: 8px;
    margin-bottom: 8px;
    line-height: 60px;
    cursor: pointer;

    img {
      width: 80px;
      height: 60px;
    }

    .img-hover {
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      display: none;
      font-size: 12px;
      color: #fff;
      text-align: center;
      background-color: rgba(0, 0, 0, 0.5);

      span {
        @include cursor;

        display: inline-block;
      }
    }
  }

  .img-list:hover {
    .img-hover {
      display: inline-block;
    }
  }
}

// 详情其他模块
.section {
  padding: 10px 0;

  &__hd {
    span {
      font-size: 14px;
      font-weight: $--font-weight-semibold;
    }
  }

  &__bd {
    margin-top: 16px;
  }
}

.secitons {
  position: relative;
  margin-top: 16px;
}

.detail-body {
  padding-top: 24px;

  .main-wrap {
    &.is-hidden-right {
      >.right-wrap {
        display: none;
      }

      >.left-wrap {
        padding-right: 0;
      }
    }

    .left-wrap {
      flex: 1;
      padding-right: 40px;
      overflow: hidden;
    }

    .right-wrap {
      flex-shrink: 0;
      width: 280px;
    }
  }

  .b-cells {
  }
}

.is-block {
  flex-basis: 100% !important;
}

// 审核信息
.examine-info {
  padding: #{$--interval-base * 2};
  margin-top: #{$--interval-base * 2};
  background-color: $--color-n20;
  border-radius: $--border-radius-base;
}
</style>

