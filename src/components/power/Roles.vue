<template>
  <div>
    <!--    面包屑导航区域-->
    <el-breadcrumb separator-class="el-icon-arrow-right">
      <el-breadcrumb-item :to="{ path: '/home' }">首页</el-breadcrumb-item>
      <el-breadcrumb-item>权限管理</el-breadcrumb-item>
      <el-breadcrumb-item>角色列表</el-breadcrumb-item>
    </el-breadcrumb>

    <el-card>
<!--      添加角色按钮区域-->
      <el-row>
        <el-col>
          <el-button type="primary" @click="addRolesDialogVisible = true">添加角色</el-button>
        </el-col>
      </el-row>
<!--      角色列表区域-->
      <el-table :data="roleList" border stripe>
<!--        展开列-->
        <el-table-column type="expand">
          <template slot-scope="scope">
            <el-row :class="['bdbottom', i1 === 0 ? 'bdtop' : '', 'vcenter']"
                    v-for="(item1, i1) in scope.row.children" :key="item1.id">
<!--              渲染一级权限-->
              <el-col :span="5">
                <el-tag closable @close="removeRightById(scope.row, item1.id)">{{item1.authName}}</el-tag>
                <i class="el-icon-caret-right"></i>
              </el-col>
<!--              渲染二级和三级权限-->
              <el-col :span="19">
                <!--                  通过for循环嵌套渲染二级权限-->
                <el-row :class="[i2 === 0 ? '' : 'bdtop', 'vcenter']"
                        v-for="(item2, i2) in item1.children" :key="item2.id">
                  <el-col :span="6">
                    <el-tag type="success" closable @close="removeRightById(scope.row, item2.id)">{{item2.authName}}</el-tag>
                    <i class="el-icon-caret-right"></i>
                  </el-col>
                  <el-col :span="18">
                    <el-tag type="warning" v-for="(item3) in item2.children"
                            :key="item3.id" closable
                            @close="removeRightById(scope.row, item3.id)">
                      {{item3.authName}}
                    </el-tag>
                  </el-col>
                </el-row>
              </el-col>
            </el-row>
          </template>
        </el-table-column>
<!--        索引列-->
        <el-table-column label="#" type="index"></el-table-column>
        <el-table-column label="角色名称" prop="roleName"></el-table-column>
        <el-table-column label="角色描述" prop="roleDesc"></el-table-column>
        <el-table-column label="操作" width="300px">
          <template slot-scope="scope">
            <el-button size="mini" type="primary" icon="el-icon-edit">编辑</el-button>
            <el-button size="mini" type="danger" icon="el-icon-delete" @click="removeRoleById(scope.row.id)">删除</el-button>
            <el-button size="mini" type="warning" icon="el-icon-setting"
                       @click="showSetRightDialog(scope.row)">分配权限</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

<!--    分配权限对话框-->
    <el-dialog
      title="分配权限"
      :visible.sync="setRightDialogVisible"
      width="50%" @close="setRightDialogClosed">
<!--      树型控件-->
      <el-tree :data="rightsList" :props="treeProps"
               node-key="id" show-checkbox
               :default-expand-all="true"
               :default-checked-keys="defKeys"
               ref="treeRef"></el-tree>
      <span slot="footer" class="dialog-footer">
    <el-button @click="setRightDialogVisible = false">取 消</el-button>
    <el-button type="primary" @click="allotRights">确 定</el-button>
  </span>
    </el-dialog>

    <!--    添加角色对话框-->
    <el-dialog
      title="添加角色"
      :visible.sync="addRolesDialogVisible"
      width="50%" @close="addRolesDialogClosed">
      <!--      树型控件-->
      <el-form :model="addForm" :rules="addFormRules" ref="addFormRef" label-width="80px">
        <el-form-item label="角色名称" prop="roleName">
          <el-input v-model="addForm.roleName"></el-input>
        </el-form-item>
        <el-form-item label="角色描述" prop="roleDesc">
          <el-input v-model="addForm.roleDesc"></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
    <el-button @click="addRolesDialogVisible = false">取 消</el-button>
    <el-button type="primary" @click="addRoles">确 定</el-button>
  </span>
    </el-dialog>

  </div>
</template>

