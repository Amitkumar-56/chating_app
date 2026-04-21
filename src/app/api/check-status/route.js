import { query } from '../../../lib/db';

export async function GET() {
  try {
    // Basic connectivity and status check for the chat system
    const result = await query('SELECT 1 as connected', []);
    
    return new Response(JSON.stringify({ 
      success: true, 
      status: 'Chat server is healthy',
      db: result[0].connected === 1 ? 'connected' : 'error'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: 'Database connection failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
