/**
 * @openapi
 * tags:
 *   - name: Categories
 *     description: Category operations
 *   - name: Tasks
 *     description: Task operations
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     Category:
 *       type: object
 *       properties:
 *         category_id:
 *           type: integer
 *         user_id:
 *           type: integer
 *         category_name:
 *           type: string
 *           minLength: 2
 *           maxLength: 80
 *         color:
 *           type: string
 *           nullable: true
 *           pattern: '^#[0-9A-Fa-f]{6}$'
 *         created_at:
 *           type: string
 *           format: date-time
 *       example:
 *         category_name: Backend
 *         color: "#2563EB"
 *     CreateCategoryRequest:
 *       type: object
 *       required:
 *         - category_name
 *       properties:
 *         category_name:
 *           type: string
 *           minLength: 2
 *           maxLength: 80
 *         color:
 *           type: string
 *           nullable: true
 *           pattern: '^#[0-9A-Fa-f]{6}$'
 *     UpdateCategoryRequest:
 *       type: object
 *       properties:
 *         category_name:
 *           type: string
 *           minLength: 2
 *           maxLength: 80
 *         color:
 *           type: string
 *           nullable: true
 *           pattern: '^#[0-9A-Fa-f]{6}$'
 *     CategoryResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         data:
 *           type: object
 *           properties:
 *             category:
 *               $ref: '#/components/schemas/Category'
 *     CategoryListResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         data:
 *           type: object
 *           properties:
 *             categories:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Category'
 *     Task:
 *       type: object
 *       properties:
 *         task_id:
 *           type: integer
 *         project_id:
 *           type: integer
 *         category_id:
 *           type: integer
 *           nullable: true
 *         created_by:
 *           type: integer
 *         assigned_to:
 *           type: integer
 *           nullable: true
 *         parent_task_id:
 *           type: integer
 *           nullable: true
 *         title:
 *           type: string
 *           minLength: 3
 *           maxLength: 150
 *         description:
 *           type: string
 *           nullable: true
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
 *           nullable: true
 *         estimated_minutes:
 *           type: integer
 *           minimum: 1
 *           nullable: true
 *         actual_minutes:
 *           type: integer
 *           minimum: 0
 *         progress_percentage:
 *           type: integer
 *           minimum: 0
 *           maximum: 100
 *         completed_at:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *         project_key:
 *           type: string
 *         project_name:
 *           type: string
 *         category_name:
 *           type: string
 *         created_by_name:
 *           type: string
 *         assigned_to_name:
 *           type: string
 *         parent_task_title:
 *           type: string
 *     CreateTaskRequest:
 *       type: object
 *       required:
 *         - project_id
 *         - title
 *       properties:
 *         project_id:
 *           type: integer
 *           minimum: 1
 *         category_id:
 *           type: integer
 *           minimum: 1
 *           nullable: true
 *         assigned_to:
 *           type: integer
 *           minimum: 1
 *           nullable: true
 *         parent_task_id:
 *           type: integer
 *           minimum: 1
 *           nullable: true
 *         title:
 *           type: string
 *           minLength: 3
 *           maxLength: 150
 *         description:
 *           type: string
 *           nullable: true
 *         status:
 *           type: string
 *           enum: [backlog, to_do, in_progress, review, done, cancelled]
 *           default: backlog
 *         urgency_priority:
 *           type: string
 *           enum: [important_urgent, important_not_urgent, not_important_urgent, not_important_not_urgent]
 *           default: important_not_urgent
 *         agile_importance:
 *           type: string
 *           enum: [critical, high, medium, low]
 *           default: medium
 *         start_date:
 *           type: string
 *           format: date
 *           nullable: true
 *         due_date:
 *           type: string
 *           format: date
 *           nullable: true
 *         estimated_minutes:
 *           type: integer
 *           minimum: 1
 *           nullable: true
 *         actual_minutes:
 *           type: integer
 *           minimum: 0
 *         progress_percentage:
 *           type: integer
 *           minimum: 0
 *           maximum: 100
 *       example:
 *         project_id: 1
 *         category_id: 1
 *         assigned_to: 2
 *         title: Build authentication API
 *         description: Create register and login endpoints
 *         status: backlog
 *         urgency_priority: important_urgent
 *         agile_importance: critical
 *         start_date: "2026-08-05"
 *         due_date: "2026-08-10"
 *         estimated_minutes: 240
 *         actual_minutes: 0
 *         progress_percentage: 0
 *     UpdateTaskRequest:
 *       type: object
 *       properties:
 *         project_id:
 *           type: integer
 *           minimum: 1
 *         category_id:
 *           type: integer
 *           minimum: 1
 *           nullable: true
 *         assigned_to:
 *           type: integer
 *           minimum: 1
 *           nullable: true
 *         parent_task_id:
 *           type: integer
 *           minimum: 1
 *           nullable: true
 *         title:
 *           type: string
 *           minLength: 3
 *           maxLength: 150
 *         description:
 *           type: string
 *           nullable: true
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
 *           nullable: true
 *         estimated_minutes:
 *           type: integer
 *           minimum: 1
 *           nullable: true
 *         actual_minutes:
 *           type: integer
 *           minimum: 0
 *         progress_percentage:
 *           type: integer
 *           minimum: 0
 *           maximum: 100
 *     UpdateTaskStatusRequest:
 *       type: object
 *       required:
 *         - status
 *       properties:
 *         status:
 *           type: string
 *           enum: [backlog, to_do, in_progress, review, done, cancelled]
 *         progress_percentage:
 *           type: integer
 *           minimum: 0
 *           maximum: 100
 *     TaskResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         data:
 *           type: object
 *           properties:
 *             task:
 *               $ref: '#/components/schemas/Task'
 *     TaskListResponse:
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
 *                 $ref: '#/components/schemas/Task'
 */

