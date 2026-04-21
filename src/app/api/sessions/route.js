import { query } from '../../../lib/db';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const employeeId = searchParams.get('employeeId');

  try {
    // Fetch all active sessions for this employee
    const sessions = await query(
      `SELECT s.*, e.name as other_employee_name, e.role as other_employee_role 
       FROM employee_sessions s
       JOIN employee_profile e ON (s.requester_id = e.id OR s.responder_id = e.id)
       WHERE (s.requester_id = ? OR s.responder_id = ?) 
       AND e.id != ?`,
      [employeeId, employeeId, employeeId]
    );

    return new Response(JSON.stringify({ success: true, sessions }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
    });
  }
}

export async function POST(request) {
  try {
    const { requester_id, responder_id, request_message } = await request.json();
    
    const result = await query(
      'INSERT INTO employee_sessions (requester_id, responder_id, request_message, status) VALUES (?, ?, ?, "active")',
      [requester_id, responder_id, request_message]
    );

    return new Response(JSON.stringify({ success: true, sessionId: result.insertId }), {
      status: 201,
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
    });
  }
}
