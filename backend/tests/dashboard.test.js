process.env.NODE_ENV = "test";

const request = require("supertest");
const app = require("../src/app");
const {
  testDatabaseConnection,
  query,
  closeDatabaseConnection,
} = require("../src/config/db");

const TEST_PASSWORD = "StrongPass123!";

const EMAIL_RUN = Date.now().toString(36).slice(-5);
const KEY_RUN = EMAIL_RUN.toUpperCase();

const USER_EMAIL = `dash.${EMAIL_RUN}.user.test@example.com`;
const OTHER_EMAIL = `dash.${EMAIL_RUN}.other.test@example.com`;
const ADMIN_EMAIL = `dash.${EMAIL_RUN}.admin.test@example.com`;

let dbAvailable = false;

let userToken = null;
let otherToken = null;
let adminToken = null;

let otherId = null;

let projectOneId = null;
let projectTwoId = null;
let projectOtherId = null;

let taskOneId = null;
let taskTwoId = null;
let taskThreeId = null;
let taskFourId = null;
let taskFiveId = null;
let taskSixId = null;

const dashboardPath = "/api/v1/dashboard";

const authed = (token) => `Bearer ${token}`;

const getOverview = (token) =>
  request(app)
    .get(`${dashboardPath}/overview`)
    .set("Authorization", authed(token));

const getProjectsProgress = (token) =>
  request(app)
    .get(`${dashboardPath}/projects-progress`)
    .set("Authorization", authed(token));

const getUpcoming = (token, queryParams = {}) =>
  request(app)
    .get(`${dashboardPath}/upcoming-tasks`)
    .set("Authorization", authed(token))
    .query(queryParams);

const toISODate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const addDays = (isoDate, days) => {
  const date = new Date(`${isoDate}T00:00:00`);
  date.setDate(date.getDate() + days);
  return toISODate(date);
};

const hasPasswordHash = (obj) => {
  const serialized = JSON.stringify(obj);
  return (
    serialized.includes("password_hash") || serialized.includes("passwordHash")
  );
};

const hasAttachmentOrCommentData = (obj) => {
  const serialized = JSON.stringify(obj);
  return /attachment|comment_body|file_path|file_url|content_type/i.test(
    serialized
  );
};

const requireDb = () => {
  if (!dbAvailable) {
    console.warn("SKIPPED: dashboard integration test (DB not configured)");
    return false;
  }
  return true;
};

const register = async (email, fullName) => {
  const res = await request(app).post("/api/v1/auth/register").send({
    fullName,
    email,
    password: TEST_PASSWORD,
  });
  return res.body.data.accessToken;
};

const createProject = async (token, key, name, progress) => {
  const res = await request(app)
    .post("/api/v1/projects")
    .set("Authorization", authed(token))
    .send({
      project_key: key,
      project_name: name,
      description: "Dashboard fixture project",
      progress_percentage: progress,
    });

  return res.body.data.project.project_id;
};