/**
 * @openapi
 * /categories:
 *   get:
 *     summary: List the authenticated user's categories
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: List of categories
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CategoryListResponse'
 *       '401':
 *         description: AUTHENTICATION_REQUIRED, INVALID_TOKEN, TOKEN_EXPIRED
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   post:
 *     summary: Create a category
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCategoryRequest'
 *     responses:
 *       '201':
 *         description: Category created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CategoryResponse'
 *       '401':
 *         description: AUTHENTICATION_REQUIRED, INVALID_TOKEN, TOKEN_EXPIRED
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '409':
 *         description: CATEGORY_ALREADY_EXISTS
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
 * /categories/{categoryId}:
 *   parameters:
 *     - name: categoryId
 *       in: path
 *       required: true
 *       schema:
 *         type: integer
 *         minimum: 1
 *   get:
 *     summary: Get one category
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Category details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CategoryResponse'
 *       '401':
 *         description: AUTHENTICATION_REQUIRED, INVALID_TOKEN, TOKEN_EXPIRED
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '403':
 *         description: FORBIDDEN
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '404':
 *         description: CATEGORY_NOT_FOUND
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
 *   put:
 *     summary: Update a category
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateCategoryRequest'
 *     responses:
 *       '200':
 *         description: Category updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CategoryResponse'
 *       '401':
 *         description: AUTHENTICATION_REQUIRED, INVALID_TOKEN, TOKEN_EXPIRED
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '403':
 *         description: FORBIDDEN
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '404':
 *         description: CATEGORY_NOT_FOUND
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '409':
 *         description: CATEGORY_ALREADY_EXISTS
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
 *     summary: Delete a category
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Category deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     category_id:
 *                       type: integer
 *       '401':
 *         description: AUTHENTICATION_REQUIRED, INVALID_TOKEN, TOKEN_EXPIRED
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '403':
 *         description: FORBIDDEN
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '404':
 *         description: CATEGORY_NOT_FOUND
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @openapi
 * /tasks:
 *   get:
 *     summary: List accessible tasks
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *           enum: [backlog, to_do, in_progress, review, done, cancelled]
 *       - name: urgency_priority
 *         in: query
 *         schema:
 *           type: string
 *           enum: [important_urgent, important_not_urgent, not_important_urgent, not_important_not_urgent]
 *       - name: agile_importance
 *         in: query
 *         schema:
 *           type: string
 *           enum: [critical, high, medium, low]
 *       - name: project_id
 *         in: query
 *         schema:
 *           type: integer
 *           minimum: 1
 *       - name: category_id
 *         in: query
 *         schema:
 *           type: integer
 *           minimum: 1
 *       - name: created_by
 *         in: query
 *         schema:
 *           type: integer
 *           minimum: 1
 *       - name: assigned_to
 *         in: query
 *         schema:
 *           type: integer
 *           minimum: 1
 *       - name: parent_task_id
 *         in: query
 *         schema:
 *           type: integer
 *           minimum: 1
 *       - name: start_date_from
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *       - name: start_date_to
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *       - name: due_date_from
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *       - name: due_date_to
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *       - name: overdue
 *         in: query
 *         schema:
 *           type: boolean
 *       - name: search
 *         in: query
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: List of accessible tasks
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TaskListResponse'
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
 *   post:
 *     summary: Create a task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTaskRequest'
 *     responses:
 *       '201':
 *         description: Task created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TaskResponse'
 *       '401':
 *         description: AUTHENTICATION_REQUIRED, INVALID_TOKEN, TOKEN_EXPIRED
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '403':
 *         description: FORBIDDEN
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '404':
 *         description: PROJECT_NOT_FOUND, CATEGORY_NOT_FOUND, ASSIGNEE_NOT_FOUND, PARENT_TASK_NOT_FOUND
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '422':
 *         description: VALIDATION_ERROR, INVALID_PROGRESS, INVALID_DATES, ASSIGNEE_NOT_IN_PROJECT, PARENT_TASK_NOT_IN_PROJECT, CIRCULAR_PARENT_TASK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @openapi
 * /tasks/{taskId}:
 *   parameters:
 *     - name: taskId
 *       in: path
 *       required: true
 *       schema:
 *         type: integer
 *         minimum: 1
 *   get:
 *     summary: Get one accessible task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Task details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TaskResponse'
 *       '401':
 *         description: AUTHENTICATION_REQUIRED, INVALID_TOKEN, TOKEN_EXPIRED
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '403':
 *         description: FORBIDDEN
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '404':
 *         description: TASK_NOT_FOUND
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
 *   put:
 *     summary: Update a task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateTaskRequest'
 *     responses:
 *       '200':
 *         description: Task updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TaskResponse'
 *       '401':
 *         description: AUTHENTICATION_REQUIRED, INVALID_TOKEN, TOKEN_EXPIRED
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '403':
 *         description: FORBIDDEN
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '404':
 *         description: TASK_NOT_FOUND, PROJECT_NOT_FOUND, CATEGORY_NOT_FOUND, ASSIGNEE_NOT_FOUND, PARENT_TASK_NOT_FOUND
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '422':
 *         description: VALIDATION_ERROR, INVALID_PROGRESS, INVALID_DATES, ASSIGNEE_NOT_IN_PROJECT, PARENT_TASK_NOT_IN_PROJECT, CIRCULAR_PARENT_TASK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   delete:
 *     summary: Delete a task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Task deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     task_id:
 *                       type: integer
 *       '401':
 *         description: AUTHENTICATION_REQUIRED, INVALID_TOKEN, TOKEN_EXPIRED
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '403':
 *         description: FORBIDDEN
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '404':
 *         description: TASK_NOT_FOUND
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @openapi
 * /tasks/{taskId}/status:
 *   parameters:
 *     - name: taskId
 *       in: path
 *       required: true
 *       schema:
 *         type: integer
 *         minimum: 1
 *   patch:
 *     summary: Change task status
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     description: >-
 *       Entering done forces progress_percentage to 100 and sets completed_at.
 *       Leaving done clears completed_at and requires a valid progress_percentage.
 *       Invalid transitions return 422 INVALID_STATUS_TRANSITION.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateTaskStatusRequest'
 *     responses:
 *       '200':
 *         description: Task status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TaskResponse'
 *       '401':
 *         description: AUTHENTICATION_REQUIRED, INVALID_TOKEN, TOKEN_EXPIRED
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '403':
 *         description: FORBIDDEN
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '404':
 *         description: TASK_NOT_FOUND
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '422':
 *         description: VALIDATION_ERROR, INVALID_STATUS_TRANSITION
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
