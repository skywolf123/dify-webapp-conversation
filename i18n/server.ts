import 'server-only'

import { cookies, headers } from 'next/headers'
import Negotiator from 'negotiator'
import { match } from '@formatjs/intl-localematcher'
import type { Locale } from '.'
import { i18n } from '.'

export const getLocaleOnServer = (): Locale => {
  // @ts-expect-error locales are readonly
  const locales: string[] = i18n.locales

  let languages: string[] | undefined
  // 从cookie获取区域设置
  const localeCookie = cookies().get('locale')
  languages = localeCookie?.value ? [localeCookie.value] : []

  if (!languages.length) {
    // Negotiator需要普通对象，所以我们需要转换headers
    const negotiatorHeaders: Record<string, string> = {}
    headers().forEach((value, key) => (negotiatorHeaders[key] = value))
    
    // 记录原始头部信息
    console.log('原始请求头:', JSON.stringify(negotiatorHeaders, null, 2))
    
    // 使用negotiator和intl-localematcher获取最佳区域设置
    languages = new Negotiator({ headers: negotiatorHeaders }).languages()
    
    // 记录Negotiator返回的语言列表
    console.log('Negotiator返回的语言列表:', languages)
  }

  // 过滤掉无效的语言代码
  const validLanguages = languages.filter(lang => lang && lang !== '*' && /^[a-zA-Z-]+$/.test(lang))

  console.log('可用的区域设置:', locales)
  console.log('检测到的语言:', languages)
  console.log('有效的语言:', validLanguages)

  try {
    // 如果没有找到有效的语言，使用默认区域设置
    if (validLanguages.length === 0) {
      console.log('没有检测到有效的语言，使用默认区域设置:', i18n.defaultLocale)
      return i18n.defaultLocale
    }

    // 匹配区域设置
    const matchedLocale = match(validLanguages, locales, i18n.defaultLocale) as Locale
    console.log('匹配的区域设置:', matchedLocale)
    return matchedLocale
  } catch (error) {
    console.error('匹配区域设置时出错:', error)
    console.error('错误详情:', JSON.stringify(error, Object.getOwnPropertyNames(error)))
    // 如果匹配失败，返回默认语言
    return i18n.defaultLocale
  }
}
