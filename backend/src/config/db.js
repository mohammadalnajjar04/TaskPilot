const pg = require("pg");
const { Pool } = pg;
const config = require("./env");

pg.types.setTypeParser(20, (value) => Number(value));

const pool = new Pool({
  host: config.db.host,
  port: config.db.port,
  database: config.db.database,
  user: config.db.user,
  password: config.db.password,
  max: config.db.max,
  idleTimeoutMillis: config.db.idleTimeoutMillis,
  connectionTimeoutMillis: config.db.connectionTimeoutMillis,
  application_name: config.db.applicationName,
});

pool.on("error", (error) => {
  console.error("Unexpected PostgreSQL pool error:", error.message);
});

const query = (text, params = []) => pool.query(text, params);

const testDatabaseConnection = async () => {
  const result = await query(
    "SELECT current_database() AS database_name, current_user AS database_user"
  );

  return {
    databaseName: result.rows[0].database_name,
    databaseUser: result.rows[0].database_user,
  };
};

const closeDatabaseConnection = async () => {
  await pool.end();
};

module.exports = {
  pool,
  query,
  testDatabaseConnection,
  closeDatabaseConnection,
};
