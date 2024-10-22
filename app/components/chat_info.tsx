import React, { useEffect, useState } from 'react'

/*
* chat info. chat is under conversation.
*/
const [chatList, setChatList, getChatList] = useGetState<ChatItem[]>([])
const chatListDomRef = useRef<HTMLDivElement>(null)
useEffect(() => {
  // scroll to bottom
  if (chatListDomRef.current)
    chatListDomRef.current.scrollTop = chatListDomRef.current.scrollHeight
}, [chatList, currConversationId])
// user can not edit inputs if user had send message
const canEditInputs = !chatList.some(item => item.isAnswer === false) && isNewConversation
const createNewChat = () => {
  // if new chat is already exist, do not create new chat
  if (conversationList.some(item => item.id === '-1'))
    return

  setConversationList(produce(conversationList, (draft) => {
    draft.unshift({
      id: '-1',
      name: t('app.chat.newChatDefaultName'),
      inputs: newConversationInputs,
      introduction: conversationIntroduction,
    })
  }))
}

// sometime introduction is not applied to state
const generateNewChatListWithOpenStatement = (introduction?: string, inputs?: Record<string, any> | null) => {
  let calculatedIntroduction = introduction || conversationIntroduction || ''
  const calculatedPromptVariables = inputs || currInputs || null
  if (calculatedIntroduction && calculatedPromptVariables)
    calculatedIntroduction = replaceVarWithValues(calculatedIntroduction, promptConfig?.prompt_variables || [], calculatedPromptVariables)

  const openStatement = {
    id: `${Date.now()}`,
    content: calculatedIntroduction,
    isAnswer: true,
    feedbackDisabled: true,
    isOpeningStatement: isShowPrompt,
  }
  if (calculatedIntroduction)
    return [openStatement]

  return []
}
