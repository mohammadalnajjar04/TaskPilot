export const AUTH_ENDPOINTS = {
  register: "/auth/register",
  login: "/auth/login",
  me: "/auth/me",
};

export const PROJECT_ENDPOINTS = {
  list: "/projects",
  create: "/projects",
  get: (projectId) => `/projects/${projectId}`,
  update: (projectId) => `/projects/${projectId}`,
  delete: (projectId) => `/projects/${projectId}`,
  changeStatus: (projectId) => `/projects/${projectId}/status`,
  members: (projectId) => `/projects/${projectId}/members`,
  member: (projectId, userId) => `/projects/${projectId}/members/${userId}`,
};

export const TASK_ENDPOINTS = {
  list: "/tasks",
  create: "/tasks",
  get: (taskId) => `/tasks/${taskId}`,
  update: (taskId) => `/tasks/${taskId}`,
  delete: (taskId) => `/tasks/${taskId}`,
  changeStatus: (taskId) => `/tasks/${taskId}/status`,
  comments: (taskId) => `/tasks/${taskId}/comments`,
  comment: (taskId, commentId) => `/tasks/${taskId}/comments/${commentId}`,
  attachments: (taskId) => `/tasks/${taskId}/attachments`,
  attachment: (taskId, attachmentId) =>
    `/tasks/${taskId}/attachments/${attachmentId}`,
};

export const CATEGORY_ENDPOINTS = {
  list: "/categories",
  create: "/categories",
  get: (categoryId) => `/categories/${categoryId}`,
  update: (categoryId) => `/categories/${categoryId}`,
  delete: (categoryId) => `/categories/${categoryId}`,
};

export const NOTIFICATION_ENDPOINTS = {
  list: "/notifications",
  get: (notificationId) => `/notifications/${notificationId}`,
  read: (notificationId) => `/notifications/${notificationId}/read`,
  readAll: "/notifications/read-all",
  unreadCount: "/notifications/unread-count",
  delete: (notificationId) => `/notifications/${notificationId}`,
};

export const DASHBOARD_ENDPOINTS = {
  overview: "/dashboard/overview",
  projectsProgress: "/dashboard/projects-progress",
  upcomingTasks: "/dashboard/upcoming-tasks",
};
