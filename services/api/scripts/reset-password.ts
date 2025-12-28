import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function resetPassword() {
  const email = 'bom.kim@placestecnologia.com.br';
  const newPassword = 'AprendeAI2024!'; // Temporary password

  try {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true },
    });

    if (!user) {
      console.log('❌ User not found:', email);
      return;
    }

    console.log('✅ User found:', user);

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { email },
      data: { passwordHash: hashedPassword },
    });

    console.log('✅ Password reset successfully!');
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
