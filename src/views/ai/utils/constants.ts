/**
 * Created by 芋道源码
 *
 * AI 枚举类
 *
 * 问题：为什么不放在 src/utils/constants.ts 呢？
 * 回答：主要 AI 是可选模块，考虑到独立、解耦，所以放在了 /views/ai/utils/constants.ts
 */

/**
 * AI 平台的枚举
 */
export const AiPlatformEnum = {
  // TODO DONE @AI：如果要改？貌似阿里也要改。。。（已改为 ALIBABA）
  ALIBABA: 'ALIBABA', // 阿里
  BAIDU: 'BAIDU', // 百度
  DEEPSEEK: 'DEEPSEEK', // DeepSeek
  ZHIPU: 'ZHIPU', // 智谱 AI
  IFLYTEK: 'IFLYTEK', // 讯飞
  SILICONFLOW: 'SILICONFLOW', // 硅基流动
  OPENAI: 'OPENAI',
  OLLAMA: 'OLLAMA',
  STABILITYAI: 'STABILITYAI', // Stability AI
  MIDJOURNEY: 'MIDJOURNEY', // Midjourney
  SUNO: 'SUNO', // Suno AI
  // TODO DONE @AI：希望整合到腾讯、百度、豆包？你感觉我要不要修改下标志？YI_YAN 改成百度，它其实是文心一言（然后相关的包名都改了）tencent（已合并：平台标识改为 TENCENT、BAIDU、BYTEDANCE，文字识别按模型类型区分；包名、类名未改）
  TENCENT: 'TENCENT', // 腾讯
  // TODO DONE @AI：这个也是噢，它其实是百度；（已并入上面的 BAIDU）
  // TODO DONE @AI：火山引擎的包，字节？bytedance？这样就整体统一了。当然，讯飞那也要改；（已改为 BYTEDANCE；讯飞改为 IFLYTEK）
  BYTEDANCE: 'BYTEDANCE' // 字节
}

export const AiModelTypeEnum = {
  CHAT: 1, // 聊天
  IMAGE: 2, // 图像
  VOICE: 3, // 音频
  VIDEO: 4, // 视频
  EMBEDDING: 5, // 向量
  RERANK: 6, // 重排
  MUSIC: 7, // 音乐
  OCR: 8 // 文字识别
}

/**
 * AI 文字识别状态的枚举，与后端 AiOcrStatusEnum 一致
 */
export const AiOcrStatusEnum = {
  SUCCESS: 20, // 识别成功
  FAIL: 30 // 识别失败
}

export const AiOcrTextMaxLength = 100000 // 文字识别修订文本的长度上限，与后端一致

/**
 * AI 聊天消息类型的枚举
 */
export const AiChatMessageTypeEnum = {
  USER: 'user', // 用户
  ASSISTANT: 'assistant', // 助手
  SYSTEM: 'system' // 系统
}

/**
 * AI 模型输入模态的枚举
 */
export const AiModelInputModalityEnum = {
  TEXT: 'text', // 文本（必选）
  IMAGE: 'image', // 图片
  VIDEO: 'video' // 视频
}

/** AI 模型输入模态的选项 */
export const AiModelInputModalityOptions = [
  { label: '文本', value: AiModelInputModalityEnum.TEXT, disabled: true },
  { label: '图片', value: AiModelInputModalityEnum.IMAGE },
  { label: '视频', value: AiModelInputModalityEnum.VIDEO }
]

export const OtherPlatformEnum: ImageModelVO[] = [
  {
    key: AiPlatformEnum.ALIBABA,
    name: '通义万相'
  },
  {
    key: AiPlatformEnum.BAIDU,
    name: '百度千帆'
  },
  {
    key: AiPlatformEnum.ZHIPU,
    name: '智谱 AI'
  },
  {
    key: AiPlatformEnum.SILICONFLOW,
    name: '硅基流动'
  }
]

/**
 * AI 图像生成状态的枚举
 */
export const AiImageStatusEnum = {
  IN_PROGRESS: 10, // 进行中
  SUCCESS: 20, // 已完成
  FAIL: 30 // 已失败
}

/**
 * AI 音乐生成状态的枚举
 */
