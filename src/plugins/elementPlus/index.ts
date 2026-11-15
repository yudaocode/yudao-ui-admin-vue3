import type { App } from 'vue'

// 与上游一致只全局安装 ElLoading（v-loading 指令及服务）；组件由模板按需解析并引入样式，
// FormCreate 设计器运行时解析的 el-button 由 @form-create/element-ui/auto-import 在安装 form-create 时注册
import { ElLoading } from 'element-plus'

export const setupElementPlus = (app: App<Element>) => {
  app.use(ElLoading)
}
