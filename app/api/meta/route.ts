import { type NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { client, getInfo, setSession, testClient } from '@/app/api/utils/common'

export async function GET(request: NextRequest) {
  const { sessionId, user } = getInfo(request)
  console.log('Meta route - User:', user)

  // 测试 client
  testClient()

  try {
    console.log('Attempting to call client.getMeta')
    const response = await client.getMeta(user)
    console.log('Meta route - Received data:', response.data)
    return NextResponse.json(response.data, {
      headers: setSession(sessionId),
    })
  }
  catch (error) {
    console.error('Meta route - Error:', error)
    console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)))
    return NextResponse.json({ error: 'Failed to get meta information', details: error.message }, { status: 500 })
  }
}
