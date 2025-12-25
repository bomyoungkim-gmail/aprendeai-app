import { PrismaClient } from '@prisma/client';
import { subDays, startOfDay } from 'date-fns';

const prisma = new PrismaClient();

async function seedActivityData() {
  console.log('🌱 Seeding activity data...');

  // Get the first user (or you can specify a user ID)
  const user = await prisma.user.findFirst();
  
  if (!user) {
    console.error('❌ No user found. Please create a user first.');
    return;
  }

  console.log(`✅ Found user: ${user.email} (${user.id})`);

  // Create activity data for the last 7 days
  const activities = [];
  
  for (let i = 0; i < 7; i++) {
    const date = startOfDay(subDays(new Date(), i));
    
    activities.push({
      userId: user.id,
      date,
      minutesStudied: Math.floor(Math.random() * 60) + 15, // 15-75 minutes
      sessionsCount: Math.floor(Math.random() * 3) + 1,    // 1-3 sessions
      contentsRead: Math.floor(Math.random() * 5) + 1,     // 1-5 contents
      annotationsCreated: Math.floor(Math.random() * 10) + 5, // 5-15 annotations
    });
  }

  // Insert activities
  for (const activity of activities) {
    await prisma.dailyActivity.upsert({
      where: {
        userId_date: {
          userId: activity.userId,
          date: activity.date,
        },
      },
      create: activity,
      update: activity,
    });
    
    console.log(`✅ Created activity for ${activity.date.toISOString().split('T')[0]}: ${activity.minutesStudied} min`);
  }

  // Summary
  const totalMinutes = activities.reduce((sum, a) => sum + a.minutesStudied, 0);
  const totalContents = activities.reduce((sum, a) => sum + a.contentsRead, 0);
  const totalAnnotations = activities.reduce((sum, a) => sum + a.annotationsCreated, 0);

  console.log('\n📊 Activity Summary:');
  console.log(`   Days with activity: ${activities.length}`);
  console.log(`   Total minutes: ${totalMinutes}`);
  console.log(`   Contents read: ${totalContents}`);
  console.log(`   Annotations: ${totalAnnotations}`);
  console.log('\n✅ Seed completed! Refresh your dashboard to see the metrics.');

  await prisma.$disconnect();
}

seedActivityData()
  .catch((e) => {
    console.error('❌ Error seeding data:', e);
    process.exit(1);
  });
