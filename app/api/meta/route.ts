import { type NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { client, getInfo, setSession } from '@/app/api/utils/common'

export async function GET(request: NextRequest) {
  const { sessionId, user } = getInfo(request)
  console.log('Meta route - User:', user) // 添加日志
  try {
    const response = await client.getMeta(user)
    console.log('Meta route - Received data:', response.data) // 添加日志
    return NextResponse.json(response.data, {
      headers: setSession(sessionId),
    })
  }
  catch (error) {
    console.error('Meta route - Error:', error) // 添加错误日志
    return NextResponse.json({ error: 'Failed to get meta information' }, { status: 500 })
  }
}
