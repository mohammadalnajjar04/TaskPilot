process.env.NODE_ENV = "test";

const fs = require("fs/promises");
const path = require("path");
const request = require("supertest");
const app = require("../src/app");
const {
  testDatabaseConnection,
  query,
  closeDatabaseConnection,
} = require("../src/config/db");

const TEST_PASSWORD = "StrongPass123!";

const OWNER_EMAIL = "att.owner.test@example.com";
const CREATOR_EMAIL = "att.creator.test@example.com";
const MEMBER_EMAIL = "att.member.test@example.com";
const ADMIN_EMAIL = "att.admin.test@example.com";
const EXTERNAL_EMAIL = "att.external.test@example.com";

const UPLOAD_DIR = path.join(
  __dirname,
  "..",
  "uploads",
  "task-attachments"
);

const MAX_FILE_SIZE = 5 * 1024 * 1024;

let dbAvailable = false;

let ownerToken = null;
let creatorToken = null;
let memberToken = null;
let adminToken = null;
let externalToken = null;

let ownerId = null;
let creatorId = null;
let adminId = null;

let projectId = null;
let taskOneId = null;
let taskTwoId = null;

let fixtureAttachmentId = null;
let uploadedId = null;

let initialFiles = new Set();

const authed = (token) => `Bearer ${token}`;

const hasPasswordHash = (obj) => {
  const serialized = JSON.stringify(obj);
  return (
    serialized.includes("password_hash") || serialized.includes("passwordHash")
  );
};

const hasAbsolutePath = (obj) => {
  const serialized = JSON.stringify(obj);
  return (
    serialized.includes("C:") ||
    serialized.includes(":\\") ||
    serialized.includes("\\")
  );
};

const attachmentsPath = (taskId) =>
  `/api/v1/tasks/${taskId}/attachments`;

const listAttachments = (token, taskId) =>
  request(app)
    .get(attachmentsPath(taskId))
    .set("Authorization", authed(token));

const getAttachment = (token, taskId, attachmentId) =>
  request(app)
    .get(`${attachmentsPath(taskId)}/${attachmentId}`)
    .set("Authorization", authed(token));

const uploadFile = (token, taskId, buffer, name, contentType, fields = {}) => {
  let req = request(app)
    .post(attachmentsPath(taskId))
    .set("Authorization", authed(token))
    .attach("file", buffer, { filename: name, contentType });

  for (const [key, value] of Object.entries(fields)) {
    req = req.field(key, value);
  }

  return req;
};

const deleteAttachment = (token, taskId, attachmentId) =>
  request(app)
    .delete(`${attachmentsPath(taskId)}/${attachmentId}`)
    .set("Authorization", authed(token));

const listDir = async () => {
  try {
    const names = await fs.readdir(UPLOAD_DIR);
    return new Set(names);
  } catch (error) {
    if (error.code === "ENOENT") {
      return new Set();
    }
    throw error;
  }
};

const fileExists = async (filePath) => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

const getStoredPath = async (attachmentId) => {
  const res = await query(
    "SELECT file_path FROM task_attachments WHERE attachment_id = $1",
    [attachmentId]
  );

  return res.rows[0] ? res.rows[0].file_path : null;
};

const requireDb = () => {
  if (!dbAvailable) {
    console.warn(
      "SKIPPED: task attachments integration test (DB not configured)"
    );
    return false;
  }
  return true;
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

  initialFiles = await listDir();

  const register = async (email, fullName) => {
    const res = await request(app).post("/api/v1/auth/register").send({
      fullName,
      email,
      password: TEST_PASSWORD,
    });
    return res.body.data.accessToken;
  };

  ownerToken = await register(OWNER_EMAIL, "ATT Owner");
  creatorToken = await register(CREATOR_EMAIL, "ATT Creator");
  memberToken = await register(MEMBER_EMAIL, "ATT Member");
  adminToken = await register(ADMIN_EMAIL, "ATT Admin");
  externalToken = await register(EXTERNAL_EMAIL, "ATT External");

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
      project_key: "ATT1",
      project_name: "Attachments Fixture Project",
      description: "Shared fixture project for attachment tests",
    });

  projectId = created.body.data.project.project_id;

  await query(
    `INSERT INTO project_members (project_id, user_id, member_role)
     SELECT $1, user_id, 'member'
     FROM users
     WHERE email = ANY($2::text[])`,
    [projectId, [CREATOR_EMAIL, MEMBER_EMAIL]]
  );

  const taskOne = await request(app)
    .post("/api/v1/tasks")
    .set("Authorization", authed(creatorToken))
    .send({
      project_id: projectId,
      title: "Attachments Fixture Task One",
    });

  taskOneId = taskOne.body.data.task.task_id;

  const taskTwo = await request(app)
    .post("/api/v1/tasks")
    .set("Authorization", authed(creatorToken))
    .send({
      project_id: projectId,
      title: "Attachments Fixture Task Two",
    });

  taskTwoId = taskTwo.body.data.task.task_id;

  const fixture = await uploadFile(
    creatorToken,
    taskOneId,
    Buffer.from("fixture attachment"),
    "fixture.txt",
    "text/plain"
  );

  fixtureAttachmentId = fixture.body.data.attachment.attachment_id;
});

