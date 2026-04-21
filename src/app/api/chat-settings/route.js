import { query } from '../../../lib/db';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const employeeId = searchParams.get('employeeId');

  try {
    const settings = await query(
      'SELECT * FROM employee_chat_settings WHERE employee_id = ?',
      [employeeId]
    );

    return new Response(JSON.stringify({ success: true, settings: settings[0] || {} }), {
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
    });
  }
}

export async function POST(request) {
  try {
    const { employee_id, is_available, notification_sound } = await request.json();
    
    await query(
      `INSERT INTO employee_chat_settings (employee_id, is_available, notification_sound) 
       VALUES (?, ?, ?) 
       ON DUPLICATE KEY UPDATE is_available = ?, notification_sound = ?`,
      [employee_id, is_available, notification_sound, is_available, notification_sound]
    );

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
    });
  }
}
