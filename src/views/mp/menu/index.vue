<template>
  <doc-alert title="公众号菜单" url="https://doc.iocoder.cn/mp/menu/" />
  <!-- 搜索工作栏 -->
  <ContentWrap>
    <el-form class="-mb-15px" ref="queryFormRef" :inline="true" label-width="68px">
      <el-form-item label="公众号" prop="accountId">
        <WxAccountSelect @change="onAccountChanged" />
      </el-form-item>
    </el-form>
  </ContentWrap>

  <ContentWrap>
    <div class="clearfix public-account-management" v-loading="loading">
      <!--左边配置菜单-->
      <div class="left">
        <div class="weixin-hd">
          <div class="weixin-title">{{ accountName }}</div>
        </div>
        <div class="clearfix weixin-menu">
          <MenuPreviewer
            v-model="menuList"
            :account-id="accountId"
            :active-index="activeIndex"
            :parent-index="parentIndex"
            @menu-clicked="(parent, x) => menuClicked(parent, x)"
            @submenu-clicked="(child, x, y) => subMenuClicked(child, x, y)"
          />
        </div>
        <div class="save_div">
          <el-button class="save_btn" type="success" @click="onSave" v-hasPermi="['mp:menu:save']"
            >保存并发布菜单</el-button
          >
          <el-button class="save_btn" type="danger" @click="onClear" v-hasPermi="['mp:menu:delete']"
            >清空菜单</el-button
          >
        </div>
      </div>
      <!--右边配置-->
      <div class="right" v-if="showRightPanel">
        <MenuEditor
          :account-id="accountId"
          :is-parent="isParent"
          v-model="activeMenu"
          @delete="onDeleteMenu"
        />
      </div>
      <!-- 一进页面就显示的默认页面，当点击左边按钮的时候，就不显示了-->
      <div v-else class="right">
        <p>请选择菜单配置</p>
      </div>
    </div>
  </ContentWrap>
</template>

<script lang="ts" setup>
import WxAccountSelect from '@/views/mp/components/wx-account-select'
import MenuEditor from './components/MenuEditor.vue'
import MenuPreviewer from './components/MenuPreviewer.vue'
import * as MpMenuApi from '@/api/mp/menu'
import * as UtilsTree from '@/utils/tree'
import { RawMenu, Menu } from './components/types'

defineOptions({ name: 'MpMenu' })

const message = useMessage() // 消息
const MENU_NOT_SELECTED = '__MENU_NOT_SELECTED__'

// ======================== 列表查询 ========================
const loading = ref(false) // 遮罩层
const accountId = ref(-1)
const accountName = ref<string>('')
const menuList = ref<Menu[]>([])

// ======================== 菜单操作 ========================
// 当前选中菜单编码：
//  * 一级（'x'）
//  * 二级（'x-y'）
//  * 未选中（MENU_NOT_SELECTED）
const activeIndex = ref<string>(MENU_NOT_SELECTED)
// 二级菜单显示标志: 归属的一级菜单index
// * 未初始化：-1
// * 初始化：x
const parentIndex = ref(-1)

// ======================== 菜单编辑 ========================
const showRightPanel = ref(false) // 右边配置显示默认详情还是配置详情
const isParent = ref<boolean>(true) // 是否一级菜单，控制MenuEditor中name字段长度
const activeMenu = ref<Menu>({}) // 选中菜单，MenuEditor的modelValue

// 一些临时值放在这里进行判断，如果放在 activeMenu，由于引用关系，menu 也会多了多余的参数
enum Level {
  Undefined = '0',
  Parent = '1',
  Child = '2'
}
const tempSelfObj = ref<{
  grand: Level
  x: number
  y: number
}>({
  grand: Level.Undefined,
  x: 0,
  y: 0
})
const dialogNewsVisible = ref(false) // 跳转图文时的素材选择弹窗

/** 侦听公众号变化 **/
const onAccountChanged = (id: number, name: string) => {
  accountId.value = id
  accountName.value = name
  getList()
}

/** 查询并转换菜单 **/
const getList = async () => {
  loading.value = false
  try {
    const data = await MpMenuApi.getMenuList(accountId.value)
    const menuData = menuListToFrontend(data)
    menuList.value = UtilsTree.handleTree(menuData, 'id')
  } finally {
    loading.value = false
  }
}

/** 搜索按钮操作 */
const handleQuery = () => {
  resetForm()
  getList()
}

// 将后端返回的 menuList，转换成前端的 menuList
const menuListToFrontend = (list: any[]) => {
  if (!list) return []

  const result: RawMenu[] = []
  list.forEach((item: RawMenu) => {
    const menu: any = {
      ...item
    }
    menu.reply = {
      type: item.replyMessageType,
      accountId: item.accountId,
      content: item.replyContent,
      mediaId: item.replyMediaId,
      url: item.replyMediaUrl,
      title: item.replyTitle,
      description: item.replyDescription,
      thumbMediaId: item.replyThumbMediaId,
      thumbMediaUrl: item.replyThumbMediaUrl,
      articles: item.replyArticles,
      musicUrl: item.replyMusicUrl,
      hqMusicUrl: item.replyHqMusicUrl
    }
    result.push(menu as RawMenu)
  })
  return result
}

// 重置表单，清空表单数据
const resetForm = () => {
  // 菜单操作
  activeIndex.value = MENU_NOT_SELECTED
  parentIndex.value = -1

  // 菜单编辑
  showRightPanel.value = false
  activeMenu.value = {}
  tempSelfObj.value = { grand: Level.Undefined, x: 0, y: 0 }
  dialogNewsVisible.value = false
}

