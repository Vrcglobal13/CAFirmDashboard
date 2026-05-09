const { Client } = require("pg");

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  const result = await client.query(
    "select u.email from public.owner_users owner_user join auth.users u on u.id = owner_user.user_id where u.email = $1",
    [process.env.OWNER_EMAIL]
  );
  await client.end();

  console.log(JSON.stringify({ ownerEmails: result.rows.map((row) => row.email) }));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
