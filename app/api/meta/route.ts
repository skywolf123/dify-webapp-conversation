import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ message: 'keeping alive' })
}
// 测试 client
// testClient()
