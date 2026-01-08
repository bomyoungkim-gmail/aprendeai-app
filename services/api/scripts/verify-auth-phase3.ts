
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { UsersService } from '../src/users/users.service';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

async function verify(description: string, check: () => Promise<boolean>) {
  try {
    const result = await check();
    if (result) {
        console.log(`[PASS] ${description}`);
    } else {
        console.error(`[FAIL] ${description} - Returned false`);
        process.exit(1);
    }
  } catch (e) {
    console.error(`[FAIL] ${description} - Exception: ${e.message}`);
    process.exit(1);
  }
}

async function bootstrap() {
  console.log('--- STARTING AUTH PHASE 3 VERIFICATION ---');
  
  const app = await NestFactory.createApplicationContext(AppModule);
  const prisma = app.get(PrismaService);
  const usersService = app.get(UsersService);

  const email = `phase3-verify-${Date.now()}@test.com`;
  const password = "securepassword123";

  // 1. Create User via UsersService (simulating Registration)
  console.log('\n--> Creating User via UsersService');
  // UsersService.createUser hash input password? No, line 82: bcrypt.hash(data.password_hash, salt)
  // Wait, if I fixed UsersService to accept password_hash input and hash it again?
  // Let's check UsersService code I modified in Step 1176.
  // const password_hash = await bcrypt.hash(data.password_hash || "temp123", salt);
  // So it expects PLAIN TEXT password in 'password_hash' property? 
  // Naming is confusing but yes (legacy behavior).
  
  const user = await usersService.createUser({
    email,
    name: "Phase 3 User",
    password_hash: password, // Passing plain text, service hashes it
    schooling_level: "ADULT",
    status: "ACTIVE"
  } as any);

  await verify('User created in users table', async () => !!user.id);

  // 2. Verify User Identity Created
  console.log('\n--> Verifying User Identity');
  const identity = await (prisma as any).user_identities.findUnique({
      where: { 
          provider_provider_id: {
              provider: "password",
              provider_id: email
          }
      }
  });

  await verify('Identity record exists', async () => !!identity);
  await verify('Identity linked to user', async () => identity.user_id === user.id);
  await verify('Identity has password hash', async () => !!identity.password_hash);

  // 3. Verify Legacy Fields Removed (via raw query or type check in logic)
  // We can't check column existence easily via Prisma Client if types generate correctly (they won't exist on 'user' object)
  await verify('User object does not have password_hash', async () => (user as any).password_hash === undefined);

  // 4. Verify Password Logic (Simulate Login)
  console.log('\n--> Verifying Password Logic (Simulate Login)');
  const isValid = await bcrypt.compare(password, identity.password_hash);
  await verify('Password hash matches input', async () => isValid);

  // 5. Change Password
  console.log('\n--> Verifying Change Password');
  const newPassword = "newpassword456";
  await usersService.changePassword(user.id, password, newPassword);

  const updatedIdentity = await (prisma as any).user_identities.findUnique({ where: { id: identity.id } });
  const isNewValid = await bcrypt.compare(newPassword, updatedIdentity.password_hash);
  await verify('New password valid', async () => isNewValid);

  // 6. Delete Account
  console.log('\n--> Verifying Delete Account');
  await usersService.deleteAccount(user.id, newPassword);
  
  const deletedUser = await prisma.users.findUnique({ where: { id: user.id } });
  const deletedIdentity = await (prisma as any).user_identities.findUnique({ where: { id: identity.id } });
  
  await verify('User deleted', async () => !deletedUser);
  await verify('Identity deleted (Cascade)', async () => !deletedIdentity);

  console.log('\n--- VERIFICATION PASSED ---');
  await app.close();
}

bootstrap();
