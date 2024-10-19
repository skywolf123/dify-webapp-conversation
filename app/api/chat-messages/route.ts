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

  // 添加自动请求 meta 的定时器
  let intervalId: NodeJS.Timeout | null = null;

  const startAutoRequest = () => {
    if (intervalId) {
      clearInterval(intervalId);
    }

    intervalId = setInterval(() => {
      fetch('/api/meta')
        .then(response => response.json())
        .then(data => {
          console.log('自动请求 /api/meta 成功:', data);
        })
        .catch(error => {
          console.error('自动请求 /api/meta 失败:', error);
        });
    }, 20000); // 每 20 秒执行一次
  };

  const stopAutoRequest = () => {
    if (intervalId) {
      clearInterval(intervalId);
    }
  };

  startAutoRequest();

  try {
    const response = await client.createChatMessage(inputs, query, user, stream, conversationId, files)

    // 创建一个 ReadableStream
    const readableStream = new ReadableStream({
      async start(controller) {
        response.data.on('data', (chunk) => {
          try {
            // 假设chunk是一个字符串，我们需要解析它
            const dataString = chunk.toString('utf-8');
            // 移除 "data: " 前缀
            const jsonString = dataString.replace(/^data: /, '');
            // 解析JSON
            const data = JSON.parse(jsonString);

            // 检查是否是以node开头的事件，以及node_type是否为code
            if (data.event.startsWith('node') && data.data && data.data.node_type === 'code') {
              // 如果是code类型的node事件，我们不将其添加到流中
              console.log('已过滤掉code节点:', data.data.id);
            } else {
              // 对于其他类型的事件，我们将其添加到流中
              controller.enqueue(chunk);
            }
          } catch (error) {
            console.error('处理数据块时出错:', error);
            // 如果解析失败，我们仍然将原始chunk添加到流中
            controller.enqueue(chunk);
          }
        });
        response.data.on('end', () => {
          controller.close()
          stopAutoRequest() // 停止自动请求
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
    console.error('创建聊天消息时出错:', error)
    stopAutoRequest() // 停止自动请求
    return new Response(JSON.stringify({ error: '处理您的请求时发生错误' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }
}