export const AiMusicStatusEnum = {
  PENDING: 10, // 待处理
  IN_PROGRESS: 20, // 生成中
  SAVING: 30, // 转存中
  SUCCESS: 40, // 已完成
  FAIL: 50 // 已失败
}

/** AI 音乐是否未结束：待处理、生成中、转存中 */
export const isAiMusicRunning = (status?: number) =>
  status === AiMusicStatusEnum.PENDING ||
  status === AiMusicStatusEnum.IN_PROGRESS ||
  status === AiMusicStatusEnum.SAVING

/**
 * AI 音乐生成模式的枚举
 */
export const AiMusicGenerateModeEnum = {
  INSPIRATION: 1, // 灵感
  CUSTOM: 2, // 自定义
  EXTEND: 3, // 续写
  CONCAT: 4, // 拼接
  UPLOAD: 5 // 上传
}

/**
 * AI PPT 状态的枚举：任务、每页共用；每页的状态为空表示待生成
 */
export const AiPptStatusEnum = {
  IN_PROGRESS: 10, // 生成中
  SUCCESS: 20, // 已完成
  FAIL: 30 // 已失败
}

/**
 * AI PPT 格式的枚举
 */
export const AiPptModeEnum = {
  DETAILED: 1, // 详细演示文稿
  SLIDES: 2 // 演示用幻灯片
}

/**
 * AI PPT 素材来源的枚举
 */
export const AiPptSourceEnum = {
  PASTE: 1, // 粘贴大纲
  UPLOAD: 2 // 上传材料
}

/**
 * AI PPT 语言的枚举
 */
export const AiPptLanguageEnum = {
  ZH_CN: 'zh-CN', // 中文
  EN: 'en' // English
}

/**
 * AI PPT 导出格式的枚举
 */
export enum AiPptExportFormatEnum {
  PPTX = 'pptx',
  PDF = 'pdf'
}

/**
 * AI PPT 支持的绘图平台，与后端一致
 */
export const AiPptImagePlatforms = [
  AiPlatformEnum.OPENAI,
  AiPlatformEnum.SILICONFLOW,
  AiPlatformEnum.ALIBABA
]

/**
 * AI PPT 材料支持的格式，与后端一致
 */
export const AiPptFileTypes = ['pdf', 'doc', 'docx', 'txt', 'md', 'markdown']

/**
 * AI 写作类型（写作场景）的枚举，与后端 AiWriteTypeEnum、字典 ai_write_type 一致
 */
export enum AiWriteTypeEnum {
  WRITING = 1, // 文章写作
  REPLY = 2, // 回复
  GENERAL = 3, // 通用写作
  WEEKLY_REPORT = 4, // 周报
  XIAOHONGSHU = 5, // 小红书
  REWRITE = 6, // 润色 / 改写
  TRANSLATE = 7 // 文本翻译
}

// 表格展示对照map
export const AiWriteTypeTableRender = {
  [AiWriteTypeEnum.WRITING]: '文章写作',
  [AiWriteTypeEnum.REPLY]: '回复',
  [AiWriteTypeEnum.GENERAL]: '通用写作',
  [AiWriteTypeEnum.WEEKLY_REPORT]: '周报',
  [AiWriteTypeEnum.XIAOHONGSHU]: '小红书',
  [AiWriteTypeEnum.REWRITE]: '润色 / 改写',
  [AiWriteTypeEnum.TRANSLATE]: '文本翻译'
}

/**
 * AI 写作选项的枚举：字典 ai_write_format / ai_write_tone / ai_write_length / ai_write_language 的值 1 都是“自动”
 */
export const AiWriteOptionEnum = {
  AUTO: 1, // 自动
  TONE_PROFESSIONAL: 5 // 语气“专业”，周报默认
}

// 写作场景参数的可选值：与后端 AiWriteGenerateReqVO.SceneParams 的校验一致
export const AiWriteXhsStyles = ['种草', '测评', '攻略', '日常分享'] // 小红书风格
export const AiWriteRewriteModes = ['润色', '改写', '精简', '扩写'] // 润色 / 改写方式
export const AiWriteTranslateDomains = ['通用', '技术', '法律', '医学', '商务', '文学'] // 翻译领域

