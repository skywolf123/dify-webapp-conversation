export async function GET() {
  return new Response(JSON.stringify({ status: 'keeping alive' }), {
    headers: {
      'Content-Type': 'application/json',
    },
  })
}
// 测试 client
// testClient()