// ======================== 菜单操作 ========================
// 一级菜单点击事件
const menuClicked = (parent: Menu, x: number) => {
  // 右侧的表单相关
  showRightPanel.value = true // 右边菜单
  activeMenu.value = parent // 这个如果放在顶部，flag 会没有。因为重新赋值了。
  tempSelfObj.value.grand = Level.Parent // 表示一级菜单
  tempSelfObj.value.x = x // 表示一级菜单索引
  isParent.value = true

  // 左侧的选中
  activeIndex.value = `${x}` // 菜单选中样式
  parentIndex.value = x // 二级菜单显示标志
}

// 二级菜单点击事件
const subMenuClicked = (child: Menu, x: number, y: number) => {
  // 右侧的表单相关
  showRightPanel.value = true // 右边菜单
  activeMenu.value = child // 将点击的数据放到临时变量，对象有引用作用
  tempSelfObj.value.grand = Level.Child // 表示二级菜单
  tempSelfObj.value.x = x // 表示一级菜单索引
  tempSelfObj.value.y = y // 表示二级菜单索引
  isParent.value = false

  // 左侧的选中
  activeIndex.value = `${x}-${y}`
}

// 删除当前菜单
const onDeleteMenu = async () => {
  try {
    await message.confirm('确定要删除吗?')
    if (tempSelfObj.value.grand === Level.Parent) {
      // 一级菜单的删除方法
      menuList.value.splice(tempSelfObj.value.x, 1)
    } else if (tempSelfObj.value.grand === Level.Child) {
      // 二级菜单的删除方法
      menuList.value[tempSelfObj.value.x].children?.splice(tempSelfObj.value.y, 1)
    }
    // 提示
    message.notifySuccess('删除成功')

    // 处理菜单的选中
    activeMenu.value = {}
    showRightPanel.value = false
    activeIndex.value = MENU_NOT_SELECTED
  } catch {}
}

// ======================== 菜单编辑 ========================
const onSave = async () => {
  try {
    await message.confirm('确定要保存吗?')
    loading.value = true
    await MpMenuApi.saveMenu(accountId.value, menuListToBackend())
    getList()
    message.notifySuccess('发布成功')
  } finally {
    loading.value = false
  }
}

const onClear = async () => {
  try {
    await message.confirm('确定要删除吗?')
    loading.value = true
    await MpMenuApi.deleteMenu(accountId.value)
    handleQuery()
    message.notifySuccess('清空成功')
  } finally {
    loading.value = false
  }
}

// 将前端的 menuList，转换成后端接收的 menuList
const menuListToBackend = () => {
  const result: any[] = []
  menuList.value.forEach((item) => {
    const menu = menuToBackend(item)
    result.push(menu)

    // 处理子菜单
    if (!item.children || item.children.length <= 0) {
      return
    }
    menu.children = []
    item.children.forEach((subItem) => {
      menu.children.push(menuToBackend(subItem))
    })
  })
  return result
}

// 将前端的 menu，转换成后端接收的 menu
// TODO: @芋艿，需要根据后台API删除不需要的字段
const menuToBackend = (menu: any) => {
  let result = {
    ...menu,
    children: undefined, // 不处理子节点
    reply: undefined // 稍后复制
  }
  result.replyMessageType = menu.reply.type
  result.replyContent = menu.reply.content
  result.replyMediaId = menu.reply.mediaId
  result.replyMediaUrl = menu.reply.url
  result.replyTitle = menu.reply.title
  result.replyDescription = menu.reply.description
  result.replyThumbMediaId = menu.reply.thumbMediaId
  result.replyThumbMediaUrl = menu.reply.thumbMediaUrl
  result.replyArticles = menu.reply.articles
  result.replyMusicUrl = menu.reply.musicUrl
  result.replyHqMusicUrl = menu.reply.hqMusicUrl

  return result
}
</script>

<!--本组件样式-->
<style lang="scss" scoped="scoped">
/* 公共颜色变量 */
.clearfix {
  *zoom: 1;
}

.clearfix::after {
  display: table;
  clear: both;
  content: '';
}

div {
  text-align: left;
}

.weixin-hd {
  position: relative;
  bottom: 426px;
  left: 0;
  width: 300px;
  height: 64px;
  color: #fff;
  text-align: center;
  background: transparent url('./assets/menu_head.png') no-repeat 0 0;
  background-position: 0 0;
  background-size: 100%;
}

.weixin-title {
  position: absolute;
  top: 33px;
  left: 0;
  width: 100%;
  font-size: 14px;
  color: #fff;
  text-align: center;
}

.weixin-menu {
  padding-left: 43px;
  font-size: 12px;
  background: transparent url('./assets/menu_foot.png') no-repeat 0 0;
}

.public-account-management {
  width: 1200px;
  // min-width: 1200px;
  margin: 0 auto;

  .left {
    position: relative;
    display: block;
    float: left;
    width: 350px;
    height: 715px;
    padding: 518px 25px 88px;
    background: url('./assets/iphone_backImg.png') no-repeat;
    background-size: 100% auto;
    box-sizing: border-box;

    .save_div {
      margin-top: 15px;
      text-align: center;

      .save_btn {
        bottom: 20px;
        left: 100px;
      }
    }
  }

  /* 右边菜单内容 */
  .right {
    float: left;
    width: 63%;
    padding: 20px;
    margin-left: 20px;
    background-color: #e8e7e7;
    box-sizing: border-box;
  }
}
</style>
<!--素材样式-->
<style lang="scss" scoped>
.pagination {
  margin-right: 25px;
  text-align: right;
}

.select-item {
  width: 280px;
  padding: 10px;
  margin: 0 auto 10px;
  border: 1px solid #eaeaea;
}

.ope-row {
  padding-top: 10px;
  text-align: center;
}

.item-name {
  overflow: hidden;
  font-size: 12px;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
