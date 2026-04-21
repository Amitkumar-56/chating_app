import { query } from '../../../lib/db';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const senderId = searchParams.get('senderId');
  const receiverId = searchParams.get('receiverId');

  try {
    const sessionResult = await query(
      `SELECT id FROM employee_sessions 
       WHERE (requester_id = ? AND responder_id = ?) 
       OR (requester_id = ? AND responder_id = ?)`,
      [senderId, receiverId, receiverId, senderId]
    );

    if (sessionResult.length === 0) {
      return new Response(JSON.stringify({ success: true, messages: [] }), { status: 200 });
    }

    const sessionId = sessionResult[0].id;
    const messages = await query(
      'SELECT * FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC',
      [sessionId]
    );

    return new Response(JSON.stringify({ success: true, messages, sessionId }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { sender_id, receiver_id, message, message_type, file_path } = await request.json();

    let sessionResult = await query(
      `SELECT id FROM employee_sessions 
       WHERE (requester_id = ? AND responder_id = ?) 
       OR (requester_id = ? AND responder_id = ?)`,
      [sender_id, receiver_id, receiver_id, sender_id]
    );

    let sessionId;
    if (sessionResult.length === 0) {
      const newSession = await query(
        'INSERT INTO employee_sessions (requester_id, responder_id, status) VALUES (?, ?, "active")',
        [sender_id, receiver_id]
      );
      sessionId = newSession.insertId;
    } else {
      sessionId = sessionResult[0].id;
    }

    await query(
      'INSERT INTO chat_messages (session_id, sender_id, receiver_id, message, message_type, file_path, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [sessionId, sender_id, receiver_id, message, message_type || 'text', file_path || null, 'sent'] 
    );

    return new Response(JSON.stringify({ success: true, sessionId }), { status: 201 });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500 });
  }
}

// Mark messages as read
export async function PUT(request) {
  try {
    const { sessionId, receiverId } = await request.json();
    await query(
      'UPDATE chat_messages SET read_at = NOW(), status = "read" WHERE session_id = ? AND receiver_id = ? AND read_at IS NULL',
      [sessionId, receiverId]
    );
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500 });
  }
}
