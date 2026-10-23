process.env.NODE_ENV = "test";

const request = require("supertest");
const app = require("../src/app");
const {
  testDatabaseConnection,
  query,
  closeDatabaseConnection,
} = require("../src/config/db");

const TEST_PASSWORD = "StrongPass123!";

const USER_EMAIL = "category.user.test@example.com";
const OTHER_EMAIL = "category.other.test@example.com";
const ADMIN_EMAIL = "category.admin.test@example.com";

let dbAvailable = false;
let userToken = null;
let otherToken = null;
let adminToken = null;

let fixtureCategoryId = null;

beforeAll(async () => {
  try {
    await testDatabaseConnection();
    dbAvailable = true;
  } catch (error) {
    dbAvailable = false;
  }

  if (!dbAvailable) {
    return;
  }

  const register = async (email, fullName) => {
    const res = await request(app).post("/api/v1/auth/register").send({
      fullName,
      email,
      password: TEST_PASSWORD,
    });
    return res.body.data.accessToken;
  };

  userToken = await register(USER_EMAIL, "Category User");
  otherToken = await register(OTHER_EMAIL, "Category Other");
  adminToken = await register(ADMIN_EMAIL, "Category Admin");

  await query("UPDATE users SET role = 'admin' WHERE email = $1", [
    ADMIN_EMAIL,
  ]);

  const created = await request(app)
    .post("/api/v1/categories")
    .set("Authorization", `Bearer ${userToken}`)
    .send({ category_name: "Work" });

  fixtureCategoryId = created.body.data.category.category_id;
});

