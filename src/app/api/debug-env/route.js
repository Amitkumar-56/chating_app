export async function GET() {
  return new Response(JSON.stringify({
    DB_HOST: process.env.DB_HOST || 'not set',
    DB_USER: process.env.DB_USER || 'not set',
    DB_NAME: process.env.DB_NAME || 'not set',
    PWD: process.cwd(),
    NODE_ENV: process.env.NODE_ENV
  }), { status: 200 });
}
