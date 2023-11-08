<template>
  <el-aside class="editor-left" width="261px">
    <el-scrollbar>
      <el-collapse v-model="extendGroups">
        <el-collapse-item
          v-for="group in groups"
          :key="group.name"
          :name="group.name"
          :title="group.name"
        >
          <draggable
            class="component-container"
            ghost-class="draggable-ghost"
            item-key="index"
            :list="group.components"
            :sort="false"
            :group="{ name: 'component', pull: 'clone', put: false }"
            :clone="handleCloneComponent"
            :animation="200"
            :force-fallback="true"
          >
            <template #item="{ element }">
              <div>
                <div class="drag-placement">组件放置区域</div>
                <div class="component">
                  <Icon :icon="element.icon" :size="32" />
                  <span class="mt-4px text-12px">{{ element.name }}</span>
                </div>
              </div>
            </template>
          </draggable>
        </el-collapse-item>
      </el-collapse>
    </el-scrollbar>
  </el-aside>
</template>

<script setup lang="ts">
import draggable from 'vuedraggable'
import { componentConfigs } from '../components/mobile/index'
import { cloneDeep } from 'lodash-es'
import { DiyComponent, DiyComponentLibrary } from '@/components/DiyEditor/util'

/** 组件库 */
defineOptions({ name: 'ComponentLibrary' })

// 组件列表
const props = defineProps<{
  list: DiyComponentLibrary[]
}>()
const groups = reactive<any[]>([])
// 展开的折叠面板
const extendGroups = reactive<string[]>([])
watch(
  () => props.list,
  () => {
    // 清除旧数据
    extendGroups.length = 0
    groups.length = 0
    // 重新生成数据
    props.list.forEach((group) => {
      // 是否展开分组
      if (group.extended) {
        extendGroups.push(group.name)
      }
      // 查找组件
      const components = group.components
        .map((name) => componentConfigs[name] as DiyComponent<any>)
        .filter((component) => component)
      if (components.length > 0) {
        groups.push({
          name: group.name,
          components
        })
      }
    })
  },
  {
    immediate: true
  }
)

// 克隆组件
const handleCloneComponent = (component: DiyComponent<any>) => {
  return cloneDeep(component)
}
</script>

<style scoped lang="scss">
.editor-left {
  z-index: 1;
  flex-shrink: 0;
  box-shadow: 8px 0 8px -8px rgba(0, 0, 0, 0.12);

  :deep(.el-collapse) {
    border-top: none;
  }
  :deep(.el-collapse-item__wrap) {
    border-bottom: none;
  }
  :deep(.el-collapse-item__content) {
    padding-bottom: 0;
  }
  :deep(.el-collapse-item__header) {
    border-bottom: none;
    background-color: var(--el-bg-color-page);
    padding: 0 24px;
    height: 32px;
    line-height: 32px;
  }

  .component-container {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
  }

  .component {
    width: 86px;
    height: 86px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border-right: 1px solid var(--el-border-color-lighter);
    border-bottom: 1px solid var(--el-border-color-lighter);
    cursor: move;

    .el-icon {
      margin-bottom: 4px;
      color: gray;
    }
  }
  .component.active,
  .component:hover {
    background: var(--el-color-primary);
    color: var(--el-color-white);

    .el-icon {
      color: var(--el-color-white);
    }
  }

  .component:nth-of-type(3n) {
    border-right: none;
  }
}

/* 拖拽占位提示，默认不显示 */
.drag-placement {
  display: none;
  color: #fff;
}

.drag-area {
  /* 拖拽到手机区域时的样式 */
  .draggable-ghost {
    width: 100%;
    height: 40px;
    display: flex;
    justify-content: center;
    align-items: center;
    /* 条纹背景 */
    background: linear-gradient(
      45deg,
      #91a8d5 0,
      #91a8d5 10%,
      #94b4eb 10%,
      #94b4eb 50%,
      #91a8d5 50%,
      #91a8d5 60%,
      #94b4eb 60%,
      #94b4eb
    );
    background-size: 1rem 1rem;
    transition: all 0.5s;
    span {
      color: #fff;
      display: inline-block;
      width: 140px;
      height: 25px;
      font-size: 12px;
      text-align: center;
      line-height: 25px;
      background: #5487df;
    }
    /* 拖拽时隐藏组件 */
    .component {
      display: none;
    }
    /* 拖拽时显示占位提示 */
    .drag-placement {
      display: block;
    }
  }
}
</style>
