process.env.NODE_ENV = "test";

const request = require("supertest");
const app = require("../src/app");
const {
  testDatabaseConnection,
  query,
  closeDatabaseConnection,
} = require("../src/config/db");

const TEST_PASSWORD = "StrongPass123!";

const OWNER_EMAIL = "pmm.owner.test@example.com";
const MEMBER_EMAIL = "pmm.member.test@example.com";
const VIEWER_EMAIL = "pmm.viewer.test@example.com";
const ADMIN_EMAIL = "pmm.admin.test@example.com";
const EXTERNAL_EMAIL = "pmm.external.test@example.com";
const EXTRA_EMAIL = "pmm.extra.test@example.com";
const INACTIVE_EMAIL = "pmm.inactive.test@example.com";

let dbAvailable = false;

let ownerToken = null;
let memberToken = null;
let viewerToken = null;
let adminToken = null;
let externalToken = null;

let ownerId = null;
let memberId = null;
let viewerId = null;
let adminId = null;
let extraId = null;
let inactiveId = null;

let projectId = null;

const authed = (token) => `Bearer ${token}`;

const hasPasswordHash = (obj) => {
  const serialized = JSON.stringify(obj);
  return (
    serialized.includes("password_hash") || serialized.includes("passwordHash")
  );
};

const memberPath = (pid) => `/api/v1/projects/${pid}/members`;

const listMembers = (token, pid) =>
  request(app).get(memberPath(pid)).set("Authorization", authed(token));

const addMember = (token, pid, body) =>
  request(app).post(memberPath(pid)).set("Authorization", authed(token)).send(body);

const updateMember = (token, pid, uid, body) =>
  request(app)
    .patch(`${memberPath(pid)}/${uid}`)
    .set("Authorization", authed(token))
    .send(body);

const removeMember = (token, pid, uid) =>
  request(app)
    .delete(`${memberPath(pid)}/${uid}`)
    .set("Authorization", authed(token));

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

  ownerToken = await register(OWNER_EMAIL, "PM Owner");
  memberToken = await register(MEMBER_EMAIL, "PM Member");
  viewerToken = await register(VIEWER_EMAIL, "PM Viewer");
  adminToken = await register(ADMIN_EMAIL, "PM Admin");
  externalToken = await register(EXTERNAL_EMAIL, "PM External");
  await register(EXTRA_EMAIL, "PM Extra");
  await register(INACTIVE_EMAIL, "PM Inactive");

  await query("UPDATE users SET role = 'admin' WHERE email = $1", [
    ADMIN_EMAIL,
  ]);

  await query("UPDATE users SET is_active = false WHERE email = $1", [
    INACTIVE_EMAIL,
  ]);

  const users = await query(
    `SELECT user_id, email FROM users
     WHERE email = ANY($1::text[])`,
    [[OWNER_EMAIL, MEMBER_EMAIL, VIEWER_EMAIL, ADMIN_EMAIL, EXTRA_EMAIL, INACTIVE_EMAIL]]
  );

  const userIdByEmail = {};
  for (const row of users.rows) {
    userIdByEmail[row.email] = Number(row.user_id);
  }

  ownerId = userIdByEmail[OWNER_EMAIL];
  memberId = userIdByEmail[MEMBER_EMAIL];
  viewerId = userIdByEmail[VIEWER_EMAIL];
  adminId = userIdByEmail[ADMIN_EMAIL];
  extraId = userIdByEmail[EXTRA_EMAIL];
  inactiveId = userIdByEmail[INACTIVE_EMAIL];

  const created = await request(app)
    .post("/api/v1/projects")
    .set("Authorization", authed(ownerToken))
    .send({
      project_key: "PMM1",
      project_name: "Members Fixture Project",
      description: "Shared fixture project for member tests",
    });

  projectId = created.body.data.project.project_id;

  const addRes1 = await addMember(ownerToken, projectId, {
    user_id: memberId,
    member_role: "member",
  });
  if (addRes1.status !== 201) {
    throw new Error(`beforeAll add member failed: ${JSON.stringify(addRes1.body)}`);
  }

  const addRes2 = await addMember(ownerToken, projectId, {
    user_id: viewerId,
    member_role: "viewer",
  });
  if (addRes2.status !== 201) {
    throw new Error(`beforeAll add viewer failed: ${JSON.stringify(addRes2.body)}`);
  }
});

