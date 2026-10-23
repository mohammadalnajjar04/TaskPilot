process.env.NODE_ENV = "test";

const request = require("supertest");
const app = require("../src/app");
const {
  testDatabaseConnection,
  query,
  closeDatabaseConnection,
} = require("../src/config/db");

const TEST_EMAIL = "test.taskpilot@example.com";
const TEST_PASSWORD = "StrongPass123!";

let dbAvailable = false;

beforeAll(async () => {
  try {
    await testDatabaseConnection();
    dbAvailable = true;
  } catch (error) {
    dbAvailable = false;
  }
});

afterAll(async () => {
  if (dbAvailable) {
    try {
      await query("DELETE FROM users WHERE email = $1", [TEST_EMAIL]);
    } catch (error) {
      // cleanup must never fail the suite
    }
  }

  try {
    await closeDatabaseConnection();
  } catch (error) {
    // already closed
  }
});

const requireDb = () => {
  if (!dbAvailable) {
    console.warn(
      "SKIPPED: database integration test (DB_PASSWORD not configured)"
    );
    return false;
  }
  return true;
};

const hasPasswordHash = (obj) => {
  const serialized = JSON.stringify(obj);
  return serialized.includes("password_hash") || serialized.includes("passwordHash");
};

describe("Foundation endpoints", () => {
  test("GET / returns 200", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test("GET /api/v1 returns 200", async () => {
    const res = await request(app).get("/api/v1");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test("GET /api/health returns 200 when DB works", async () => {
    if (!requireDb()) {
      return;
    }
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.database).toBe("connected");
  });

  test("Unknown route returns 404 JSON", async () => {
    const res = await request(app).get("/nonexistent");
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });
});

describe("Auth validation (no database required)", () => {
  test("register rejects invalid email with 422", async () => {
    const res = await request(app).post("/api/v1/auth/register").send({
      fullName: "Test User",
      email: "not-an-email",
      password: "StrongPass123!",
    });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  test("register rejects short fullName with 422", async () => {
    const res = await request(app).post("/api/v1/auth/register").send({
      fullName: "Ab",
      email: "valid@example.com",
      password: "StrongPass123!",
    });
    expect(res.status).toBe(422);
  });

  test("register rejects weak password with 422", async () => {
    const res = await request(app).post("/api/v1/auth/register").send({
      fullName: "Test User",
      email: "valid@example.com",
      password: "weakpass",
    });
    expect(res.status).toBe(422);
  });

  test("register rejects missing fields with 422", async () => {
    const res = await request(app).post("/api/v1/auth/register").send({});
    expect(res.status).toBe(422);
    expect(res.body.error.details.length).toBeGreaterThan(0);
  });

  test("login rejects invalid email with 422", async () => {
    const res = await request(app).post("/api/v1/auth/login").send({
      email: "not-an-email",
      password: "Whatever123!",
    });
    expect(res.status).toBe(422);
  });

  test("login rejects missing password with 422", async () => {
    const res = await request(app).post("/api/v1/auth/login").send({
      email: "valid@example.com",
    });
    expect(res.status).toBe(422);
  });

  test("validation responses never expose password_hash", async () => {
    const res = await request(app).post("/api/v1/auth/register").send({
      fullName: "Ab",
      email: "not-an-email",
      password: "weakpass",
    });
    expect(hasPasswordHash(res.body)).toBe(false);
  });
});

describe("Auth protected routes (no database required)", () => {
  test("GET /api/v1/auth/me without token returns 401", async () => {
    const res = await request(app).get("/api/v1/auth/me");
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("AUTHENTICATION_REQUIRED");
  });

  test("GET /api/v1/auth/me with malformed header returns 401", async () => {
    const res = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", "Basic abc123");
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("INVALID_AUTHORIZATION_HEADER");
  });

  test("GET /api/v1/auth/me with garbage token returns 401", async () => {
    const res = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", "Bearer not.a.jwt");
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("INVALID_TOKEN");
  });
});

describe("Auth database integration (requires configured DB)", () => {
  test("register creates user and returns token", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await request(app).post("/api/v1/auth/register").send({
      fullName: "Test TaskPilot User",
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      role: "admin",
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.user_id).toBeDefined();
    expect(res.body.data.user.email).toBe(TEST_EMAIL);
    expect(res.body.data.user.role).toBe("user");
    expect(res.body.data.accessToken).toBeDefined();
    expect(hasPasswordHash(res.body)).toBe(false);
  });

  test("duplicate registration returns 409", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await request(app).post("/api/v1/auth/register").send({
      fullName: "Test TaskPilot User",
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("EMAIL_ALREADY_EXISTS");
  });

  test("login with wrong password returns 401", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await request(app).post("/api/v1/auth/login").send({
      email: TEST_EMAIL,
      password: "WrongPassword123!",
    });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
  });

  test("login with unknown email returns 401", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await request(app).post("/api/v1/auth/login").send({
      email: "nobody@example.com",
      password: TEST_PASSWORD,
    });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
  });

  test("login succeeds and returns user + token", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await request(app).post("/api/v1/auth/login").send({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(TEST_EMAIL);
    expect(res.body.data.accessToken).toBeDefined();
    expect(hasPasswordHash(res.body)).toBe(false);
  });

  test("GET /api/v1/auth/me returns authenticated user", async () => {
    if (!requireDb()) {
      return;
    }

    const login = await request(app).post("/api/v1/auth/login").send({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });
    const token = login.body.data.accessToken;

    const res = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(TEST_EMAIL);
    expect(hasPasswordHash(res.body)).toBe(false);
  });
});
