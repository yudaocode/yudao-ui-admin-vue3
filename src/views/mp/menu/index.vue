<template>
  <doc-alert title="公众号菜单" url="https://doc.iocoder.cn/mp/menu/" />
  <!-- 搜索工作栏 -->
  <ContentWrap>
    <!-- TODO @芋艿：调整成 el-form 和 WxAccountSelect  -->
    <WxAccountSelect @change="accountChanged" />
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <div class="public-account-management clearfix" v-loading="loading">
      <!--左边配置菜单-->
      <div class="left">
        <div class="weixin-hd">
          <div class="weixin-title">{{ name }}</div>
        </div>
        <div class="weixin-menu menu_main clearfix">
          <div class="menu_bottom" v-for="(item, i) of menuList" :key="i">
            <!-- 一级菜单 -->
            <div @click="menuClick(i, item)" class="menu_item" :class="{ active: isActive === i }"
              ><Icon icon="ep:fold" color="black" />{{ item.name }}
            </div>
            <!-- 以下为二级菜单-->
            <div class="submenu" v-if="isSubMenuFlag === i">
              <div class="subtitle menu_bottom" v-for="(subItem, k) in item.children" :key="k">
                <div
                  class="menu_subItem"
                  v-if="item.children"
                  :class="{ active: isSubMenuActive === i + '' + k }"
                  @click="subMenuClick(subItem, i, k)"
                >
                  {{ subItem.name }}
                </div>
              </div>
              <!-- 二级菜单加号， 当长度 小于 5 才显示二级菜单的加号  -->
              <div
                class="menu_bottom menu_addicon"
                v-if="!item.children || item.children.length < 5"
                @click="addSubMenu(i, item)"
              >
                <Icon icon="ep:plus" />
              </div>
            </div>
          </div>
          <!-- 一级菜单加号 -->
          <div class="menu_bottom menu_addicon" v-if="menuList.length < 3" @click="addMenu">
            <Icon icon="ep:plus" />
          </div>
        </div>
        <div class="save_div">
          <el-button
            class="save_btn"
            type="success"
            @click="handleSave"
            v-hasPermi="['mp:menu:save']"
            >保存并发布菜单</el-button
          >
          <el-button
            class="save_btn"
            type="danger"
            @click="handleDelete"
            v-hasPermi="['mp:menu:delete']"
            >清空菜单</el-button
          >
        </div>
      </div>
      <!--右边配置-->
      <div v-if="showRightFlag" class="right">
        <div class="configure_page">
          <div class="delete_btn">
            <el-button size="small" type="danger" @click="handleDeleteMenu(tempObj)">
              删除当前菜单<Icon icon="ep:delete" />
            </el-button>
          </div>
          <div>
            <span>菜单名称：</span>
            <el-input
              class="input_width"
              v-model="tempObj.name"
              placeholder="请输入菜单名称"
              :maxlength="nameMaxLength"
              clearable
            />
          </div>
          <div v-if="showConfigureContent">
            <div class="menu_content">
              <span>菜单标识：</span>
              <el-input
                class="input_width"
                v-model="tempObj.menuKey"
                placeholder="请输入菜单 KEY"
                clearable
              />
            </div>
            <div class="menu_content">
              <span>菜单内容：</span>
              <el-select v-model="tempObj.type" clearable placeholder="请选择" class="menu_option">
                <el-option
                  v-for="item in menuOptions"
                  :label="item.label"
                  :value="item.value"
                  :key="item.value"
                />
              </el-select>
            </div>
            <div class="configur_content" v-if="tempObj.type === 'view'">
              <span>跳转链接：</span>
              <el-input
                class="input_width"
                v-model="tempObj.url"
                placeholder="请输入链接"
                clearable
              />
            </div>
            <div class="configur_content" v-if="tempObj.type === 'miniprogram'">
              <div class="applet">
                <span>小程序的 appid ：</span>
                <el-input
                  class="input_width"
                  v-model="tempObj.miniProgramAppId"
                  placeholder="请输入小程序的appid"
                  clearable
                />
              </div>
              <div class="applet">
                <span>小程序的页面路径：</span>
                <el-input
                  class="input_width"
                  v-model="tempObj.miniProgramPagePath"
                  placeholder="请输入小程序的页面路径，如：pages/index"
                  clearable
                />
              </div>
              <div class="applet">
                <span>小程序的备用网页：</span>
                <el-input
                  class="input_width"
                  v-model="tempObj.url"
                  placeholder="不支持小程序的老版本客户端将打开本网页"
                  clearable
                />
              </div>
              <p class="blue">tips:需要和公众号进行关联才可以把小程序绑定带微信菜单上哟！</p>
            </div>
            <div class="configur_content" v-if="tempObj.type === 'article_view_limited'">
              <el-row>
                <div class="select-item" v-if="tempObj && tempObj.replyArticles">
                  <WxNews :articles="tempObj.replyArticles" />
                  <el-row class="ope-row" justify="center" align="middle">
                    <el-button type="danger" circle @click="deleteMaterial">
                      <icon icon="ep:delete" />
                    </el-button>
                  </el-row>
                </div>
                <div v-else>
                  <el-row justify="center">
                    <el-col :span="24" style="text-align: center">
                      <el-button type="success" @click="openMaterial">
                        素材库选择<Icon icon="ep:circle-check" />
                      </el-button>
                    </el-col>
                  </el-row>
                </div>
                <el-dialog title="选择图文" v-model="dialogNewsVisible" width="90%">
                  <WxMaterialSelect
                    :objData="{ type: 'news', accountId: accountId }"
                    @select-material="selectMaterial"
                  />
                </el-dialog>
              </el-row>
            </div>
            <div
              class="configur_content"
              v-if="tempObj.type === 'click' || tempObj.type === 'scancode_waitmsg'"
            >
              <WxReplySelect :objData="tempObj.reply" v-if="hackResetWxReplySelect" />
            </div>
          </div>
        </div>
      </div>
      <!-- 一进页面就显示的默认页面，当点击左边按钮的时候，就不显示了-->
      <div v-else class="right">
        <p>请选择菜单配置</p>
      </div>
    </div>
  </ContentWrap>
