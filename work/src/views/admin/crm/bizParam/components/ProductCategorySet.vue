<template>
  <div v-loading="loading">
    <div class="content-header">
      <span>产品类别设置<i
        class="wk wk-icon-fill-help wk-help-tips"
        data-type="24"
        data-id="218" /></span>
    </div>
    <div class="content-body">
      <div class="product-setting-con">
        <div class="tips">注：产品类别最多设置20级</div>
        <div>
          <el-button
            type="primary-text"
            style="padding-left: 0;"
            @click.native="handleTreeSetDrop({type:'create-one'})">+新增一级分类</el-button>
        </div>
        <div class="tree-box">
          <el-tree
            :data="treeData"
            :props="defaultProps"
            default-expand-all>
            <flexbox
              slot-scope="{ node, data }"
              class="node-data">
              <img
                v-if="node.expanded"
                class="node-img"
                src="@/assets/img/fold.png">
              <img
                v-if="!node.expanded"
                class="node-img"
                src="@/assets/img/unfold.png">
              <div class="node-label">{{ node.label }}</div>
              <el-dropdown
                v-if="node.level < maxCreateLevel"
                trigger="click"
                @command="handleTreeSetDrop">
                <div
                  class="node-label-set"
                  @click.stop="getChild(node)">设置</div>
                <el-dropdown-menu slot="dropdown">
                  <el-dropdown-item
                    v-for="(item, index) in treeSetTypes"
                    :key="index"
                    :command="item">{{ item.name }}</el-dropdown-item>
                </el-dropdown-menu>
              </el-dropdown>
            </flexbox>
          </el-tree>
        </div>
      </div>
    </div>
    <el-dialog
      :visible.sync="productHandleDialog"
      :close-on-click-modal="false"
      title="提示"
      width="400px">
      <el-form :model="productForm">
        <el-form-item
          label="类别名称"
          label-width="80">
          <el-input
            v-model="productForm.name"
            :maxlength="20"
            autocomplete="off" />
        </el-form-item>
      </el-form>
      <div
        slot="footer"
        class="dialog-footer">
        <el-button
          type="primary"
          @click="handleProduct">确定</el-button>
        <el-button @click="productHandleDialog = false">取消</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import {
  productCategoryIndexAPI,
  productCategorySaveAPI,
  productCategoryDeleteAPI
} from '@/api/admin/crm'

export default {
  name: 'ProductCategorySet',

  components: {},

  data() {
    return {
      loading: false, // 展示加载中效果

      // 产品类别设置
      treeData: [],
      /** 更多操作 */
      treeSetTypes: [],
      // 最大可创建20级
      maxCreateLevel: 20,
      // 编辑产品弹窗
      productHandleDialog: false,
      productForm: { name: '', type: '', parentId: '', categoryId: '' },
      defaultProps: {
        children: 'children',
        label: 'label'
      }
    }
  },

  created() {
    this.getProductCategoryIndex()
  },

  methods: {
    /**
     * 产品类别设置
     */
    getChild(node) {
      var temps = [
        { type: 'create-child', name: '新建子分类' },
        { type: 'create-brother', name: '新建平级分类' },
        { type: 'edit', name: '编辑分类' },
        { type: 'delete', name: '删除分类' }
      ]
      this.treeSetTypes = temps.map(function(item, index, array) {
        item['node'] = node
        return item
      })
    },

    /**
     * 产品操作
     */
    handleTreeSetDrop(command) {
      if (command.type == 'create-one') {
        this.productForm.type = command.type
        this.productForm.name = ''
        this.productHandleDialog = true
      }
      if (command.type == 'create-child') {
        this.productForm.type = command.type
        this.productForm.parentId = command.node.data.categoryId
        this.productForm.name = ''
        this.productHandleDialog = true
      } else if (command.type == 'create-brother') {
        this.productForm.type = command.type
        this.productForm.parentId = command.node.data.parentId
        this.productForm.name = ''
        this.productHandleDialog = true
      } else if (command.type == 'edit') {
        this.productForm.type = command.type
        this.productForm.name = command.node.data.name
        this.productForm.categoryId = command.node.data.categoryId
        this.productForm.parentId = command.node.data.parentId
        this.productHandleDialog = true
      } else if (command.type == 'delete') {
        this.$confirm('确定删除?', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
          .then(() => {
            this.loading = true
            productCategoryDeleteAPI({
              id: command.node.data.categoryId
            })
              .then(res => {
                this.$message({
                  type: 'success',
                  message: '删除成功!'
                })
                this.getProductCategoryIndex()
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
      }
    },

    /**
     * 产品类别操作
     */
    handleProduct() {
      if (this.productForm.name.length == 0) {
        this.$message({
          message: '请填写名称',
          type: 'warning'
        })
        return
      }
      this.productHandleDialog = false
      if (this.productForm.type == 'create-one') {
        this.loading = true
        productCategorySaveAPI({
          name: this.productForm.name
        })
          .then(res => {
            this.getProductCategoryIndex()
            this.$message.success('新增成功')
            this.loading = false
          })
          .catch(() => {
            this.loading = false
          })
      } else if (this.productForm.type == 'create-child') {
        this.loading = true
        productCategorySaveAPI({
          parentId: this.productForm.parentId,
          name: this.productForm.name
        })
          .then(res => {
            this.getProductCategoryIndex()
            this.$message.success('新建成功')
            this.loading = false
          })
          .catch(() => {
            this.loading = false
          })
      } else if (this.productForm.type == 'create-brother') {
        this.loading = true
        productCategorySaveAPI({
          parentId: this.productForm.parentId,
          name: this.productForm.name
        })
          .then(res => {
            this.getProductCategoryIndex()
            this.$message.success('新建成功')
            this.loading = false
          })
          .catch(() => {
            this.loading = false
          })
      } else if (this.productForm.type == 'edit') {
        this.loading = true
        productCategorySaveAPI({
          categoryId: this.productForm.categoryId,
          parentId: this.productForm.parentId,
          name: this.productForm.name
        })
          .then(res => {
            this.getProductCategoryIndex()
            this.$message.success('编辑成功')
            this.loading = false
          })
          .catch(() => {
            this.loading = false
          })
      }
    },

    /**
     * 获取产品分类数据
     */
    getProductCategoryIndex() {
      this.loading = true
      productCategoryIndexAPI({
        type: 'tree'
      })
        .then(res => {
          this.loading = false
          this.treeData = res.data
        })
        .catch(() => {
          this.loading = false
        })
    }
  }
}
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
@import "./index.scss";

.tree-box {
  overflow: auto;
}

.tree-box /deep/ .el-tree-node__expand-icon {
  display: none;
}

.tree-box /deep/ .el-tree-node__content {
  margin-bottom: 10px;
}

.node-data {
  .node-img {
    display: block;
    width: 15px;
    height: 15px;
    margin-right: 8px;
  }

  .node-label:hover {
    background-color: #ededed;
  }

  .node-label-set {
    display: none;
    margin-left: 8px;
  }
}

.node-data:hover .node-label-set {
  display: block;
}

.product-setting-con {
  position: absolute;
  top: 40px;
  right: 0;
  bottom: 0;
  left: 0;
  overflow: auto;
}

.tips {
  color: $--color-text-secondary;
}
</style>
