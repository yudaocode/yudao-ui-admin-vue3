import { useI18n } from '@/hooks/web/useI18n'
import { FormItemRule } from 'element-plus'

interface LengthRange {
  min: number
  max: number
  message?: string
}

export const useValidator = () => {
  // 在调用时获取 t：模块顶层获取会早于 setupI18n，导致只能返回原始 key
  const { t } = useI18n()

  const required = (message?: string): FormItemRule => {
    return {
      required: true,
      message: message || t('common.required')
    }
  }

  const lengthRange = (options: LengthRange): FormItemRule => {
    const { min, max, message } = options

    return {
      min,
      max,
      message: message || t('common.lengthRange', { min, max })
    }
  }

  const notSpace = (message?: string): FormItemRule => {
    return {
      validator: ((_, val) => {
        if (typeof val === 'string' && val.includes(' ')) {
          return Promise.reject(new Error(message || t('common.notSpace')))
        }
        return Promise.resolve()
      }) as any
    }
  }

  const notSpecialCharacters = (message?: string): FormItemRule => {
    return {
      validator: ((_, val) => {
        if (/[`~!@#$%^&*()_+<>?:"{},.\/;'[\]]/gi.test(val)) {
          return Promise.reject(new Error(message || t('common.notSpecialCharacters')))
        }
        return Promise.resolve()
      }) as any
    }
  }

  // 空值（''、null、undefined）不校验格式，是否必填交给 required
  const isEmptyValue = (val: unknown) => val === '' || val === null || val === undefined

  // 手机号（参考上游 4146716655）：空值通过
  const phone = (message?: string): FormItemRule => {
    return {
      validator: ((_, val) => {
        if (!isEmptyValue(val) && !/^1[3456789]\d{9}$/.test(String(val))) {
          return Promise.reject(new Error(message || t('common.phone')))
        }
        return Promise.resolve()
      }) as any
    }
  }

  // 邮箱（参考上游 4146716655，沿用上游正则）：空值通过
  const email = (message?: string): FormItemRule => {
    return {
      validator: ((_, val) => {
        if (!isEmptyValue(val) && !/^(\w-*\.*)+@(\w-?)+(\.\w{2,})+$/.test(String(val))) {
          return Promise.reject(new Error(message || t('common.email')))
        }
        return Promise.resolve()
      }) as any
    }
  }

  // 最大长度（参考上游 4146716655）
  const maxlength = (max: number, message?: string): FormItemRule => {
    return {
      max,
      message: message || t('common.maxlength', { max })
    }
  }

  // 勾选类校验（如 IAgree 协议勾选）：只有值为 true 才通过
  const check = (message?: string): FormItemRule => {
    return {
      validator: ((_, val) => {
        if (val !== true) {
          return Promise.reject(new Error(message || t('common.required')))
        }
        return Promise.resolve()
      }) as any
    }
  }

  return {
    required,
    lengthRange,
    notSpace,
    notSpecialCharacters,
    phone,
    email,
    maxlength,
    check
  }
}
