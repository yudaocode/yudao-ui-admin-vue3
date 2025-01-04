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
        <el-button plain @click="refreshMenu">
          <Icon class="mr-5px" icon="ep:refresh" />
          刷新菜单缓存
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <div style="height: 700px">
      <!-- AutoResizer 自动调节大小 -->
      <el-auto-resizer>
        <template #default="{ height, width }">
          <!-- Virtualized Table 虚拟化表格：高性能，解决表格在大数据量下的卡顿问题 -->
          <el-table-v2
            v-loading="loading"
            :columns="columns"
            :data="list"
            :width="width"
            :height="height"
            expand-column-key="name"
          />
        </template>
      </el-auto-resizer>
    </div>
  </ContentWrap>

  <!-- 表单弹窗：添加/修改 -->
  <MenuForm ref="formRef" @success="getList" />
</template>
<script lang="ts" setup>
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { handleTree } from '@/utils/tree'
import * as MenuApi from '@/api/system/menu'
import { MenuVO } from '@/api/system/menu'
import MenuForm from './MenuForm.vue'
import { CACHE_KEY, useCache } from '@/hooks/web/useCache'
import { h } from 'vue'
import { Column, ElButton } from 'element-plus'
import { Icon } from '@/components/Icon'
import { hasPermission } from '@/directives/permission/hasPermi'
import { CommonStatusEnum } from '@/utils/constants'

defineOptions({ name: 'SystemMenu' })

const { wsCache } = useCache()
const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

// 表格的 column 字段
const columns: Column[] = [
  {
    dataKey: 'name',
    title: '菜单名称',
    width: 250
  },
  {
    dataKey: 'icon',
    title: '图标',
    width: 150,
    cellRenderer: ({ rowData }) => {
      return h(Icon, {
        icon: rowData.icon
      })
    }
  },
  {
    dataKey: 'sort',
    title: '排序',
    width: 100
  },
  {
    dataKey: 'permission',
    title: '权限标识',
    width: 240
  },
  {
    dataKey: 'component',
    title: '组件路径',
    width: 240
  },
  {
    dataKey: 'componentName',
    title: '组件名称',
    width: 240
  },
  {
    dataKey: 'status',
    title: '状态',
    width: 160,
    cellRenderer: ({ rowData }) => {
      return h(ElSwitch, {
        modelValue: rowData.status,
        activeValue: CommonStatusEnum.ENABLE,
        inactiveValue: CommonStatusEnum.DISABLE,
        loading: menuStatusUpdating.value[rowData.id],
        disabled: !hasPermission(['system:menu:update']),
        onChange: (val) => handleStatusChanged(rowData, val as number)
      })
    }
  },
  {
    dataKey: 'operation',
    title: '操作',
    width: 200,
    cellRenderer: ({ rowData }) => {
      return h(
        'div',
        [
          hasPermission(['system:menu:update']) &&
            h(
              ElButton,
              {
                link: true,
                type: 'primary',
                onClick: () => openForm('update', rowData.id)
              },
              '修改'
            ),
          hasPermission(['system:menu:create']) &&
            h(
              ElButton,
              {
                link: true,
                type: 'primary',
                onClick: () => openForm('create', undefined, rowData.id)
              },
              '新增'
            ),
          hasPermission(['system:menu:delete']) &&
            h(
              ElButton,
              {
                link: true,
                type: 'danger',
                onClick: () => handleDelete(rowData.id)
              },
              '删除'
            )
        ].filter(Boolean)
      )
    }
  }
]
const loading = ref(true) // 列表的加载中
const list = ref<any>([]) // 列表的数据
const queryParams = reactive({
  name: undefined,
  status: undefined
})
const queryFormRef = ref() // 搜索的表单

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