<script>
export default {
  data() {
    return {
      // 所有角色列表数据
      roleList: [],
      // 控制权限对话框的显示与隐藏
      setRightDialogVisible: false,
      rightsList: [],
      // 树形控件的属性绑定对象
      treeProps: {
        label: 'authName',
        children: 'children'
      },
      // 默认选中的节点ID值数组
      defKeys: [],
      // 当前即将分配权限的角色的id
      roleId: '',
      addRolesDialogVisible: false,
      // 添加角色的表单数据
      addForm: {
        roleName: '',
        roleDesc: ''
      },
      addFormRules: {
        roleName: [
          { required: true, message: '请输入角色名称', trigger: 'blur' }
        ],
        roleDesc: [
          { required: true, message: '请输入角色描述', trigger: 'blur' }
        ]
      }
    }
  },
  created() {
    this.getRoleList()
  },
  methods: {
    // 获取所有角色的列表
    async getRoleList() {
      const { data: res } = await this.$http.get('roles')
      if (res.meta.status !== 200) { return this.$message.error('获取角色列表失败') }

      this.roleList = res.data
    },
    // 根据id删除对应的权限
    async removeRightById(role, rightId) {
      // 弹框提示
      const confirmResult = await this.$confirm('此操作将永久删除该文件, 是否继续?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).catch(err => err)
      if (confirmResult !== 'confirm') { return this.$message.info('取消了删除') }

      const { data: res } = await this.$http.delete(`roles/${role.id}/rights/${rightId}`)
      if (res.meta.status !== 200) { return this.$message.error('删除权限失败') }

      role.children = res.data
    },
    // 展示分配权限的对话框
    async showSetRightDialog(role) {
      this.roleId = role.id
      // 获取所有权限的数据
      const { data: res } = await this.$http.get('rights/tree')
      if (res.meta.status !== 200) { return this.$message.error('获取全线数据失败') }
      // 把获取到的全线数据保存到data中
      this.rightsList = res.data

      // 递归获取三级权限id
      this.getLeafKeys(role, this.defKeys)
      this.setRightDialogVisible = true
    },
    // 通过递归的形式, 获取角色下所有三级权限的id
    getLeafKeys(node, arr) {
      // 如果当前node节点不包含children属性,则是三级节点
      if (!node.children) { return arr.push(node.id) }

      node.children.forEach(item => {
        this.getLeafKeys(item, arr)
      })
    },
    // 坚挺分配权限对话框的关闭事件
    setRightDialogClosed() {
      this.defKeys = []
    },
    // 为角色分配权限
    async allotRights() {
      const keys = [
        ...this.$refs.treeRef.getCheckedKeys(),
        ...this.$refs.treeRef.getHalfCheckedKeys()
      ]
      const idStr = keys.join(',')
      const { data: res } = await this.$http.post(`roles/${this.roleId}/rights`, { rids: idStr })
      if (res.meta.status !== 200) { return this.$message.error('分配权限失败!') }

      this.$message.success('分配权限成功')
      this.getRoleList()
      this.setRightDialogVisible = false
    },
    // 监听添加角色对话框关闭事件
    addRolesDialogClosed() {
      this.$refs.addFormRef.resetFields()
    },
    // 监听添加角色对话框确定按钮事件
    async addRoles() {
      this.$refs.addForm.validate(async valid => {
        if (!valid) return
        const { data: res } = await this.$http.post('roles', this.addForm)
        console.log(res)
        if (res.meta.status !== 201) { return this.$message.error('添加角色失败!') }

        this.$message.success('添加角色成功')
        this.getRoleList()
        this.addRolesDialogVisible = false
      })
    },
    // 根据id删除角色
    async removeRoleById(id) {
      const confirmResult = await this.$confirm('此操作将永久删除该角色, 是否继续? ', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).catch(err => err)
      if (confirmResult !== 'confirm') { return this.$message.info('已取消删除') }

      const { data: res } = await this.$http.delete('roles/' + id)
      if (res.meta.status !== 200) { return this.$message.error('删除角色失败') }

      this.$message.success('删除用户成功')
      this.getRoleList()
    }
  }
}
</script>

<style lang="less" scoped>
.el-tag{
  margin: 7px;
}
.bdtop {
  border-top: 1px solid #eee;
}
.bdbottom {
  border-bottom: 1px solid #eee;
}
/*纵向居中*/
.vcenter {
  display: flex;
  align-items: center;
}
</style>
