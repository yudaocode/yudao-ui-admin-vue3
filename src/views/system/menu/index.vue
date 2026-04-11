<template>
  <doc-alert title="功能权限" url="https://doc.iocoder.cn/resource-permission" />
  <doc-alert title="菜单路由" url="https://doc.iocoder.cn/vue3/route/" />

  <!-- 搜索工作栏 -->
  <ContentWrap>
    <el-form
      ref="queryFormRef"
      :inline="true"
      :model="queryParams"
      class="-mb-15px"
      label-width="68px"
    >
      <el-form-item label="菜单名称" prop="name">
        <el-input
          v-model="queryParams.name"
          class="!w-240px"
          clearable
          placeholder="请输入菜单名称"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select
          v-model="queryParams.status"
          class="!w-240px"
          clearable
          placeholder="请选择菜单状态"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery">
          <Icon class="mr-5px" icon="ep:search" />
          搜索
        </el-button>
        <el-button @click="resetQuery">
          <Icon class="mr-5px" icon="ep:refresh" />
          重置
        </el-button>
        <el-button
          v-hasPermi="['system:menu:create']"
          plain
          type="primary"
          @click="openForm('create')"
        >
          <Icon class="mr-5px" icon="ep:plus" />
          新增
        </el-button>
        <el-button plain type="danger" @click="toggleExpandAll">
          <Icon class="mr-5px" icon="ep:sort" />
          展开/折叠
        </el-button>
        <el-button plain @click="refreshMenu">
          <Icon class="mr-5px" icon="ep:refresh" />
          刷新菜单缓存
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-auto-resizer>
      <template #default="{ width }">
        <el-table-v2
          v-model:expanded-row-keys="expandedRowKeys"
          :columns="columns"
          :data="list"
          :expand-column-key="columns[0].key"
          :height="1000"
          :width="width"
          fixed
          row-key="id"
        />
      </template>
    </el-auto-resizer>
  </ContentWrap>

  <!-- 表单弹窗：添加/修改 -->
  <MenuForm ref="formRef" @success="getList" />
</template>
<script lang="tsx" setup>
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { handleTree } from '@/utils/tree'
import * as MenuApi from '@/api/system/menu'
import { MenuVO } from '@/api/system/menu'
import MenuForm from './MenuForm.vue'
import DictTag from '@/components/DictTag/src/DictTag.vue'
import { Icon } from '@/components/Icon'
import { ElButton, TableV2FixedDir, ElSwitch } from 'element-plus'
import { checkPermi } from '@/utils/permission'
import { CommonStatusEnum } from '@/utils/constants'
import { CACHE_KEY, useCache } from '@/hooks/web/useCache'

defineOptions({ name: 'SystemMenu' })

