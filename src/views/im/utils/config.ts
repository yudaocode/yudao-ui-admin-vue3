/**
 * IM 前端运行参数 / UI 阈值
 *
 * 与 constants.ts 的分工：
 * - constants.ts：协议枚举（与后端 enum 一一对应）+ 协议契约值（如 IM_AT_ALL_USER_ID）
 * - config.ts：可调节的策略数值，包括镜像后端 ImProperties 的默认值与纯前端 UI 阈值
 *
 * 标注「后端镜像」的常量与 yudao.im.* 配置默认值一致；调整后端配置时需同步修改这里
 */

// ==================== 后端镜像（与 ImProperties 默认值对齐） ====================

/** 群最大成员人数（对齐 yudao.im.group.max-member） */
export const GROUP_MAX_MEMBER = 500

/** 单群管理员人数上限（对齐 yudao.im.group.admin-max-count） */
export const GROUP_ADMIN_MAX_COUNT = 3

/** 单群置顶消息条数上限（对齐 yudao.im.group.pin-max-count） */
export const GROUP_PIN_MAX_COUNT = 5

/**
 * 是否启用私聊已读功能（对齐 yudao.im.message.private-read-enabled）
 *
 * 关闭后：进入私聊会话不再上报已读位置；气泡的「已读 / 未读」标签隐藏；
 * 管理后台私聊消息列表的「状态」列与详情中的状态字段隐藏
 */
export const MESSAGE_PRIVATE_READ_ENABLED = true

/**
 * 是否启用群聊已读功能（含群消息回执，对齐 yudao.im.message.group-read-enabled）
 *
 * 关闭后：进入群会话不再上报已读位置；输入框的「发送回执消息」入口隐藏；
 * 群消息气泡上的「N 人已读」popover 隐藏；管理后台群消息列表的「状态」「回执」列与详情中对应字段隐藏
 */
export const MESSAGE_GROUP_READ_ENABLED = true

/** 消息撤回时间限制（分钟，对齐 yudao.im.message.recall-timeout-minutes） */
export const MESSAGE_RECALL_TIMEOUT_MINUTES = 5

/** 私聊离线消息最大拉取天数（对齐 yudao.im.message.private-pull-max-days） */
export const MESSAGE_PRIVATE_PULL_MAX_DAYS = 30

/** 群聊离线消息最大拉取天数（对齐 yudao.im.message.group-pull-max-days） */
export const MESSAGE_GROUP_PULL_MAX_DAYS = 30

// ==================== 前端独有：拉取 / 分页 ====================

/** 每次拉取私聊消息的最大条数（后端上限 1000，前端取保守值 100） */
export const MESSAGE_PRIVATE_PULL_SIZE = 100

/** 每次拉取群聊消息的最大条数（后端上限 1000，前端取保守值 100） */
export const MESSAGE_GROUP_PULL_SIZE = 100

/** 「我相关」好友申请列表的单次拉取条数（游标分页 page size） */
export const FRIEND_REQUEST_PAGE_SIZE = 100

/** 「我相关」加群申请列表的单次拉取条数 */
export const GROUP_REQUEST_PAGE_SIZE = 100

// ==================== 上传安全策略 ====================
// 数值与后端 Spring multipart 配置对齐（`spring.servlet.multipart.max-file-size = 16MB`）
// 后端调大后这里同步调；不要单边放宽，否则用户上传完到后端 413

/** 图片 / 视频 / 普通文件单文件上限（MB），对齐后端 max-file-size */
export const MESSAGE_IMAGE_MAX_MB = 16
export const MESSAGE_VIDEO_MAX_MB = 16
export const MESSAGE_FILE_MAX_MB = 16
/** 语音单文件上限（MB）：60s @ 64kbps 约 0.5MB，5MB 已远超录制可能产出的大小 */
export const MESSAGE_VOICE_MAX_MB = 5

/** 可执行 / 脚本类扩展名黑名单；接收端点击下载后本地双击就跑，html 本地打开还能执行脚本 */
export const DANGEROUS_FILE_EXTENSIONS = [
  'exe',
  'bat',
  'cmd',
  'com',
  'msi',
  'scr',
  'pif',
  'vbs',
  'vbe',
  'wsf',
  'ws',
  'js',
  'jse',
  'jar',
  'sh',
  'app',
  'ps1',
  'reg',
  'html',
  'htm'
]

// ==================== 前端独有：UI 阈值 ====================

/** 消息之间渲染「时间分隔条」的阈值：10 分钟 */
export const MESSAGE_TIME_TIP_GAP_MS = 10 * 60 * 1000

/**
 * 撤回菜单可见的时间窗：自己发送的消息超过这个时长就不能再撤回，菜单回退为「删除」
 *
 * 比后端 MESSAGE_RECALL_TIMEOUT_MINUTES（5 分钟）严格，对齐微信 PC 的 2 分钟
 */
export const MESSAGE_RECALL_WINDOW_MS = 2 * 60 * 1000

/** 合并转发消息（MERGE 类型）气泡内预览的最大行数（对齐微信「聊天记录」气泡） */
export const MESSAGE_MERGE_PREVIEW_LINES = 3

/** 最近转发会话 key 列表的最大保留数量（对齐微信 PC 横向头像区可见容量） */
export const CONVERSATION_RECENT_FORWARD_MAX = 12

// ==================== 前端独有：RTC 通话兜底 ====================

/**
 * 振铃超时兜底；通话存活期间 timer 调用 noAnswerCallCheck 接口的间隔；
 * 实际超时阈值由后端 yudao.im.rtc.invite-timeout-minutes 决定，前端仅决定触发频率
 */
export const RTC_NO_ANSWER_CALL_CHECK_INTERVAL_MS = 60 * 1000

// ==================== 前端独有：WebSocket 自动重连 ====================
// 指数退避：base * 2^attempt，上限封顶；每次再叠加 0~jitter ms 随机偏移
// 避免服务端重启时全量客户端在同一秒打过来形成「惊群」；不设次数上限，持续重连直到链路恢复

/** 首次重连等待，单位 ms */
export const WS_RECONNECT_BASE_MS = 1000

/** 退避上限，单位 ms；连续失败 5 次后稳定在 30s 不再增长 */
export const WS_RECONNECT_MAX_MS = 30 * 1000

/** 退避叠加的随机抖动上限，单位 ms */
export const WS_RECONNECT_JITTER_MS = 1000
