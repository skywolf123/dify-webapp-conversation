import { type NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { client, getInfo, setSession, testClient } from '@/app/api/utils/common'

export async function GET(request: NextRequest) {
  const { sessionId, user } = getInfo(request)
  console.log('Meta route - User:', user)
  return NextResponse.json([]);
}
// 测试 client
// testClient()
