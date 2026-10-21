/**
 * 地图坐标系转换工具
 *
 * BD09：百度地图坐标；GCJ02：国测局坐标（微信、腾讯等）
 * 中国大陆范围外百度、微信均使用 WGS84，坐标保持不变
 * 参数统一先经度、后纬度
 */

/** 经纬度坐标 */
export interface MapCoordinate {
  latitude: number // 纬度
  longitude: number // 经度
}

const X_PI = (Math.PI * 3000) / 180

/** 判断坐标是否位于中国大陆转换范围外 */
const isOutsideChina = (longitude: number, latitude: number) => {
  return longitude < 72.004 || longitude > 137.8347 || latitude < 0.8293 || latitude > 55.8271
}

/** 转换为有限数字，空白和非数字返回 undefined */
const toFiniteNumber = (value: unknown) => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined
  }
  if (typeof value === 'string' && value.trim()) {
    const result = Number(value)
    return Number.isFinite(result) ? result : undefined
  }
  return undefined
}

/** 解析经纬度，任一值缺失或非有限数字时返回 undefined；0 是合法坐标 */
export const toMapCoordinate = (
  longitude: unknown,
  latitude: unknown
): MapCoordinate | undefined => {
  const lng = toFiniteNumber(longitude)
  const lat = toFiniteNumber(latitude)
  if (lng === undefined || lat === undefined) {
    return undefined
  }
  return { longitude: lng, latitude: lat }
}

/** GCJ02 转 BD09，中国大陆范围外不偏移 */
export const gcj02ToBd09 = (longitude: number, latitude: number): MapCoordinate => {
  if (isOutsideChina(longitude, latitude)) {
    return { longitude, latitude }
  }
  const z = Math.hypot(longitude, latitude) + 2e-5 * Math.sin(latitude * X_PI)
  const theta = Math.atan2(latitude, longitude) + 3e-6 * Math.cos(longitude * X_PI)
  return {
    longitude: z * Math.cos(theta) + 0.0065,
    latitude: z * Math.sin(theta) + 0.006
  }
}

/** BD09 转 GCJ02：先按公式近似反算，再用正算结果迭代校正；中国大陆范围外不偏移 */
export const bd09ToGcj02 = (longitude: number, latitude: number): MapCoordinate => {
  if (isOutsideChina(longitude, latitude)) {
    return { longitude, latitude }
  }
  const x = longitude - 0.0065
  const y = latitude - 0.006
  const z = Math.hypot(x, y) - 2e-5 * Math.sin(y * X_PI)
  const theta = Math.atan2(y, x) - 3e-6 * Math.cos(x * X_PI)
  let result: MapCoordinate = {
    longitude: z * Math.cos(theta),
    latitude: z * Math.sin(theta)
  }
  for (let i = 0; i < 3; i++) {
    const bd09 = gcj02ToBd09(result.longitude, result.latitude)
    result = {
      longitude: result.longitude + longitude - bd09.longitude,
      latitude: result.latitude + latitude - bd09.latitude
    }
  }
  return result
}
