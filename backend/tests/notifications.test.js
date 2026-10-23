process.env.NODE_ENV = "test";

const request = require("supertest");
const app = require("../src/app");
const notificationService = require("../src/services/notificationService");
const {
  testDatabaseConnection,
  query,
  closeDatabaseConnection,
} = require("../src/config/db");

const TEST_PASSWORD = "StrongPass123!";

const OWNER_EMAIL = "notif.owner.test@example.com";
const OTHER_EMAIL = "notif.other.test@example.com";
const INACTIVE_EMAIL = "notif.inactive.test@example.com";

let dbAvailable = false;

let ownerToken = null;
let otherToken = null;

let ownerId = null;
let otherId = null;
let inactiveId = null;

let projectOneId = null;
let projectTwoId = null;
let taskOneId = null;
let taskTwoId = null;

let nA1 = null;
let nA2 = null;
let nA3 = null;
let nB1 = null;
let nA4 = null;

const authed = (token) => `Bearer ${token}`;

const notificationsPath = "/api/v1/notifications";

const listNotifications = (token, queryParams = {}) =>
  request(app)
    .get(notificationsPath)
    .set("Authorization", authed(token))
    .query(queryParams);

const getNotification = (token, notificationId) =>
  request(app)
    .get(`${notificationsPath}/${notificationId}`)
    .set("Authorization", authed(token));

const markAsRead = (token, notificationId) =>
  request(app)
    .patch(`${notificationsPath}/${notificationId}/read`)
    .set("Authorization", authed(token));

const markAllAsRead = (token) =>
  request(app)
    .patch(`${notificationsPath}/read-all`)
    .set("Authorization", authed(token));

const deleteNotification = (token, notificationId) =>
  request(app)
    .delete(`${notificationsPath}/${notificationId}`)
    .set("Authorization", authed(token));

const getUnreadCount = (token) =>
  request(app)
    .get(`${notificationsPath}/unread-count`)
    .set("Authorization", authed(token));

const hasPasswordHash = (obj) => {
  const serialized = JSON.stringify(obj);
  return (
    serialized.includes("password_hash") || serialized.includes("passwordHash")
  );
};