</template>
<script setup name="MpMenu">
import { handleTree } from '@/utils/tree'
import WxReplySelect from '@/views/mp/components/wx-reply/main.vue'
import WxNews from '@/views/mp/components/wx-news/main.vue'
import WxMaterialSelect from '@/views/mp/components/wx-material-select/main.vue'
import WxAccountSelect from '@/views/mp/components/wx-account-select/main.vue'
import * as MpMenuApi from '@/api/mp/menu'
import menuOptions from './menuOptions'
const message = useMessage() // 消息

// ======================== 列表查询 ========================
const loading = ref(true) // 遮罩层
const accountId = ref(undefined) // 公众号Id
const menuList = ref({ children: [] })

// ======================== 菜单操作 ========================
const isActive = ref(-1) // 一级菜单点中样式
const isSubMenuActive = ref(-1) // 一级菜单点中样式
const isSubMenuFlag = ref(-1) // 二级菜单显示标志

// ======================== 菜单编辑 ========================
const showRightFlag = ref(false) // 右边配置显示默认详情还是配置详情
const nameMaxLength = ref(0) // 菜单名称最大长度；1 级是 4 字符；2 级是 7 字符；
const showConfigureContent = ref(true) // 是否展示配置内容；如果有子菜单，就不显示配置内容
const hackResetWxReplySelect = ref(false) // 重置 WxReplySelect 组件
const tempObj = ref({}) // 右边临时变量，作为中间值牵引关系

// 一些临时值放在这里进行判断，如果放在 tempObj，由于引用关系，menu 也会多了多余的参数
const tempSelfObj = ref({})
const dialogNewsVisible = ref(false) // 跳转图文时的素材选择弹窗

/** 侦听公众号变化 **/
const accountChanged = (id) => {
  accountId.value = id
  getList()
}

