import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { connectDB } from '../config/db.js';
import { User } from '../models/User.js';

// One-off CLI provisioning for admin accounts — there's no self-service admin signup (see
// auth.routes.js), so this is the only way to create the first admin, or any admin after it.
// Usage: node src/scripts/create-admin.js --email you@company.com --password 'Str0ngPass!' [--company "Falsafah HQ"] [--phone "+92 300 0000000"]

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i].startsWith('--')) {
      out[argv[i].slice(2)] = argv[i + 1];
      i += 1;
    }
  }
  return out;
}

async function main() {
  const { email, password, company, phone } = parseArgs(process.argv.slice(2));
  if (!email || !password) {
    console.error('Usage: node src/scripts/create-admin.js --email you@company.com --password \'Str0ngPass!\' [--company "Falsafah HQ"] [--phone "+92 300 0000000"]');
    process.exit(1);
  }
  if (password.length < 8) {
    console.error('Password must be at least 8 characters.');
    process.exit(1);
  }

  await connectDB();

  const normalizedEmail = email.trim().toLowerCase();
  const passwordHash = await bcrypt.hash(password, 10);
  const existing = await User.findOne({ email: normalizedEmail });

  if (existing) {
    existing.role = 'admin';
    existing.passwordHash = passwordHash;
    await existing.save();
    console.log(`Promoted existing account to admin: ${normalizedEmail}`);
  } else {
    await User.create({
      role: 'admin',
      email: normalizedEmail,
      phone: phone || `admin_${Date.now()}`,
      passwordHash,
      companyName: company || 'Admin',
      country: 'Pakistan',
    });
    console.log(`Created admin account: ${normalizedEmail}`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error('create-admin failed:', err);
  process.exit(1);
});
