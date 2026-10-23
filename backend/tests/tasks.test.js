process.env.NODE_ENV = "test";

const request = require("supertest");
const app = require("../src/app");
const {
  testDatabaseConnection,
  query,
  closeDatabaseConnection,
} = require("../src/config/db");

const TEST_PASSWORD = "StrongPass123!";

const OWNER_EMAIL = "tasks.owner.test@example.com";
const MEMBER_EMAIL = "tasks.member.test@example.com";
const EXTERNAL_EMAIL = "tasks.external.test@example.com";
const ADMIN_EMAIL = "tasks.admin.test@example.com";

let dbAvailable = false;
let ownerToken = null;
let memberToken = null;
let externalToken = null;
let adminToken = null;

let ownerId = null;
let memberId = null;
let externalId = null;

let projectOneId = null;
let projectTwoId = null;
let projectThreeId = null;

let categoryId = null;
let fixtureTaskId = null;
let assignedTaskId = null;
let parentTaskId = null;
let childTaskId = null;

const authed = (token) => `Bearer ${token}`;

const hasPasswordHash = (obj) => {
  const serialized = JSON.stringify(obj);
  return (
    serialized.includes("password_hash") || serialized.includes("passwordHash")
  );
};

const createProject = async (token, projectKey, projectName) => {
  const res = await request(app)
    .post("/api/v1/projects")
    .set("Authorization", authed(token))
    .send({ project_key: projectKey, project_name: projectName });

  return res.body.data.project.project_id;
};

const createTask = async (token, body) => {
  const res = await request(app)
    .post("/api/v1/tasks")
    .set("Authorization", authed(token))
    .send(body);

  return res;
};

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

  ownerToken = await register(OWNER_EMAIL, "Tasks Owner");
  memberToken = await register(MEMBER_EMAIL, "Tasks Member");
  externalToken = await register(EXTERNAL_EMAIL, "Tasks External");
  adminToken = await register(ADMIN_EMAIL, "Tasks Admin");

  await query("UPDATE users SET role = 'admin' WHERE email = $1", [
    ADMIN_EMAIL,
  ]);

  const users = await query(
    `SELECT user_id, email FROM users WHERE email = ANY($1::text[])`,
    [[OWNER_EMAIL, MEMBER_EMAIL, EXTERNAL_EMAIL]]
  );

  const userIdByEmail = {};
  for (const row of users.rows) {
    userIdByEmail[row.email] = Number(row.user_id);
  }

  ownerId = userIdByEmail[OWNER_EMAIL];
  memberId = userIdByEmail[MEMBER_EMAIL];
  externalId = userIdByEmail[EXTERNAL_EMAIL];

  projectOneId = await createProject(ownerToken, "TSK1", "Tasks Project One");
  projectTwoId = await createProject(memberToken, "TSK2", "Tasks Project Two");
  projectThreeId = await createProject(externalToken, "TSK3", "Tasks Project Three");

  await query(
    `INSERT INTO project_members (project_id, user_id, member_role)
     VALUES ($1, $2, 'member')`,
    [projectOneId, memberId]
  );

  const category = await request(app)
    .post("/api/v1/categories")
    .set("Authorization", authed(ownerToken))
    .send({ category_name: "Tasks Fixture Category", color: "#2563EB" });

  categoryId = category.body.data.category.category_id;

  const fixture = await createTask(ownerToken, {
    title: "Fixture Task",
    description: "Shared fixture task",
    project_id: projectOneId,
  });

  fixtureTaskId = fixture.body.data.task.task_id;

  const assigned = await createTask(ownerToken, {
    title: "Assigned Fixture Task",
    project_id: projectOneId,
    assigned_to: memberId,
  });

  assignedTaskId = assigned.body.data.task.task_id;

  const parent = await createTask(ownerToken, {
    title: "Parent Fixture Task",
    project_id: projectOneId,
  });

  parentTaskId = parent.body.data.task.task_id;

  const child = await createTask(ownerToken, {
    title: "Child Fixture Task",
    project_id: projectOneId,
    parent_task_id: parentTaskId,
  });

  childTaskId = child.body.data.task.task_id;

  await createTask(ownerToken, {
    title: "In Progress Fixture Task",
    project_id: projectOneId,
    status: "in_progress",
  });

  await createTask(memberToken, {
    title: "Member Owned Project Task",
    project_id: projectTwoId,
  });

  await createTask(externalToken, {
    title: "External Project Task",
    project_id: projectThreeId,
  });
});