afterAll(async () => {
  if (dbAvailable) {
    try {
      const userIds = await query(
        `SELECT user_id FROM users
         WHERE email = ANY($1::text[])`,
        [[OWNER_EMAIL, MEMBER_EMAIL, VIEWER_EMAIL, ADMIN_EMAIL, EXTERNAL_EMAIL, EXTRA_EMAIL, INACTIVE_EMAIL]]
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
    console.warn("SKIPPED: project members integration test (DB not configured)");
    return false;
  }
  return true;
};

describe("Project members authorization (no database required)", () => {
  test("GET members without token returns 401", async () => {
    const res = await request(app).get(memberPath(1));
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("AUTHENTICATION_REQUIRED");
  });

  test("POST members without token returns 401", async () => {
    const res = await request(app)
      .post(memberPath(1))
      .send({ user_id: 1, member_role: "member" });
    expect(res.status).toBe(401);
  });

  test("PATCH member without token returns 401", async () => {
    const res = await request(app)
      .patch(`${memberPath(1)}/1`)
      .send({ member_role: "viewer" });
    expect(res.status).toBe(401);
  });

  test("DELETE member without token returns 401", async () => {
    const res = await request(app).delete(`${memberPath(1)}/1`);
    expect(res.status).toBe(401);
  });
});

describe("Project members database integration (requires configured DB)", () => {
  test("owner lists members returns 200 with safe user fields", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await listMembers(ownerToken, projectId);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.members)).toBe(true);

    const ids = res.body.data.members.map((m) => Number(m.user_id));
    expect(ids).toContain(memberId);
    expect(ids).toContain(viewerId);

    for (const member of res.body.data.members) {
      expect(member.project_member_id).toBeDefined();
      expect(Number(member.project_id)).toBe(Number(projectId));
      expect(member.member_role).toBeDefined();
      expect(member.joined_at).toBeDefined();
      expect(member.full_name).toBeDefined();
      expect(member.email).toBeDefined();
      expect(member.is_active).toBeDefined();
    }

    expect(hasPasswordHash(res.body)).toBe(false);
  });

  test("member lists members returns 200", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await listMembers(memberToken, projectId);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.members)).toBe(true);
  });

  test("viewer lists members returns 200", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await listMembers(viewerToken, projectId);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.members)).toBe(true);
  });

  test("external user listing members returns 403", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await listMembers(externalToken, projectId);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });

  test("unknown project returns 404", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await listMembers(ownerToken, 999999999);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("PROJECT_NOT_FOUND");
  });

  test("owner adds active user returns 201 with safe user fields", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await addMember(ownerToken, projectId, {
      user_id: extraId,
      member_role: "member",
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(Number(res.body.data.member.user_id)).toBe(extraId);
    expect(res.body.data.member.member_role).toBe("member");
    expect(Number(res.body.data.member.project_id)).toBe(Number(projectId));
    expect(res.body.data.member.full_name).toBeDefined();
    expect(res.body.data.member.email).toBe(EXTRA_EMAIL);
    expect(res.body.data.member.is_active).toBe(true);
    expect(hasPasswordHash(res.body)).toBe(false);
  });

  test("duplicate add returns 409", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await addMember(ownerToken, projectId, {
      user_id: extraId,
      member_role: "viewer",
    });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("PROJECT_MEMBER_ALREADY_EXISTS");
  });

  test("unknown user returns 404", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await addMember(ownerToken, projectId, {
      user_id: 999999999,
      member_role: "member",
    });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("USER_NOT_FOUND");
  });

  test("inactive user cannot be added", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await addMember(ownerToken, projectId, {
      user_id: inactiveId,
      member_role: "member",
    });

    expect(res.status).toBe(422);
  });

  test("invalid role returns 422", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await addMember(ownerToken, projectId, {
      user_id: ownerId,
      member_role: "superadmin",
    });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("INVALID_MEMBER_ROLE");
  });

  test("owner role assignment returns 422", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await addMember(ownerToken, projectId, {
      user_id: adminId,
      member_role: "owner",
    });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("INVALID_MEMBER_ROLE");
  });

  test("owner updates member role returns 200", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await updateMember(ownerToken, projectId, extraId, {
      member_role: "viewer",
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Number(res.body.data.member.user_id)).toBe(extraId);
    expect(res.body.data.member.member_role).toBe("viewer");
    expect(hasPasswordHash(res.body)).toBe(false);
  });

  test("ordinary member cannot update a member", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await updateMember(memberToken, projectId, extraId, {
      member_role: "manager",
    });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });

  test("project owner cannot be modified", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await updateMember(ownerToken, projectId, ownerId, {
      member_role: "viewer",
    });

    expect(res.status).toBe(422);
  });

  test("owner removes member returns 200", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await removeMember(ownerToken, projectId, extraId);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Number(res.body.data.user_id)).toBe(extraId);

    const after = await listMembers(ownerToken, projectId);
    const ids = after.body.data.members.map((m) => Number(m.user_id));
    expect(ids).not.toContain(extraId);
  });

  test("project owner cannot be removed", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await removeMember(ownerToken, projectId, ownerId);

    expect(res.status).toBe(422);
  });

  test("removing a non-member returns 404", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await removeMember(ownerToken, projectId, extraId);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("PROJECT_MEMBER_NOT_FOUND");
  });

  test("external user cannot add, update or remove members", async () => {
    if (!requireDb()) {
      return;
    }

    const addRes = await addMember(externalToken, projectId, {
      user_id: extraId,
      member_role: "member",
    });
    expect(addRes.status).toBe(403);

    const updateRes = await updateMember(externalToken, projectId, memberId, {
      member_role: "viewer",
    });
    expect(updateRes.status).toBe(403);

    const removeRes = await removeMember(externalToken, projectId, memberId);
    expect(removeRes.status).toBe(403);
  });

  test("ordinary member cannot add or remove members", async () => {
    if (!requireDb()) {
      return;
    }

    const addRes = await addMember(memberToken, projectId, {
      user_id: extraId,
      member_role: "member",
    });
    expect(addRes.status).toBe(403);

    const removeRes = await removeMember(memberToken, projectId, viewerId);
    expect(removeRes.status).toBe(403);
  });

  test("admin can list, add, update and remove members", async () => {
    if (!requireDb()) {
      return;
    }

    const listRes = await listMembers(adminToken, projectId);
    expect(listRes.status).toBe(200);

    const addRes = await addMember(adminToken, projectId, {
      user_id: extraId,
      member_role: "member",
    });
    expect(addRes.status).toBe(201);

    const updateRes = await updateMember(adminToken, projectId, extraId, {
      member_role: "manager",
    });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.member.member_role).toBe("manager");

    const removeRes = await removeMember(adminToken, projectId, extraId);
    expect(removeRes.status).toBe(200);
  });

  test("invalid project id returns 422", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await listMembers(ownerToken, "abc");
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  test("activity events are written with project_id populated", async () => {
    if (!requireDb()) {
      return;
    }

    await addMember(adminToken, projectId, {
      user_id: extraId,
      member_role: "member",
    });

    await updateMember(adminToken, projectId, extraId, {
      member_role: "viewer",
    });

    await removeMember(adminToken, projectId, extraId);

    const logs = await query(
      `SELECT log_id, project_id, action_type
       FROM activity_logs
       WHERE action_type = ANY($1::text[])
         AND project_id = $2
         AND user_id IN (SELECT user_id FROM users WHERE email = ANY($3::text[]))
       ORDER BY log_id DESC
       LIMIT 10`,
      [
        ["PROJECT_MEMBER_ADDED", "PROJECT_MEMBER_ROLE_UPDATED", "PROJECT_MEMBER_REMOVED"],
        projectId,
        [ADMIN_EMAIL, OWNER_EMAIL],
      ]
    );

    const actions = logs.rows.map((row) => row.action_type);

    expect(actions).toContain("PROJECT_MEMBER_ADDED");
    expect(actions).toContain("PROJECT_MEMBER_ROLE_UPDATED");
    expect(actions).toContain("PROJECT_MEMBER_REMOVED");

    for (const row of logs.rows) {
      expect(Number(row.project_id)).toBe(Number(projectId));
    }
  });

  test("no members response contains password_hash", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await listMembers(ownerToken, projectId);
    expect(hasPasswordHash(res.body)).toBe(false);
  });
});
