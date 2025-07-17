/**
 * IoT 场景联动错误处理和用户反馈工具
 */

import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'

// 错误类型枚举
export enum ErrorType {
  VALIDATION = 'validation',
  NETWORK = 'network',
  BUSINESS = 'business',
  SYSTEM = 'system',
  PERMISSION = 'permission'
}

// 错误级别枚举
export enum ErrorLevel {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

// 错误信息接口
export interface ErrorInfo {
  type: ErrorType
  level: ErrorLevel
  code?: string
  message: string
  details?: any
  timestamp?: Date
  context?: string
}

// 用户反馈选项
export interface FeedbackOptions {
  showMessage?: boolean
  showNotification?: boolean
  showDialog?: boolean
  autoClose?: boolean
  duration?: number
  confirmText?: string
  cancelText?: string
}

/**
 * 错误处理器类
 */
export class SceneRuleErrorHandler {
  private static instance: SceneRuleErrorHandler
  private errorLog: ErrorInfo[] = []
  private maxLogSize = 100

  private constructor() {}

  static getInstance(): SceneRuleErrorHandler {
    if (!SceneRuleErrorHandler.instance) {
      SceneRuleErrorHandler.instance = new SceneRuleErrorHandler()
    }
    return SceneRuleErrorHandler.instance
  }

  /**
   * 处理错误
   */
  handleError(error: ErrorInfo, options: FeedbackOptions = {}): Promise<boolean> {
    // 记录错误日志
    this.logError(error)

    // 根据错误类型和级别选择处理方式
    return this.processError(error, options)
  }

  /**
   * 记录错误日志
   */
  private logError(error: ErrorInfo): void {
    const errorWithTimestamp = {
      ...error,
      timestamp: new Date()
    }

    this.errorLog.unshift(errorWithTimestamp)

    // 限制日志大小
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(0, this.maxLogSize)
    }

    // 开发环境下打印到控制台
    if (import.meta.env.DEV) {
      console.error('[SceneRule Error]', errorWithTimestamp)
    }
  }

  /**
   * 处理错误
   */
  private async processError(error: ErrorInfo, options: FeedbackOptions): Promise<boolean> {
    const defaultOptions: FeedbackOptions = {
      showMessage: true,
      showNotification: false,
      showDialog: false,
      autoClose: true,
      duration: 3000,
      confirmText: '确定',
      cancelText: '取消'
    }

    const finalOptions = { ...defaultOptions, ...options }

    try {
      // 根据错误级别决定反馈方式
      switch (error.level) {
        case ErrorLevel.INFO:
          return this.handleInfoError(error, finalOptions)
        case ErrorLevel.WARNING:
          return this.handleWarningError(error, finalOptions)
        case ErrorLevel.ERROR:
          return this.handleNormalError(error, finalOptions)
        case ErrorLevel.CRITICAL:
          return this.handleCriticalError(error, finalOptions)
        default:
          return this.handleNormalError(error, finalOptions)
      }
    } catch (e) {
      console.error('Error handler failed:', e)
      return false
    }
  }

  /**
   * 处理信息级错误
   */
  private async handleInfoError(error: ErrorInfo, options: FeedbackOptions): Promise<boolean> {
    if (options.showMessage) {
      ElMessage.info({
        message: error.message,
        duration: options.duration,
        showClose: !options.autoClose
      })
    }
    return true
  }

  /**
   * 处理警告级错误
   */
  private async handleWarningError(error: ErrorInfo, options: FeedbackOptions): Promise<boolean> {
    if (options.showNotification) {
      ElNotification.warning({
        title: '警告',
        message: error.message,
        duration: options.duration
      })
    } else if (options.showMessage) {
      ElMessage.warning({
        message: error.message,
        duration: options.duration,
        showClose: !options.autoClose
      })
    }
    return true
  }

  /**
   * 处理普通错误
   */
  private async handleNormalError(error: ErrorInfo, options: FeedbackOptions): Promise<boolean> {
    if (options.showDialog) {
      try {
        await ElMessageBox.alert(error.message, '错误', {
          type: 'error',
          confirmButtonText: options.confirmText
        })
        return true
      } catch (e) {
        return false
      }
    } else if (options.showNotification) {
      ElNotification.error({
        title: '错误',
        message: error.message,
        duration: options.duration
      })
    } else if (options.showMessage) {
      ElMessage.error({
        message: error.message,
        duration: options.duration,
        showClose: !options.autoClose
      })
    }
    return true
  }

  /**
   * 处理严重错误
   */
  private async handleCriticalError(error: ErrorInfo, _: FeedbackOptions): Promise<boolean> {
    try {
      await ElMessageBox.confirm(`${error.message}\n\n是否重新加载页面？`, '严重错误', {
        type: 'error',
        confirmButtonText: '重新加载',
        cancelButtonText: '继续使用'
      })
      // 用户选择重新加载
      window.location.reload()
      return true
    } catch (e) {
      // 用户选择继续使用
      return false
    }
  }

  /**
   * 获取错误日志
   */
  getErrorLog(): ErrorInfo[] {
    return [...this.errorLog]
  }

  /**
   * 清空错误日志
   */
  clearErrorLog(): void {
    this.errorLog = []
  }

  /**
   * 导出错误日志
   */
  exportErrorLog(): string {
    return JSON.stringify(this.errorLog, null, 2)
  }
}

/**
 * 预定义的错误处理函数
 */
export const errorHandler = SceneRuleErrorHandler.getInstance()

/**
 * 验证错误处理
 */
export function handleValidationError(message: string, context?: string): Promise<boolean> {
  return errorHandler.handleError(
    {
      type: ErrorType.VALIDATION,
      level: ErrorLevel.WARNING,
      message,
      context
    },
    {
      showMessage: true,
      duration: 4000
    }
  )
}

