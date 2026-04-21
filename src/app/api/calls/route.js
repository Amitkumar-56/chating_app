import { query } from '../../../lib/db';

let isTableInitialized = false;

async function ensureTableExists() {
  if (isTableInitialized) return;
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS chat_calls (
        id INT AUTO_INCREMENT PRIMARY KEY,
        caller_id INT NOT NULL,
        receiver_id INT NOT NULL,
        call_type ENUM('voice', 'video') DEFAULT 'voice',
        status ENUM('calling', 'ongoing', 'ended') DEFAULT 'calling',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    isTableInitialized = true;
    console.log('chat_calls table verified/initialized');
  } catch (e) {
    console.error('Auto-setup error during table creation:', e.message);
    // Don't set isTableInitialized to true so it can retry on next request if it was a transient error
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  try {
    if (!userId) return new Response(JSON.stringify({ success: false }), { status: 400 });

    // Ensure table exists before querying
    await ensureTableExists();

    const calls = await query(
      `SELECT c.*, e.name as caller_name 
       FROM chat_calls c 
       JOIN employee_profile e ON c.caller_id = e.id 
       WHERE c.receiver_id = ? AND c.status = 'calling' 
       ORDER BY c.created_at DESC LIMIT 1`,
      [userId]
    );

    return new Response(JSON.stringify({ success: true, call: calls[0] || null }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { caller_id, receiver_id, call_type } = await request.json();
    
    await ensureTableExists();

    // Clean up active calls
    await query("UPDATE chat_calls SET status = 'ended' WHERE caller_id = ? OR receiver_id = ?", [caller_id, caller_id]);

    const result = await query(
      "INSERT INTO chat_calls (caller_id, receiver_id, call_type, status) VALUES (?, ?, ?, 'calling')",
      [caller_id, receiver_id, call_type]
    );

    return new Response(JSON.stringify({ success: true, callId: result.insertId }), { status: 201 });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { callId, status } = await request.json();
    await query("UPDATE chat_calls SET status = ? WHERE id = ?", [status, callId]);
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500 });
  }
}
