import type { RouteLocationRaw } from 'vue-router'
import qs from 'qs'

type RouteMetaLike = {
  hash?: string
  iframeSrc?: string
  link?: string
  params?: Record<string, any>
  query?: Record<string, any>
}

export interface ParsedRouteLocation {
  hash?: string
  iframe?: boolean
  path: string
  query?: Record<string, any>
}

const ROUTE_IFRAME_QUERY_KEY = '_iframe'
const EXTERNAL_LINK_ROUTE_PREFIX = '/external-link'

export const parseQueryString = (queryString = ''): Record<string, any> => {
  return qs.parse(queryString.replace(/^\?/, '')) as Record<string, any>
}

export const splitRoutePath = (rawPath: string | null | undefined): ParsedRouteLocation => {
  if (!rawPath) {
    return { path: '' }
  }

  const hashIndex = rawPath.indexOf('#')
  const pathWithQuery = hashIndex === -1 ? rawPath : rawPath.slice(0, hashIndex)
  const hash = hashIndex === -1 ? undefined : rawPath.slice(hashIndex)
  const questionMarkIndex = pathWithQuery.indexOf('?')
  if (questionMarkIndex === -1) {
    return {
      ...(hash ? { hash } : {}),
      path: pathWithQuery
    }
  }

  const path = pathWithQuery.slice(0, questionMarkIndex)
  const query = parseQueryString(pathWithQuery.slice(questionMarkIndex + 1))
  return {
    ...(hash ? { hash } : {}),
    path,
    ...(Object.keys(query).length ? { query } : {})
  }
}

export const parseRouteLocation = (rawPath: string | null | undefined): ParsedRouteLocation => {
  return splitRoutePath(rawPath)
}

export const parseExternalRouteLocation = (rawPath: string): ParsedRouteLocation => {
  try {
    const url = new URL(rawPath)
    if (!url.searchParams.has(ROUTE_IFRAME_QUERY_KEY)) {
      return { path: rawPath }
    }
    url.searchParams.delete(ROUTE_IFRAME_QUERY_KEY)
    return {
      iframe: true,
      path: url.toString()
    }
  } catch {
    return { path: rawPath }
  }
}

export const getExternalRoutePath = (id: number | string | undefined, name: string): string => {
  return `${EXTERNAL_LINK_ROUTE_PREFIX}/${encodeURIComponent(String(id || name))}`
}

export const getDynamicPathParamNames = (path: string): string[] => {
  const names: string[] = []
  path.replace(/:([A-Za-z0-9_]+)(?:\([^/]*\))?[?+*]?/g, (_matched, key) => {
    names.push(key)
    return _matched
  })
  return names
}

export const splitDynamicRouteParams = (
  path: string,
  query?: Record<string, any>
): {
  params?: Record<string, any>
  query?: Record<string, any>
} => {
  if (!query || !Object.keys(query).length) {
    return {}
  }
  const paramNames = getDynamicPathParamNames(path)
  if (!paramNames.length) {
    return { query }
  }
  const nextQuery = { ...query }
  const params: Record<string, any> = {}
  paramNames.forEach((name) => {
    const value = nextQuery[name]
    if (value === undefined || value === null || value === '') {
      return
    }
    params[name] = value
    delete nextQuery[name]
  })
  return {
    ...(Object.keys(params).length ? { params } : {}),
    ...(Object.keys(nextQuery).length ? { query: nextQuery } : {})
  }
}

const isRepeatableParam = (matched: string): boolean =>
  matched.endsWith('*') || matched.endsWith('+')

const encodeRouteParam = (matched: string, value: any): string => {
  if (Array.isArray(value)) {
    const encodedSegments = value.map((item) => encodeURIComponent(String(item)))
    return isRepeatableParam(matched)
      ? encodedSegments.join('/')
      : encodeURIComponent(value.map((item) => String(item)).join(','))
  }
  return encodeURIComponent(String(value))
}

export const resolveDynamicPath = (path: string, params?: Record<string, any>): string => {
  if (!params) {
    return path
  }
  return path.replace(/:([A-Za-z0-9_]+)(?:\([^/]*\))?[?+*]?/g, (matched, key) => {
    const value = params[key]
    return value === undefined || value === null ? matched : encodeRouteParam(matched, value)
  })
}

export const createRouteLocation = (
  path: string,
  meta?: RouteMetaLike,
  routeName?: string
): RouteLocationRaw => {
  const hash = meta?.hash
  const params = meta?.params
  const query = meta?.query

  if (params && Object.keys(params).length > 0 && routeName) {
    return {
      ...(hash ? { hash } : {}),
      name: routeName,
      params,
      query
    }
  }

  return {
    ...(hash ? { hash } : {}),
    path: resolveDynamicPath(path, params),
    query
  }
}
