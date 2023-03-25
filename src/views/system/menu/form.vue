<template>
  <Dialog :title="modelTitle" v-model="modelVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="80px"
      v-loading="formLoading"
    >
      <el-form-item label="上级菜单">
        <el-tree-select
          node-key="id"
          v-model="formData.parentId"
          :props="defaultProps"
          :data="menuOptions"
          :default-expanded-keys="[0]"
          check-strictly
        />
      </el-form-item>
      <el-col :span="16">
        <el-form-item label="菜单名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入菜单名称" clearable />
        </el-form-item>
      </el-col>
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
      <template v-if="formData.type !== 3">
        <el-form-item label="菜单图标">
          <IconSelect v-model="formData.icon" clearable />
        </el-form-item>
        <el-col :span="16">
          <el-form-item label="路由地址" prop="path">
            <template #label>
              <Tooltip
                titel="路由地址"
                message="访问的路由地址，如：`user`。如需外网地址时，则以 `http(s)://` 开头"
              />
            </template>
            <el-input v-model="formData.path" placeholder="请输入路由地址" clearable />
          </el-form-item>
        </el-col>
      </template>
      <template v-if="formData.type === 2">
        <el-col :span="16">
          <el-form-item label="组件地址" prop="component">
            <el-input
              v-model="formData.component"
              placeholder="例如说：system/user/index"
              clearable
            />
          </el-form-item>
        </el-col>
        <el-col :span="16">
          <el-form-item label="组件名字" prop="componentName">
            <el-input v-model="formData.componentName" placeholder="例如说：SystemUser" clearable />
          </el-form-item>
        </el-col>
      </template>
      <template v-if="formData.type !== 1">
        <el-col :span="16">
          <el-form-item label="权限标识" prop="permission">
            <template #label>
              <Tooltip
                titel="权限标识"
                message="Controller 方法上的权限字符，如：@PreAuthorize(`@ss.hasPermission('system:user:list')`)"
              />
            </template>
            <el-input v-model="formData.permission" placeholder="请输入权限标识" clearable />
          </el-form-item>
        </el-col>
      </template>
      <el-col :span="16">
        <el-form-item label="显示排序" prop="sort">
          <el-input-number v-model="formData.sort" controls-position="right" :min="0" clearable />
        </el-form-item>
      </el-col>
      <el-col :span="16">
        <el-form-item label="菜单状态" prop="status">
          <el-radio-group v-model="formData.status">
            <el-radio
              border
              v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
              :key="dict.label"
              :label="dict.value"
            >
              {{ dict.label }}
            </el-radio>
          </el-radio-group>
        </el-form-item>
      </el-col>
      <template v-if="formData.type !== 3">
        <el-col :span="16">
          <el-form-item label="显示状态" prop="visible">
            <template #label>
              <Tooltip
                titel="显示状态"
                message="选择隐藏时，路由将不会出现在侧边栏，但仍然可以访问"
              />
            </template>
            <el-radio-group v-model="formData.visible">
              <el-radio border key="true" :label="true">显示</el-radio>
              <el-radio border key="false" :label="false">隐藏</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
      </template>
      <template v-if="formData.type !== 3">
        <el-col :span="16">
          <el-form-item label="总是显示" prop="alwaysShow">
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
        </el-col>
      </template>
      <template v-if="formData.type === 2">
        <el-col :span="16">
          <el-form-item label="缓存状态" prop="keepAlive">
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
        </el-col>
      </template>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
        <el-button @click="modelVisible = false">取 消</el-button>
      </div>
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

const modelVisible = ref(false) // 弹窗的是否展示
const modelTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: 0,
  name: '',
  permission: '',
  type: SystemMenuTypeEnum.DIR,
  sort: 1,
  parentId: 0,
  path: '',
  icon: '',
  component: '',
  componentName: '',
  status: CommonStatusEnum.ENABLE,
  visible: true,
  keepAlive: true,
  alwaysShow: true,
  createTime: new Date()
})

const formRules = reactive({
  name: [{ required: true, message: '菜单名称不能为空', trigger: 'blur' }],
  sort: [{ required: true, message: '菜单顺序不能为空', trigger: 'blur' }],
  path: [{ required: true, message: '路由地址不能为空', trigger: 'blur' }],
  status: [{ required: true, message: '状态不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref

/** 打开弹窗 */
const openModal = async (type: string, id?: number) => {
  modelVisible.value = true
  modelTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  await getTree()
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await MenuApi.getMenuApi(id)
      // TODO 芋艿：这块要优化下，部分字段未重置，无法修改
      //   formData.value.componentName = res.componentName || ''
      //   formData.value.alwaysShow = res.alwaysShow !== undefined ? res.alwaysShow : true
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ openModal }) // 提供 openModal 方法，用于打开弹窗

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
    const data = formData.value
    if (formType.value === 'create') {
      await MenuApi.createMenuApi(data)
      message.success(t('common.createSuccess'))
    } else {
      await MenuApi.updateMenuApi(data)
      message.success(t('common.updateSuccess'))
    }
    modelVisible.value = false
    // 发送操作成功的事件
    emit('success')
  } finally {
    formLoading.value = false
    wsCache.delete(CACHE_KEY.ROLE_ROUTERS)
  }
}

// ========== 下拉框[上级菜单] ==========
const menuOptions = ref<any[]>([]) // 树形结构
// 获取下拉框[上级菜单]的数据
const getTree = async () => {
  menuOptions.value = []
  const res = await MenuApi.listSimpleMenusApi()
  let menu: Tree = { id: 0, name: '主类目', children: [] }
  menu.children = handleTree(res)
  menuOptions.value.push(menu)
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    id: 0,
    name: '',
    permission: '',
    type: SystemMenuTypeEnum.DIR,
    sort: 1,
    parentId: 0,
    path: '',
    icon: '',
    component: '',
    componentName: '',
    status: CommonStatusEnum.ENABLE,
    visible: true,
    keepAlive: true,
    alwaysShow: true,
    createTime: new Date()
  }
  formRef.value?.resetFields()
}

// 判断 path 是不是外部的 HTTP 等链接
const isExternal = (path: string) => {
  return /^(https?:|mailto:|tel:)/.test(path)
}
</script>
