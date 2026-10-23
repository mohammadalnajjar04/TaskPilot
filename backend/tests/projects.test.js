process.env.NODE_ENV = "test";

const request = require("supertest");
const app = require("../src/app");
const {
  testDatabaseConnection,
  query,
  closeDatabaseConnection,
} = require("../src/config/db");

const TEST_PASSWORD = "StrongPass123!";

const OWNER_EMAIL = "project.owner.test@example.com";
const MEMBER_EMAIL = "project.member.test@example.com";
const ADMIN_EMAIL = "project.admin.test@example.com";
const OTHER_EMAIL = "project.other.test@example.com";

let dbAvailable = false;
let ownerToken = null;
let memberToken = null;
let adminToken = null;
let otherToken = null;

const fixtureProjectIds = [];

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

  ownerToken = await register(OWNER_EMAIL, "Project Owner");
  memberToken = await register(MEMBER_EMAIL, "Project Member");
  adminToken = await register(ADMIN_EMAIL, "Project Admin");
  otherToken = await register(OTHER_EMAIL, "Project Other");

  await query("UPDATE users SET role = 'admin' WHERE email = $1", [
    ADMIN_EMAIL,
  ]);

  const created = await request(app)
    .post("/api/v1/projects")
    .set("Authorization", `Bearer ${ownerToken}`)
    .send({
      project_key: "FIXT",
      project_name: "Fixture Project",
      description: "Shared fixture project",
      progress_percentage: 10,
    });

  fixtureProjectIds.push(created.body.data.project.project_id);

  await query(
    `INSERT INTO project_members (project_id, user_id)
     SELECT $1, user_id FROM users WHERE email = $2`,
    [created.body.data.project.project_id, MEMBER_EMAIL]
  );
});

