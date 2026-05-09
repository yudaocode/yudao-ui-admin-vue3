/**
 * WMS 前端运行参数
 *
 * 标注「后端镜像」的常量与 yudao.wms.* 配置默认值一致；调整后端配置时需同步修改这里
 */

// ==================== 后端镜像（与 WmsProperties 默认值对齐） ====================

/** 是否启用库区模式（对齐 yudao.wms.area-enable） */
export const AREA_ENABLE = true

/**
 * 是否启用批次/效期/库存明细模式（对齐 yudao.wms.batch-enable）
 *
 * 依赖 AREA_ENABLE = true
 */
export const BATCH_ENABLE = true
