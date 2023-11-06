import { useI18n } from '@/hooks/web/useI18n'
import { FormItemRule } from 'element-plus'

const { t } = useI18n()

interface LengthRange {
  min: number
  max: number
  message?: string
}

export const useValidator = () => {
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
      validator: (_, val, callback) => {
        if (val?.indexOf(' ') !== -1) {
          callback(new Error(message || t('common.notSpace')))
        } else {
          callback()
        }
      }
    }
  }

  const notSpecialCharacters = (message?: string): FormItemRule => {
    return {
      validator: (_, val, callback) => {
        if (/[`~!@#$%^&*()_+<>?:"{},.\/;'[\]]/gi.test(val)) {
          callback(new Error(message || t('common.notSpecialCharacters')))
        } else {
          callback()
        }
      }
    }
  }

  return {
    required,
    lengthRange,
    notSpace,
    notSpecialCharacters
  }
}
