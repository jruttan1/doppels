// Run with: npx tsx scripts/test-ingest.ts

const TEST_USER_ID = process.argv[2];

if (!TEST_USER_ID) {
  console.log("Usage: npx tsx scripts/test-ingest.ts <user-id>");
  console.log("\nTo get a user ID, run this SQL in Supabase:");
  console.log("  SELECT id, email, name FROM users LIMIT 5;");
  process.exit(1);
}

async function testIngest() {
  console.log(`\n🧪 Testing ingestion for user: ${TEST_USER_ID}\n`);
  
  const res = await fetch("http://localhost:3000/api/ingest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: TEST_USER_ID }),
  });

  const data = await res.json();
  
  if (data.success) {
    console.log("✅ Ingestion successful!\n");
    console.log("Generated Persona:");
    console.log(JSON.stringify(data.persona, null, 2));
  } else {
    console.log("❌ Ingestion failed:");
    console.log(data.error);
  }
}

testIngest().catch(console.error);
