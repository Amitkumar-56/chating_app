import { query } from '../../../../lib/db';
import crypto from 'crypto';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    console.log('Login attempt for:', email);

    // 1. Check if user exists
    const users = await query(
      'SELECT id, name, email, password, role, emp_code FROM employee_profile WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return new Response(JSON.stringify({ success: false, message: 'User not found' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const user = users[0];

    // 2. Hash incoming password with SHA256 to match DB
    const hashedInput = crypto.createHash('sha256').update(password).digest('hex');

    // 3. Compare hashes
    if (user.password !== hashedInput) {
      console.log('Password mismatch for:', email, '(Hashed Comparison)');
      return new Response(JSON.stringify({ success: false, message: 'Incorrect password' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Success
    // Using simple crypto-based token for now since jsonwebtoken is not installed
    const secret = process.env.JWT_SECRET || 'default_secret';
    const token = crypto.createHmac('sha256', secret)
      .update(`${user.id}_${Date.now()}`)
      .digest('hex');

    await query('UPDATE employee_profile SET auth_token = ?, status = 1 WHERE id = ?', [token, user.id]);
    
    const { password: _, ...userWithoutPassword } = user;

    return new Response(JSON.stringify({ success: true, user: userWithoutPassword, token }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Login error:', error.message);
    return new Response(JSON.stringify({ success: false, error: 'Database connection failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
