import { FC } from 'react'
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

const AppIcon: FC<AppIconProps> = ({
  size = 'medium',
  rounded = false,
  background,
  className,
}) => {
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
      {getIconContent()}
    </span>
  )
}

export default AppIcon

const getIconContent = async () => {
  try {
    const response = await fetchMeta()
    const toolIcons = response.data.tool_icons
    const firstToolName = Object.keys(toolIcons)[0]
    if (firstToolName) {
      return toolIcons[firstToolName].content
    } else {
      console.error('No icon data found')
      return '🤖'
    }
  } catch (error) {
    console.error('Error fetching meta data:', error)
    return '🤖'
  }
}
