import { type NextRequest } from 'next/server'
import { ChatClient } from 'dify-client'
import { v4 } from 'uuid'
import { API_KEY, API_URL, APP_ID } from '@/config'

const userPrefix = `user_${APP_ID}:`

export const getInfo = (request: NextRequest) => {
  const sessionId = request.cookies.get('session_id')?.value || v4()
  const user = userPrefix + sessionId
  return {
    sessionId,
    user,
  }
}

export const setSession = (sessionId: string) => {
  return { 'Set-Cookie': `session_id=${sessionId}` }
}

export const client: ChatClient = new ChatClient(API_KEY, API_URL || undefined)

// 添加一个测试函数来检查 client 的方法
export const testClient = () => {
  console.log('Client methods:', Object.keys(client))
  console.log('getMeta exists:', typeof client.getMeta === 'function')
  console.log('getParamates exists:', typeof client.getParamates === 'function')
}