// 虚拟列表表格
const columns = [
  {
    key: 'name',
    title: '菜单名称',
    dataKey: 'name',
    width: 250,
    fixed: TableV2FixedDir.LEFT
  },
  {
    key: 'icon',
    title: '图标',
    dataKey: 'icon',
    width: 100,
    align: 'center',
    cellRenderer: ({ cellData: icon }) => <Icon icon={icon} />
  },
  {
    key: 'sort',
    title: '排序',
    dataKey: 'sort',
    width: 60
  },
  {
    key: 'permission',
    title: '权限标识',
    dataKey: 'permission',
    width: 300
  },
  {
    key: 'component',
    title: '组件路径',
    dataKey: 'component',
    width: 500
  },
  {
    key: 'componentName',
    title: '组件名称',
    dataKey: 'componentName',
    width: 200
  },
  {
    key: 'status',
    title: '状态',
    dataKey: 'status',
    width: 60,
    fixed: TableV2FixedDir.RIGHT,
    cellRenderer: ({ rowData }) => {
      // 检查权限
      if (!checkPermi(['system:menu:update'])) {
        return <DictTag type={DICT_TYPE.COMMON_STATUS} value={rowData.status} />
      }

      // 如果有权限，渲染 ElSwitch
      return (
        <ElSwitch
          v-model={rowData.status}
          active-value={CommonStatusEnum.ENABLE}
          inactive-value={CommonStatusEnum.DISABLE}
          loading={menuStatusUpdating[rowData.id]}
          class="ml-4px"
          onChange={(val) => handleStatusChanged(rowData, val)}
        />
      )
    }
  },
  {
    key: 'operations',
    title: '操作',
    align: 'center',
    width: 160,
    fixed: TableV2FixedDir.RIGHT,
    cellRenderer: ({ rowData }) => {
      // 定义按钮列表
      const buttons: InstanceType<typeof ElButton>[] = []

      // 检查权限并添加按钮
      if (checkPermi(['system:menu:update'])) {
        buttons.push(
          <ElButton key="edit" link type="primary" onClick={() => openForm('update', rowData.id)}>
            修改
          </ElButton>
        )
      }
      if (checkPermi(['system:menu:create'])) {
        buttons.push(
          <ElButton
            key="create"
            link
            type="primary"
            onClick={() => openForm('create', undefined, rowData.id)}
          >
            新增
          </ElButton>
        )
      }
      if (checkPermi(['system:menu:delete'])) {
        buttons.push(
          <ElButton key="delete" link type="danger" onClick={() => handleDelete(rowData.id)}>
            删除
          </ElButton>
        )
      }
      // 如果没有权限，返回 null
      if (buttons.length === 0) {
        return null
      }
      // 渲染按钮列表
      return <>{buttons}</>
    }
  }
]

const { wsCache } = useCache()
const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const loading = ref(true) // 列表的加载中
const list = ref<any[]>([]) // 列表的数据
const queryParams = reactive({
  name: undefined,
  status: undefined
})
const queryFormRef = ref() // 搜索的表单
const isExpandAll = ref(false) // 是否展开，默认全部折叠
const refreshTable = ref(true) // 重新渲染表格状态

// 添加展开行控制
const expandedRowKeys = ref<number[]>([])

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await MenuApi.getMenuList(queryParams)
    list.value = handleTree(data)
  } finally {
    loading.value = false
  }
}

/** 搜索按钮操作 */
const handleQuery = () => {
  getList()
}

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value.resetFields()
  handleQuery()
}

/** 添加/修改操作 */
const formRef = ref()
const openForm = (type: string, id?: number, parentId?: number) => {
  formRef.value.open(type, id, parentId)
}

/** 展开/折叠操作 */
const toggleExpandAll = () => {
  if (!isExpandAll.value) {
    // 展开所有
    expandedRowKeys.value = list.value.map((item) => item.id)
  } else {
    // 折叠所有
    expandedRowKeys.value = []
  }
  isExpandAll.value = !isExpandAll.value
}

/** 刷新菜单缓存按钮操作 */
const refreshMenu = async () => {
  try {
    await message.confirm('即将更新缓存刷新浏览器！', '刷新菜单缓存')
    // 清空，从而触发刷新
    wsCache.delete(CACHE_KEY.USER)
    wsCache.delete(CACHE_KEY.ROLE_ROUTERS)
    // 刷新浏览器
    location.reload()
  } catch {}
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 发起删除
    await MenuApi.deleteMenu(id)
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch {}
}

/** 开启/关闭菜单的状态 */
const menuStatusUpdating = ref({}) // 菜单状态更新中的 menu 映射。key：菜单编号，value：是否更新中
const handleStatusChanged = async (menu: MenuVO, val: number) => {
  // 1. 标记 menu.id 更新中
  menuStatusUpdating.value[menu.id] = true
  try {
    // 2. 发起更新状态
    menu.status = val
    await MenuApi.updateMenu(menu)
  } finally {
    // 3. 标记 menu.id 更新完成
    menuStatusUpdating.value[menu.id] = false
  }
}

/** 初始化 **/
onMounted(() => {
  getList()
})
</script>
