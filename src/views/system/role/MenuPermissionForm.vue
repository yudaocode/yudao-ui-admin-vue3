<template>
  <Dialog :title="dialogScopeTitle" v-model="dialogScopeVisible" width="800">
    <el-form
      ref="menuPermissionFormRef"
      :model="dataScopeForm"
      :inline="true"
      label-width="80px"
      v-loading="formLoading"
    >
      <el-form-item label="角色名称">
        <el-tag>{{ dataScopeForm.name }}</el-tag>
      </el-form-item>
      <el-form-item label="角色标识">
        <el-tag>{{ dataScopeForm.code }}</el-tag>
      </el-form-item>
      <!-- 分配角色的数据权限对话框 -->
      <el-form-item label="权限范围" v-if="actionScopeType === 'data'">
        <el-select v-model="dataScopeForm.dataScope">
          <el-option
            v-for="item in dataScopeDictDatas"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <!-- 分配角色的菜单权限对话框 -->
      <el-row>
        <el-col :span="24">
          <el-form-item
            label="权限范围"
            v-if="
              actionScopeType === 'menu' ||
              dataScopeForm.dataScope === SystemDataScopeEnum.DEPT_CUSTOM
            "
            style="display: flex"
          >
            <el-card class="card" shadow="never">
              <template #header>
                父子联动(选中父节点，自动选择子节点):
                <el-switch
                  v-model="checkStrictly"
                  inline-prompt
                  active-text="是"
                  inactive-text="否"
                />
                全选/全不选:
                <el-switch
                  v-model="treeNodeAll"
                  inline-prompt
                  active-text="是"
                  inactive-text="否"
                  @change="handleCheckedTreeNodeAll()"
                />
              </template>
              <el-tree
                ref="treeRef"
                node-key="id"
                show-checkbox
                :check-strictly="!checkStrictly"
                :props="defaultProps"
                :data="dataScopeForm"
                empty-text="加载中，请稍后"
              />
            </el-card>
          </el-form-item> </el-col
      ></el-row>
    </el-form>
    <!-- 操作按钮 -->
    <template #footer>
      <div class="dialog-footer">
        <el-button
          :title="t('action.save')"
          :loading="actionLoading"
          @click="submitScope()"
          type="primary"
          :disabled="formLoading"
        >
          保存
        </el-button>
        <el-button
          :loading="actionLoading"
          :title="t('dialog.close')"
          @click="dialogScopeVisible = false"
          >取 消</el-button
        >
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import * as RoleApi from '@/api/system/role'
import type { ElTree } from 'element-plus'
import type { FormExpose } from '@/components/Form'
import { handleTree, defaultProps } from '@/utils/tree'
import { SystemDataScopeEnum } from '@/utils/constants'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { listSimpleMenusApi } from '@/api/system/menu'
import { listSimpleDeptApi } from '@/api/system/dept'
import * as PermissionApi from '@/api/system/permission'
// ========== CRUD 相关 ==========
const actionLoading = ref(false) // 遮罩层
const menuPermissionFormRef = ref<FormExpose>() // 表单 Ref
const { t } = useI18n() // 国际化
const dialogScopeTitle = ref('菜单权限')
const dataScopeDictDatas = ref()
const message = useMessage() // 消息弹窗
const actionScopeType = ref('')
// 选项
const checkStrictly = ref(true)
const treeNodeAll = ref(false)
const dialogScopeVisible = ref(false) // 弹窗的是否展示
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const treeOptions = ref<any[]>([]) // 菜单树形结构
const treeRef = ref<InstanceType<typeof ElTree>>()
// ========== 数据权限 ==========
const dataScopeForm = reactive({
  id: 0,
  name: '',
  code: '',
  dataScope: 0,
  checkList: []
})

/** 打开弹窗 */
const openModal = async (type: string, row: RoleApi.RoleVO) => {
  dataScopeForm.id = row.id
  dataScopeForm.name = row.name
  dataScopeForm.code = row.code
  actionScopeType.value = type
  dialogScopeVisible.value = true
  if (type === 'menu') {
    const menuRes = await listSimpleMenusApi()
    treeOptions.value = handleTree(menuRes)
    const role = await PermissionApi.listRoleMenusApi(row.id)
    if (role) {
      role?.forEach((item: any) => {
        unref(treeRef)?.setChecked(item, true, false)
      })
    }
  } else if (type === 'data') {
    const deptRes = await listSimpleDeptApi()
    treeOptions.value = handleTree(deptRes)
    const role = await RoleApi.getRole(row.id)
    dataScopeForm.dataScope = role.dataScope
    if (role.dataScopeDeptIds) {
      role.dataScopeDeptIds?.forEach((item: any) => {
        unref(treeRef)?.setChecked(item, true, false)
      })
    }
  }
}

// 保存权限
const submitScope = async () => {
  if ('data' === actionScopeType.value) {
    const data = ref<PermissionApi.PermissionAssignRoleDataScopeReqVO>({
      roleId: dataScopeForm.id,
      dataScope: dataScopeForm.dataScope,
      dataScopeDeptIds:
        dataScopeForm.dataScope !== SystemDataScopeEnum.DEPT_CUSTOM
          ? []
          : (treeRef.value!.getCheckedKeys(false) as unknown as Array<number>)
    })
    await PermissionApi.assignRoleDataScopeApi(data.value)
  } else if ('menu' === actionScopeType.value) {
    const data = ref<PermissionApi.PermissionAssignRoleMenuReqVO>({
      roleId: dataScopeForm.id,
      menuIds: [
        ...(treeRef.value!.getCheckedKeys(false) as unknown as Array<number>),
        ...(treeRef.value!.getHalfCheckedKeys() as unknown as Array<number>)
      ]
    })
    await PermissionApi.assignRoleMenuApi(data.value)
  }
  message.success(t('common.updateSuccess'))
  dialogScopeVisible.value = false
}

// 全选/全不选
const handleCheckedTreeNodeAll = () => {
  treeRef.value!.setCheckedNodes(treeNodeAll.value ? treeOptions.value : [])
}

const init = () => {
  dataScopeDictDatas.value = getIntDictOptions(DICT_TYPE.SYSTEM_DATA_SCOPE)
}

defineExpose({ openModal }) // 提供 openModal 方法，用于打开弹窗
// ========== 初始化 ==========
onMounted(() => {
  init()
})
</script>
<style scoped>
.card {
  width: 100%;
  max-height: 400px;
  overflow-y: scroll;
}
</style>