afterAll(async () => {
  if (dbAvailable) {
    try {
      const users = await query(
        `SELECT user_id FROM users
         WHERE email = ANY($1::text[])`,
        [[OWNER_EMAIL, MEMBER_EMAIL, EXTERNAL_EMAIL, ADMIN_EMAIL]]
      );

      const ids = users.rows.map((row) => row.user_id);

      if (ids.length > 0) {
        await query(
          `DELETE FROM tasks
           WHERE project_id IN (
             SELECT project_id FROM projects WHERE owner_id = ANY($1::bigint[])
           )`,
          [ids]
        );

        await query(
          `DELETE FROM projects WHERE owner_id = ANY($1::bigint[])`,
          [ids]
        );

        await query(
          "DELETE FROM categories WHERE user_id = ANY($1::bigint[])",
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
    console.warn("SKIPPED: tasks integration test (DB_PASSWORD not configured)");
    return false;
  }
  return true;
};

describe("Tasks authorization (no database required)", () => {
  test("GET /api/v1/tasks without token returns 401", async () => {
    const res = await request(app).get("/api/v1/tasks");
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("AUTHENTICATION_REQUIRED");
  });

  test("GET /api/v1/tasks/:id without token returns 401", async () => {
    const res = await request(app).get("/api/v1/tasks/1");
    expect(res.status).toBe(401);
  });

  test("POST /api/v1/tasks without token returns 401", async () => {
    const res = await request(app).post("/api/v1/tasks").send({
      title: "No Token Task",
    });
    expect(res.status).toBe(401);
  });

  test("PUT /api/v1/tasks/:id without token returns 401", async () => {
    const res = await request(app).put("/api/v1/tasks/1").send({
      title: "Updated",
    });
    expect(res.status).toBe(401);
  });

  test("PATCH /api/v1/tasks/:id/status without token returns 401", async () => {
    const res = await request(app)
      .patch("/api/v1/tasks/1/status")
      .send({ status: "to_do" });
    expect(res.status).toBe(401);
  });

  test("DELETE /api/v1/tasks/:id without token returns 401", async () => {
    const res = await request(app).delete("/api/v1/tasks/1");
    expect(res.status).toBe(401);
  });
});

describe("Tasks database integration (requires configured DB)", () => {
  describe("create", () => {
    test("create without project_id returns 422", async () => {
      if (!requireDb()) {
        return;
      }

      const res = await createTask(ownerToken, { title: "No Project Task" });
      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    test("owner creates task returns 201 with live defaults", async () => {
      if (!requireDb()) {
        return;
      }

      const res = await createTask(ownerToken, {
        title: "Defaults Task",
        project_id: projectOneId,
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.task.task_id).toBeDefined();
      expect(res.body.data.task.project_id).toBe(projectOneId);
      expect(res.body.data.task.created_by).toBe(ownerId);
      expect(res.body.data.task.assigned_to).toBeNull();
      expect(res.body.data.task.title).toBe("Defaults Task");
      expect(res.body.data.task.status).toBe("backlog");
      expect(res.body.data.task.urgency_priority).toBe("important_not_urgent");
      expect(res.body.data.task.agile_importance).toBe("medium");
      expect(res.body.data.task.progress_percentage).toBe(0);
      expect(res.body.data.task.actual_minutes).toBe(0);
      expect(res.body.data.task.completed_at).toBeNull();
      expect(res.body.data.task.project_name).toBe("Tasks Project One");
      expect(hasPasswordHash(res.body)).toBe(false);
    });

    test("create task with all live fields returns 201", async () => {
      if (!requireDb()) {
        return;
      }

      const res = await createTask(ownerToken, {
        title: "Full Fields Task",
        description: "Everything provided",
        project_id: projectOneId,
        category_id: categoryId,
        assigned_to: memberId,
        parent_task_id: parentTaskId,
        status: "to_do",
        urgency_priority: "important_urgent",
        agile_importance: "critical",
        start_date: "2026-01-01",
        due_date: "2026-12-31",
        estimated_minutes: 120,
        actual_minutes: 45,
        progress_percentage: 25,
      });

      expect(res.status).toBe(201);
      const task = res.body.data.task;
      expect(task.category_id).toBe(categoryId);
      expect(task.assigned_to).toBe(memberId);
      expect(task.parent_task_id).toBe(parentTaskId);
      expect(task.status).toBe("to_do");
      expect(task.urgency_priority).toBe("important_urgent");
      expect(task.agile_importance).toBe("critical");
      expect(task.estimated_minutes).toBe(120);
      expect(task.actual_minutes).toBe(45);
      expect(task.progress_percentage).toBe(25);
      expect(task.created_by_name).toBe("Tasks Owner");
      expect(task.assigned_to_name).toBe("Tasks Member");
      expect(task.parent_task_title).toBe("Parent Fixture Task");
      expect(hasPasswordHash(res.body)).toBe(false);
    });

    test("create task with status done forces progress 100 and completed_at", async () => {
      if (!requireDb()) {
        return;
      }

      const res = await createTask(ownerToken, {
        title: "Done On Create Task",
        project_id: projectOneId,
        status: "done",
      });

      expect(res.status).toBe(201);
      expect(res.body.data.task.status).toBe("done");
      expect(res.body.data.task.progress_percentage).toBe(100);
      expect(res.body.data.task.completed_at).not.toBeNull();
    });

    test("create task with progress 100 and non-done status returns 422", async () => {
      if (!requireDb()) {
        return;
      }

      const res = await createTask(ownerToken, {
        title: "Bad Progress Task",
        project_id: projectOneId,
        progress_percentage: 100,
      });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("INVALID_PROGRESS");
    });

    test("create task assigned to non-existent user returns 404", async () => {
      if (!requireDb()) {
        return;
      }

      const res = await createTask(ownerToken, {
        title: "Missing Assignee Task",
        project_id: projectOneId,
        assigned_to: 99999999,
      });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("ASSIGNEE_NOT_FOUND");
    });

    test("create task assigned to user outside the project returns 422", async () => {
      if (!requireDb()) {
        return;
      }

      const res = await createTask(ownerToken, {
        title: "Foreign Assignee Task",
        project_id: projectOneId,
        assigned_to: externalId,
      });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("ASSIGNEE_NOT_IN_PROJECT");
    });

    test("create task with non-existent parent returns 404", async () => {
      if (!requireDb()) {
        return;
      }

      const res = await createTask(ownerToken, {
        title: "Missing Parent Task",
        project_id: projectOneId,
        parent_task_id: 99999999,
      });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("PARENT_TASK_NOT_FOUND");
    });

    test("create task with parent in another project returns 422", async () => {
      if (!requireDb()) {
        return;
      }

      const res = await createTask(memberToken, {
        title: "Cross Project Parent Task",
        project_id: projectTwoId,
        parent_task_id: parentTaskId,
      });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("PARENT_TASK_NOT_IN_PROJECT");
    });

    test("create task referencing another user's category returns 403", async () => {
      if (!requireDb()) {
        return;
      }

      const res = await createTask(memberToken, {
        title: "Cross User Category Task",
        project_id: projectTwoId,
        category_id: categoryId,
      });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });

    test("create task referencing a non-existent category returns 404", async () => {
      if (!requireDb()) {
        return;
      }

      const res = await createTask(ownerToken, {
        title: "Missing Category Task",
        project_id: projectOneId,
        category_id: 99999999,
      });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("CATEGORY_NOT_FOUND");
    });

    test("external user cannot create task in another user's project returns 403", async () => {
      if (!requireDb()) {
        return;
      }

      const res = await createTask(externalToken, {
        title: "Cross User Project Task",
        project_id: projectOneId,
      });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });

    test("member creates task in a project they belong to returns 201", async () => {
      if (!requireDb()) {
        return;
      }

      const res = await createTask(memberToken, {
        title: "Member Created Task",
        project_id: projectOneId,
      });

      expect(res.status).toBe(201);
      expect(res.body.data.task.created_by).toBe(memberId);
    });

    test("rejects invalid title lengths with 422", async () => {
      if (!requireDb()) {
        return;
      }

      const cases = [{ title: "ab" }, { title: "x".repeat(151) }];

      for (const body of cases) {
        const res = await createTask(ownerToken, {
          ...body,
          project_id: projectOneId,
        });
        expect(res.status).toBe(422);
        expect(res.body.error.code).toBe("VALIDATION_ERROR");
      }
    });

    test("rejects invalid enums with 422", async () => {
      if (!requireDb()) {
        return;
      }

      const cases = [
        { status: "archived" },
        { urgency_priority: "urgent" },
        { agile_importance: "big" },
      ];

      for (const body of cases) {
        const res = await createTask(ownerToken, {
          title: "Bad Enum Task",
          project_id: projectOneId,
          ...body,
        });
        expect(res.status).toBe(422);
        expect(res.body.error.code).toBe("VALIDATION_ERROR");
      }
    });

    test("rejects invalid minutes with 422", async () => {
      if (!requireDb()) {
        return;
      }

      const cases = [
        { estimated_minutes: 0 },
        { estimated_minutes: -5 },
        { actual_minutes: -1 },
        { progress_percentage: 101 },
        { progress_percentage: -1 },
      ];

      for (const body of cases) {
        const res = await createTask(ownerToken, {
          title: "Bad Numbers Task",
          project_id: projectOneId,
          ...body,
        });
        expect(res.status).toBe(422);
        expect(res.body.error.code).toBe("VALIDATION_ERROR");
      }
    });

    test("rejects due_date before start_date with 422", async () => {
      if (!requireDb()) {
        return;
      }

      const res = await createTask(ownerToken, {
        title: "Bad Dates Task",
        project_id: projectOneId,
        start_date: "2026-12-31",
        due_date: "2026-01-01",
      });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("view", () => {
    test("owner views own task returns 200", async () => {
      if (!requireDb()) {
        return;
      }

      const res = await request(app)
        .get(`/api/v1/tasks/${fixtureTaskId}`)
        .set("Authorization", authed(ownerToken));

      expect(res.status).toBe(200);
      expect(res.body.data.task.task_id).toBe(fixtureTaskId);
    });

    test("project member can view task returns 200", async () => {
      if (!requireDb()) {
        return;
      }

      const res = await request(app)
        .get(`/api/v1/tasks/${fixtureTaskId}`)
        .set("Authorization", authed(memberToken));

      expect(res.status).toBe(200);
    });

    test("external user cannot view task returns 403", async () => {
      if (!requireDb()) {
        return;
      }

      const res = await request(app)
        .get(`/api/v1/tasks/${fixtureTaskId}`)
        .set("Authorization", authed(externalToken));

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });

    test("unknown task returns 404", async () => {
      if (!requireDb()) {
        return;
      }

      const res = await request(app)
        .get("/api/v1/tasks/99999999")
        .set("Authorization", authed(ownerToken));

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("TASK_NOT_FOUND");
    });
  });

  describe("list", () => {
    test("owner lists only tasks in accessible projects", async () => {
      if (!requireDb()) {
        return;
      }

      const res = await request(app)
        .get("/api/v1/tasks")
        .set("Authorization", authed(ownerToken));

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data.tasks)).toBe(true);
      expect(res.body.data.tasks.length).toBeGreaterThan(0);
      for (const task of res.body.data.tasks) {
        expect(task.project_id).toBe(projectOneId);
      }
    });

    test("member list excludes tasks from unshared projects", async () => {
      if (!requireDb()) {
        return;
      }

      const res = await request(app)
        .get("/api/v1/tasks")
        .set("Authorization", authed(memberToken));

      expect(res.status).toBe(200);
      expect(res.body.data.tasks.length).toBeGreaterThan(0);
      const projectIds = new Set(
        res.body.data.tasks.map((task) => task.project_id)
      );
      expect(projectIds.has(projectOneId)).toBe(true);
      expect(projectIds.has(projectTwoId)).toBe(true);
      expect(projectIds.has(projectThreeId)).toBe(false);
    });

    test("list tasks filtered by status returns only matches", async () => {
      if (!requireDb()) {
        return;
      }

      const res = await request(app)
        .get("/api/v1/tasks?status=in_progress")
        .set("Authorization", authed(ownerToken));

      expect(res.status).toBe(200);
      expect(res.body.data.tasks.length).toBeGreaterThan(0);
      for (const task of res.body.data.tasks) {
        expect(task.status).toBe("in_progress");
      }
    });

    test("list tasks filtered by urgency_priority returns only matches", async () => {
      if (!requireDb()) {
        return;
      }

      const res = await request(app)
        .get("/api/v1/tasks?urgency_priority=important_urgent")
        .set("Authorization", authed(ownerToken));

      expect(res.status).toBe(200);
      for (const task of res.body.data.tasks) {
        expect(task.urgency_priority).toBe("important_urgent");
      }
    });

    test("list tasks filtered by agile_importance returns only matches", async () => {
      if (!requireDb()) {
        return;
      }

      const res = await request(app)
        .get("/api/v1/tasks?agile_importance=critical")
        .set("Authorization", authed(ownerToken));

      expect(res.status).toBe(200);
      for (const task of res.body.data.tasks) {
        expect(task.agile_importance).toBe("critical");
      }
    });

    test("list tasks filtered by project_id returns only matches", async () => {
      if (!requireDb()) {
        return;
      }

      const res = await request(app)
        .get(`/api/v1/tasks?project_id=${projectOneId}`)
        .set("Authorization", authed(ownerToken));

      expect(res.status).toBe(200);
      expect(res.body.data.tasks.length).toBeGreaterThan(0);
      for (const task of res.body.data.tasks) {
        expect(task.project_id).toBe(projectOneId);
      }
    });

    test("list tasks filtered by assigned_to returns only matches", async () => {
      if (!requireDb()) {
        return;
      }

      const res = await request(app)
        .get(`/api/v1/tasks?assigned_to=${memberId}`)
        .set("Authorization", authed(ownerToken));

      expect(res.status).toBe(200);
      expect(res.body.data.tasks.length).toBeGreaterThan(0);
      for (const task of res.body.data.tasks) {
        expect(task.assigned_to).toBe(memberId);
      }
    });

    test("list tasks filtered by created_by returns only matches", async () => {
      if (!requireDb()) {
        return;
      }

      const res = await request(app)
        .get(`/api/v1/tasks?created_by=${ownerId}`)
        .set("Authorization", authed(ownerToken));

      expect(res.status).toBe(200);
      for (const task of res.body.data.tasks) {
        expect(task.created_by).toBe(ownerId);
      }
    });

    test("invalid list filters return 422", async () => {
      if (!requireDb()) {
        return;
      }

      const cases = [
        "?status=archived",
        "?urgency_priority=urgent",
        "?agile_importance=big",
        "?project_id=abc",
        "?assigned_to=abc",
      ];

      for (const queryString of cases) {
        const res = await request(app)
          .get(`/api/v1/tasks${queryString}`)
          .set("Authorization", authed(ownerToken));
        expect(res.status).toBe(422);
        expect(res.body.error.code).toBe("VALIDATION_ERROR");
      }
    });
  });

  describe("update", () => {
    test("owner updates task returns 200", async () => {
      if (!requireDb()) {
        return;
      }

      const res = await request(app)
        .put(`/api/v1/tasks/${fixtureTaskId}`)
        .set("Authorization", authed(ownerToken))
        .send({
          title: "Fixture Task Updated",
          description: "Updated description",
          urgency_priority: "important_urgent",
          agile_importance: "low",
          estimated_minutes: 90,
          actual_minutes: 30,
          progress_percentage: 50,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.task.title).toBe("Fixture Task Updated");
      expect(res.body.data.task.urgency_priority).toBe("important_urgent");
      expect(res.body.data.task.agile_importance).toBe("low");
      expect(res.body.data.task.estimated_minutes).toBe(90);
      expect(res.body.data.task.actual_minutes).toBe(30);
      expect(res.body.data.task.progress_percentage).toBe(50);
    });

    test("member who is neither creator nor assignee cannot update returns 403", async () => {
      if (!requireDb()) {
        return;
      }

      const res = await request(app)
        .put(`/api/v1/tasks/${fixtureTaskId}`)
        .set("Authorization", authed(memberToken))
        .send({ title: "Hijacked" });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });

    test("assignee can update the task returns 200", async () => {
      if (!requireDb()) {
        return;
      }

      const res = await request(app)
        .put(`/api/v1/tasks/${assignedTaskId}`)
        .set("Authorization", authed(memberToken))
        .send({ title: "Assignee Updated Task" });

      expect(res.status).toBe(200);
      expect(res.body.data.task.title).toBe("Assignee Updated Task");
    });

    test("external user cannot update task returns 403", async () => {
      if (!requireDb()) {
        return;
      }

      const res = await request(app)
        .put(`/api/v1/tasks/${fixtureTaskId}`)
        .set("Authorization", authed(externalToken))
        .send({ title: "External Hijack" });

      expect(res.status).toBe(403);
    });

    test("update assigned_to to user outside project returns 422", async () => {
      if (!requireDb()) {
        return;
      }

      const res = await request(app)
        .put(`/api/v1/tasks/${fixtureTaskId}`)
        .set("Authorization", authed(ownerToken))
        .send({ assigned_to: externalId });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("ASSIGNEE_NOT_IN_PROJECT");
    });

    test("updating to done sets progress 100 and completed_at", async () => {
      if (!requireDb()) {
        return;
      }

      const created = await createTask(ownerToken, {
        title: "Complete Via Update Task",
        project_id: projectOneId,
        status: "review",
      });

      const res = await request(app)
        .put(`/api/v1/tasks/${created.body.data.task.task_id}`)
        .set("Authorization", authed(ownerToken))
        .send({ status: "done" });

      expect(res.status).toBe(200);
      expect(res.body.data.task.status).toBe("done");
      expect(res.body.data.task.progress_percentage).toBe(100);
      expect(res.body.data.task.completed_at).not.toBeNull();
    });

    test("updating progress to 100 while not done returns 422", async () => {
      if (!requireDb()) {
        return;
      }

      const res = await request(app)
        .put(`/api/v1/tasks/${fixtureTaskId}`)
        .set("Authorization", authed(ownerToken))
        .send({ progress_percentage: 100 });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("INVALID_PROGRESS");
    });

    test("updating progress below 100 while done returns 422", async () => {
      if (!requireDb()) {
        return;
      }

      const created = await createTask(ownerToken, {
        title: "Done Then Reopen Progress Task",
        project_id: projectOneId,
        status: "done",
      });

      const res = await request(app)
        .put(`/api/v1/tasks/${created.body.data.task.task_id}`)
        .set("Authorization", authed(ownerToken))
        .send({ progress_percentage: 50 });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("INVALID_PROGRESS");
    });

    test("invalid status transition returns 422", async () => {
      if (!requireDb()) {
        return;
      }

      const created = await createTask(ownerToken, {
        title: "Bad Transition Task",
        project_id: projectOneId,
      });

      const res = await request(app)
        .patch(`/api/v1/tasks/${created.body.data.task.task_id}/status`)
        .set("Authorization", authed(ownerToken))
        .send({ status: "done" });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("INVALID_STATUS_TRANSITION");
    });

    test("reopening a done task clears completed_at and progress", async () => {
      if (!requireDb()) {
        return;
      }

      const created = await createTask(ownerToken, {
        title: "Reopen Task",
        project_id: projectOneId,
        status: "done",
      });

      const taskId = created.body.data.task.task_id;

      const res = await request(app)
        .patch(`/api/v1/tasks/${taskId}/status`)
        .set("Authorization", authed(ownerToken))
        .send({ status: "in_progress" });

      expect(res.status).toBe(200);
      expect(res.body.data.task.status).toBe("in_progress");
      expect(res.body.data.task.progress_percentage).toBe(0);
      expect(res.body.data.task.completed_at).toBeNull();
    });

    test("status workflow follows allowed transitions", async () => {
      if (!requireDb()) {
        return;
      }

      const created = await createTask(ownerToken, {
        title: "Workflow Task",
        project_id: projectOneId,
      });

      const taskId = created.body.data.task.task_id;
      const patch = async (status) => {
        const res = await request(app)
          .patch(`/api/v1/tasks/${taskId}/status`)
          .set("Authorization", authed(ownerToken))
          .send({ status });
        return res;
      };

      expect((await patch("to_do")).status).toBe(200);
      expect((await patch("in_progress")).status).toBe(200);
      expect((await patch("review")).status).toBe(200);

      const doneRes = await patch("done");
      expect(doneRes.status).toBe(200);
      expect(doneRes.body.data.task.progress_percentage).toBe(100);
      expect(doneRes.body.data.task.completed_at).not.toBeNull();

      const reopenRes = await patch("in_progress");
      expect(reopenRes.status).toBe(200);
      expect(reopenRes.body.data.task.progress_percentage).toBe(0);
      expect(reopenRes.body.data.task.completed_at).toBeNull();
    });

    test("PATCH with invalid status returns 422", async () => {
      if (!requireDb()) {
        return;
      }

      const res = await request(app)
        .patch(`/api/v1/tasks/${fixtureTaskId}/status`)
        .set("Authorization", authed(ownerToken))
        .send({ status: "archived" });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    test("assignee can change status returns 200", async () => {
      if (!requireDb()) {
        return;
      }

      const res = await request(app)
        .patch(`/api/v1/tasks/${assignedTaskId}/status`)
        .set("Authorization", authed(memberToken))
        .send({ status: "to_do" });

      expect(res.status).toBe(200);
      expect(res.body.data.task.status).toBe("to_do");
    });

    test("setting parent to self returns 422", async () => {
      if (!requireDb()) {
        return;
      }

      const res = await request(app)
        .put(`/api/v1/tasks/${childTaskId}`)
        .set("Authorization", authed(ownerToken))
        .send({ parent_task_id: childTaskId });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("CIRCULAR_PARENT_TASK");
    });

    test("setting parent to a descendant creates cycle and returns 422", async () => {
      if (!requireDb()) {
        return;
      }

      const res = await request(app)
        .put(`/api/v1/tasks/${parentTaskId}`)
        .set("Authorization", authed(ownerToken))
        .send({ parent_task_id: childTaskId });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("CIRCULAR_PARENT_TASK");
    });

    test("clearing parent_task_id returns 200", async () => {
      if (!requireDb()) {
        return;
      }

      const res = await request(app)
        .put(`/api/v1/tasks/${childTaskId}`)
        .set("Authorization", authed(ownerToken))
        .send({ parent_task_id: null });

      expect(res.status).toBe(200);
      expect(res.body.data.task.parent_task_id).toBeNull();
    });

    test("reject invalid update payloads with 422", async () => {
      if (!requireDb()) {
        return;
      }

      const cases = [
        { title: "x" },
        { title: "x".repeat(151) },
        { progress_percentage: 101 },
        { estimated_minutes: 0 },
        { actual_minutes: -1 },
        { status: "nope" },
        { urgency_priority: "urgent" },
        { agile_importance: "big" },
        { start_date: "not-a-date" },
        { due_date: "2026-01-01", start_date: "2026-12-31" },
      ];

      for (const body of cases) {
        const res = await request(app)
          .put(`/api/v1/tasks/${fixtureTaskId}`)
          .set("Authorization", authed(ownerToken))
          .send(body);
        expect(res.status).toBe(422);
        expect(res.body.error.code).toBe("VALIDATION_ERROR");
      }
    });
  });

  describe("delete", () => {
    test("member cannot delete a task they did not create returns 403", async () => {
      if (!requireDb()) {
        return;
      }

      const res = await request(app)
        .delete(`/api/v1/tasks/${fixtureTaskId}`)
        .set("Authorization", authed(memberToken));

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });

    test("creator deletes task returns 200 and 404 afterwards", async () => {
      if (!requireDb()) {
        return;
      }

      const created = await createTask(ownerToken, {
        title: "Task To Delete",
        project_id: projectOneId,
      });

      const taskId = created.body.data.task.task_id;

      const del = await request(app)
        .delete(`/api/v1/tasks/${taskId}`)
        .set("Authorization", authed(ownerToken));

      expect(del.status).toBe(200);
      expect(del.body.data.task_id).toBe(taskId);

      const after = await request(app)
        .get(`/api/v1/tasks/${taskId}`)
        .set("Authorization", authed(ownerToken));

      expect(after.status).toBe(404);
    });
  });

  describe("admin", () => {
    test("admin lists all tasks across projects", async () => {
      if (!requireDb()) {
        return;
      }

      const res = await request(app)
        .get("/api/v1/tasks")
        .set("Authorization", authed(adminToken));

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data.tasks)).toBe(true);
      const projectIds = new Set(
        res.body.data.tasks.map((task) => task.project_id)
      );
      expect(projectIds.has(projectThreeId)).toBe(true);
    });

    test("admin views any task returns 200", async () => {
      if (!requireDb()) {
        return;
      }

      const res = await request(app)
        .get(`/api/v1/tasks/${fixtureTaskId}`)
        .set("Authorization", authed(adminToken));

      expect(res.status).toBe(200);
    });

    test("admin creates task in any project returns 201", async () => {
      if (!requireDb()) {
        return;
      }

      const res = await createTask(adminToken, {
        title: "Admin Created Task",
        project_id: projectOneId,
      });

      expect(res.status).toBe(201);
    });

    test("admin deletes any task returns 200", async () => {
      if (!requireDb()) {
        return;
      }

      const created = await createTask(ownerToken, {
        title: "Admin Deletes Task",
        project_id: projectOneId,
      });

      const res = await request(app)
        .delete(`/api/v1/tasks/${created.body.data.task.task_id}`)
        .set("Authorization", authed(adminToken));

      expect(res.status).toBe(200);
    });
  });
});
