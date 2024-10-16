import { type NextRequest } from 'next/server'
import { client, getInfo } from '@/app/api/utils/common'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const {
    inputs,
    query,
    files,
    conversation_id: conversationId,
    response_mode: responseMode,
  } = body
  const { user } = getInfo(request)

  // 设置流式响应
  const stream = true

  try {
    const response = await client.createChatMessage(inputs, query, user, stream, conversationId, files)

    // 创建一个 ReadableStream
    const readableStream = new ReadableStream({
      async start(controller) {
        // 原有的流
        response.data.on('data', (chunk) => {
          controller.enqueue(chunk)
        })
        response.data.on('end', () => {
          controller.close()
        })

        // 新增的每隔3秒一次的流
        const intervalId = setInterval(() => {
          controller.enqueue(`每隔5秒的心跳包: ${new Date().toISOString()}\n`)
        }, 1000)

        // 在流式响应结束时清除定时器
        response.data.on('end', () => {
          clearInterval(intervalId)
          controller.close()
        })

        // 在流式响应发生错误时清除定时器
        response.data.on('error', () => {
          clearInterval(intervalId)
          controller.error('流式响应发生错误')
        })
      }
    })

    // 返回流式响应
    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Error in chat message creation:', error)
    return new Response(JSON.stringify({ error: 'An error occurred while processing your request' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }
}
