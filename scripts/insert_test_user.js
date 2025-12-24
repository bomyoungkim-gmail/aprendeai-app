const { Client } = require('pg');
// Use the credentials we found in docker-compose
const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'aprendeai',
  password: 'postgres',
  port: 5432,
});

async function run() {
  try {
    await client.connect();
    console.log("Connected to DB");
    
    // Check if plan exists, insert if not
    const planRes = await client.query("SELECT id FROM plans WHERE code = 'PRO'");
    let planId;
    if (planRes.rows.length === 0) {
      console.log("Creating PRO plan...");
      const insertPlan = await client.query(`
        INSERT INTO plans (id, code, name, is_active, entitlements, updated_at)
        VALUES (gen_random_uuid(), 'PRO', 'Pro Plan', true, '{}', NOW())
        RETURNING id
      `);
      planId = insertPlan.rows[0].id;
    } else {
      planId = planRes.rows[0].id;
    }

    // Insert User
    // Use a simpler hash like 'Test1234' or whatever bcrypt hash format is valid.
    // Ideally we use a real hash.
    // $2b$10$wL4gqS.1v6Z1y6/1y6/1y6/1y6/1y6/1y6/1y6/1y6 is just a placeholder example I used before.
    // Let's use a known hash for 'password123' if possible or just update it if we can login.
    // Since I can't generate bcrypt easily without library, I'll rely on the app using bcrypt.
    // I will try to use the 'bcrypt' library if available in node_modules.
    let hash = '$2b$10$EpOd/..'; // broken hash
    try {
        const bcrypt = require('bcrypt');
        hash = await bcrypt.hash('password123', 10);
    } catch (e) {
        console.log("Bcrypt not found, using placeholder hash (login might fail if not valid)");
        // Valid bcrypt hash for 'password123' (cost 10)
        hash = '$2b$10$89.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1'; // Fake
        // Actually, let's assume we can require valid bcrypt from the project root.
    }

    const email = 'test@example.com';
    await client.query(`
      INSERT INTO users (id, email, password_hash, name, role, status, schooling_level, updated_at)
      VALUES (gen_random_uuid(), $1, $2, 'Test User', 'STUDENT', 'ACTIVE', 'High School', NOW())
      ON CONFLICT (email) DO UPDATE SET password_hash = $2
    `, [email, hash]);
    
    console.log(`User ${email} created/updated.`);
  } catch (e) {
    console.error(e);
  } finally {
    await client.end();
  }
}

run();
