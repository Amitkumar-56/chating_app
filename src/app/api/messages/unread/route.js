import { query } from '../../../../lib/db';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const receiverId = searchParams.get('receiverId');

  try {
    if (!receiverId) throw new Error('Receiver ID required');

    // Get counts grouped by sender_id where read_at is NULL
    const counts = await query(
      'SELECT sender_id, COUNT(*) as unread_count FROM chat_messages WHERE receiver_id = ? AND read_at IS NULL GROUP BY sender_id',
      [receiverId]
    );

    return new Response(JSON.stringify({ success: true, counts }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500 });
  }
}
