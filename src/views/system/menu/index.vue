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
    <el-tree-v2
      v-if="refreshTable"
      v-loading="loading"
      :data="list"
      :props="{
        label: 'name',
        children: 'children'
      }"
      :default-expanded-keys="isExpandAll ? list.map(item => item.id) : []"
      :height="600"
      :item-size="40"
      :virtual-scroll-horizontal="true"
      :highlight-current="true"
      @current-change="handleCurrentChange"
    >
      <template #default="{ data }">
        <div 
          class="custom-tree-node"
          :class="{ 'menu-item': true }"
        >
          <div class="node-content">
            <span class="label">{{ data.name }}</span>
            <div v-if="currentNode === data" class="menu-info">
              <span class="info-item" v-if="data.icon">
                <span class="info-label">图标：</span>
                <span class="icon-preview">
                  <Icon :icon="data.icon" />
                  <span class="icon-name">{{ data.icon }}</span>
                </span>
              </span>
              <span class="info-item">
                <span class="info-label">排序：</span>
                <span class="info-value">{{ data.sort }}</span>
              </span>
              <span class="info-item" v-if="data.permission">
                <span class="info-label">权限标识：</span>
                <span class="info-value">{{ data.permission }}</span>
              </span>
              <span class="info-item" v-if="data.path">
                <span class="info-label">路由地址：</span>
                <span class="info-value">{{ data.path }}</span>
              </span>
              <span class="info-item" v-if="data.component">
                <span class="info-label">组件路径：</span>
                <span class="info-value">{{ data.component }}</span>
              </span>
              <span class="info-item" v-if="data.componentName">
                <span class="info-label">组件名称：</span>
                <span class="info-value">{{ data.componentName }}</span>
              </span>
            </div>
          </div>
          <div v-show="currentNode === data" class="operations">
            <el-button
              v-hasPermi="['system:menu:update']"
              link
              type="primary"
              @click.stop="openForm('update', data.id)"
            >
              修改
            </el-button>
            <el-button
              v-hasPermi="['system:menu:create']"
              link
              type="primary"
              @click.stop="openForm('create', undefined, data.id)"
            >
              新增
            </el-button>
            <el-button
              v-hasPermi="['system:menu:delete']"
              link
              type="danger"
              @click.stop="handleDelete(data.id)"
            >
              删除
            </el-button>
          </div>
        </div>
      </template>
    </el-tree-v2>
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
import { CommonStatusEnum } from '@/utils/constants'

defineOptions({ name: 'SystemMenu' })

const { wsCache } = useCache()
const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const loading = ref(true) // 列表的加载中
const list = ref<any>([]) // 列表的数据
const queryParams = reactive({
  name: undefined,
  status: undefined
})
const queryFormRef = ref() // 搜索的表单
const isExpandAll = ref(false) // 是否展开，默认全部折叠
const refreshTable = ref(true) // 重新渲染表格状态
const currentNode = ref<any>(null) // 当前选中节点

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await MenuApi.getMenuList(queryParams)
    // 为每个节点添加 showInfo 属性和样式对象
    const addProps = (items: any[]) => {
      items.forEach(item => {
        item.showInfo = false
        item.popupStyle = {}
        if (item.children && item.children.length > 0) {
          addProps(item.children)
        }
      })
    }
    const processedData = handleTree(data)
    addProps(processedData)
    list.value = processedData
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
  refreshTable.value = false
  isExpandAll.value = !isExpandAll.value
  nextTick(() => {
    refreshTable.value = true
  })
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

const handleCurrentChange = (data: any) => {
  currentNode.value = data
  // 关闭所有信息面板
  list.value.forEach((item: any) => {
    item.showInfo = false
  })
}

// 添加点击外部关闭弹出层的处理
onMounted(() => {
  document.addEventListener('click', (event: MouseEvent) => {
    const target = event.target as HTMLElement
    if (!target.closest('.menu-info-popup') && !target.closest('.info-button')) {
      list.value.forEach((item: any) => {
        item.showInfo = false
      })
    }
  })
})

/** 初始化 **/
onMounted(() => {
  getList()
})
</script>

<style lang="scss" scoped>
:deep(.el-tree-node.is-current > .el-tree-node__content) {
  background-color: var(--el-color-primary-light-7) !important;

  .custom-tree-node {
    background-color: var(--el-color-primary-light-7);
    
    .operations {
      background-color: var(--el-color-primary-light-7);
    }
  }
}

.custom-tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px;
  height: 40px;
  position: relative;
  border-bottom: 1px solid var(--el-border-color-lighter);
  min-width: 800px;
  transition: background-color 0.3s;

  .node-content {
    display: flex;
    align-items: center;
    gap: 12px;
    height: 100%;
    flex: 1;
    min-width: 0;

    .label {
      flex-shrink: 0;
    }

    .menu-info {
      display: flex;
      align-items: center;
      gap: 16px;
      overflow-x: auto;
      flex: 1;
      margin-right: 16px;
      padding: 0 4px;
      
      &::-webkit-scrollbar {
        height: 6px;
      }
      
      &::-webkit-scrollbar-thumb {
        background: var(--el-border-color);
        border-radius: 3px;
      }
      
      &::-webkit-scrollbar-track {
        background: transparent;
      }
    }

    .info-item {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      gap: 4px;

      .info-label {
        color: var(--el-text-color-secondary);
        font-size: 13px;
      }

      .info-value {
        color: var(--el-text-color-primary);
        font-size: 13px;
      }

      .icon-preview {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 0 8px;
        height: 24px;
        border-radius: 4px;
        border: 1px solid var(--el-border-color-lighter);
        background-color: var(--el-bg-color);
        
        .icon-name {
          font-size: 13px;
          color: var(--el-text-color-regular);
        }
      }
    }
  }

  .operations {
    display: flex;
    gap: 8px;
    height: 100%;
    align-items: center;
    flex-shrink: 0;
    position: sticky;
    right: 8px;
    padding-left: 8px;
    transition: background-color 0.3s;
  }
}
</style>