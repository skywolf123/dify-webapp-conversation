import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { setLocaleOnClient } from '@/i18n/client'
import { fetchAppParams, fetchConversations, generationConversationName } from '@/service'
import type { ConversationItem, PromptConfig, VisionSettings } from '@/types/app'
import { Resolution, TransferMethod } from '@/types/app'
import { replaceVarWithValues, userInputsFormToPromptVariables } from '@/utils/prompt'
import { addFileInfos, sortAgentSorts } from '@/utils/tools'

interface AppInitializationProps {
  APP_ID: string
  API_KEY: string
  APP_INFO: any
  promptTemplate: string
  setAppUnavailable: (value: boolean) => void
  setIsUnknownReason: (value: boolean) => void
  setPromptConfig: (config: PromptConfig | null) => void
  setInited: (value: boolean) => void
  setVisionConfig: (config: VisionSettings | undefined) => void
  setConversationList: (list: ConversationItem[]) => void
  setCurrConversationId: (id: string, appId: string, isNew?: boolean) => void
  getConversationIdFromStorage: (appId: string) => string
  setNewConversationInfo: (info: { name: string; introduction: string }) => void
}

const AppInitialization: React.FC<AppInitializationProps> = ({
  APP_ID,
  API_KEY,
  APP_INFO,
  promptTemplate,
  setAppUnavailable,
  setIsUnknownReason,
  setPromptConfig,
  setInited,
  setVisionConfig,
  setConversationList,
  setCurrConversationId,
  getConversationIdFromStorage,
  setNewConversationInfo,
}) => {
  const { t } = useTranslation()
  const [hasSetAppConfig] = useState<boolean>(APP_ID && API_KEY)

  useEffect(() => {
    if (!hasSetAppConfig) {
      setAppUnavailable(true)
      return
    }
    (async () => {
      try {
        const [conversationData, appParams] = await Promise.all([fetchConversations(), fetchAppParams()])

        // handle current conversation id
        const { data: conversations } = conversationData as { data: ConversationItem[] }
        const _conversationId = getConversationIdFromStorage(APP_ID)
        const isNotNewConversation = conversations.some(item => item.id === _conversationId)

        // fetch new conversation info
        const { user_input_form, opening_statement: introduction, file_upload, system_parameters }: any = appParams
        setLocaleOnClient(APP_INFO.default_language, true)
        setNewConversationInfo({
          name: t('app.chat.newChatDefaultName'),
          introduction,
        })
        const prompt_variables = userInputsFormToPromptVariables(user_input_form)
        setPromptConfig({
          prompt_template: promptTemplate,
          prompt_variables,
        } as PromptConfig)
        setVisionConfig({
          ...file_upload?.image,
          image_file_size_limit: system_parameters?.system_parameters || 0,
        })
        setConversationList(conversations as ConversationItem[])

        if (isNotNewConversation)
          setCurrConversationId(_conversationId, APP_ID, false)

        setInited(true)
      }
      catch (e: any) {
        if (e.status === 404) {
          setAppUnavailable(true)
        }
        else {
          setIsUnknownReason(true)
          setAppUnavailable(true)
        }
      }
    })()
  }, [hasSetAppConfig])

  return null
}

export default AppInitialization
