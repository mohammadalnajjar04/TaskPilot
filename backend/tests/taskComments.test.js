process.env.NODE_ENV = "test";

const request = require("supertest");
const app = require("../src/app");
const {
  testDatabaseConnection,
  query,
  closeDatabaseConnection,
} = require("../src/config/db");

const TEST_PASSWORD = "StrongPass123!";

const OWNER_EMAIL = "tcm.owner.test@example.com";
const CREATOR_EMAIL = "tcm.creator.test@example.com";
const ASSIGNEE_EMAIL = "tcm.assignee.test@example.com";
const MEMBER_EMAIL = "tcm.member.test@example.com";
const ADMIN_EMAIL = "tcm.admin.test@example.com";
const EXTERNAL_EMAIL = "tcm.external.test@example.com";

let dbAvailable = false;

let ownerToken = null;
let creatorToken = null;
let assigneeToken = null;
let memberToken = null;
let adminToken = null;
let externalToken = null;

let ownerId = null;
let creatorId = null;
let adminId = null;

let projectId = null;
let taskOneId = null;
let taskTwoId = null;

let commentAId = null;
let commentBId = null;
let commentCId = null;

const authed = (token) => `Bearer ${token}`;

const hasPasswordHash = (obj) => {
  const serialized = JSON.stringify(obj);
  return (
    serialized.includes("password_hash") || serialized.includes("passwordHash")
  );
};

const commentPath = (taskId) => `/api/v1/tasks/${taskId}/comments`;

const listComments = (token, taskId) =>
  request(app).get(commentPath(taskId)).set("Authorization", authed(token));

const createComment = (token, taskId, body) =>
  request(app)
    .post(commentPath(taskId))
    .set("Authorization", authed(token))
    .send(body);

const updateComment = (token, taskId, commentId, body) =>
  request(app)
    .put(`${commentPath(taskId)}/${commentId}`)
    .set("Authorization", authed(token))
    .send(body);

const deleteComment = (token, taskId, commentId) =>
  request(app)
    .delete(`${commentPath(taskId)}/${commentId}`)
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

  ownerToken = await register(OWNER_EMAIL, "TC Owner");
  creatorToken = await register(CREATOR_EMAIL, "TC Creator");
  assigneeToken = await register(ASSIGNEE_EMAIL, "TC Assignee");
  memberToken = await register(MEMBER_EMAIL, "TC Member");
  adminToken = await register(ADMIN_EMAIL, "TC Admin");
  externalToken = await register(EXTERNAL_EMAIL, "TC External");

  await query("UPDATE users SET role = 'admin' WHERE email = $1", [
    ADMIN_EMAIL,
  ]);

  const users = await query(
    `SELECT user_id, email FROM users
     WHERE email = ANY($1::text[])`,
    [[OWNER_EMAIL, CREATOR_EMAIL, ADMIN_EMAIL]]
  );

  const userIdByEmail = {};
  for (const row of users.rows) {
    userIdByEmail[row.email] = Number(row.user_id);
  }

  ownerId = userIdByEmail[OWNER_EMAIL];
  creatorId = userIdByEmail[CREATOR_EMAIL];
  adminId = userIdByEmail[ADMIN_EMAIL];

  const created = await request(app)
    .post("/api/v1/projects")
    .set("Authorization", authed(ownerToken))
    .send({
      project_key: "TCM1",
      project_name: "Comments Fixture Project",
      description: "Shared fixture project for comment tests",
    });

  projectId = created.body.data.project.project_id;

  await query(
    `INSERT INTO project_members (project_id, user_id, member_role)
     SELECT $1, user_id, 'member'
     FROM users
     WHERE email = ANY($2::text[])`,
    [projectId, [CREATOR_EMAIL, ASSIGNEE_EMAIL, MEMBER_EMAIL]]
  );

  const assigneeRows = await query(
    `SELECT user_id FROM users WHERE email = $1`,
    [ASSIGNEE_EMAIL]
  );
  const assigneeId = Number(assigneeRows.rows[0].user_id);

  const taskOne = await request(app)
    .post("/api/v1/tasks")
    .set("Authorization", authed(creatorToken))
    .send({
      project_id: projectId,
      title: "Comments Fixture Task One",
      assigned_to: assigneeId,
    });

  taskOneId = taskOne.body.data.task.task_id;

  const taskTwo = await request(app)
    .post("/api/v1/tasks")
    .set("Authorization", authed(creatorToken))
    .send({
      project_id: projectId,
      title: "Comments Fixture Task Two",
    });

  taskTwoId = taskTwo.body.data.task.task_id;

  const commentA = await createComment(creatorToken, taskOneId, {
    comment_text: "  First fixture comment  ",
  });

  commentAId = commentA.body.data.comment.comment_id;
});