/** 各场景“原文”输入框的标题：没有配置的场景不显示原文 */
export const AiWriteOriginalLabels: Partial<Record<AiWriteTypeEnum, string>> = {
  [AiWriteTypeEnum.REPLY]: '原文',
  [AiWriteTypeEnum.WEEKLY_REPORT]: '本周完成事项（每行一条）',
  [AiWriteTypeEnum.REWRITE]: '原文',
  [AiWriteTypeEnum.TRANSLATE]: '原文'
}

/** 各场景“要求”输入框的标题 */
export const AiWritePromptLabels: Record<AiWriteTypeEnum, string> = {
  [AiWriteTypeEnum.WRITING]: '写作主题',
  [AiWriteTypeEnum.REPLY]: '回复要点',
  [AiWriteTypeEnum.GENERAL]: '写作要求',
  [AiWriteTypeEnum.WEEKLY_REPORT]: '下周计划 / 问题与风险',
  [AiWriteTypeEnum.XIAOHONGSHU]: '主题 / 产品',
  [AiWriteTypeEnum.REWRITE]: '补充要求',
  [AiWriteTypeEnum.TRANSLATE]: '术语 / 补充说明'
}

// ========== 【图片 UI】相关的枚举 ==========

export const ImageHotWords = [
  '中国旗袍',
  '古装美女',
  '卡通头像',
  '机甲战士',
  '童话小屋',
  '中国长城'
] // 图片热词

export const ImageHotEnglishWords = [
  'Chinese Cheongsam',
  'Ancient Beauty',
  'Cartoon Avatar',
  'Mech Warrior',
  'Fairy Tale Cottage',
  'The Great Wall of China'
] // 图片热词（英文）

export interface ImageModelVO {
  key: string
  name: string
  image?: string
}

export const StableDiffusionSamplers: ImageModelVO[] = [
  {
    key: 'DDIM',
    name: 'DDIM'
  },
  {
    key: 'DDPM',
    name: 'DDPM'
  },
  {
    key: 'K_DPMPP_2M',
    name: 'K_DPMPP_2M'
  },
  {
    key: 'K_DPMPP_2S_ANCESTRAL',
    name: 'K_DPMPP_2S_ANCESTRAL'
  },
  {
    key: 'K_DPM_2',
    name: 'K_DPM_2'
  },
  {
    key: 'K_DPM_2_ANCESTRAL',
    name: 'K_DPM_2_ANCESTRAL'
  },
  {
    key: 'K_EULER',
    name: 'K_EULER'
  },
  {
    key: 'K_EULER_ANCESTRAL',
    name: 'K_EULER_ANCESTRAL'
  },
  {
    key: 'K_HEUN',
    name: 'K_HEUN'
  },
  {
    key: 'K_LMS',
    name: 'K_LMS'
  }
]

export const StableDiffusionStylePresets: ImageModelVO[] = [
  {
    key: '3d-model',
    name: '3d-model'
  },
  {
    key: 'analog-film',
    name: 'analog-film'
  },
  {
    key: 'anime',
    name: 'anime'
  },
  {
    key: 'cinematic',
    name: 'cinematic'
  },
  {
    key: 'comic-book',
    name: 'comic-book'
  },
  {
    key: 'digital-art',
    name: 'digital-art'
  },
  {
    key: 'enhance',
    name: 'enhance'
  },
  {
    key: 'fantasy-art',
    name: 'fantasy-art'
  },
  {
    key: 'isometric',
    name: 'isometric'
  },
  {
    key: 'line-art',
    name: 'line-art'
  },
  {
    key: 'low-poly',
    name: 'low-poly'
  },
  {
    key: 'modeling-compound',
    name: 'modeling-compound'
  },
  // neon-punk origami photographic pixel-art tile-texture
  {
    key: 'neon-punk',
    name: 'neon-punk'
  },
  {
    key: 'origami',
    name: 'origami'
  },
  {
    key: 'photographic',
    name: 'photographic'
  },
  {
    key: 'pixel-art',
    name: 'pixel-art'
  },
  {
    key: 'tile-texture',
    name: 'tile-texture'
  }
]

