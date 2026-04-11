import CryptoJS from 'crypto-js'
import { JSEncrypt } from 'jsencrypt'

/**
 * API 加解密工具类
 * 支持 AES 和 RSA 加密算法
 */

// 从环境变量获取配置
const API_ENCRYPT_ENABLE = import.meta.env.VITE_APP_API_ENCRYPT_ENABLE === 'true'
const API_ENCRYPT_HEADER = import.meta.env.VITE_APP_API_ENCRYPT_HEADER || 'X-Api-Encrypt'
const API_ENCRYPT_ALGORITHM = import.meta.env.VITE_APP_API_ENCRYPT_ALGORITHM || 'AES'
const API_ENCRYPT_REQUEST_KEY = import.meta.env.VITE_APP_API_ENCRYPT_REQUEST_KEY || '' // AES密钥 或 RSA公钥
const API_ENCRYPT_RESPONSE_KEY = import.meta.env.VITE_APP_API_ENCRYPT_RESPONSE_KEY || '' // AES密钥 或 RSA私钥

/**
 * AES 加密工具类
 */
export class AES {
  /**
   * AES 加密
   * @param data 要加密的数据
   * @param key 加密密钥
   * @returns 加密后的字符串
   */
  static encrypt(data: string, key: string): string {
    try {
      if (!key) {
        throw new Error('AES 加密密钥不能为空')
      }
      if (key.length !== 32) {
        throw new Error(`AES 加密密钥长度必须为 32 位，当前长度: ${key.length}`)
      }

      const keyUtf8 = CryptoJS.enc.Utf8.parse(key)
      const encrypted = CryptoJS.AES.encrypt(data, keyUtf8, {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7
      })
      return encrypted.toString()
    } catch (error) {
      console.error('AES 加密失败:', error)
      throw error
    }
  }

  /**
   * AES 解密
   * @param encryptedData 加密的数据
   * @param key 解密密钥
   * @returns 解密后的字符串
   */
  static decrypt(encryptedData: string, key: string): string {
    try {
      if (!key) {
        throw new Error('AES 解密密钥不能为空')
      }
      if (key.length !== 32) {
        throw new Error(`AES 解密密钥长度必须为 32 位，当前长度: ${key.length}`)
      }
      if (!encryptedData) {
        throw new Error('AES 解密数据不能为空')
      }

      const keyUtf8 = CryptoJS.enc.Utf8.parse(key)
      const decrypted = CryptoJS.AES.decrypt(encryptedData, keyUtf8, {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7
      })
      const result = decrypted.toString(CryptoJS.enc.Utf8)
      if (!result) {
        throw new Error('AES 解密结果为空，可能是密钥错误或数据损坏')
      }
      return result
    } catch (error) {
      console.error('AES 解密失败:', error)
      throw error
    }
  }
}

/**
 * RSA 加密工具类
 */
export class RSA {
  /**
   * RSA 加密
   * @param data 要加密的数据
   * @param publicKey 公钥（必需）
   * @returns 加密后的字符串
   */
  static encrypt(data: string, publicKey: string): string | false {
    try {
      if (!publicKey) {
        throw new Error('RSA 公钥不能为空')
      }

      const encryptor = new JSEncrypt()
      encryptor.setPublicKey(publicKey)
      const result = encryptor.encrypt(data)
      if (result === false) {
        throw new Error('RSA 加密失败，可能是公钥格式错误或数据过长')
      }
      return result
    } catch (error) {
      console.error('RSA 加密失败:', error)
      throw error
    }
  }

  /**
   * RSA 解密
   * @param encryptedData 加密的数据
   * @param privateKey 私钥（必需）
   * @returns 解密后的字符串
   */
  static decrypt(encryptedData: string, privateKey: string): string | false {
    try {
      if (!privateKey) {
        throw new Error('RSA 私钥不能为空')
      }
      if (!encryptedData) {
        throw new Error('RSA 解密数据不能为空')
      }

      const encryptor = new JSEncrypt()
      encryptor.setPrivateKey(privateKey)
      const result = encryptor.decrypt(encryptedData)
      if (result === false) {
        throw new Error('RSA 解密失败，可能是私钥错误或数据损坏')
      }
      return result
    } catch (error) {
      console.error('RSA 解密失败:', error)
      throw error
    }
  }
}

/**
 * API 加解密主类
 */
export class ApiEncrypt {
  /**
   * 获取加密头名称
   */
  static getEncryptHeader(): string {
    return API_ENCRYPT_HEADER
  }

  /**
   * 加密请求数据
   * @param data 要加密的数据
   * @returns 加密后的数据
   */
  static encryptRequest(data: any): string {
    if (!API_ENCRYPT_ENABLE) {
      return data
    }

    try {
      const jsonData = typeof data === 'string' ? data : JSON.stringify(data)

      if (API_ENCRYPT_ALGORITHM.toUpperCase() === 'AES') {
        if (!API_ENCRYPT_REQUEST_KEY) {
          throw new Error('AES 请求加密密钥未配置')
        }
        return AES.encrypt(jsonData, API_ENCRYPT_REQUEST_KEY)
      } else if (API_ENCRYPT_ALGORITHM.toUpperCase() === 'RSA') {
        if (!API_ENCRYPT_REQUEST_KEY) {
          throw new Error('RSA 公钥未配置')
        }
        const result = RSA.encrypt(jsonData, API_ENCRYPT_REQUEST_KEY)
        if (result === false) {
          throw new Error('RSA 加密失败')
        }
        return result
      } else {
        throw new Error(`不支持的加密算法: ${API_ENCRYPT_ALGORITHM}`)
      }
    } catch (error) {
      console.error('请求数据加密失败:', error)
      throw error
    }
  }

  /**
   * 解密响应数据
   * @param encryptedData 加密的响应数据
   * @returns 解密后的数据
   */
  static decryptResponse(encryptedData: string): any {
    if (!API_ENCRYPT_ENABLE) {
      return encryptedData
    }

    try {
      let decryptedData: string | false = ''
      if (API_ENCRYPT_ALGORITHM.toUpperCase() === 'AES') {
        if (!API_ENCRYPT_RESPONSE_KEY) {
          throw new Error('AES 响应解密密钥未配置')
        }
        decryptedData = AES.decrypt(encryptedData, API_ENCRYPT_RESPONSE_KEY)
      } else if (API_ENCRYPT_ALGORITHM.toUpperCase() === 'RSA') {
        if (!API_ENCRYPT_RESPONSE_KEY) {
          throw new Error('RSA 私钥未配置')
        }
        decryptedData = RSA.decrypt(encryptedData, API_ENCRYPT_RESPONSE_KEY)
        if (decryptedData === false) {
          throw new Error('RSA 解密失败')
        }
      } else {
        throw new Error(`不支持的解密算法: ${API_ENCRYPT_ALGORITHM}`)
      }

      if (!decryptedData) {
        throw new Error('解密结果为空')
      }

      // 尝试解析为 JSON，如果失败则返回原字符串
      try {
        return JSON.parse(decryptedData)
      } catch {
        return decryptedData
      }
    } catch (error) {
      console.error('响应数据解密失败:', error)
      throw error
    }
  }
}
