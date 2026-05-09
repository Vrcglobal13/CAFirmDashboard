const fs = require("fs");
const { Client } = require("pg");

async function main() {
  const connectionString = process.env.DATABASE_URL;
  const ownerEmail = process.env.OWNER_EMAIL;
  const files = process.argv.slice(2);

  if (!connectionString) throw new Error("DATABASE_URL is required.");

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();

  for (const file of files) {
    const sql = fs.readFileSync(file, "utf8");
    await client.query(sql);
    console.log(`applied ${file}`);
  }

  if (ownerEmail) {
    const insert = await client.query(
      "insert into public.owner_users(user_id) select id from auth.users where email = $1 on conflict (user_id) do nothing returning user_id",
      [ownerEmail]
    );
    const check = await client.query(
      "select count(*)::int as count from public.owner_users ou join auth.users u on u.id = ou.user_id where u.email = $1",
      [ownerEmail]
    );
    console.log(JSON.stringify({ ownerInserted: insert.rowCount, ownerLinked: check.rows[0].count }));
  }

  await client.end();
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
