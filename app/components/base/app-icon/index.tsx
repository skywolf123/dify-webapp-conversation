import { FC, useEffect, useState } from 'react'
import classNames from 'classnames'
import style from './style.module.css'
import { fetchMeta } from '@/service/index'

export type AppIconProps = {
  size?: 'xs' | 'tiny' | 'small' | 'medium' | 'large'
  rounded?: boolean
  icon?: string
  background?: string
  className?: string
}

const getIconContent = async (): Promise<string> => {
  try {
    const response = await fetchMeta()
    console.log('fetchMeta response:', response) // 保留日志

    if (Array.isArray(response) && response.length > 0) {
      // 假设第一个元素包含 tool_icons
      const firstItem = response[0]
      if (firstItem && firstItem.tool_icons && Object.keys(firstItem.tool_icons).length > 0) {
        const firstToolName = Object.keys(firstItem.tool_icons)[0]
        return firstItem.tool_icons[firstToolName].content
      }
    }
    console.error('没有找到有效的图标数据', response)
    return '🤖'
  } catch (error) {
    console.error('获取元数据时出错:', error)
    return '🤖'
  }
}

const AppIcon: FC<AppIconProps> = ({
  size = 'medium',
  rounded = false,
  background,
  className,
}) => {
  const [iconContent, setIconContent] = useState<string>('🤖')

  useEffect(() => {
    getIconContent().then(setIconContent)
  }, [])

  return (
    <span
      className={classNames(
        style.appIcon,
        size !== 'medium' && style[size],
        rounded && style.rounded,
        className ?? '',
      )}
      style={{
        background,
      }}
    >
      {iconContent}
    </span>
  )
}

export default AppIcon
