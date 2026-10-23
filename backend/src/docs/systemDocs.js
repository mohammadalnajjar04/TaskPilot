/**
 * @openapi
 * tags:
 *   - name: Notifications
 *     description: Notification operations
 *   - name: Dashboard
 *     description: Dashboard statistics operations
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     Notification:
 *       type: object
 *       properties:
 *         notification_id:
 *           type: integer
 *         user_id:
 *           type: integer
 *         task_id:
 *           type: integer
 *           nullable: true
 *         project_id:
 *           type: integer
 *           nullable: true
 *         notification_type:
 *           type: string
 *           enum: [task_assigned, deadline_approaching, task_overdue, comment_added, project_updated, project_completed]
 *         title:
 *           type: string
 *           maxLength: 150
 *         message:
 *           type: string
 *         is_read:
 *           type: boolean
 *         created_at:
 *           type: string
 *           format: date-time
 *       example:
 *         notification_id: 10
 *         user_id: 2
 *         task_id: 4
 *         project_id: 1
 *         notification_type: task_assigned
 *         title: New Task Assigned
 *         message: You were assigned to a new task.
 *         is_read: false
 *         created_at: "2026-08-05T12:00:00.000Z"
 *     NotificationResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         data:
 *           type: object
 *           properties:
 *             notification:
 *               $ref: '#/components/schemas/Notification'
 *     NotificationListResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         data:
 *           type: object
 *           properties:
 *             notifications:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Notification'
 *     UnreadCountResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         data:
 *           type: object
 *           properties:
 *             unread_count:
 *               type: integer
 *     ReadAllResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         data:
 *           type: object
 *           properties:
 *             updated_count:
 *               type: integer
 *     DeleteNotificationResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         data:
 *           type: object
 *           properties:
 *             deleted:
 *               type: object
 *               properties:
 *                 notification_id:
 *                   type: integer
 *     DashboardOverview:
 *       type: object
 *       properties:
 *         total_projects:
 *           type: integer
 *         planning_projects:
 *           type: integer
 *         in_progress_projects:
 *           type: integer
 *         on_hold_projects:
 *           type: integer
 *         completed_projects:
 *           type: integer
 *         cancelled_projects:
 *           type: integer
 *         average_project_progress:
 *           type: number
 *         total_tasks:
 *           type: integer
 *         backlog_tasks:
 *           type: integer
 *         to_do_tasks:
 *           type: integer
 *         in_progress_tasks:
 *           type: integer
 *         review_tasks:
 *           type: integer
 *         done_tasks:
 *           type: integer
 *         cancelled_tasks:
 *           type: integer
 *         overdue_tasks:
 *           type: integer
 *         tasks_due_today:
 *           type: integer
 *         tasks_due_next_7_days:
 *           type: integer
 *         critical_tasks:
 *           type: integer
 *         important_urgent_tasks:
 *           type: integer
 *         total_estimated_minutes:
 *           type: integer
 *         total_actual_minutes:
 *           type: integer
 *         total_pending_tasks:
 *           type: integer
 *         project_completion_rate:
 *           type: number
 *         task_completion_rate:
 *           type: number
 *       example:
 *         total_projects: 2
 *         planning_projects: 1
 *         in_progress_projects: 1
 *         completed_projects: 0
 *         total_tasks: 4
 *         done_tasks: 1
 *         total_pending_tasks: 3
 *         task_completion_rate: 25
 *     DashboardOverviewResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         data:
 *           type: object
 *           properties:
 *             overview:
 *               $ref: '#/components/schemas/DashboardOverview'
 *     ProjectProgress:
 *       type: object
 *       properties:
 *         project_id:
 *           type: integer
 *         project_key:
 *           type: string
 *         project_name:
 *           type: string
 *         status:
 *           type: string
 *           enum: [planning, in_progress, on_hold, completed, cancelled]
 *         progress_percentage:
 *           type: number
 *         total_tasks:
 *           type: integer
 *         completed_tasks:
 *           type: integer
 *         overdue_tasks:
 *           type: integer
 *         task_completion_rate:
 *           type: number
 *     ProjectsProgressResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         data:
 *           type: object
 *           properties:
 *             projects:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ProjectProgress'
 *     UpcomingTask:
 *       type: object
 *       properties:
 *         task_id:
 *           type: integer
 *         title:
 *           type: string
 *         status:
 *           type: string
 *           enum: [backlog, to_do, in_progress, review, done, cancelled]
 *         urgency_priority:
 *           type: string
 *           enum: [important_urgent, important_not_urgent, not_important_urgent, not_important_not_urgent]
 *         agile_importance:
 *           type: string
 *           enum: [critical, high, medium, low]
 *         start_date:
 *           type: string
 *           format: date
 *           nullable: true
 *         due_date:
 *           type: string
 *           format: date
 *         progress_percentage:
 *           type: integer
 *         project_id:
 *           type: integer
 *         project_key:
 *           type: string
 *         project_name:
 *           type: string
 *         assigned_to:
 *           type: integer
 *           nullable: true
 *         assigned_to_name:
 *           type: string
 *           nullable: true
 *     UpcomingTasksResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         data:
 *           type: object
 *           properties:
 *             tasks:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/UpcomingTask'
 */