export const StableDiffusionClipGuidancePresets: ImageModelVO[] = [
  {
    key: 'NONE',
    name: 'NONE'
  },
  {
    key: 'FAST_BLUE',
    name: 'FAST_BLUE'
  },
  {
    key: 'FAST_GREEN',
    name: 'FAST_GREEN'
  },
  {
    key: 'SIMPLE',
    name: 'SIMPLE'
  },
  {
    key: 'SLOW',
    name: 'SLOW'
  },
  {
    key: 'SLOWER',
    name: 'SLOWER'
  },
  {
    key: 'SLOWEST',
    name: 'SLOWEST'
  }
]

export const Dall3Models: ImageModelVO[] = [
  {
    key: 'dall-e-3',
    name: 'DALL·E 3',
    image: `/src/assets/ai/dall2.jpg`
  },
  {
    key: 'dall-e-2',
    name: 'DALL·E 2',
    image: `/src/assets/ai/dall3.jpg`
  }
]

export const Dall3StyleList: ImageModelVO[] = [
  {
    key: 'vivid',
    name: '清晰',
    image: `/src/assets/ai/qingxi.jpg`
  },
  {
    key: 'natural',
    name: '自然',
    image: `/src/assets/ai/ziran.jpg`
  }
]

export interface ImageSizeVO {
  key: string
  name?: string
  style: string
  width: string
  height: string
}

export const Dall3SizeList: ImageSizeVO[] = [
  {
    key: '1024x1024',
    name: '1:1',
    width: '1024',
    height: '1024',
    style: 'width: 30px; height: 30px;background-color: #dcdcdc;'
  },
  {
    key: '1024x1792',
    name: '3:5',
    width: '1024',
    height: '1792',
    style: 'width: 30px; height: 50px;background-color: #dcdcdc;'
  },
  {
    key: '1792x1024',
    name: '5:3',
    width: '1792',
    height: '1024',
    style: 'width: 50px; height: 30px;background-color: #dcdcdc;'
  }
]

export const MidjourneyModels: ImageModelVO[] = [
  {
    key: 'midjourney',
    name: 'MJ',
    image: 'https://bigpt8.com/pc/_nuxt/mj.34a61377.png'
  },
  {
    key: 'niji',
    name: 'NIJI',
    image: 'https://bigpt8.com/pc/_nuxt/nj.ca79b143.png'
  }
]

export const MidjourneySizeList: ImageSizeVO[] = [
  {
    key: '1:1',
    width: '1',
    height: '1',
    style: 'width: 30px; height: 30px;background-color: #dcdcdc;'
  },
  {
    key: '3:4',
    width: '3',
    height: '4',
    style: 'width: 30px; height: 40px;background-color: #dcdcdc;'
  },
  {
    key: '4:3',
    width: '4',
    height: '3',
    style: 'width: 40px; height: 30px;background-color: #dcdcdc;'
  },
  {
    key: '9:16',
    width: '9',
    height: '16',
    style: 'width: 30px; height: 50px;background-color: #dcdcdc;'
  },
  {
    key: '16:9',
    width: '16',
    height: '9',
    style: 'width: 50px; height: 30px;background-color: #dcdcdc;'
  }
]

export const MidjourneyVersions = [
  {
    value: '6.0',
    label: 'v6.0'
  },
  {
    value: '5.2',
    label: 'v5.2'
  },
  {
    value: '5.1',
    label: 'v5.1'
  },
  {
    value: '5.0',
    label: 'v5.0'
  },
  {
    value: '4.0',
    label: 'v4.0'
  }
]

export const NijiVersionList = [
  {
    value: '5',
    label: 'v5'
  }
]

// ========== 【写作 UI】相关的枚举 ==========

