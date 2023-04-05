<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      v-loading="formLoading"
    >
      <el-form-item label="上级菜单">
        <el-tree-select
          node-key="id"
          v-model="formData.parentId"
          :props="defaultProps"
          :data="menuTree"
          :default-expanded-keys="[0]"
          check-strictly
        />
      </el-form-item>
      <el-form-item label="菜单名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入菜单名称" clearable />
      </el-form-item>
      <el-form-item label="菜单类型" prop="type">
        <el-radio-group v-model="formData.type">
          <el-radio-button
            v-for="dict in getIntDictOptions(DICT_TYPE.SYSTEM_MENU_TYPE)"
            :key="dict.label"
            :label="dict.value"
          >
            {{ dict.label }}
          </el-radio-button>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="菜单图标" v-if="formData.type !== 3">
        <IconSelect v-model="formData.icon" clearable />
      </el-form-item>
      <el-form-item label="路由地址" prop="path" v-if="formData.type !== 3">
        <template #label>
          <Tooltip
            titel="路由地址"
            message="访问的路由地址，如：`user`。如需外网地址时，则以 `http(s)://` 开头"
          />
        </template>
        <el-input v-model="formData.path" placeholder="请输入路由地址" clearable />
      </el-form-item>
      <el-form-item label="组件地址" prop="component" v-if="formData.type === 2">
        <el-input v-model="formData.component" placeholder="例如说：system/user/index" clearable />
      </el-form-item>
      <el-form-item label="组件名字" prop="componentName" v-if="formData.type === 2">
        <el-input v-model="formData.componentName" placeholder="例如说：SystemUser" clearable />
      </el-form-item>
      <el-form-item label="权限标识" prop="permission" v-if="formData.type !== 1">
        <template #label>
          <Tooltip
            titel="权限标识"
            message="Controller 方法上的权限字符，如：@PreAuthorize(`@ss.hasPermission('system:user:list')`)"
          />
        </template>
        <el-input v-model="formData.permission" placeholder="请输入权限标识" clearable />
      </el-form-item>
      <el-form-item label="显示排序" prop="sort">
        <el-input-number v-model="formData.sort" controls-position="right" :min="0" clearable />
      </el-form-item>
      <el-form-item label="菜单状态" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio
            v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
            :key="dict.label"
            :label="dict.value"
          >
            {{ dict.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="显示状态" prop="visible" v-if="formData.type !== 3">
        <template #label>
          <Tooltip titel="显示状态" message="选择隐藏时，路由将不会出现在侧边栏，但仍然可以访问" />
        </template>
        <el-radio-group v-model="formData.visible">
          <el-radio border key="true" :label="true">显示</el-radio>
          <el-radio border key="false" :label="false">隐藏</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="总是显示" prop="alwaysShow" v-if="formData.type !== 3">
        <template #label>
          <Tooltip
            titel="总是显示"
            message="选择不是时，当该菜单只有一个子菜单时，不展示自己，直接展示子菜单"
          />
        </template>
        <el-radio-group v-model="formData.alwaysShow">
          <el-radio border key="true" :label="true">总是</el-radio>
          <el-radio border key="false" :label="false">不是</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="缓存状态" prop="keepAlive" v-if="formData.type === 2">
        <template #label>
          <Tooltip
            titel="缓存状态"
            message="选择缓存时，则会被 `keep-alive` 缓存，必须填写「组件名称」字段"
          />
        </template>
        <el-radio-group v-model="formData.keepAlive">
          <el-radio border key="true" :label="true">缓存</el-radio>
          <el-radio border key="false" :label="false">不缓存</el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import * as MenuApi from '@/api/system/menu'
import { CACHE_KEY, useCache } from '@/hooks/web/useCache'
import { SystemMenuTypeEnum, CommonStatusEnum } from '@/utils/constants'
import { handleTree, defaultProps } from '@/utils/tree'
const { wsCache } = useCache()
const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: 0,
  name: '',
  permission: '',
  type: SystemMenuTypeEnum.DIR,
  sort: Number(undefined),
  parentId: 0,
  path: '',
  icon: '',
  component: '',
  componentName: '',
  status: CommonStatusEnum.ENABLE,
  visible: true,
  keepAlive: true,
  alwaysShow: true
})
const formRules = reactive({
  name: [{ required: true, message: '菜单名称不能为空', trigger: 'blur' }],
  sort: [{ required: true, message: '菜单顺序不能为空', trigger: 'blur' }],
  path: [{ required: true, message: '路由地址不能为空', trigger: 'blur' }],
  status: [{ required: true, message: '状态不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref

/** 打开弹窗 */
const open = async (type: string, id?: number, parentId?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  if (parentId) {
    formData.value.parentId = parentId
  }
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await MenuApi.getMenu(id)
    } finally {
      formLoading.value = false
    }
  }
  // 获得菜单列表
  await getTree()
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 提交表单 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
const submitForm = async () => {
  // 校验表单
  if (!formRef) return
  const valid = await formRef.value.validate()
  if (!valid) return
  // 提交请求
  formLoading.value = true
  try {
    if (
      formData.value.type === SystemMenuTypeEnum.DIR ||
      formData.value.type === SystemMenuTypeEnum.MENU
    ) {
      if (!isExternal(formData.value.path)) {
        if (formData.value.parentId === 0 && formData.value.path.charAt(0) !== '/') {
          message.error('路径必须以 / 开头')
          return
        } else if (formData.value.parentId !== 0 && formData.value.path.charAt(0) === '/') {
          message.error('路径不能以 / 开头')
          return
        }
      }
    }
    const data = formData.value as unknown as MenuApi.MenuVO
    if (formType.value === 'create') {
      await MenuApi.createMenu(data)
      message.success(t('common.createSuccess'))
    } else {
      await MenuApi.updateMenu(data)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
    // 发送操作成功的事件
    emit('success')
  } finally {
    formLoading.value = false
    // 清空，从而触发刷新
    wsCache.delete(CACHE_KEY.ROLE_ROUTERS)
  }
}

/** 获取下拉框[上级菜单]的数据  */
const menuTree = ref<Tree[]>([]) // 树形结构
const getTree = async () => {
  menuTree.value = []
  const res = await MenuApi.getSimpleMenusList()
  let menu: Tree = { id: 0, name: '主类目', children: [] }
  menu.children = handleTree(res)
  menuTree.value.push(menu)
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    id: 0,
    name: '',
    permission: '',
    type: SystemMenuTypeEnum.DIR,
    sort: Number(undefined),
    parentId: 0,
    path: '',
    icon: '',
    component: '',
    componentName: '',
    status: CommonStatusEnum.ENABLE,
    visible: true,
    keepAlive: true,
    alwaysShow: true
  }
  formRef.value?.resetFields()
}

/** 判断 path 是不是外部的 HTTP 等链接 */
const isExternal = (path: string) => {
  return /^(https?:|mailto:|tel:)/.test(path)
}
</script>
