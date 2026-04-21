import { query } from '../../../lib/db';

export async function POST(request) {
  try {
    const { userId } = await request.json();
    if (!userId) throw new Error('User ID required');

    // Heartbeat disabled to prevent database errors until last_seen column is manually added
    // await query('UPDATE employee_profile SET last_seen = CURRENT_TIMESTAMP WHERE id = ?', [userId]);

    return new Response(JSON.stringify({ success: true, message: 'Heartbeat received (DB storage skipped)' }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500 });
  }
}

export async function GET() {
    try {
        const employees = await query('SELECT id FROM employee_profile');
        return new Response(JSON.stringify({ success: true, statuses: employees }), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500 });
    }
}