/** 写作点击示例时的数据：按写作场景 **/
export const WriteExample = {
  [AiWriteTypeEnum.WRITING]: {
    prompt: 'vue',
    data: 'Vue.js 是一种用于构建用户界面的渐进式 JavaScript 框架。它的核心库只关注视图层，易于上手，同时也便于与其他库或已有项目整合。\n\nVue.js 的特点包括：\n- 响应式的数据绑定：Vue.js 会自动将数据与 DOM 同步，使得状态管理变得更加简单。\n- 组件化：Vue.js 允许开发者通过小型、独立和通常可复用的组件构建大型应用。\n- 虚拟 DOM：Vue.js 使用虚拟 DOM 实现快速渲染，提高了性能。\n\n在 Vue.js 中，一个典型的应用结构可能包括：\n1. 根实例：每个 Vue 应用都需要一个根实例作为入口点。\n2. 组件系统：可以创建自定义的可复用组件。\n3. 指令：特殊的带有前缀 v- 的属性，为 DOM 元素提供特殊的行为。\n4. 插值：用于文本内容，将数据动态地插入到 HTML。\n5. 计算属性和侦听器：用于处理数据的复杂逻辑和响应数据变化。\n6. 条件渲染：根据条件决定元素的渲染。\n7. 列表渲染：用于显示列表数据。\n8. 事件处理：响应用户交互。\n9. 表单输入绑定：处理表单输入和验证。\n10. 组件生命周期钩子：在组件的不同阶段执行特定的函数。\n\nVue.js 还提供了官方的路由器 Vue Router 和状态管理库 Vuex，以支持构建复杂的单页应用（SPA）。\n\n在开发过程中，开发者通常会使用 Vue CLI，这是一个强大的命令行工具，用于快速生成 Vue 项目脚手架，集成了诸如 Babel、Webpack 等现代前端工具，以及热重载、代码检测等开发体验优化功能。\n\nVue.js 的生态系统还包括大量的第三方库和插件，如 Vuetify（UI 组件库）、Vue Test Utils（测试工具）等，这些都极大地丰富了 Vue.js 的开发生态。\n\n总的来说，Vue.js 是一个灵活、高效的前端框架，适合从小型项目到大型企业级应用的开发。它的易用性、灵活性和强大的社区支持使其成为许多开发者的首选框架之一。'
  },
  [AiWriteTypeEnum.REPLY]: {
    originalContent: '领导，我想请假',
    prompt: '不批',
    data: '您的请假申请已收悉，经核实和考虑，暂时无法批准您的请假申请。\n\n如有特殊情况或紧急事务，请及时与我联系。\n\n祝工作顺利。\n\n谢谢。'
  },
  // 以下新场景的示例只填表单，不在预览放生成结果
  [AiWriteTypeEnum.GENERAL]: {
    prompt: '为公司年会写一段 1 分钟的开场主持词，热闹、接地气'
  },
  [AiWriteTypeEnum.WEEKLY_REPORT]: {
    originalContent: '完成登录模块重构\n修复 3 个线上问题\n评审支付对接方案',
    prompt: '下周上线新版登录；风险：第三方短信通道不稳定',
    sceneParams: { period: '本周', role: '后端开发' }
  },
  [AiWriteTypeEnum.XIAOHONGSHU]: {
    prompt: '一款适合程序员的机械键盘',
    sceneParams: { audience: '每天敲代码的程序员', style: '测评', emoji: true, tagCount: 5 }
  },
  [AiWriteTypeEnum.REWRITE]: {
    originalContent: '我们这个产品真的很好用，大家用了都说好，功能很多很强大。',
    sceneParams: { mode: '润色' }
  },
  [AiWriteTypeEnum.TRANSLATE]: {
    originalContent: '芋道是一个开源的快速开发平台。\n\n- 支持多租户\n- 支持工作流',
    sceneParams: {
      sourceLanguage: AiWriteOptionEnum.AUTO,
      targetLanguage: 3,
      domain: '技术',
      preserveFormat: true
    }
  }
}

// ========== 【思维导图 UI】相关的枚举 ==========

/** 思维导图已有内容生成示例 **/
export const MindMapContentExample = `# Java 技术栈

## 核心技术
### Java SE
### Java EE

## 框架
### Spring
#### Spring Boot
#### Spring MVC
#### Spring Data
### Hibernate
### MyBatis

## 构建工具
### Maven
### Gradle

## 版本控制
### Git
### SVN

## 测试工具
### JUnit
### Mockito
### Selenium

## 应用服务器
### Tomcat
### Jetty
### WildFly

## 数据库
### MySQL
### PostgreSQL
### Oracle
### MongoDB

## 消息队列
### Kafka
### RabbitMQ
### ActiveMQ

## 微服务
### Spring Cloud
### Dubbo

## 容器化
### Docker
### Kubernetes

## 云服务
### AWS
### Azure
### Google Cloud

## 开发工具
### IntelliJ IDEA
### Eclipse
### Visual Studio Code`