/**
 * 网络错误处理
 */
export function handleNetworkError(error: any, context?: string): Promise<boolean> {
  let message = '网络请求失败'

  if (error?.response?.status) {
    switch (error.response.status) {
      case 400:
        message = '请求参数错误'
        break
      case 401:
        message = '未授权，请重新登录'
        break
      case 403:
        message = '权限不足'
        break
      case 404:
        message = '请求的资源不存在'
        break
      case 500:
        message = '服务器内部错误'
        break
      case 502:
        message = '网关错误'
        break
      case 503:
        message = '服务暂不可用'
        break
      default:
        message = `网络错误 (${error.response.status})`
    }
  } else if (error?.message) {
    message = error.message
  }

  return errorHandler.handleError(
    {
      type: ErrorType.NETWORK,
      level: ErrorLevel.ERROR,
      code: error?.response?.status?.toString(),
      message,
      details: error,
      context
    },
    {
      showMessage: true,
      duration: 5000
    }
  )
}

/**
 * 业务逻辑错误处理
 */
export function handleBusinessError(
  message: string,
  code?: string,
  context?: string
): Promise<boolean> {
  return errorHandler.handleError(
    {
      type: ErrorType.BUSINESS,
      level: ErrorLevel.ERROR,
      code,
      message,
      context
    },
    {
      showMessage: true,
      duration: 4000
    }
  )
}

/**
 * 系统错误处理
 */
export function handleSystemError(error: any, context?: string): Promise<boolean> {
  const message = error?.message || '系统发生未知错误'

  return errorHandler.handleError(
    {
      type: ErrorType.SYSTEM,
      level: ErrorLevel.CRITICAL,
      message,
      details: error,
      context
    },
    {
      showDialog: true
    }
  )
}

/**
 * 权限错误处理
 */
export function handlePermissionError(
  message: string = '权限不足',
  context?: string
): Promise<boolean> {
  return errorHandler.handleError(
    {
      type: ErrorType.PERMISSION,
      level: ErrorLevel.WARNING,
      message,
      context
    },
    {
      showNotification: true,
      duration: 5000
    }
  )
}

/**
 * 成功反馈
 */
export function showSuccess(message: string, duration: number = 3000): void {
  ElMessage.success({
    message,
    duration,
    showClose: false
  })
}

/**
 * 信息反馈
 */
export function showInfo(message: string, duration: number = 3000): void {
  ElMessage.info({
    message,
    duration,
    showClose: false
  })
}

/**
 * 警告反馈
 */
export function showWarning(message: string, duration: number = 4000): void {
  ElMessage.warning({
    message,
    duration,
    showClose: true
  })
}

/**
 * 确认对话框
 */
export function showConfirm(
  message: string,
  title: string = '确认',
  options: {
    type?: 'info' | 'success' | 'warning' | 'error'
    confirmText?: string
    cancelText?: string
  } = {}
): Promise<boolean> {
  const defaultOptions = {
    type: 'warning' as const,
    confirmText: '确定',
    cancelText: '取消'
  }

  const finalOptions = { ...defaultOptions, ...options }

  return ElMessageBox.confirm(message, title, {
    type: finalOptions.type,
    confirmButtonText: finalOptions.confirmText,
    cancelButtonText: finalOptions.cancelText
  })
    .then(() => true)
    .catch(() => false)
}

/**
 * 加载状态管理
 */
export class LoadingManager {
  private loadingStates = new Map<string, boolean>()
  private loadingInstances = new Map<string, any>()

  /**
   * 开始加载
   */
  startLoading(key: string, _: string = '加载中...'): void {
    if (this.loadingStates.get(key)) {
      return // 已经在加载中
    }

    this.loadingStates.set(key, true)

    // 这里可以根据需要创建全局加载实例
    // const loading = ElLoading.service({
    //   lock: true,
    //   text,
    //   background: 'rgba(0, 0, 0, 0.7)'
    // })
    // this.loadingInstances.set(key, loading)
  }

  /**
   * 结束加载
   */
  stopLoading(key: string): void {
    this.loadingStates.set(key, false)

    const loading = this.loadingInstances.get(key)
    if (loading) {
      loading.close()
      this.loadingInstances.delete(key)
    }
  }

  /**
   * 检查是否在加载中
   */
  isLoading(key: string): boolean {
    return this.loadingStates.get(key) || false
  }

  /**
   * 清空所有加载状态
   */
  clearAll(): void {
    this.loadingInstances.forEach((loading) => loading.close())
    this.loadingStates.clear()
    this.loadingInstances.clear()
  }
}

export const loadingManager = new LoadingManager()

/**
 * 异步操作包装器，自动处理错误和加载状态
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  options: {
    loadingKey?: string
    loadingText?: string
    context?: string
    showSuccess?: boolean
    successMessage?: string
    errorHandler?: (error: any) => Promise<boolean>
  } = {}
): Promise<T | null> {
  const {
    loadingKey,
    loadingText = '处理中...',
    context,
    showSuccess = false,
    // successMessage = '操作成功',
    errorHandler: customErrorHandler
  } = options

  try {
    // 开始加载
    if (loadingKey) {
      loadingManager.startLoading(loadingKey, loadingText)
    }

    // 执行操作
    const result = await operation()

    // 显示成功消息
    if (showSuccess) {
      // showSuccess(successMessage)
    }

    return result
  } catch (error) {
    // 使用自定义错误处理器或默认处理器
    if (customErrorHandler) {
      await customErrorHandler(error)
    } else {
      await handleNetworkError(error, context)
    }
    return null
  } finally {
    // 结束加载
    if (loadingKey) {
      loadingManager.stopLoading(loadingKey)
    }
  }
}
