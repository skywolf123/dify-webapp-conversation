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

    // 创建一个 TransformStream 来注入 keepalive 消息
    const keepAliveStream = new TransformStream({
      async transform(chunk, controller) {
        controller.enqueue(chunk)
      },
      flush(controller) {
        clearInterval(timer)
      }
    })

    // 设置一个定时器，每5秒发送一次 keepalive 消息
    const timer = setInterval(() => {
      const encoder = new TextEncoder()
      keepAliveStream.writable.getWriter().write(encoder.encode('\n'))
    }, 5000)

    // 创建一个 ReadableStream
    const readableStream = new ReadableStream({
      async start(controller) {
        response.data.on('data', (chunk) => {
          keepAliveStream.writable.getWriter().write(chunk)
        })
        response.data.on('end', () => {
          keepAliveStream.writable.getWriter().close()
        })
      }
    })

    // 将原始响应通过 keepAliveStream 传递
    readableStream.pipeTo(keepAliveStream.writable)

    // 返回流式响应
    return new Response(keepAliveStream.readable, {
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