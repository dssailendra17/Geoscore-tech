import 'dotenv/config';
import { db } from './server/db.js';
import { users } from './shared/schema.js';
import { eq } from 'drizzle-orm';

const email = 'admin@myindianbrand.com';

const user = await db.select({
  email: users.email,
  verificationCode: users.verificationCode,
  verificationExpiry: users.verificationExpiry,
}).from(users).where(eq(users.email, email)).limit(1);

if (user.length > 0) {
  console.log('\n✅ User found:');
  console.log('Email:', user[0].email);
  console.log('OTP:', user[0].verificationCode);
  console.log('Expiry:', user[0].verificationExpiry);
} else {
  console.log('\n❌ User not found with email:', email);
}

process.exit(0);