afterAll(async () => {
  if (dbAvailable) {
    try {
      const currentFiles = await listDir();
      for (const name of currentFiles) {
        if (!initialFiles.has(name)) {
          try {
            await fs.unlink(path.join(UPLOAD_DIR, name));
          } catch {
            // already gone
          }
        }
      }

      const userIds = await query(
        `SELECT user_id FROM users
         WHERE email = ANY($1::text[])`,
        [
          [
            OWNER_EMAIL,
            CREATOR_EMAIL,
            MEMBER_EMAIL,
            ADMIN_EMAIL,
            EXTERNAL_EMAIL,
          ],
        ]
      );

      const ids = userIds.rows.map((row) => row.user_id);

      if (ids.length > 0) {
        await query(
          `DELETE FROM task_attachments
           WHERE task_id IN (
             SELECT task_id FROM tasks WHERE project_id IN (
               SELECT project_id FROM projects WHERE owner_id = ANY($1::bigint[])
             )
           )`,
          [ids]
        );

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

describe("Task attachments authorization (no database required)", () => {
  test("GET attachments without token returns 401", async () => {
    const res = await request(app).get(attachmentsPath(1));
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("AUTHENTICATION_REQUIRED");
  });

  test("GET one attachment without token returns 401", async () => {
    const res = await request(app).get(`${attachmentsPath(1)}/1`);
    expect(res.status).toBe(401);
  });

  test("POST attachment without token returns 401", async () => {
    const res = await request(app)
      .post(attachmentsPath(1))
      .attach("file", Buffer.from("hi"), {
        filename: "x.txt",
        contentType: "text/plain",
      });
    expect(res.status).toBe(401);
  });

  test("DELETE attachment without token returns 401", async () => {
    const res = await request(app).delete(`${attachmentsPath(1)}/1`);
    expect(res.status).toBe(401);
  });
});

describe("Task attachments database integration (requires configured DB)", () => {
  test("owner lists attachments returns 200 with safe fields", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await listAttachments(ownerToken, taskOneId);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.attachments)).toBe(true);

    const ids = res.body.data.attachments.map((a) => Number(a.attachment_id));
    expect(ids).toContain(Number(fixtureAttachmentId));

    for (const attachment of res.body.data.attachments) {
      expect(attachment.attachment_id).toBeDefined();
      expect(attachment.task_id).toBeDefined();
      expect(attachment.file_name).toBeDefined();
      expect(attachment.mime_type).toBeDefined();
      expect(attachment.file_size).toBeDefined();
      expect(attachment.uploaded_at).toBeDefined();
      expect(attachment.uploader_user_id).toBeDefined();
      expect(attachment.uploader_full_name).toBeDefined();
      expect(attachment.uploader_email).toBeDefined();
      expect(attachment.file_path).toBeUndefined();
      expect(attachment.download_url).toBeDefined();
    }

    expect(hasPasswordHash(res.body)).toBe(false);
    expect(hasAbsolutePath(res.body)).toBe(false);
  });

  test("task creator lists attachments returns 200", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await listAttachments(creatorToken, taskOneId);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test("external user listing attachments returns 403", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await listAttachments(externalToken, taskOneId);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });

  test("external user uploading returns 403", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await uploadFile(
      externalToken,
      taskOneId,
      Buffer.from("nope"),
      "nope.txt",
      "text/plain"
    );
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });

  test("valid upload returns 201 with safe metadata", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await uploadFile(
      creatorToken,
      taskOneId,
      Buffer.from("hello attachment"),
      "hello.txt",
      "text/plain"
    );

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);

    const attachment = res.body.data.attachment;
    expect(Number(attachment.task_id)).toBe(Number(taskOneId));
    expect(Number(attachment.uploaded_by)).toBe(creatorId);
    expect(attachment.file_name).toBe("hello.txt");
    expect(attachment.mime_type).toBe("text/plain");
    expect(attachment.file_size).toBe(Buffer.byteLength("hello attachment"));
    expect(attachment.uploader_email).toBe(CREATOR_EMAIL);
    expect(attachment.file_path).toBeUndefined();
    expect(attachment.download_url).toMatch(/^\/uploads\/task-attachments\//);
    expect(hasPasswordHash(res.body)).toBe(false);
    expect(hasAbsolutePath(res.body)).toBe(false);

    uploadedId = attachment.attachment_id;
  });

  test("uploaded_by from request body is ignored", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await uploadFile(
      creatorToken,
      taskOneId,
      Buffer.from("spoofed author"),
      "spoof.txt",
      "text/plain",
      { uploaded_by: String(adminId) }
    );

    expect(res.status).toBe(201);
    expect(Number(res.body.data.attachment.uploaded_by)).toBe(creatorId);
    expect(Number(res.body.data.attachment.uploaded_by)).not.toBe(adminId);

    await deleteAttachment(creatorToken, taskOneId, res.body.data.attachment.attachment_id);
  });

  test("missing file returns 422 FILE_REQUIRED", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await request(app)
      .post(attachmentsPath(taskOneId))
      .set("Authorization", authed(creatorToken))
      .send({});
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("FILE_REQUIRED");
  });

  test("unsupported MIME returns 422 UNSUPPORTED_FILE_TYPE", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await uploadFile(
      creatorToken,
      taskOneId,
      Buffer.from("MZ..."),
      "evil.exe",
      "application/x-msdownload"
    );
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("UNSUPPORTED_FILE_TYPE");
  });

  test("file larger than 5 MB returns 413 FILE_TOO_LARGE", async () => {
    if (!requireDb()) {
      return;
    }

    const big = Buffer.alloc(MAX_FILE_SIZE + 4096, 1);
    const res = await uploadFile(
      creatorToken,
      taskOneId,
      big,
      "big.bin",
      "application/zip"
    );
    expect(res.status).toBe(413);
    expect(res.body.error.code).toBe("FILE_TOO_LARGE");
  });

  test("invalid taskId returns 422", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await listAttachments(creatorToken, "abc");
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  test("invalid attachmentId returns 422", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await getAttachment(creatorToken, taskOneId, "abc");
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  test("get one attachment returns metadata", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await getAttachment(creatorToken, taskOneId, uploadedId);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Number(res.body.data.attachment.attachment_id)).toBe(
      Number(uploadedId)
    );
    expect(res.body.data.attachment.file_name).toBe("hello.txt");
    expect(res.body.data.attachment.download_url).toMatch(
      /^\/uploads\/task-attachments\//
    );
    expect(res.body.data.attachment.file_path).toBeUndefined();
    expect(hasPasswordHash(res.body)).toBe(false);
    expect(hasAbsolutePath(res.body)).toBe(false);
  });

  test("wrong task/attachment combination returns 404", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await getAttachment(ownerToken, taskTwoId, uploadedId);
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("ATTACHMENT_NOT_FOUND");
  });

  test("unknown attachment returns 404", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await getAttachment(ownerToken, taskOneId, 999999999);
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("ATTACHMENT_NOT_FOUND");
  });

  test("attachment uploader can delete, DB row and file are removed", async () => {
    if (!requireDb()) {
      return;
    }

    const upload = await uploadFile(
      creatorToken,
      taskOneId,
      Buffer.from("delete me"),
      "delete-me.txt",
      "text/plain"
    );
    const id = upload.body.data.attachment.attachment_id;

    const storedPath = await getStoredPath(id);
    expect(storedPath).toBeTruthy();

    const del = await deleteAttachment(creatorToken, taskOneId, id);
    expect(del.status).toBe(200);
    expect(del.body.success).toBe(true);

    const rowRes = await query(
      "SELECT 1 FROM task_attachments WHERE attachment_id = $1",
      [id]
    );
    expect(rowRes.rows).toHaveLength(0);

    expect(await fileExists(storedPath)).toBe(false);
    expect(hasAbsolutePath(del.body)).toBe(false);
  });

  test("project owner can delete another user's attachment", async () => {
    if (!requireDb()) {
      return;
    }

    const upload = await uploadFile(
      memberToken,
      taskOneId,
      Buffer.from("member upload"),
      "member.txt",
      "text/plain"
    );
    const id = upload.body.data.attachment.attachment_id;
    expect(Number(upload.body.data.attachment.uploaded_by)).not.toBe(ownerId);

    const storedPath = await getStoredPath(id);

    const del = await deleteAttachment(ownerToken, taskOneId, id);
    expect(del.status).toBe(200);

    const rowRes = await query(
      "SELECT 1 FROM task_attachments WHERE attachment_id = $1",
      [id]
    );
    expect(rowRes.rows).toHaveLength(0);

    expect(await fileExists(storedPath)).toBe(false);
  });

  test("unauthorized member cannot delete another user's attachment", async () => {
    if (!requireDb()) {
      return;
    }

    const upload = await uploadFile(
      creatorToken,
      taskOneId,
      Buffer.from("protected"),
      "protected.txt",
      "text/plain"
    );
    const id = upload.body.data.attachment.attachment_id;

    const del = await deleteAttachment(memberToken, taskOneId, id);
    expect(del.status).toBe(403);
    expect(del.body.error.code).toBe("FORBIDDEN");

    const rowRes = await query(
      "SELECT 1 FROM task_attachments WHERE attachment_id = $1",
      [id]
    );
    expect(rowRes.rows).toHaveLength(1);

    await deleteAttachment(ownerToken, taskOneId, id);
  });

  test("external user cannot delete returns 403", async () => {
    if (!requireDb()) {
      return;
    }

    const upload = await uploadFile(
      creatorToken,
      taskOneId,
      Buffer.from("ext guard"),
      "ext.txt",
      "text/plain"
    );
    const id = upload.body.data.attachment.attachment_id;

    const del = await deleteAttachment(externalToken, taskOneId, id);
    expect(del.status).toBe(403);

    await deleteAttachment(ownerToken, taskOneId, id);
  });

  test("deleting when physical file is already missing still succeeds", async () => {
    if (!requireDb()) {
      return;
    }

    const upload = await uploadFile(
      creatorToken,
      taskOneId,
      Buffer.from("missing file"),
      "missing.txt",
      "text/plain"
    );
    const id = upload.body.data.attachment.attachment_id;

    const storedPath = await getStoredPath(id);
    expect(await fileExists(storedPath)).toBe(true);
    await fs.unlink(storedPath);
    expect(await fileExists(storedPath)).toBe(false);

    const del = await deleteAttachment(creatorToken, taskOneId, id);
    expect(del.status).toBe(200);
    expect(del.body.success).toBe(true);

    const rowRes = await query(
      "SELECT 1 FROM task_attachments WHERE attachment_id = $1",
      [id]
    );
    expect(rowRes.rows).toHaveLength(0);
  });

  test("list ordering and download_url safety", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await listAttachments(ownerToken, taskOneId);

    for (const attachment of res.body.data.attachments) {
      expect(attachment.file_path).toBeUndefined();
      expect(attachment.download_url).toMatch(
        /^\/uploads\/task-attachments\/[^/]+$/
      );
      expect(attachment.download_url).not.toContain("..");
      expect(attachment.download_url).not.toContain("\\");
    }

    expect(hasPasswordHash(res.body)).toBe(false);
    expect(hasAbsolutePath(res.body)).toBe(false);
  });

  test("activity logs record CREATE and DELETE with project_id and task_id", async () => {
    if (!requireDb()) {
      return;
    }

    const upload = await uploadFile(
      creatorToken,
      taskOneId,
      Buffer.from("activity probe"),
      "activity.txt",
      "text/plain"
    );
    const id = upload.body.data.attachment.attachment_id;

    await deleteAttachment(creatorToken, taskOneId, id);

    const logs = await query(
      `SELECT action_type, task_id, project_id
       FROM activity_logs
       WHERE action_type = ANY($1::text[])
         AND task_id = $2
         AND user_id = $3
       ORDER BY log_id DESC
       LIMIT 5`,
      [
        ["TASK_ATTACHMENT_CREATED", "TASK_ATTACHMENT_DELETED"],
        taskOneId,
        creatorId,
      ]
    );

    const actions = logs.rows.map((row) => row.action_type);

    expect(actions).toContain("TASK_ATTACHMENT_CREATED");
    expect(actions).toContain("TASK_ATTACHMENT_DELETED");

    for (const row of logs.rows) {
      expect(Number(row.task_id)).toBe(Number(taskOneId));
      expect(Number(row.project_id)).toBe(Number(projectId));
    }
  });
});
