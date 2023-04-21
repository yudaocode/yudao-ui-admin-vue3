<template>
  <div class="menu_bottom" v-for="(parent, x) of menuList" :key="x">
    <!-- 一级菜单 -->
    <div
      @click="menuClicked(parent, x)"
      class="menu_item"
      draggable="true"
      @dragstart="onDragStart(DragType.Parent, x)"
      @dragenter.prevent="onDragEnter(DragType.Parent, x)"
      :class="{ active: props.activeIndex === `${x}` }"
    >
      <Icon icon="ep:fold" color="black" />{{ parent.name }}
    </div>
    <!-- 以下为二级菜单-->
    <div class="submenu" v-if="parentIndex === x && parent.children">
      <div class="subtitle menu_bottom" v-for="(child, y) in parent.children" :key="y">
        <div
          class="menu_subItem"
          draggable="true"
          @dragstart="onDragStart(DragType.Child, y)"
          @dragenter.prevent="onDragEnter(DragType.Child, x, y)"
          v-if="parent.children"
          :class="{ active: props.activeIndex === `${x}-${y}` }"
          @click="subMenuClicked(child, x, y)"
        >
          {{ child.name }}
        </div>
      </div>
      <!-- 二级菜单加号， 当长度 小于 5 才显示二级菜单的加号  -->
      <div
        class="menu_bottom menu_addicon"
        v-if="!parent.children || parent.children.length < 5"
        @click="addSubMenu(x, parent)"
      >
        <Icon icon="ep:plus" class="plus" />
      </div>
    </div>
  </div>
  <!-- 一级菜单加号 -->
  <div class="menu_bottom menu_addicon" v-if="menuList.length < 3" @click="addMenu">
    <Icon icon="ep:plus" class="plus" />
  </div>
</template>

<script setup lang="ts">
import { Menu } from './types'

const props = defineProps<{
  modelValue: Menu[]
  activeIndex: string
  parentIndex: number
  accountId: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: Menu[])
  (e: 'menu-clicked', parent: Menu, x: number)
  (e: 'submenu-clicked', child: Menu, x: number, y: number)
}>()

const menuList = computed<Menu[]>({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

// 添加横向一级菜单
const addMenu = () => {
  const index = menuList.value.length
  const menu = {
    name: '菜单名称',
    children: [],
    reply: {
      // 用于存储回复内容
      type: 'text',
      accountId: props.accountId // 保证组件里，可以使用到对应的公众号
    }
  }
  menuList.value[index] = menu
  menuClicked(menu, index - 1)
}

// 添加横向二级菜单；parent 表示要操作的父菜单
const addSubMenu = (i: number, parent: any) => {
  const subMenuKeyLength = parent.children.length // 获取二级菜单key长度
  const addButton = {
    name: '子菜单名称',
    reply: {
      // 用于存储回复内容
      type: 'text',
      accountId: props.accountId // 保证组件里，可以使用到对应的公众号
    }
  }
  parent.children[subMenuKeyLength] = addButton
  subMenuClicked(parent.children[subMenuKeyLength], i, subMenuKeyLength)
}

const menuClicked = (parent: Menu, x: number) => {
  emit('menu-clicked', parent, x)
}
const subMenuClicked = (child: Menu, x: number, y: number) => {
  emit('submenu-clicked', child, x, y)
}

// ======================== 菜单排序 ========================
const dragIndex = ref<number>(0)
enum DragType {
  Parent = 'parent',
  Child = 'child'
}
const dragType = ref<DragType>()

/**
 * 菜单开始拖动回调，记录被拖动菜单的信息（类型,下标）
 *
 * @param type DragType, 拖动类型，父节点、子节点
 * @param index number, 被拖动的菜单下标
 */
const onDragStart = (type: DragType, index: number) => {
  dragIndex.value = index
  dragType.value = type
}

/**
 * 拖动其他菜单位置回调, 判断【被拖动】及【被替换位置】的两个菜单是否同个类型，同类型才会进行插入
 *
 * @param type: DragType, 拖动类型，父节点、子节点
 * @param x number, 准备替换父节点位置的下标
 * @param y number, 准备替换子节点位置的下标, 父节点拖动时可选
 */
const onDragEnter = (type: DragType, x: number, y = -1) => {
  if (dragIndex.value !== x && dragType.value === type) {
    if (type === DragType.Parent) {
      const source = menuList.value.splice(dragIndex.value, 1)
      menuList.value.splice(x, 0, ...source)
    } else {
      const source = menuList.value[x].children?.splice(dragIndex.value, 1)
      menuList.value[x].children?.splice(y, 0, ...(source as any))
    }
  }
}
</script>

<style lang="scss" scoped>
.menu_bottom {
  position: relative;
  display: inline-block;
  float: left;
  width: 85.5px;
  text-align: center;
  cursor: pointer;
  background-color: #fff;
  border: 1px solid #ebedee;
  box-sizing: border-box;

  &.menu_addicon {
    height: 46px;
    line-height: 46px;

    .plus {
      color: #2bb673;
    }
  }

  .menu_item {
    display: flex;
    width: 100%;
    height: 44px;
    line-height: 44px;
    // text-align: center;
    box-sizing: border-box;
    align-items: center;
    justify-content: center;

    &.active {
      border: 1px solid #2bb673;
    }
  }

  .menu_subItem {
    height: 44px;
    line-height: 44px;
    text-align: center;
    box-sizing: border-box;

    &.active {
      border: 1px solid #2bb673;
    }
  }
}

/* 第二级菜单 */
.submenu {
  position: absolute;
  bottom: 45px;
  width: 85.5px;

  .subtitle {
    background-color: #fff;
    box-sizing: border-box;
  }
}
</style>
