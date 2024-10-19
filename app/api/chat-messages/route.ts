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
        let buffer = '';
        response.data.on('data', (chunk) => {
          try {
            // 将新的chunk添加到buffer中
            buffer += chunk.toString('utf-8');
            
            // 尝试处理buffer中的所有完整JSON对象
            while (true) {
              const match = buffer.match(/^data: ({.*})\n\n/);
              if (!match) break;
              
              const jsonString = match[1];
              buffer = buffer.slice(match[0].length);
              
              try {
                const data = JSON.parse(jsonString);
                
                // 检查是否是以node开头的事件，以及node_type是否为code
                if (data.event.startsWith('node') && data.data && data.data.node_type === 'code') {
                  // 如果是code类型的node事件，我们不将其添加到流中
                  console.log('已过滤掉 code 节点:', data.data.title);
                } else if (data.event === 'node_finished') {
                  // 过滤掉 node_finished 事件
                  console.log('已过滤掉 node_finished 节点:', data.data.title);
                } else {
                  // 对于其他类型的事件，我们将其添加到流中
                  controller.enqueue('data: ' + jsonString + '\n\n');
                }
              } catch (jsonError) {
                console.error('JSON解析错误:', jsonError);
                // 如果JSON解析失败，我们将原始数据添加到流中
                controller.enqueue('data: ' + jsonString + '\n\n');
              }
            }
          } catch (error) {
            console.error('处理数据块时出错:', error);
            // 如果处理失败，我们将原始chunk添加到流中
            controller.enqueue(chunk);
          }
        });
        response.data.on('end', () => {
          // 处理剩余的buffer
          if (buffer.length > 0) {
            console.warn('流结束时存在未处理的数据:', buffer);
            controller.enqueue(buffer);
          }
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
