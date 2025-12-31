import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Keys on prisma instance:');
  // property names are usually not enumerable on the instance itself but on the prototype or strictly defined. 
  // However, logging the instance often helps, or checking strict keys.
  // Actually, for prisma client, the model properties are usually getters on the instance.
  
  // Let's try to inspect commonly expected names
  const expected = [
    'user', 'users', 
    'institution', 'institutions', 
    'institutionMember', 'institutionMembers', 'institution_members',
    'familyMember', 'familyMembers', 'family_members',
    'entitlementSnapshot', 'entitlementSnapshots', 'entitlement_snapshots'
  ];
  
  for (const key of expected) {
      if ((prisma as any)[key]) {
          console.log(`✅ prisma.${key} exists`);
      } else {
          console.log(`❌ prisma.${key} matches nothing`);
      }
  }
  
  // Also try to print all keys starting with a lowercase letter
  console.log('All keys starting with lowercase:');
  for (const key in prisma) {
      if (/^[a-z]/.test(key)) {
          console.log(key);
      }
  }
  
  // Check methods on institutions
  if (prisma.institutions) {
      console.log('keys on prisma.institutions:', Object.keys(prisma.institutions));
  }
  
  // Inspect User keys by creating a dummy user
  if (prisma.users) {
      try {
          const user = await prisma.users.create({
              data: {
                  id: 'debug-user-' + Date.now(),
                  name: 'Debug User',
                  email: 'debug-' + Date.now() + '@example.com',
                  schooling_level: 'High School',
                  // Try using camelCase fields if typescript allows, otherwise cast to any
                  // We want to see what WRITES work and what READS return
                  legacyRole: 'COMMON_USER', 
                  activeInstitutionId: null,
                  contextRole: 'OWNER',
                  systemRole: null
              } as any
          });
          console.log('✅ Created dummy user. Keys:', Object.keys(user));
          console.log('User object:', user);
      } catch (e: any) {
          console.log('❌ Failed to create user:', e.message);
          // Try creating with snake_case to see if that works?
          try {
             console.log('Attempting create with snake_case...');
             const userSnake = await prisma.users.create({
                 data: {
                    id: 'debug-user-snake-' + Date.now(),
                    name: 'Debug Snake',
                    email: 'debug-snake-' + Date.now() + '@example.com',
                    schooling_level: 'High School',
                    role: 'COMMON_USER', 
                    institution_id: null,
                    context_role: 'OWNER',
                    system_role: null
                 } as any
             });
             console.log('✅ Created snake_case dummy user. Keys:', Object.keys(userSnake));
          } catch(e2: any) {
             console.log('❌ Failed to create snake_case user:', e2.message);
          }
      }
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
