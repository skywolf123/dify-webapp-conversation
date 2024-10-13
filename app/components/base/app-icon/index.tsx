import { FC, useEffect, useState } from 'react'
import classNames from 'classnames'
import style from './style.module.css'
import { fetchMeta } from '@/service/index'

export type AppIconProps = {
  size?: 'xs' | 'tiny' | 'small' | 'medium' | 'large'
  rounded?: boolean
  className?: string
}

const AppIcon: FC<AppIconProps> = ({
  size = 'medium',
  rounded = false,
  className,
}) => {
  const [iconData, setIconData] = useState<{ background: string; content: string }>({
    background: '',
    content: '',
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetchMeta()
        const toolIcons = response.data.tool_icons

        // 获取第一个图标
        const firstToolName = Object.keys(toolIcons)[0]
        if (firstToolName) {
          setIconData(toolIcons[firstToolName])
        } else {
          console.error('No icon data found')
        }
      } catch (error) {
        console.error('Error fetching meta data:', error)
      }
    }

    loadData()
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
        background: iconData.background,
      }}
    >
      {iconData.content}
    </span>
  )
}

export default AppIcon
