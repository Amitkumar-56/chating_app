import { query } from '../../../lib/db';

export async function GET() {
  try {
    // Fetching all active employees from employee_profile
    const employees = await query(
      'SELECT id, name, role, status, emp_code, picture, last_seen FROM employee_profile',
      []
    );

    console.log('Fetched employees count:', employees.length);

    return new Response(JSON.stringify({ 
      success: true, 
      employees: employees || [] 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('API Error in employees:', error.message);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