afterAll(async () => {
  if (dbAvailable) {
    try {
      const userIds = await query(
        `SELECT user_id FROM users
         WHERE email = ANY($1::text[])`,
        [[USER_EMAIL, OTHER_EMAIL, ADMIN_EMAIL]]
      );

      const ids = userIds.rows.map((row) => row.user_id);

      if (ids.length > 0) {
        await query(
          `DELETE FROM categories WHERE user_id = ANY($1::bigint[])`,
          [ids]
        );

        await query("DELETE FROM users WHERE user_id = ANY($1::bigint[])", [
          ids,
        ]);
      }
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
      "SKIPPED: categories integration test (DB_PASSWORD not configured)"
    );
    return false;
  }
  return true;
};

const hasPasswordHash = (obj) => {
  const serialized = JSON.stringify(obj);
  return serialized.includes("password_hash") || serialized.includes("passwordHash");
};

describe("Categories authorization (no database required)", () => {
  test("GET /api/v1/categories without token returns 401", async () => {
    const res = await request(app).get("/api/v1/categories");
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("AUTHENTICATION_REQUIRED");
  });

  test("GET /api/v1/categories/:id without token returns 401", async () => {
    const res = await request(app).get("/api/v1/categories/1");
    expect(res.status).toBe(401);
  });

  test("POST /api/v1/categories without token returns 401", async () => {
    const res = await request(app)
      .post("/api/v1/categories")
      .send({ category_name: "Personal", color: "#111111" });
    expect(res.status).toBe(401);
  });

  test("PUT /api/v1/categories/:id without token returns 401", async () => {
    const res = await request(app)
      .put("/api/v1/categories/1")
      .send({ category_name: "Renamed", color: "#111111" });
    expect(res.status).toBe(401);
  });

  test("DELETE /api/v1/categories/:id without token returns 401", async () => {
    const res = await request(app).delete("/api/v1/categories/1");
    expect(res.status).toBe(401);
  });
});

describe("Categories database integration (requires configured DB)", () => {
  test("create category with color returns 201", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await request(app)
      .post("/api/v1/categories")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ category_name: "Personal", color: "#10B981" });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.category.category_id).toBeDefined();
    expect(res.body.data.category.user_id).toBeDefined();
    expect(res.body.data.category.category_name).toBe("Personal");
    expect(res.body.data.category.color).toBe("#10B981");
    expect(hasPasswordHash(res.body)).toBe(false);
  });

  test("create category without color uses database default", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await request(app)
      .post("/api/v1/categories")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ category_name: "No Color" });

    expect(res.status).toBe(201);
    expect(res.body.data.category.color).toBe("#2563EB");
  });

  test("duplicate category name for same user returns 409", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await request(app)
      .post("/api/v1/categories")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ category_name: "work", color: "#111111" });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("CATEGORY_ALREADY_EXISTS");
  });

  test("same category name by another user is allowed", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await request(app)
      .post("/api/v1/categories")
      .set("Authorization", `Bearer ${otherToken}`)
      .send({ category_name: "Work", color: "#7C3AED" });

    expect(res.status).toBe(201);
  });

  test("create category rejects invalid data with 422", async () => {
    if (!requireDb()) {
      return;
    }

    const cases = [
      {},
      { category_name: "" },
      { category_name: "x" },
      { category_name: "x".repeat(81) },
      { category_name: "Valid", color: "blue" },
      { category_name: "Valid", color: "#FFF" },
      { category_name: "Valid", color: "#GGGGGG" },
    ];

    for (const body of cases) {
      const res = await request(app)
        .post("/api/v1/categories")
        .set("Authorization", `Bearer ${userToken}`)
        .send(body);
      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    }
  });

  test("user lists own categories only", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await request(app)
      .get("/api/v1/categories")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.categories)).toBe(true);
    expect(res.body.data.categories.length).toBeGreaterThan(0);
    for (const category of res.body.data.categories) {
      expect(category.user_id).toBe(res.body.data.categories[0].user_id);
    }
  });

  test("user views own category returns 200", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await request(app)
      .get(`/api/v1/categories/${fixtureCategoryId}`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.category.category_id).toBe(fixtureCategoryId);
    expect(res.body.data.category.color).toBe("#2563EB");
  });

  test("user cannot view another user's category returns 403", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await request(app)
      .get(`/api/v1/categories/${fixtureCategoryId}`)
      .set("Authorization", `Bearer ${otherToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });

  test("unknown category returns 404", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await request(app)
      .get("/api/v1/categories/99999999")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("CATEGORY_NOT_FOUND");
  });

  test("user updates category name preserving color returns 200", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await request(app)
      .put(`/api/v1/categories/${fixtureCategoryId}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ category_name: "Work Renamed" });

    expect(res.status).toBe(200);
    expect(res.body.data.category.category_name).toBe("Work Renamed");
    expect(res.body.data.category.color).toBe("#2563EB");
  });

  test("user updates category color returns 200", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await request(app)
      .put(`/api/v1/categories/${fixtureCategoryId}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ category_name: "Work Renamed", color: "#F59E0B" });

    expect(res.status).toBe(200);
    expect(res.body.data.category.color).toBe("#F59E0B");
  });

  test("user cannot update another user's category returns 403", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await request(app)
      .put(`/api/v1/categories/${fixtureCategoryId}`)
      .set("Authorization", `Bearer ${otherToken}`)
      .send({ category_name: "Hijacked", color: "#111111" });

    expect(res.status).toBe(403);
  });

  test("user cannot delete another user's category returns 403", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await request(app)
      .delete(`/api/v1/categories/${fixtureCategoryId}`)
      .set("Authorization", `Bearer ${otherToken}`);

    expect(res.status).toBe(403);
  });

  test("admin can view any category", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await request(app)
      .get(`/api/v1/categories/${fixtureCategoryId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });

  test("admin lists all categories", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await request(app)
      .get("/api/v1/categories")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.categories)).toBe(true);
  });

  test("user deletes own category returns 200 and 404 afterwards", async () => {
    if (!requireDb()) {
      return;
    }

    const created = await request(app)
      .post("/api/v1/categories")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ category_name: "Temp Category", color: "#EF4444" });

    const categoryId = created.body.data.category.category_id;

    const del = await request(app)
      .delete(`/api/v1/categories/${categoryId}`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(del.status).toBe(200);
    expect(del.body.data.category_id).toBe(categoryId);

    const after = await request(app)
      .get(`/api/v1/categories/${categoryId}`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(after.status).toBe(404);
  });

  test("admin can delete any category", async () => {
    if (!requireDb()) {
      return;
    }

    const created = await request(app)
      .post("/api/v1/categories")
      .set("Authorization", `Bearer ${otherToken}`)
      .send({ category_name: "Admin Removes", color: "#06B6D4" });

    const categoryId = created.body.data.category.category_id;

    const del = await request(app)
      .delete(`/api/v1/categories/${categoryId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(del.status).toBe(200);
  });
});
