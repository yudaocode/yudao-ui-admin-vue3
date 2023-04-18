<template>
  <div class="menu_bottom" v-for="(parent, x) of menuList" :key="x">
    <!-- 一级菜单 -->
    <div
      @click="menuClicked(parent, x)"
      class="menu_item"
      :class="{ active: props.activeIndex === `${x}` }"
    >
      <Icon icon="ep:fold" color="black" />{{ parent.name }}
    </div>
    <!-- 以下为二级菜单-->
    <div class="submenu" v-if="parentIndex === x && parent.children">
      <div class="subtitle menu_bottom" v-for="(child, y) in parent.children" :key="y">
        <div
          class="menu_subItem"
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
  accountId?: number
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