afterAll(async () => {
  if (dbAvailable) {
    try {
      const userIds = await query(
        `SELECT user_id FROM users
         WHERE email = ANY($1::text[])`,
        [[OWNER_EMAIL, CREATOR_EMAIL, ASSIGNEE_EMAIL, MEMBER_EMAIL, ADMIN_EMAIL, EXTERNAL_EMAIL]]
      );

      const ids = userIds.rows.map((row) => row.user_id);

      if (ids.length > 0) {
        await query(
          `DELETE FROM task_comments
           WHERE task_id IN (
             SELECT task_id FROM tasks WHERE project_id IN (
               SELECT project_id FROM projects WHERE owner_id = ANY($1::bigint[])
             )
           )`,
          [ids]
        );

        await query(
          `DELETE FROM tasks
           WHERE project_id IN (
             SELECT project_id FROM projects WHERE owner_id = ANY($1::bigint[])
           )`,
          [ids]
        );

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
    console.warn("SKIPPED: task comments integration test (DB not configured)");
    return false;
  }
  return true;
};

describe("Task comments authorization (no database required)", () => {
  test("GET comments without token returns 401", async () => {
    const res = await request(app).get(commentPath(1));
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("AUTHENTICATION_REQUIRED");
  });

  test("POST comments without token returns 401", async () => {
    const res = await request(app)
      .post(commentPath(1))
      .send({ comment_text: "hello" });
    expect(res.status).toBe(401);
  });

  test("PUT comment without token returns 401", async () => {
    const res = await request(app)
      .put(`${commentPath(1)}/1`)
      .send({ comment_text: "hello" });
    expect(res.status).toBe(401);
  });

  test("DELETE comment without token returns 401", async () => {
    const res = await request(app).delete(`${commentPath(1)}/1`);
    expect(res.status).toBe(401);
  });
});

describe("Task comments database integration (requires configured DB)", () => {
  test("owner lists comments returns 200 with safe author fields", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await listComments(ownerToken, taskOneId);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.comments)).toBe(true);

    const ids = res.body.data.comments.map((c) => Number(c.comment_id));
    expect(ids).toContain(Number(commentAId));

    for (const comment of res.body.data.comments) {
      expect(comment.task_id).toBeDefined();
      expect(comment.user_id).toBeDefined();
      expect(comment.comment_text).toBeDefined();
      expect(comment.created_at).toBeDefined();
      expect(comment.updated_at).toBeDefined();
      expect(comment.full_name).toBeDefined();
      expect(comment.email).toBeDefined();
    }

    expect(hasPasswordHash(res.body)).toBe(false);
  });

  test("project member lists comments returns 200", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await listComments(memberToken, taskOneId);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.comments)).toBe(true);
  });

  test("task creator lists comments returns 200", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await listComments(creatorToken, taskOneId);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test("task assignee lists comments returns 200", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await listComments(assigneeToken, taskOneId);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test("external user listing comments returns 403", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await listComments(externalToken, taskOneId);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });

  test("external user creating a comment returns 403", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await createComment(externalToken, taskOneId, {
      comment_text: "not allowed",
    });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });

  test("unknown task returns 404", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await listComments(ownerToken, 999999999);
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("TASK_NOT_FOUND");
  });

  test("authorized user creates comment returns 201", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await createComment(creatorToken, taskOneId, {
      comment_text: "  A new comment  ",
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.comment.comment_text).toBe("A new comment");
    expect(Number(res.body.data.comment.user_id)).toBe(creatorId);
    expect(res.body.data.comment.full_name).toBeDefined();
    expect(res.body.data.comment.email).toBe(CREATOR_EMAIL);
    expect(hasPasswordHash(res.body)).toBe(false);

    commentBId = res.body.data.comment.comment_id;
  });

  test("user_id from body is ignored", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await createComment(creatorToken, taskOneId, {
      comment_text: "Spoofed author attempt",
      user_id: adminId,
    });

    expect(res.status).toBe(201);
    expect(Number(res.body.data.comment.user_id)).toBe(creatorId);

    await deleteComment(creatorToken, taskOneId, res.body.data.comment.comment_id);
  });

  test("empty comment returns 422", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await createComment(creatorToken, taskOneId, {
      comment_text: "",
    });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  test("whitespace-only comment returns 422", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await createComment(creatorToken, taskOneId, {
      comment_text: "    ",
    });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  test("missing comment_text returns 422", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await createComment(creatorToken, taskOneId, {});
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  test("author updates comment returns 200", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await updateComment(creatorToken, taskOneId, commentBId, {
      comment_text: "  Updated by author  ",
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.comment.comment_text).toBe("Updated by author");
    expect(Number(res.body.data.comment.user_id)).toBe(creatorId);
    expect(Number(res.body.data.comment.task_id)).toBe(Number(taskOneId));
  });

  test("non-author cannot update a comment", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await updateComment(memberToken, taskOneId, commentBId, {
      comment_text: "hijack attempt",
    });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });

  test("admin updates a comment returns 200", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await updateComment(adminToken, taskOneId, commentBId, {
      comment_text: "Updated by admin",
    });

    expect(res.status).toBe(200);
    expect(res.body.data.comment.comment_text).toBe("Updated by admin");
    expect(Number(res.body.data.comment.user_id)).toBe(creatorId);
    expect(Number(res.body.data.comment.task_id)).toBe(Number(taskOneId));
  });

  test("author deletes own comment returns 200", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await deleteComment(creatorToken, taskOneId, commentBId);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Number(res.body.data.comment_id)).toBe(Number(commentBId));
  });

  test("project owner deletes another user's comment", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await deleteComment(ownerToken, taskOneId, commentAId);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Number(res.body.data.comment_id)).toBe(Number(commentAId));
  });

  test("comment/task mismatch returns 404", async () => {
    if (!requireDb()) {
      return;
    }

    const created = await createComment(creatorToken, taskOneId, {
      comment_text: "Mismatch probe comment",
    });
    commentCId = created.body.data.comment.comment_id;

    const listRes = await listComments(ownerToken, taskTwoId);
    const inWrongTask = listRes.body.data.comments.some(
      (c) => Number(c.comment_id) === Number(commentCId)
    );
    expect(inWrongTask).toBe(false);

    const putRes = await updateComment(ownerToken, taskTwoId, commentCId, {
      comment_text: "wrong task",
    });
    expect(putRes.status).toBe(404);
    expect(putRes.body.error.code).toBe("COMMENT_NOT_FOUND");

    const delRes = await deleteComment(ownerToken, taskTwoId, commentCId);
    expect(delRes.status).toBe(404);
    expect(delRes.body.error.code).toBe("COMMENT_NOT_FOUND");
  });

  test("comments are ordered by created_at ASC then comment_id ASC", async () => {
    if (!requireDb()) {
      return;
    }

    const created = [];
    for (let i = 0; i < 3; i++) {
      const res = await createComment(creatorToken, taskOneId, {
        comment_text: `Ordering probe ${i}`,
      });
      created.push(res.body.data.comment);
    }

    const listRes = await listComments(ownerToken, taskOneId);
    const byId = new Map(
      listRes.body.data.comments.map((c) => [Number(c.comment_id), c])
    );

    const probes = created.map((c) => byId.get(Number(c.comment_id)));
    expect(probes).not.toContain(undefined);

    const ids = probes.map((c) => Number(c.comment_id));
    expect([...ids].sort((a, b) => a - b)).toEqual(ids);

    const keys = probes.map(
      (c) => `${c.created_at}|${String(c.comment_id).padStart(20, "0")}`
    );
    expect(keys).toEqual([...keys].sort());

    for (const comment of created) {
      await deleteComment(creatorToken, taskOneId, comment.comment_id);
    }
  });

  test("unauthorized member cannot delete another user's comment", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await deleteComment(memberToken, taskOneId, commentCId);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");

    await deleteComment(creatorToken, taskOneId, commentCId);
  });

  test("unknown comment returns 404", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await deleteComment(ownerToken, taskOneId, 999999999);
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("COMMENT_NOT_FOUND");
  });

  test("no comment response contains password_hash", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await listComments(ownerToken, taskOneId);
    expect(hasPasswordHash(res.body)).toBe(false);
  });

  test("activity events include task_id and project_id", async () => {
    if (!requireDb()) {
      return;
    }

    const created = await createComment(creatorToken, taskOneId, {
      comment_text: "Activity probe comment",
    });
    const probeId = created.body.data.comment.comment_id;

    await updateComment(creatorToken, taskOneId, probeId, {
      comment_text: "Activity probe updated",
    });

    await deleteComment(creatorToken, taskOneId, probeId);

    const logs = await query(
      `SELECT action_type, task_id, project_id
       FROM activity_logs
       WHERE action_type = ANY($1::text[])
         AND task_id = $2
         AND user_id = $3
       ORDER BY log_id DESC
       LIMIT 5`,
      [
        ["TASK_COMMENT_CREATED", "TASK_COMMENT_UPDATED", "TASK_COMMENT_DELETED"],
        taskOneId,
        creatorId,
      ]
    );

    const actions = logs.rows.map((row) => row.action_type);

    expect(actions).toContain("TASK_COMMENT_CREATED");
    expect(actions).toContain("TASK_COMMENT_UPDATED");
    expect(actions).toContain("TASK_COMMENT_DELETED");

    for (const row of logs.rows) {
      expect(Number(row.task_id)).toBe(Number(taskOneId));
      expect(Number(row.project_id)).toBe(Number(projectId));
    }
  });
});