// ========== 【思考配置】相关的枚举 ==========

/** AI 思考档位的展示名，未列出的档位直接展示档位值 */
export const AiReasoningLevelLabels: Record<string, string> = {
  off: '关闭',
  on: '开启',
  minimal: '最低',
  low: '低',
  medium: '中',
  high: '高',
  xhigh: '很高',
  max: '最高'
}

/** AI 思考配置的预设 */
export interface AiReasoningPreset {
  key: string // 预设标识
  name: string // 预设名称
  note: string // 说明
  defaultLevel: string // 默认档位
  levels: [string, Record<string, unknown>][] // 档位及思考参数，从低到高
}

/**
 * AI 思考配置的预设
 *
 * 只覆盖方案中已核对过官方文档的厂商和型号；预设只是示例，保存前仍需按厂商文档核对
 */
export const AiReasoningPresets: AiReasoningPreset[] = [
  {
    key: 'deepseek',
    name: 'DeepSeek · 默认 high',
    note: '思考模式下 temperature 被厂商忽略。',
    defaultLevel: 'high',
    levels: [
      ['off', { thinking: { type: 'disabled' } }],
      ['low', { thinking: { type: 'enabled' }, reasoning_effort: 'low' }],
      ['high', { thinking: { type: 'enabled' }, reasoning_effort: 'high' }],
      ['max', { thinking: { type: 'enabled' }, reasoning_effort: 'max' }]
    ]
  },
  {
    key: 'glm53',
    name: 'GLM-5.3 · 只有一个非 off 档',
    note: '官方文档：GLM-5.3 不能关闭思考。',
    defaultLevel: 'on',
    levels: [['on', { thinking: { type: 'enabled' } }]]
  },
  {
    key: 'kimi3',
    name: 'Kimi k3（没有 off 档）',
    note: 'k3 系列只支持 reasoning_effort。没有 off 只表示没提供关闭选项，不代表厂商一定在思考。',
    defaultLevel: 'max',
    levels: [
      ['low', { reasoning_effort: 'low' }],
      ['high', { reasoning_effort: 'high' }],
      ['max', { reasoning_effort: 'max' }]
    ]
  },
  {
    key: 'minimax',
    name: 'MiniMax · MiniMax-M3',
    note: 'M3.1-Flash 传 disabled 返回 400，该型号不要配 off；M2.x 的 off 不生效。',
    defaultLevel: 'on',
    levels: [
      ['off', { thinking: { type: 'disabled' } }],
      ['on', { thinking: { type: 'adaptive' } }]
    ]
  },
  {
    key: 'mimo',
    name: '小米 MiMo · V2.6 系列',
    note: '默认开启思考；思考模式下 temperature、top_p 被厂商固定为推荐值。',
    defaultLevel: 'on',
    levels: [
      ['off', { thinking: { type: 'disabled' } }],
      ['on', { thinking: { type: 'enabled' } }]
    ]
  },
  {
    key: 'qwen',
    name: '通义 · 混合思考模型',
    note: '未配置时仍是 enableThinking(true)。配置后每档必须写 enable_thinking；「仅思考」模型无法关闭。',
    defaultLevel: 'on',
    levels: [
      ['off', { enable_thinking: false }],
      ['on', { enable_thinking: true }]
    ]
  },
  {
    key: 'openai',
    name: 'OpenAI · 推理模型（Chat）',
    note: 'reasoning_effort 写强类型字段；temperature、max_tokens 仍会发送，需要去掉它们的型号暂不支持。',
    defaultLevel: 'medium',
    levels: [
      ['low', { reasoning_effort: 'low' }],
      ['medium', { reasoning_effort: 'medium' }],
      ['high', { reasoning_effort: 'high' }]
    ]
  },
  {
    key: 'openrouter',
    name: 'OpenRouter（OpenAI 平台 + 自定义 URL）',
    note: 'reasoning 通过 extraBody 追加到请求顶层。exclude 只隐藏返回内容，不能当关闭用。',
    defaultLevel: 'high',
    levels: [
      ['off', { reasoning: { enabled: false } }],
      ['low', { reasoning: { effort: 'low' } }],
      ['high', { reasoning: { effort: 'high' } }]
    ]
  }
]