/** 查询并转换菜单 **/
const getList = async () => {
  loading.value = false
  try {
    const data = await MpMenuApi.getMenuList(accountId.value)
    const menuData = convertMenuList(data)
    menuList.value = handleTree(menuData, 'id')
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
const convertMenuList = (list) => {
  if (!list) return []

  const menuList = []
  list.forEach((item) => {
    const menu = {
      ...item
    }
    if (item.type === 'click' || item.type === 'scancode_waitmsg') {
      delete menu.replyMessageType
      delete menu.replyContent
      delete menu.replyMediaId
      delete menu.replyMediaUrl
      delete menu.replyDescription
      delete menu.replyArticles
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
    }
    menuList.push(menu)
  })
  return menuList
}

// 重置表单，清空表单数据
const resetForm = () => {
  // 菜单操作
  isActive.value = -1
  isSubMenuActive.value = -1
  isSubMenuFlag.value = -1

  // 菜单编辑
  showRightFlag.value = false
  nameMaxLength.value = 0
  showConfigureContent.value = 0
  hackResetWxReplySelect.value = false
  tempObj.value = {}
  tempSelfObj.value = {}
  dialogNewsVisible.value = false
}

// ======================== 菜单操作 ========================
// 一级菜单点击事件
const menuClick = (i, item) => {
  // 右侧的表单相关
  resetEditor()
  showRightFlag.value = true // 右边菜单
  tempObj.value = item // 这个如果放在顶部，flag 会没有。因为重新赋值了。
  tempSelfObj.value.grand = '1' // 表示一级菜单
  tempSelfObj.value.index = i // 表示一级菜单索引
  nameMaxLength.value = 4
  showConfigureContent.value = !(item.children && item.children.length > 0) // 有子菜单，就不显示配置内容

  // 左侧的选中
  isActive.value = i // 一级菜单选中样式
  isSubMenuFlag.value = i // 二级菜单显示标志
  isSubMenuActive.value = -1 // 二级菜单去除选中样式
}

// 二级菜单点击事件
const subMenuClick = (subItem, index, k) => {
  // 右侧的表单相关
  resetEditor()
  showRightFlag.value = true // 右边菜单
  console.log(subItem)
  tempObj.value = subItem // 将点击的数据放到临时变量，对象有引用作用
  tempSelfObj.value.grand = '2' // 表示二级菜单
  tempSelfObj.value.index = index // 表示一级菜单索引
  tempSelfObj.value.secondIndex = k // 表示二级菜单索引
  nameMaxLength.value = 7
  showConfigureContent.value = true

  // 左侧的选中
  isActive.value = -1 // 一级菜单去除样式
  isSubMenuActive.value = index + '' + k // 二级菜单选中样式
}

// 添加横向一级菜单
const addMenu = () => {
  const menuKeyLength = menuList.value.length
  const addButton = {
    name: '菜单名称',
    children: [],
    reply: {
      // 用于存储回复内容
      type: 'text',
      accountId: accountId.value // 保证组件里，可以使用到对应的公众号
    }
  }
  menuList.value[menuKeyLength] = addButton
  menuClick(menuKeyLength.value - 1, addButton)
}
// 添加横向二级菜单；item 表示要操作的父菜单
const addSubMenu = (i, item) => {
  // 清空父菜单的属性，因为它只需要 name 属性即可
  if (!item.children || item.children.length <= 0) {
    item.children = []
    delete item['type']
    delete item['menuKey']
    delete item['miniProgramAppId']
    delete item['miniProgramPagePath']
    delete item['url']
    delete item['reply']
    delete item['articleId']
    delete item['replyArticles']
    // 关闭配置面板
    showConfigureContent.value = false
  }

  let subMenuKeyLength = item.children.length // 获取二级菜单key长度
  let addButton = {
    name: '子菜单名称',
    reply: {
      // 用于存储回复内容
      type: 'text',
      accountId: accountId.value // 保证组件里，可以使用到对应的公众号
    }
  }
  item.children[subMenuKeyLength] = addButton
  subMenuClick(item.children[subMenuKeyLength], i, subMenuKeyLength)
}

// 删除当前菜单
const handleDeleteMenu = async () => {
  try {
    await message.confirm('确定要删除吗?')
    if (tempSelfObj.value.grand === '1') {
      // 一级菜单的删除方法
      menuList.value.splice(tempSelfObj.value.index, 1)
    } else if (tempSelfObj.value.grand === '2') {
      // 二级菜单的删除方法
      menuList.value[tempSelfObj.value.index].children.splice(tempSelfObj.value.secondIndex, 1)
    }
    // 提示
    message.notifySuccess('删除成功')

    // 处理菜单的选中
    tempObj.value = {}
    showRightFlag.value = false
    isActive.value = -1
    isSubMenuActive.value = -1
  } catch {}
}

// ======================== 菜单编辑 ========================
const handleSave = async () => {
  try {
    await message.confirm('确定要删除吗?')
    loading.value = true
    await MpMenuApi.saveMenu(accountId.value, convertMenuFormList())
    getList()
    message.notifySuccess('发布成功')
  } finally {
    loading.value = false
  }
}

// 表单 Editor 重置
const resetEditor = () => {
  hackResetWxReplySelect.value = false // 销毁组件
  nextTick(() => {
    console.log('nextTick')
    hackResetWxReplySelect.value = true // 重建组件
  })
}

const handleDelete = async () => {
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
const convertMenuFormList = () => {
  const result = []
  menuList.value.forEach((item) => {
    let menu = convertMenuForm(item)
    result.push(menu)

    // 处理子菜单
    if (!item.children || item.children.length <= 0) {
      return
    }
    menu.children = []
    item.children.forEach((subItem) => {
      menu.children.push(convertMenuForm(subItem))
    })
  })
  return result
}

// 将前端的 menu，转换成后端接收的 menu
const convertMenuForm = (menu) => {
  let result = {
    ...menu,
    children: undefined, // 不处理子节点
    reply: undefined // 稍后复制
  }
  if (menu.type === 'click' || menu.type === 'scancode_waitmsg') {
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
  }
  return result
}

// ======================== 菜单编辑（素材选择） ========================
const openMaterial = () => {
  dialogNewsVisible.value = true
}

const selectMaterial = (item) => {
  const articleId = item.articleId
  const articles = item.content.newsItem
  // 提示，针对多图文
  if (articles.length > 1) {
    message.alertWarning('您选择的是多图文，将默认跳转第一篇')
  }
  dialogNewsVisible.value = false

  // 设置菜单的回复
  tempObj.value.articleId = articleId
  tempObj.value.replyArticles = []
  articles.forEach((article) => {
    tempObj.value.replyArticles.push({
      title: article.title,
      description: article.digest,
      picUrl: article.picUrl,
      url: article.url
    })
  })
}

const deleteMaterial = () => {
  delete tempObj.value['articleId']
  delete tempObj.value['replyArticles']
}
</script>

<!--本组件样式-->
<style lang="scss" scoped="scoped">
/* 公共颜色变量 */
.clearfix {
  *zoom: 1;
}

.clearfix::after {
  content: '';
  display: table;
  clear: both;
}

div {
  text-align: left;
}

.weixin-hd {
  color: #fff;
  text-align: center;
  position: relative;
  bottom: 426px;
  left: 0px;
  width: 300px;
  height: 64px;
  background: transparent url('./assets/menu_head.png') no-repeat 0 0;
  background-position: 0 0;
  background-size: 100%;
}

.weixin-title {
  color: #fff;
  font-size: 14px;
  width: 100%;
  text-align: center;
  position: absolute;
  top: 33px;
  left: 0px;
}

.weixin-menu {
  background: transparent url('./assets/menu_foot.png') no-repeat 0 0;
  padding-left: 43px;
  font-size: 12px;
}

.menu_option {
  width: 40% !important;
}

.public-account-management {
  min-width: 1200px;
  width: 1200px;
  margin: 0 auto;

  .left {
    float: left;
    display: inline-block;
    width: 350px;
    height: 715px;
    background: url('./assets/iphone_backImg.png') no-repeat;
    background-size: 100% auto;
    padding: 518px 25px 88px;
    position: relative;
    box-sizing: border-box;

    /*第一级菜单*/
    .menu_main {
      .menu_bottom {
        position: relative;
        float: left;
        display: inline-block;
        box-sizing: border-box;
        width: 85.5px;
        text-align: center;
        border: 1px solid #ebedee;
        background-color: #fff;
        cursor: pointer;

        &.menu_addicon {
          height: 46px;
          line-height: 46px;
        }

        .menu_item {
          height: 44px;
          line-height: 44px;
          // text-align: center;
          box-sizing: border-box;
          width: 100%;
          display: flex;
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

      i {
        color: #2bb673;
      }

      /*第二级菜单*/
      .submenu {
        position: absolute;
        width: 85.5px;
        bottom: 45px;

        .subtitle {
          background-color: #fff;
          box-sizing: border-box;
        }
      }
    }

    .save_div {
      margin-top: 15px;
      text-align: center;

      .save_btn {
        bottom: 20px;
        left: 100px;
      }
    }
  }

  /*右边菜单内容*/
  .right {
    float: left;
    width: 63%;
    background-color: #e8e7e7;
    padding: 20px;
    margin-left: 20px;
    -webkit-box-sizing: border-box;
    box-sizing: border-box;

    .configure_page {
      .delete_btn {
        text-align: right;
        margin-bottom: 15px;
      }

      .menu_content {
        margin-top: 20px;
      }

      .configur_content {
        margin-top: 20px;
        background-color: #fff;
        padding: 20px 10px;
        border-radius: 5px;
      }

      .blue {
        color: #29b6f6;
        margin-top: 10px;
      }

      .applet {
        margin-bottom: 20px;

        span {
          width: 20%;
        }
      }

      .input_width {
        width: 40%;
      }

      .material {
        .input_width {
          width: 30%;
        }

        .el-textarea {
          width: 80%;
        }
      }
    }
  }

  .el-input {
    width: 70%;
    margin-right: 2%;
  }
}
</style>
<!--素材样式-->
<style lang="scss" scoped>
.pagination {
  text-align: right;
  margin-right: 25px;
}

.select-item {
  width: 280px;
  padding: 10px;
  margin: 0 auto 10px auto;
  border: 1px solid #eaeaea;
}

.select-item2 {
  padding: 10px;
  margin: 0 auto 10px auto;
  border: 1px solid #eaeaea;
}

.ope-row {
  padding-top: 10px;
  text-align: center;
}

.item-name {
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: center;
}
</style>