const requireDb = () => {
  if (!dbAvailable) {
    console.warn(
      "SKIPPED: notifications integration test (DB not configured)"
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

  const register = async (email, fullName) => {
    const res = await request(app).post("/api/v1/auth/register").send({
      fullName,
      email,
      password: TEST_PASSWORD,
    });
    return res.body.data.accessToken;
  };

  ownerToken = await register(OWNER_EMAIL, "Notif Owner");
  otherToken = await register(OTHER_EMAIL, "Notif Other");
  await register(INACTIVE_EMAIL, "Notif Inactive");

  await query("UPDATE users SET is_active = false WHERE email = $1", [
    INACTIVE_EMAIL,
  ]);

  const users = await query(
    `SELECT user_id, email FROM users
     WHERE email = ANY($1::text[])`,
    [[OWNER_EMAIL, OTHER_EMAIL, INACTIVE_EMAIL]]
  );

  const userIdByEmail = {};
  for (const row of users.rows) {
    userIdByEmail[row.email] = Number(row.user_id);
  }

  ownerId = userIdByEmail[OWNER_EMAIL];
  otherId = userIdByEmail[OTHER_EMAIL];
  inactiveId = userIdByEmail[INACTIVE_EMAIL];

  const projectOne = await request(app)
    .post("/api/v1/projects")
    .set("Authorization", authed(ownerToken))
    .send({
      project_key: "NOT1",
      project_name: "Notifications Fixture Project One",
      description: "Shared fixture project for notification tests",
    });

  projectOneId = projectOne.body.data.project.project_id;

  const projectTwo = await request(app)
    .post("/api/v1/projects")
    .set("Authorization", authed(ownerToken))
    .send({
      project_key: "NOT2",
      project_name: "Notifications Fixture Project Two",
      description: "Second fixture project for mismatch tests",
    });

  projectTwoId = projectTwo.body.data.project.project_id;

  const taskOne = await request(app)
    .post("/api/v1/tasks")
    .set("Authorization", authed(ownerToken))
    .send({
      project_id: projectOneId,
      title: "Notifications Fixture Task One",
    });

  taskOneId = taskOne.body.data.task.task_id;

  const taskTwo = await request(app)
    .post("/api/v1/tasks")
    .set("Authorization", authed(ownerToken))
    .send({
      project_id: projectOneId,
      title: "Notifications Fixture Task Two",
    });

  taskTwoId = taskTwo.body.data.task.task_id;

  const createdA1 = await notificationService.createNotification({
    userId: ownerId,
    taskId: taskOneId,
    notificationType: "task_assigned",
    title: "Task assigned fixture",
    message: "You have been assigned a fixture task",
  });
  nA1 = createdA1.notification_id;

  const createdA2 = await notificationService.createNotification({
    userId: ownerId,
    projectId: projectOneId,
    notificationType: "project_updated",
    title: "Project updated fixture",
    message: "The fixture project was updated",
  });
  nA2 = createdA2.notification_id;

  const createdA3 = await notificationService.createNotification({
    userId: ownerId,
    notificationType: "project_completed",
    title: "Plain notification fixture",
    message: "A notification without task or project scope",
  });
  nA3 = createdA3.notification_id;

  const createdB1 = await notificationService.createNotification({
    userId: otherId,
    taskId: taskOneId,
    notificationType: "task_assigned",
    title: "Other user task assigned",
    message: "A notification belonging to another user",
  });
  nB1 = createdB1.notification_id;
});

afterAll(async () => {
  if (dbAvailable) {
    try {
      const userIds = await query(
        `SELECT user_id FROM users
         WHERE email = ANY($1::text[])`,
        [[OWNER_EMAIL, OTHER_EMAIL, INACTIVE_EMAIL]]
      );

      const ids = userIds.rows.map((row) => row.user_id);

      if (ids.length > 0) {
        await query(
          "DELETE FROM notifications WHERE user_id = ANY($1::bigint[])",
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
          "DELETE FROM projects WHERE owner_id = ANY($1::bigint[])",
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

describe("Notifications authorization (no database required)", () => {
  test("list notifications without token returns 401", async () => {
    const res = await request(app).get(notificationsPath);
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("AUTHENTICATION_REQUIRED");
  });

  test("get notification without token returns 401", async () => {
    const res = await request(app).get(`${notificationsPath}/1`);
    expect(res.status).toBe(401);
  });

  test("mark as read without token returns 401", async () => {
    const res = await request(app).patch(`${notificationsPath}/1/read`);
    expect(res.status).toBe(401);
  });

  test("mark all as read without token returns 401", async () => {
    const res = await request(app).patch(`${notificationsPath}/read-all`);
    expect(res.status).toBe(401);
  });

  test("delete notification without token returns 401", async () => {
    const res = await request(app).delete(`${notificationsPath}/1`);
    expect(res.status).toBe(401);
  });

  test("unread-count without token returns 401", async () => {
    const res = await request(app).get(`${notificationsPath}/unread-count`);
    expect(res.status).toBe(401);
  });
});

describe("Notifications database integration (requires configured DB)", () => {
  test("user lists only their own notifications", async () => {
    if (!requireDb()) {
      return;
    }

    const ownerRes = await listNotifications(ownerToken);
    expect(ownerRes.status).toBe(200);
    const ownerIds = ownerRes.body.data.notifications.map((n) =>
      Number(n.notification_id)
    );
    expect(ownerIds).toContain(Number(nA1));
    expect(ownerIds).toContain(Number(nA2));
    expect(ownerIds).toContain(Number(nA3));
    expect(ownerIds).not.toContain(Number(nB1));

    const otherRes = await listNotifications(otherToken);
    expect(otherRes.status).toBe(200);
    const otherIds = otherRes.body.data.notifications.map((n) =>
      Number(n.notification_id)
    );
    expect(otherIds).toContain(Number(nB1));
    expect(otherIds).not.toContain(Number(nA1));

    expect(hasPasswordHash(ownerRes.body)).toBe(false);
    expect(hasPasswordHash(otherRes.body)).toBe(false);
  });

  test("another user's notification returns 404", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await getNotification(ownerToken, nB1);
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOTIFICATION_NOT_FOUND");

    const res2 = await getNotification(otherToken, nA1);
    expect(res2.status).toBe(404);
    expect(res2.body.error.code).toBe("NOTIFICATION_NOT_FOUND");
  });

  test("get an owned notification returns 200 with metadata", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await getNotification(ownerToken, nA1);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Number(res.body.data.notification.notification_id)).toBe(
      Number(nA1)
    );
    expect(res.body.data.notification.title).toBeDefined();
    expect(res.body.data.notification.message).toBeDefined();
    expect(res.body.data.notification.notification_type).toBe("task_assigned");
    expect(res.body.data.notification.is_read).toBe(false);
    expect(Number(res.body.data.notification.task_id)).toBe(
      Number(taskOneId)
    );
    expect(hasPasswordHash(res.body)).toBe(false);
  });

  test("unread-count returns the correct integer", async () => {
    if (!requireDb()) {
      return;
    }

    const ownerRes = await getUnreadCount(ownerToken);
    expect(ownerRes.status).toBe(200);
    expect(ownerRes.body.data.unread_count).toBe(3);

    const otherRes = await getUnreadCount(otherToken);
    expect(otherRes.status).toBe(200);
    expect(otherRes.body.data.unread_count).toBe(1);
  });

  test("is_read filter works before any read", async () => {
    if (!requireDb()) {
      return;
    }

    const unreadRes = await listNotifications(ownerToken, {
      is_read: "false",
    });
    expect(unreadRes.status).toBe(200);
    expect(unreadRes.body.data.notifications).toHaveLength(3);

    const readRes = await listNotifications(ownerToken, { is_read: "true" });
    expect(readRes.status).toBe(200);
    expect(readRes.body.data.notifications).toHaveLength(0);
  });

  test("PATCH one/read marks a single notification as read", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await markAsRead(ownerToken, nA1);

    expect(res.status).toBe(200);
    expect(res.body.data.notification.is_read).toBe(true);
    expect(Number(res.body.data.notification.notification_id)).toBe(
      Number(nA1)
    );
    expect(hasPasswordHash(res.body)).toBe(false);
  });

  test("unread-count decreases after marking one read", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await getUnreadCount(ownerToken);
    expect(res.status).toBe(200);
    expect(res.body.data.unread_count).toBe(2);
  });

  test("is_read filter distinguishes read from unread", async () => {
    if (!requireDb()) {
      return;
    }

    const readRes = await listNotifications(ownerToken, { is_read: "true" });
    const readIds = readRes.body.data.notifications.map((n) =>
      Number(n.notification_id)
    );
    expect(readIds).toEqual([Number(nA1)]);

    const unreadRes = await listNotifications(ownerToken, {
      is_read: "false",
    });
    const unreadIds = unreadRes.body.data.notifications.map((n) =>
      Number(n.notification_id)
    );
    expect(unreadIds).toHaveLength(2);
    expect(unreadIds).not.toContain(Number(nA1));
  });

  test("PATCH read-all marks all owned notifications as read", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await markAllAsRead(ownerToken);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.updated_count).toBe(2);
  });

  test("unread-count is 0 after read-all", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await getUnreadCount(ownerToken);
    expect(res.status).toBe(200);
    expect(res.body.data.unread_count).toBe(0);
  });

  test("notification_type filter works", async () => {
    if (!requireDb()) {
      return;
    }

    const createdA4 = await notificationService.createNotification({
      userId: ownerId,
      taskId: taskOneId,
      notificationType: "comment_added",
      title: "Comment added fixture",
      message: "A new comment was added to your task",
    });
    nA4 = createdA4.notification_id;

    const commentRes = await listNotifications(ownerToken, {
      notification_type: "comment_added",
    });
    const commentIds = commentRes.body.data.notifications.map((n) =>
      Number(n.notification_id)
    );
    expect(commentIds).toContain(Number(nA4));

    const assignedRes = await listNotifications(ownerToken, {
      notification_type: "task_assigned",
    });
    const assignedIds = assignedRes.body.data.notifications.map((n) =>
      Number(n.notification_id)
    );
    expect(assignedIds).toEqual([Number(nA1)]);
  });

  test("project_id filter works", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await listNotifications(ownerToken, {
      project_id: projectOneId,
    });
    const ids = res.body.data.notifications.map((n) =>
      Number(n.notification_id)
    );
    expect(ids).toEqual([Number(nA2)]);
  });

  test("task_id filter works", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await listNotifications(ownerToken, {
      task_id: taskOneId,
    });
    const ids = res.body.data.notifications.map((n) =>
      Number(n.notification_id)
    );
    expect(ids).toContain(Number(nA1));
    expect(ids).toContain(Number(nA4));
    expect(ids).not.toContain(Number(nA2));
    expect(ids).not.toContain(Number(nA3));
  });

  test("list is ordered by created_at DESC then notification_id DESC", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await listNotifications(ownerToken);
    const returnedIds = res.body.data.notifications.map((n) =>
      Number(n.notification_id)
    );

    const db = await query(
      `SELECT notification_id, created_at
       FROM notifications
       WHERE user_id = $1`,
      [ownerId]
    );

    const expected = db.rows
      .map((row) => ({
        id: Number(row.notification_id),
        createdAt: row.created_at,
      }))
      .sort((a, b) => {
        if (a.createdAt !== b.createdAt) {
          return a.createdAt < b.createdAt ? 1 : -1;
        }
        return b.id - a.id;
      })
      .map((entry) => entry.id);

    expect(returnedIds).toEqual(expected);
  });

  test("owner deletes own notification and it is gone", async () => {
    if (!requireDb()) {
      return;
    }

    const del = await deleteNotification(ownerToken, nA2);
    expect(del.status).toBe(200);
    expect(del.body.success).toBe(true);

    const get = await getNotification(ownerToken, nA2);
    expect(get.status).toBe(404);
    expect(get.body.error.code).toBe("NOTIFICATION_NOT_FOUND");
  });

  test("deleting another user's notification returns 404", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await deleteNotification(ownerToken, nB1);
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOTIFICATION_NOT_FOUND");

    const res2 = await deleteNotification(otherToken, nA3);
    expect(res2.status).toBe(404);
    expect(res2.body.error.code).toBe("NOTIFICATION_NOT_FOUND");
  });

  test("invalid notificationId returns 422", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await getNotification(ownerToken, "abc");
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  test("invalid is_read filter returns 422", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await listNotifications(ownerToken, { is_read: "maybe" });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  test("invalid notification_type filter returns 422", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await listNotifications(ownerToken, {
      notification_type: "not_a_type",
    });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  test("invalid project_id filter returns 422", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await listNotifications(ownerToken, { project_id: "abc" });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  test("invalid task_id filter returns 422", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await listNotifications(ownerToken, { task_id: "-5" });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  test("no response exposes password_hash", async () => {
    if (!requireDb()) {
      return;
    }

    const responses = [];
    responses.push(await listNotifications(ownerToken));
    responses.push(await getNotification(ownerToken, nA1));
    responses.push(await markAsRead(ownerToken, nA1));
    responses.push(await getUnreadCount(ownerToken));

    for (const res of responses) {
      expect(hasPasswordHash(res.body)).toBe(false);
    }
  });

  test("no public POST /notifications endpoint exists", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await request(app)
      .post(notificationsPath)
      .set("Authorization", authed(ownerToken))
      .send({
        title: "should not be accepted",
        message: "this endpoint must not exist",
      });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  test("internal createNotification creates a task-scoped notification", async () => {
    if (!requireDb()) {
      return;
    }

    const created = await notificationService.createNotification({
      userId: ownerId,
      taskId: taskTwoId,
      notificationType: "deadline_approaching",
      title: "Task deadline fixture",
      message: "The deadline for a task is approaching",
    });

    expect(created.notification_id).toBeDefined();
    expect(Number(created.user_id)).toBe(ownerId);
    expect(Number(created.task_id)).toBe(Number(taskTwoId));
    expect(created.project_id).toBeNull();
    expect(created.notification_type).toBe("deadline_approaching");
    expect(created.is_read).toBe(false);
  });

  test("internal createNotification creates a project-scoped notification", async () => {
    if (!requireDb()) {
      return;
    }

    const created = await notificationService.createNotification({
      userId: ownerId,
      projectId: projectTwoId,
      notificationType: "task_overdue",
      title: "Project overdue fixture",
      message: "A task in this project is overdue",
    });

    expect(created.notification_id).toBeDefined();
    expect(Number(created.project_id)).toBe(Number(projectTwoId));
    expect(created.task_id).toBeNull();
    expect(created.notification_type).toBe("task_overdue");
  });

  test("internal createNotification allows both scopes to be null", async () => {
    if (!requireDb()) {
      return;
    }

    const created = await notificationService.createNotification({
      userId: ownerId,
      notificationType: "project_completed",
      title: "General notification",
      message: "A general notification without task or project",
    });

    expect(created.notification_id).toBeDefined();
    expect(created.task_id).toBeNull();
    expect(created.project_id).toBeNull();
    expect(created.notification_type).toBe("project_completed");
  });

  test("internal invalid notification type returns 422", async () => {
    if (!requireDb()) {
      return;
    }

    await expect(
      notificationService.createNotification({
        userId: ownerId,
        notificationType: "bogus_type",
        title: "Invalid type",
        message: "This must be rejected",
      })
    ).rejects.toMatchObject({
      statusCode: 422,
      code: "INVALID_NOTIFICATION_TYPE",
    });
  });

  test("internal missing target user returns 404", async () => {
    if (!requireDb()) {
      return;
    }

    await expect(
      notificationService.createNotification({
        userId: 999999999,
        notificationType: "task_assigned",
        title: "Missing user",
        message: "This must be rejected",
      })
    ).rejects.toMatchObject({
      statusCode: 404,
      code: "USER_NOT_FOUND",
    });
  });

  test("internal inactive target user returns 403", async () => {
    if (!requireDb()) {
      return;
    }

    await expect(
      notificationService.createNotification({
        userId: inactiveId,
        notificationType: "task_assigned",
        title: "Inactive user",
        message: "This must be rejected",
      })
    ).rejects.toMatchObject({
      statusCode: 403,
      code: "USER_NOT_ACTIVE",
    });
  });

  test("internal missing task returns 404", async () => {
    if (!requireDb()) {
      return;
    }

    await expect(
      notificationService.createNotification({
        userId: ownerId,
        taskId: 999999999,
        notificationType: "task_assigned",
        title: "Missing task",
        message: "This must be rejected",
      })
    ).rejects.toMatchObject({
      statusCode: 404,
      code: "TASK_NOT_FOUND",
    });
  });

  test("internal missing project returns 404", async () => {
    if (!requireDb()) {
      return;
    }

    await expect(
      notificationService.createNotification({
        userId: ownerId,
        taskId: taskOneId,
        projectId: 999999999,
        notificationType: "task_assigned",
        title: "Missing project",
        message: "This must be rejected",
      })
    ).rejects.toMatchObject({
      statusCode: 404,
      code: "PROJECT_NOT_FOUND",
    });
  });

  test("internal task/project mismatch returns 422", async () => {
    if (!requireDb()) {
      return;
    }

    await expect(
      notificationService.createNotification({
        userId: ownerId,
        taskId: taskOneId,
        projectId: projectTwoId,
        notificationType: "task_assigned",
        title: "Mismatch",
        message: "Task belongs to another project",
      })
    ).rejects.toMatchObject({
      statusCode: 422,
      code: "TASK_PROJECT_MISMATCH",
    });
  });
});