/**
 * @openapi
 * /notifications:
 *   get:
 *     summary: List the authenticated user's notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: is_read
 *         in: query
 *         description: "Boolean-like filter. Accepted values: true, false, 1, 0"
 *         schema:
 *           type: boolean
 *       - name: notification_type
 *         in: query
 *         schema:
 *           type: string
 *           enum: [task_assigned, deadline_approaching, task_overdue, comment_added, project_updated, project_completed]
 *       - name: project_id
 *         in: query
 *         schema:
 *           type: integer
 *           minimum: 1
 *       - name: task_id
 *         in: query
 *         schema:
 *           type: integer
 *           minimum: 1
 *     responses:
 *       '200':
 *         description: List of the authenticated user's notifications
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotificationListResponse'
 *       '401':
 *         description: AUTHENTICATION_REQUIRED, INVALID_TOKEN, TOKEN_EXPIRED
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '422':
 *         description: VALIDATION_ERROR
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @openapi
 * /notifications/unread-count:
 *   get:
 *     summary: Get unread notification count
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Unread notification count
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnreadCountResponse'
 *       '401':
 *         description: AUTHENTICATION_REQUIRED, INVALID_TOKEN, TOKEN_EXPIRED
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @openapi
 * /notifications/read-all:
 *   patch:
 *     summary: Mark all owned unread notifications as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: All unread notifications marked as read
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReadAllResponse'
 *       '401':
 *         description: AUTHENTICATION_REQUIRED, INVALID_TOKEN, TOKEN_EXPIRED
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @openapi
 * /notifications/{notificationId}:
 *   parameters:
 *     - name: notificationId
 *       in: path
 *       required: true
 *       schema:
 *         type: integer
 *         minimum: 1
 *   get:
 *     summary: Get one owned notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Notification details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotificationResponse'
 *       '401':
 *         description: AUTHENTICATION_REQUIRED, INVALID_TOKEN, TOKEN_EXPIRED
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '404':
 *         description: NOTIFICATION_NOT_FOUND
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '422':
 *         description: VALIDATION_ERROR
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   delete:
 *     summary: Delete one owned notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Notification deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DeleteNotificationResponse'
 *       '401':
 *         description: AUTHENTICATION_REQUIRED, INVALID_TOKEN, TOKEN_EXPIRED
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '404':
 *         description: NOTIFICATION_NOT_FOUND
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '422':
 *         description: VALIDATION_ERROR
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @openapi
 * /notifications/{notificationId}/read:
 *   parameters:
 *     - name: notificationId
 *       in: path
 *       required: true
 *       schema:
 *         type: integer
 *         minimum: 1
 *   patch:
 *     summary: Mark one owned notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Notification marked as read
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotificationResponse'
 *       '401':
 *         description: AUTHENTICATION_REQUIRED, INVALID_TOKEN, TOKEN_EXPIRED
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '404':
 *         description: NOTIFICATION_NOT_FOUND
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '422':
 *         description: VALIDATION_ERROR
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @openapi
 * /dashboard/overview:
 *   get:
 *     summary: Get dashboard overview statistics
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     description: >-
 *       Normal users receive only data from accessible projects.
 *       Admins receive global statistics.
 *     responses:
 *       '200':
 *         description: Dashboard overview statistics
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DashboardOverviewResponse'
 *       '401':
 *         description: AUTHENTICATION_REQUIRED, INVALID_TOKEN, TOKEN_EXPIRED
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @openapi
 * /dashboard/projects-progress:
 *   get:
 *     summary: Get accessible projects with task progress
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     description: >-
 *       Normal users receive only data from accessible projects.
 *       Admins receive global statistics.
 *     responses:
 *       '200':
 *         description: Projects with task progress
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProjectsProgressResponse'
 *       '401':
 *         description: AUTHENTICATION_REQUIRED, INVALID_TOKEN, TOKEN_EXPIRED
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @openapi
 * /dashboard/upcoming-tasks:
 *   get:
 *     summary: Get upcoming accessible tasks
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     description: >-
 *       Normal users receive only data from accessible projects.
 *       Admins receive global statistics.
 *     parameters:
 *       - name: limit
 *         in: query
 *         description: Maximum number of upcoming tasks to return
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *     responses:
 *       '200':
 *         description: Upcoming tasks
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UpcomingTasksResponse'
 *       '401':
 *         description: AUTHENTICATION_REQUIRED, INVALID_TOKEN, TOKEN_EXPIRED
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '422':
 *         description: VALIDATION_ERROR
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