const createTask = async (token, body) => {
  const res = await request(app)
    .post("/api/v1/tasks")
    .set("Authorization", authed(token))
    .send(body);

  return res.body.data.task.task_id;
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

  userToken = await register(USER_EMAIL, "Dash User");
  otherToken = await register(OTHER_EMAIL, "Dash Other");
  adminToken = await register(ADMIN_EMAIL, "Dash Admin");

  await query("UPDATE users SET role = 'admin' WHERE email = $1", [
    ADMIN_EMAIL,
  ]);

  const users = await query(
    `SELECT user_id, email FROM users WHERE email = ANY($1::text[])`,
    [[USER_EMAIL, OTHER_EMAIL, ADMIN_EMAIL]]
  );

  const userIdByEmail = {};
  for (const row of users.rows) {
    userIdByEmail[row.email] = Number(row.user_id);
  }
  otherId = userIdByEmail[OTHER_EMAIL];

  projectOneId = await createProject(
    userToken,
    `DASH${KEY_RUN}1`,
    "Dashboard Fixture Project One",
    40
  );
  projectTwoId = await createProject(
    userToken,
    `DASH${KEY_RUN}2`,
    "Dashboard Fixture Project Two (Zero Tasks)",
    20
  );
  projectOtherId = await createProject(
    otherToken,
    `DASH${KEY_RUN}3`,
    "Dashboard Fixture Project Other",
    30
  );

  const today = toISODate(new Date());

  taskOneId = await createTask(userToken, {
    project_id: projectOneId,
    title: "Dashboard Fixture Done Task",
    status: "done",
    agile_importance: "critical",
    urgency_priority: "important_urgent",
    start_date: addDays(today, -2),
    due_date: addDays(today, 20),
    estimated_minutes: 100,
    actual_minutes: 60,
    progress_percentage: 100,
  });

  taskTwoId = await createTask(userToken, {
    project_id: projectOneId,
    title: "Dashboard Fixture In Progress Task",
    status: "in_progress",
    agile_importance: "critical",
    urgency_priority: "important_urgent",
    start_date: addDays(today, -1),
    due_date: addDays(today, 3),
    estimated_minutes: 120,
    actual_minutes: 40,
    progress_percentage: 40,
  });

  taskThreeId = await createTask(userToken, {
    project_id: projectOneId,
    title: "Dashboard Fixture To Do Task",
    status: "to_do",
    agile_importance: "high",
    urgency_priority: "important_not_urgent",
    due_date: addDays(today, 5),
    estimated_minutes: 90,
    actual_minutes: 0,
  });

  taskFourId = await createTask(userToken, {
    project_id: projectOneId,
    title: "Dashboard Fixture Backlog Critical Task",
    status: "backlog",
    agile_importance: "critical",
    urgency_priority: "not_important_not_urgent",
    due_date: addDays(today, 5),
    estimated_minutes: 60,
    actual_minutes: 0,
  });

  taskFiveId = await createTask(userToken, {
    project_id: projectOneId,
    title: "Dashboard Fixture Cancelled Task",
    status: "cancelled",
    agile_importance: "low",
    urgency_priority: "not_important_not_urgent",
    due_date: addDays(today, 1),
    estimated_minutes: 50,
    actual_minutes: 0,
  });

  taskSixId = await createTask(userToken, {
    project_id: projectOneId,
    title: "Dashboard Fixture No Due Date Task",
    status: "to_do",
    agile_importance: "medium",
    urgency_priority: "important_not_urgent",
    estimated_minutes: 30,
    actual_minutes: 0,
  });

  await createTask(otherToken, {
    project_id: projectOtherId,
    title: "DASH OTHER TASK ONE",
    status: "to_do",
    agile_importance: "high",
    urgency_priority: "important_not_urgent",
    due_date: addDays(today, 6),
  });

  await createTask(otherToken, {
    project_id: projectOtherId,
    title: "DASH OTHER TASK TWO",
    status: "done",
    agile_importance: "medium",
    urgency_priority: "not_important_urgent",
    due_date: addDays(today, 12),
  });
});

