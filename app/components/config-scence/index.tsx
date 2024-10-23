import type { FC } from 'react'
import React from 'react'
import type { IWelcomeProps } from '../welcome'
import Welcome from '../welcome'
import { handleButtonClick } from '../chat/index' // 导入 handleButtonClick 函数

const ConfigSence: FC<IWelcomeProps> = (props) => {
  // 创建 onButtonClick 函数来处理点击事件
  const onButtonClick = (buttonText: string) => {
    handleButtonClick(buttonText) // 调用 handleButtonClick，并传入按钮文本
  }

  return (
    <div className='mb-5 antialiased font-sans overflow-hidden shrink-0'>
      <Welcome {...props} onButtonClick={onButtonClick} />
    </div>
  )
}
export default React.memo(ConfigSence)
