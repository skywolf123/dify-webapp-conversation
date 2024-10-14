import { type NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { client, getInfo, setSession } from '@/app/api/utils/common'

export async function GET(request: NextRequest) {
  const { sessionId, user } = getInfo(request)
  try {
    // 只使用 user 参数调用 getMeta 方法
    const { data }: any = await client.getMeta(user)
    return NextResponse.json(data, {
      headers: setSession(sessionId),
    })
  } catch (error) {
    console.error('Error fetching meta data:', error)
    return NextResponse.json({ error: 'Failed to fetch meta data' }, { status: 500 })
  }
}
