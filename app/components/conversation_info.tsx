import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useBoolean, useGetState } from 'ahooks'
import useConversation from '@/hooks/use-conversation'
import { fetchChatList, fetchConversations, generationConversationName } from '@/service'
import type { ChatItem, ConversationItem } from '@/types/app'
import { replaceVarWithValues } from '@/utils/prompt'
import { addFileInfos, sortAgentSorts } from '@/utils/tools'
import produce from 'immer'

import { createNewChat, setChatList} from '@/app/components/chat_info'
import generateNewChatListWithOpenStatement from '@/app/components/chat_info'

/*
* conversation info
*/
const {
  conversationList,
  setConversationList,
  currConversationId,
  getCurrConversationId,
  setCurrConversationId,
  getConversationIdFromStorage,
  isNewConversation,
  currConversationInfo,
  currInputs,
  newConversationInputs,
  resetNewConversationInputs,
  setCurrInputs,
  setNewConversationInfo,
  setExistConversationInfo,
} = useConversation()

const [conversationIdChangeBecauseOfNew, setConversationIdChangeBecauseOfNew, getConversationIdChangeBecauseOfNew] = useGetState(false)
const [isChatStarted, { setTrue: setChatStarted, setFalse: setChatNotStarted }] = useBoolean(false)
const handleStartChat = (inputs: Record<string, any>) => {
  createNewChat()
  setConversationIdChangeBecauseOfNew(true)
  setCurrInputs(inputs)
  setChatStarted()
  // parse variables in introduction
  setChatList(generateNewChatListWithOpenStatement('', inputs))
}
const hasSetInputs = (() => {
  if (!isNewConversation)
    return true

  return isChatStarted
})()

const conversationName = currConversationInfo?.name || t('app.chat.newChatDefaultName') as string
const conversationIntroduction = currConversationInfo?.introduction || ''

const handleConversationSwitch = () => {
  if (!inited)
    return

  // update inputs of current conversation
  let notSyncToStateIntroduction = ''
  let notSyncToStateInputs: Record<string, any> | undefined | null = {}
  if (!isNewConversation) {
    const item = conversationList.find(item => item.id === currConversationId)
    notSyncToStateInputs = item?.inputs || {}
    setCurrInputs(notSyncToStateInputs as any)
    notSyncToStateIntroduction = item?.introduction || ''
    setExistConversationInfo({
      name: item?.name || '',
      introduction: notSyncToStateIntroduction,
    })
  }
  else {
    notSyncToStateInputs = newConversationInputs
    setCurrInputs(notSyncToStateInputs)
  }

  // update chat list of current conversation
  if (!isNewConversation && !conversationIdChangeBecauseOfNew && !isResponding) {
    fetchChatList(currConversationId).then((res: any) => {
      const { data } = res
      const newChatList: ChatItem[] = generateNewChatListWithOpenStatement(notSyncToStateIntroduction, notSyncToStateInputs)

      data.forEach((item: any) => {
        newChatList.push({
          id: `question-${item.id}`,
          content: item.query,
          isAnswer: false,
          message_files: item.message_files?.filter((file: any) => file.belongs_to === 'user') || [],

        })
        newChatList.push({
          id: item.id,
          content: item.answer,
          agent_thoughts: addFileInfos(item.agent_thoughts ? sortAgentSorts(item.agent_thoughts) : item.agent_thoughts, item.message_files),
          feedback: item.feedback,
          isAnswer: true,
          message_files: item.message_files?.filter((file: any) => file.belongs_to === 'assistant') || [],
        })
      })
      setChatList(newChatList)
    })
  }

  if (isNewConversation && isChatStarted)
    setChatList(generateNewChatListWithOpenStatement())
}
useEffect(handleConversationSwitch, [currConversationId, inited])

const handleConversationIdChange = (id: string) => {
  if (id === '-1') {
    createNewChat()
    setConversationIdChangeBecauseOfNew(true)
  }
  else {
    setConversationIdChangeBecauseOfNew(false)
  }
  // trigger handleConversationSwitch
  setCurrConversationId(id, APP_ID)
  hideSidebar()
}
