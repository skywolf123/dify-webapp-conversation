import React, { useEffect, useState } from 'react'
import { useBoolean } from 'ahooks'
import { useTranslation } from 'react-i18next'
import useConversation from '@/hooks/use-conversation'
import { fetchChatList, fetchConversations, generationConversationName } from '@/service'
import type { ChatItem, ConversationItem } from '@/types/app'
import { replaceVarWithValues } from '@/utils/prompt'
import { addFileInfos, sortAgentSorts } from '@/utils/tools'
import produce from 'immer'

interface ConversationManagementProps {
  APP_ID: string
  promptConfig: any
  inited: boolean
  currConversationId: string
  setCurrConversationId: (id: string, appId: string, isNew?: boolean) => void
  setChatList: (list: ChatItem[]) => void
  getChatList: () => ChatItem[]
  setNewConversationInfo: (info: { name: string; introduction: string }) => void
  setExistConversationInfo: (info: { name: string; introduction: string }) => void
  resetNewConversationInputs: () => void
  setChatStarted: () => void
  setChatNotStarted: () => void
  isNewConversation: boolean
  currConversationInfo: any
  currInputs: any
  newConversationInputs: any
  setCurrInputs: (inputs: any) => void
  isShowPrompt: boolean
  setConversationList: (list: ConversationItem[]) => void
  isResponding: boolean
}

const ConversationManagement: React.FC<ConversationManagementProps> = ({
  APP_ID,
  promptConfig,
  inited,
  currConversationId,
  setCurrConversationId,
  setChatList,
  getChatList,
  setNewConversationInfo,
  setExistConversationInfo,
  resetNewConversationInputs,
  setChatStarted,
  setChatNotStarted,
  isNewConversation,
  currConversationInfo,
  currInputs,
  newConversationInputs,
  setCurrInputs,
  isShowPrompt,
  setConversationList,
  isResponding,
}) => {
  const { t } = useTranslation()
  const {
    conversationList,
  } = useConversation()

  const [conversationIdChangeBecauseOfNew, setConversationIdChangeBecauseOfNew, getConversationIdChangeBecauseOfNew] = useGetState(false)
  const [isChatStarted, { setTrue: setChatStartedState, setFalse: setChatNotStartedState }] = useBoolean(false)

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
  }

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

  const handleNewConversation = async () => {
    if (getConversationIdChangeBecauseOfNew()) {
      const { data: allConversations }: any = await fetchConversations()
      const newItem: any = await generationConversationName(allConversations[0].id)

      const newAllConversations = produce(allConversations, (draft: any) => {
        draft[0].name = newItem.name
      })
      setConversationList(newAllConversations as any)
    }
    setConversationIdChangeBecauseOfNew(false)
    resetNewConversationInputs()
    setChatNotStarted()
  }

  return {
    handleStartChat,
    handleConversationIdChange,
    handleNewConversation,
    hasSetInputs,
    conversationName,
  }
}

export default ConversationManagement
