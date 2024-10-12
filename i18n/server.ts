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
  // get locale from cookie
  const localeCookie = cookies().get('locale')
  languages = localeCookie?.value ? [localeCookie.value] : []

  if (!languages.length) {
    // Negotiator expects plain object so we need to transform headers
    const negotiatorHeaders: Record<string, string> = {}
    headers().forEach((value, key) => (negotiatorHeaders[key] = value))
    // Use negotiator and intl-localematcher to get best locale
    languages = new Negotiator({ headers: negotiatorHeaders }).languages()
  }

  // 添加日志记录
  console.log('Available locales:', locales)
  console.log('Detected languages:', languages)

  try {
    // match locale
    const matchedLocale = match(languages, locales, i18n.defaultLocale) as Locale
    console.log('Matched locale:', matchedLocale)
    return matchedLocale
  } catch (error) {
    console.error('Error matching locale:', error)
    // 如果匹配失败，返回默认语言
    return i18n.defaultLocale
  }
}