afterAll(async () => {
  if (dbAvailable) {
    try {
      const userIds = await query(
        `SELECT user_id FROM users WHERE email = ANY($1::text[])`,
        [[USER_EMAIL, OTHER_EMAIL, ADMIN_EMAIL]]
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
          `DELETE FROM tasks
           WHERE project_id IN (
             SELECT project_id FROM projects WHERE owner_id = ANY($1::bigint[])
           )`,
          [ids]
        );

        await query("DELETE FROM projects WHERE owner_id = ANY($1::bigint[])", [
          ids,
        ]);

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

describe("Dashboard authorization (no database required)", () => {
  test("overview without token returns 401", async () => {
    const res = await request(app).get(`${dashboardPath}/overview`);
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("AUTHENTICATION_REQUIRED");
  });

  test("projects-progress without token returns 401", async () => {
    const res = await request(app).get(`${dashboardPath}/projects-progress`);
    expect(res.status).toBe(401);
  });

  test("upcoming-tasks without token returns 401", async () => {
    const res = await request(app).get(`${dashboardPath}/upcoming-tasks`);
    expect(res.status).toBe(401);
  });
});

describe("Dashboard database integration (requires configured DB)", () => {
  test("authenticated normal user gets overview 200", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await getOverview(userToken);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.overview).toBeDefined();
  });

  test("overview contains all expected numeric fields", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await getOverview(userToken);
    expect(res.status).toBe(200);

    const overview = res.body.data.overview;

    const numericFields = [
      "total_projects",
      "planning_projects",
      "in_progress_projects",
      "on_hold_projects",
      "completed_projects",
      "cancelled_projects",
      "average_project_progress",
      "total_tasks",
      "backlog_tasks",
      "to_do_tasks",
      "in_progress_tasks",
      "review_tasks",
      "done_tasks",
      "cancelled_tasks",
      "overdue_tasks",
      "tasks_due_today",
      "tasks_due_next_7_days",
      "critical_tasks",
      "important_urgent_tasks",
      "total_estimated_minutes",
      "total_actual_minutes",
      "total_pending_tasks",
      "project_completion_rate",
      "task_completion_rate",
    ];

    for (const field of numericFields) {
      expect(typeof overview[field]).toBe("number");
      expect(Number.isFinite(overview[field])).toBe(true);
    }

    expect(overview.total_projects).toBe(2);
    expect(overview.total_tasks).toBe(6);
    expect(overview.done_tasks).toBe(1);
    expect(overview.cancelled_tasks).toBe(1);
    expect(overview.total_estimated_minutes).toBe(450);
    expect(overview.total_actual_minutes).toBe(100);
  });

  test("total_pending_tasks is calculated correctly", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await getOverview(userToken);
    expect(res.status).toBe(200);
    expect(res.body.data.overview.total_pending_tasks).toBe(4);
  });

  test("project_completion_rate is numeric and rounded to 2 decimals", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await getOverview(userToken);
    const rate = res.body.data.overview.project_completion_rate;

    expect(typeof rate).toBe("number");
    expect(Number.isFinite(rate)).toBe(true);
    expect(Number(rate.toFixed(2))).toBe(rate);
    expect(rate).toBe(0);
  });

  test("task_completion_rate is numeric and rounded to 2 decimals", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await getOverview(userToken);
    const rate = res.body.data.overview.task_completion_rate;

    expect(typeof rate).toBe("number");
    expect(Number.isFinite(rate)).toBe(true);
    expect(Number(rate.toFixed(2))).toBe(rate);
    expect(rate).toBe(16.67);
  });

  test("normal user sees only accessible projects and tasks", async () => {
    if (!requireDb()) {
      return;
    }

    const overviewRes = await getOverview(userToken);
    expect(overviewRes.body.data.overview.total_projects).toBe(2);
    expect(overviewRes.body.data.overview.total_tasks).toBe(6);

    const progressRes = await getProjectsProgress(userToken);
    const projectIds = progressRes.body.data.projects.map(
      (project) => Number(project.project_id)
    );
    expect(projectIds).toContain(Number(projectOneId));
    expect(projectIds).toContain(Number(projectTwoId));
    expect(projectIds).not.toContain(Number(projectOtherId));

    const upcomingRes = await getUpcoming(userToken);
    for (const task of upcomingRes.body.data.tasks) {
      expect(Number(task.project_id)).not.toBe(Number(projectOtherId));
    }
  });

  test("admin sees global statistics", async () => {
    if (!requireDb()) {
      return;
    }

    const globalProjects = await query(
      "SELECT COUNT(*)::int AS count FROM projects"
    );
    const globalTasks = await query("SELECT COUNT(*)::int AS count FROM tasks");

    const overviewRes = await getOverview(adminToken);
    expect(overviewRes.status).toBe(200);

    const overview = overviewRes.body.data.overview;
    expect(overview.total_projects).toBe(globalProjects.rows[0].count);
    expect(overview.total_tasks).toBe(globalTasks.rows[0].count);

    const progressRes = await getProjectsProgress(adminToken);
    const projectIds = progressRes.body.data.projects.map(
      (project) => Number(project.project_id)
    );
    expect(projectIds).toContain(Number(projectOtherId));

    const upcomingRes = await getUpcoming(adminToken);
    const titles = upcomingRes.body.data.tasks.map((task) => task.title);
    expect(titles).toContain("DASH OTHER TASK ONE");
  });

  test("projects progress returns numeric task counts", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await getProjectsProgress(userToken);
    expect(res.status).toBe(200);

    for (const project of res.body.data.projects) {
      expect(typeof project.total_tasks).toBe("number");
      expect(typeof project.completed_tasks).toBe("number");
      expect(typeof project.overdue_tasks).toBe("number");
      expect(Number.isInteger(project.total_tasks)).toBe(true);
      expect(Number.isInteger(project.completed_tasks)).toBe(true);
      expect(Number.isInteger(project.overdue_tasks)).toBe(true);
    }
  });

  test("project task_completion_rate is correct", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await getProjectsProgress(userToken);
    const projects = res.body.data.projects;

    const projectOne = projects.find(
      (project) => Number(project.project_id) === Number(projectOneId)
    );
    expect(projectOne).toBeDefined();
    expect(projectOne.total_tasks).toBe(6);
    expect(projectOne.completed_tasks).toBe(1);
    expect(projectOne.overdue_tasks).toBe(0);
    expect(projectOne.task_completion_rate).toBe(16.67);
  });

  test("zero-task project returns completion rate 0", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await getProjectsProgress(userToken);
    const projectTwo = res.body.data.projects.find(
      (project) => Number(project.project_id) === Number(projectTwoId)
    );
    expect(projectTwo).toBeDefined();
    expect(projectTwo.total_tasks).toBe(0);
    expect(projectTwo.completed_tasks).toBe(0);
    expect(projectTwo.task_completion_rate).toBe(0);
  });

  test("upcoming tasks excludes done and cancelled tasks", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await getUpcoming(userToken);
    expect(res.status).toBe(200);

    const taskIds = res.body.data.tasks.map((task) => Number(task.task_id));
    expect(taskIds).not.toContain(Number(taskOneId));
    expect(taskIds).not.toContain(Number(taskFiveId));

    const titles = res.body.data.tasks.map((task) => task.title);
    expect(titles).not.toContain("Dashboard Fixture Done Task");
    expect(titles).not.toContain("Dashboard Fixture Cancelled Task");
  });

  test("upcoming tasks ordered by due_date ASC, agile importance, task_id", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await getUpcoming(userToken);
    const taskIds = res.body.data.tasks.map((task) => Number(task.task_id));

    expect(taskIds).toEqual([
      Number(taskTwoId),
      Number(taskFourId),
      Number(taskThreeId),
    ]);

    const statuses = res.body.data.tasks.map((task) => task.status);
    expect(statuses.every((status) => status !== "done")).toBe(true);
    expect(statuses.every((status) => status !== "cancelled")).toBe(true);
  });

  test("dates are returned as YYYY-MM-DD strings or null", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await getUpcoming(userToken);
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;

    for (const task of res.body.data.tasks) {
      expect(datePattern.test(task.due_date)).toBe(true);
      expect(
        task.start_date === null || datePattern.test(task.start_date)
      ).toBe(true);
    }
  });

  test("default limit works", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await getUpcoming(userToken);
    expect(res.status).toBe(200);
    expect(res.body.data.tasks.length).toBe(3);
  });

  test("valid string limit 7 works", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await getUpcoming(userToken, { limit: "7" });
    expect(res.status).toBe(200);
    expect(res.body.data.tasks.length).toBe(3);
  });

  test("limit 50 works", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await getUpcoming(userToken, { limit: "50" });
    expect(res.status).toBe(200);
    expect(res.body.data.tasks.length).toBe(3);
  });

  test("limit 51 returns 422", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await getUpcoming(userToken, { limit: "51" });
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  test("limit 0 returns 422", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await getUpcoming(userToken, { limit: "0" });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  test("negative limit returns 422", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await getUpcoming(userToken, { limit: "-5" });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  test("non-numeric limit returns 422", async () => {
    if (!requireDb()) {
      return;
    }

    const res = await getUpcoming(userToken, { limit: "abc" });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  test("no response contains password_hash", async () => {
    if (!requireDb()) {
      return;
    }

    const overviewRes = await getOverview(userToken);
    const progressRes = await getProjectsProgress(userToken);
    const upcomingRes = await getUpcoming(userToken);

    expect(hasPasswordHash(overviewRes.body)).toBe(false);
    expect(hasPasswordHash(progressRes.body)).toBe(false);
    expect(hasPasswordHash(upcomingRes.body)).toBe(false);
  });

  test("no response contains attachment paths or comment bodies", async () => {
    if (!requireDb()) {
      return;
    }

    const overviewRes = await getOverview(userToken);
    const progressRes = await getProjectsProgress(userToken);
    const upcomingRes = await getUpcoming(userToken);

    expect(hasAttachmentOrCommentData(overviewRes.body)).toBe(false);
    expect(hasAttachmentOrCommentData(progressRes.body)).toBe(false);
    expect(hasAttachmentOrCommentData(upcomingRes.body)).toBe(false);
  });
});