afterAll(async () => {
  if (dbAvailable) {
    try {
      const userIds = await query(
        `SELECT user_id FROM users
         WHERE email = ANY($1::text[])`,
        [[OWNER_EMAIL, MEMBER_EMAIL, ADMIN_EMAIL, OTHER_EMAIL]]
      );

      const ids = userIds.rows.map((row) => row.user_id);

      if (ids.length > 0) {
        await query(
          `DELETE FROM project_members
           WHERE project_id IN (
             SELECT project_id FROM projects WHERE owner_id = ANY($1::bigint[])
           )`,
          [ids]
        );

        await query(
          `DELETE FROM projects WHERE owner_id = ANY($1::bigint[])`,
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
    console.warn("SKIPPED: projects integration test (DB_PASSWORD not configured)");
    return false;
  }
  return true;
};

const authed = (token) => `Bearer ${token}`;

const hasPasswordHash = (obj) => {
  const serialized = JSON.stringify(obj);
  return serialized.includes("password_hash") || serialized.includes("passwordHash");
};

describe("Projects authorization (no database required)", () => {
  test("GET /api/v1/projects without token returns 401", async () => {
    const res = await request(app).get("/api/v1/projects");
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("AUTHENTICATION_REQUIRED");
  });

  test("GET /api/v1/projects/:id without token returns 401", async () => {
    const res = await request(app).get("/api/v1/projects/1");
    expect(res.status).toBe(401);
  });

  test("POST /api/v1/projects without token returns 401", async () => {
    const res = await request(app).post("/api/v1/projects").send({
      project_key: "NOTOK",
      project_name: "No Token Project",
    });
    expect(res.status).toBe(401);
  });

  test("PUT /api/v1/projects/:id without token returns 401", async () => {
    const res = await request(app).put("/api/v1/projects/1").send({
      project_name: "Updated",
    });
    expect(res.status).toBe(401);
  });

  test("PATCH /api/v1/projects/:id/status without token returns 401", async () => {
    const res = await request(app)
      .patch("/api/v1/projects/1/status")
      .send({ status: "in_progress" });
    expect(res.status).toBe(401);
  });

  test("DELETE /api/v1/projects/:id without token returns 401", async () => {
    const res = await request(app).delete("/api/v1/projects/1");
    expect(res.status).toBe(401);
  });
});

describe("Projects database integration (requires configured DB)", () => {
  test("owner creates project returns 201 with project_key and planning status", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await request(app)
      .post("/api/v1/projects")
      .set("Authorization", authed(ownerToken))
      .send({
        project_key: "CRT1",
        project_name: "Created Project",
        description: "A fresh project",
        progress_percentage: 5,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.project.project_id).toBeDefined();
    expect(res.body.data.project.owner_id).toBeDefined();
    expect(res.body.data.project.project_key).toBe("CRT1");
    expect(res.body.data.project.status).toBe("planning");
    expect(hasPasswordHash(res.body)).toBe(false);

    fixtureProjectIds.push(res.body.data.project.project_id);
  });

  test("duplicate project name returns 409", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await request(app)
      .post("/api/v1/projects")
      .set("Authorization", authed(ownerToken))
      .send({ project_key: "CRT2", project_name: "Created Project" });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("PROJECT_NAME_ALREADY_EXISTS");
  });

  test("duplicate project key returns 409", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await request(app)
      .post("/api/v1/projects")
      .set("Authorization", authed(ownerToken))
      .send({ project_key: "CRT1", project_name: "Another Project" });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("PROJECT_KEY_ALREADY_EXISTS");
  });

  test("create project rejects invalid data with 422", async () => {
    if (!requireDb()) {
      return;
    }

    const cases = [
      { project_name: "", project_key: "BAD1" },
      { project_name: "x", project_key: "BAD1" },
      { project_name: "Valid Name", project_key: "BAD1", progress_percentage: 150 },
      { project_name: "Valid Name", project_key: "BAD1", status: "not_a_status" },
      { project_name: "Valid Name", project_key: "BAD1", end_date: "not-a-date" },
      { project_name: "Valid Name" },
    ];

    for (const body of cases) {
      const res = await request(app)
        .post("/api/v1/projects")
        .set("Authorization", authed(ownerToken))
        .send(body);
      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    }
  });

  test("create project rejects invalid project_key format with 422", async () => {
    if (!requireDb()) {
      return;
    }

    const cases = [
      "A",
      "1ABC",
      "lowercase",
      "abc123",
      "ABCDEFGHIJK",
      "A!@#",
    ];

    for (const project_key of cases) {
      const res = await request(app)
        .post("/api/v1/projects")
        .set("Authorization", authed(ownerToken))
        .send({ project_key, project_name: "Valid Name" });
      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    }
  });

  test("owner lists projects and sees them", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await request(app)
      .get("/api/v1/projects")
      .set("Authorization", authed(ownerToken));

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.projects)).toBe(true);
    expect(res.body.data.projects.length).toBeGreaterThan(0);
    expect(res.body.data.projects[0].project_key).toBeDefined();
  });

  test("member lists accessible projects", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await request(app)
      .get("/api/v1/projects")
      .set("Authorization", authed(memberToken));

    expect(res.status).toBe(200);
    expect(res.body.data.projects.length).toBeGreaterThan(0);
  });

  test("owner views project returns 200", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await request(app)
      .get(`/api/v1/projects/${fixtureProjectIds[0]}`)
      .set("Authorization", authed(ownerToken));

    expect(res.status).toBe(200);
    expect(res.body.data.project.project_id).toBe(fixtureProjectIds[0]);
    expect(res.body.data.project.project_key).toBe("FIXT");
  });

  test("member views project returns 200", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await request(app)
      .get(`/api/v1/projects/${fixtureProjectIds[0]}`)
      .set("Authorization", authed(memberToken));

    expect(res.status).toBe(200);
  });

  test("non-member views project returns 403", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await request(app)
      .get(`/api/v1/projects/${fixtureProjectIds[0]}`)
      .set("Authorization", authed(otherToken));

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });

  test("unknown project returns 404", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await request(app)
      .get("/api/v1/projects/99999999")
      .set("Authorization", authed(ownerToken));

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("PROJECT_NOT_FOUND");
  });

  test("owner updates project returns 200", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await request(app)
      .put(`/api/v1/projects/${fixtureProjectIds[0]}`)
      .set("Authorization", authed(ownerToken))
      .send({
        project_key: "FIXT2",
        project_name: "Fixture Project Updated",
        description: "Updated description",
        progress_percentage: 40,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.project.project_key).toBe("FIXT2");
    expect(res.body.data.project.project_name).toBe("Fixture Project Updated");
    expect(res.body.data.project.progress_percentage).toBe(40);
  });

  test("member cannot update project returns 403", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await request(app)
      .put(`/api/v1/projects/${fixtureProjectIds[0]}`)
      .set("Authorization", authed(memberToken))
      .send({ project_name: "Hijacked" });

    expect(res.status).toBe(403);
  });

  test("member cannot delete project returns 403", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await request(app)
      .delete(`/api/v1/projects/${fixtureProjectIds[0]}`)
      .set("Authorization", authed(memberToken));

    expect(res.status).toBe(403);
  });

  test("owner changes status to in_progress returns 200", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await request(app)
      .patch(`/api/v1/projects/${fixtureProjectIds[0]}/status`)
      .set("Authorization", authed(ownerToken))
      .send({ status: "in_progress" });

    expect(res.status).toBe(200);
    expect(res.body.data.project.status).toBe("in_progress");
  });

  test("completing a project forces progress to 100", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await request(app)
      .patch(`/api/v1/projects/${fixtureProjectIds[0]}/status`)
      .set("Authorization", authed(ownerToken))
      .send({ status: "completed" });

    expect(res.status).toBe(200);
    expect(res.body.data.project.status).toBe("completed");
    expect(res.body.data.project.progress_percentage).toBe(100);
  });

  test("invalid status transition returns 422", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await request(app)
      .patch(`/api/v1/projects/${fixtureProjectIds[0]}/status`)
      .set("Authorization", authed(ownerToken))
      .send({ status: "cancelled" });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("INVALID_STATUS_TRANSITION");
  });

  test("member cannot change status returns 403", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await request(app)
      .patch(`/api/v1/projects/${fixtureProjectIds[0]}/status`)
      .set("Authorization", authed(memberToken))
      .send({ status: "cancelled" });

    expect(res.status).toBe(403);
  });

  test("owner deletes project returns 200 and 404 afterwards", async () => {
    if (!requireDb()) {
      return;
    }

    const created = await request(app)
      .post("/api/v1/projects")
      .set("Authorization", authed(ownerToken))
      .send({ project_key: "DEL1", project_name: "Project To Delete" });

    const projectId = created.body.data.project.project_id;

    const del = await request(app)
      .delete(`/api/v1/projects/${projectId}`)
      .set("Authorization", authed(ownerToken));

    expect(del.status).toBe(200);
    expect(del.body.data.project_id).toBe(projectId);

    const after = await request(app)
      .get(`/api/v1/projects/${projectId}`)
      .set("Authorization", authed(ownerToken));

    expect(after.status).toBe(404);
  });

  test("admin lists all projects and can delete any", async () => {
    if (!requireDb()) {
      return;
    }

    const list = await request(app)
      .get("/api/v1/projects")
      .set("Authorization", authed(adminToken));

    expect(list.status).toBe(200);
    expect(Array.isArray(list.body.data.projects)).toBe(true);

    const someProject = fixtureProjectIds[0];
    const view = await request(app)
      .get(`/api/v1/projects/${someProject}`)
      .set("Authorization", authed(adminToken));

    expect(view.status).toBe(200);

    const created = await request(app)
      .post("/api/v1/projects")
      .set("Authorization", authed(adminToken))
      .send({ project_key: "ADMN", project_name: "Admin Project" });

    const projectId = created.body.data.project.project_id;

    const del = await request(app)
      .delete(`/api/v1/projects/${projectId}`)
      .set("Authorization", authed(adminToken));

    expect(del.status).toBe(200);
  });
});
