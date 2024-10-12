import { getLocaleOnServer } from '@/i18n/server'
import './styles/globals.css'
import './styles/markdown.scss'

const LocaleLayout = ({
  children,
}: {
  children: React.ReactNode
}) => {
  let locale
  try {
    locale = getLocaleOnServer()
  } catch (error) {
    console.error('Error getting locale:', error)
    locale = 'en' // 使用英语作为默认语言
  }

  return (
    <html lang={locale} className="h-full">
      <body className="h-full">
        <div className="overflow-x-auto">
          <div className="w-screen h-screen min-w-[300px]">
            {children}
          </div>
        </div>
      </body>
    </html>
  )
}

export default LocaleLayout
