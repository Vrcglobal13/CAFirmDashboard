const { Client } = require("pg");

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  const tables = await client.query(
    "select table_name from information_schema.tables where table_schema = 'public' and table_name in ('firms','users','registration_codes','owner_users','tasks','clients') order by table_name"
  );
  const functions = await client.query(
    "select routine_name from information_schema.routines where routine_schema = 'public' and routine_name in ('create_firm_and_admin','create_registration_code','get_owner_firm_summaries','is_platform_owner') order by routine_name"
  );
  await client.end();

  console.log(
    JSON.stringify({
      tables: tables.rows.map((row) => row.table_name),
      functions: functions.rows.map((row) => row.routine_name)
    })
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
