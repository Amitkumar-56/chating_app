import { query } from '../../../lib/db';

export async function POST(request) {
  try {
    const { userId } = await request.json();
    if (!userId) throw new Error('User ID required');

    // Auto-setup: Ensure last_seen column exists
    try {
        await query("ALTER TABLE employee_profile ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP NULL");
    } catch (e) {
        // Column might already exist or DB might not support IF NOT EXISTS in ALTER for some versions
    }

    // Update last_seen for the user
    await query(
      'UPDATE employee_profile SET last_seen = CURRENT_TIMESTAMP WHERE id = ?',
      [userId]
    );

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500 });
  }
}

export async function GET() {
    try {
        // Fetch all employees with their last_seen
        const employees = await query('SELECT id, last_seen FROM employee_profile');
        return new Response(JSON.stringify({ success: true, statuses: employees }), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500 });
    }
}
