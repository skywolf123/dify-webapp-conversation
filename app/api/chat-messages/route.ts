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

        const processBuffer = (forceProcess = false) => {
          while (true) {
            const match = buffer.match(/^data: ({.*})\n\n/);
            if (!match && !forceProcess) break;
            
            let jsonString = match ? match[1] : buffer;
            buffer = match ? buffer.slice(match[0].length) : '';
            
            try {
              const data = JSON.parse(jsonString);
              
              if (data.event.startsWith('node') && data.data && data.data.node_type === 'code') {
                console.log('已过滤掉 code 节点:', data.data.title);
              } else if (data.event === 'node_finished') {
                console.log('已过滤掉 node_finished 节点:', data.data.title);
              } else {
                controller.enqueue('data: ' + JSON.stringify(data) + '\n\n');
              }
            } catch (jsonError) {
              console.error('JSON解析错误:', jsonError);
              if (forceProcess) {
                // 如果是强制处理模式，我们将未能解析的数据分割并尝试逐个解析
                const parts = jsonString.split('\n\n');
                parts.forEach(part => {
                  if (part.trim()) {
                    try {
                      const partData = JSON.parse(part);
                      controller.enqueue('data: ' + JSON.stringify(partData) + '\n\n');
                    } catch {
                      controller.enqueue('data: ' + part + '\n\n');
                    }
                  }
                });
              } else {
                // 如果不是强制处理模式，我们将原始数据添加回 buffer
                buffer = 'data: ' + jsonString + '\n\n' + buffer;
                break;
              }
            }

            if (forceProcess && buffer.length === 0) break;
          }
        };

        response.data.on('data', (chunk) => {
          try {
            buffer += chunk.toString('utf-8');
            processBuffer();
          } catch (error) {
            console.error('处理数据块时出错:', error);
            controller.enqueue(chunk);
          }
        });

        response.data.on('end', () => {
          // 处理剩余的 buffer
          if (buffer.length > 0) {
            console.warn('流结束时存在未处理的数据，尝试处理:', buffer);
            processBuffer(true);
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
