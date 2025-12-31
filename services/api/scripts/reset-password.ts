import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function resetPassword() {
  const email = 'bom.kim@placestecnologia.com.br';
  const newPassword = 'teste123'; // Temporary password requested for testing

  try {
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Upsert user (Create or Update)
    const result = await prisma.users.upsert({
      where: { email },
      update: { password_hash: hashedPassword },
      create: {
        id: 'user-' + Date.now(),
        email,
        name: 'Bom Kim',
        password_hash: hashedPassword,
        system_role: 'ADMIN',
        last_context_role: 'OWNER',
        status: 'ACTIVE',
        updated_at: new Date()
      },
    });

    console.log('✅ User record processed:', result.email);
    console.log('✅ Password set successfully!');
    console.log('📧 Email:', email);
    console.log('🔑 New password:', newPassword);
    console.log('⚠️  Please change this password after login!');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetPassword();
