import { useEffect } from 'react';

const useInitApp = (hasSetAppConfig, setAppUnavailable, setInited, setPromptConfig, setVisionConfig, setConversationList, setNewConversationInfo, setCurrConversationId, setIsUnknownReason) => {
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
  }, [hasSetAppConfig, setAppUnavailable, setInited, setPromptConfig, setVisionConfig, setConversationList, setNewConversationInfo, setCurrConversationId, setIsUnknownReason])
}

export default useInitApp
