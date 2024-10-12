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

    // 使用negotiator和intl-localematcher获取最佳区域设置
    languages = new Negotiator({ headers: negotiatorHeaders }).languages()

    // 将 ['*'] 改为 []
    if (languages.length === 1 && languages[0] === '*') {
      languages = []
    }
  }

  // 如果languages为空，直接返回默认语言
  if (languages.length === 0) {
    return i18n.defaultLocale
  }

  // 匹配区域设置
  try {
    const matchedLocale = match(languages, locales, i18n.defaultLocale) as Locale
    return matchedLocale
  } catch (error) {
    // 如果匹配失败，返回默认语言
    return i18n.defaultLocale
  }
}
