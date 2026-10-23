/**
 * @openapi
 * tags:
 *   - name: Projects
 *     description: Project operations
 *   - name: Project Members
 *     description: Project member operations
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     Project:
 *       type: object
 *       properties:
 *         project_id:
 *           type: integer
 *         owner_id:
 *           type: integer
 *         project_key:
 *           type: string
 *         project_name:
 *           type: string
 *         description:
 *           type: string
 *           nullable: true
 *         start_date:
 *           type: string
 *           format: date
 *           nullable: true
 *         end_date:
 *           type: string
 *           format: date
 *           nullable: true
 *         status:
 *           type: string
 *           enum: [planning, in_progress, on_hold, completed, cancelled]
 *         progress_percentage:
 *           type: integer
 *           minimum: 0
 *           maximum: 100
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *       example:
 *         project_key: TP
 *         project_name: TaskPilot Backend
 *         description: Task management backend project
 *         start_date: "2026-08-01"
 *         end_date: "2026-09-01"
 *         status: planning
 *         progress_percentage: 0
 *     CreateProjectRequest:
 *       type: object
 *       required:
 *         - project_key
 *         - project_name
 *       properties:
 *         project_key:
 *           type: string
 *           pattern: '^[A-Z][A-Z0-9]{1,9}$'
 *         project_name:
 *           type: string
 *           minLength: 3
 *           maxLength: 150
 *         description:
 *           type: string
 *         start_date:
 *           type: string
 *           format: date
 *           nullable: true
 *         end_date:
 *           type: string
 *           format: date
 *           nullable: true
 *         status:
 *           type: string
 *           enum: [planning, in_progress, on_hold, completed, cancelled]
 *           default: planning
 *         progress_percentage:
 *           type: integer
 *           minimum: 0
 *           maximum: 100
 *           default: 0
 *     UpdateProjectRequest:
 *       type: object
 *       properties:
 *         project_key:
 *           type: string
 *           pattern: '^[A-Z][A-Z0-9]{1,9}$'
 *         project_name:
 *           type: string
 *           minLength: 3
 *           maxLength: 150
 *         description:
 *           type: string
 *         start_date:
 *           type: string
 *           format: date
 *           nullable: true
 *         end_date:
 *           type: string
 *           format: date
 *           nullable: true
 *         status:
 *           type: string
 *           enum: [planning, in_progress, on_hold, completed, cancelled]
 *         progress_percentage:
 *           type: integer
 *           minimum: 0
 *           maximum: 100
 *     UpdateProjectStatusRequest:
 *       type: object
 *       required:
 *         - status
 *       properties:
 *         status:
 *           type: string
 *           enum: [planning, in_progress, on_hold, completed, cancelled]
 *         progress_percentage:
 *           type: integer
 *           minimum: 0
 *           maximum: 100
 *     ProjectResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         data:
 *           type: object
 *           properties:
 *             project:
 *               $ref: '#/components/schemas/Project'
 *     ProjectListResponse:
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
 *                 $ref: '#/components/schemas/Project'
 *     ProjectMember:
 *       type: object
 *       properties:
 *         project_member_id:
 *           type: integer
 *         project_id:
 *           type: integer
 *         user_id:
 *           type: integer
 *         member_role:
 *           type: string
 *           enum: [owner, manager, member, viewer]
 *         joined_at:
 *           type: string
 *           format: date-time
 *         full_name:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         is_active:
 *           type: boolean
 *     AddProjectMemberRequest:
 *       type: object
 *       required:
 *         - user_id
 *         - member_role
 *       properties:
 *         user_id:
 *           type: integer
 *           minimum: 1
 *         member_role:
 *           type: string
 *           enum: [manager, member, viewer]
 *       example:
 *         user_id: 2
 *         member_role: member
 *     UpdateProjectMemberRoleRequest:
 *       type: object
 *       required:
 *         - member_role
 *       properties:
 *         member_role:
 *           type: string
 *           enum: [manager, member, viewer]
 *     ProjectMemberResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         data:
 *           type: object
 *           properties:
 *             member:
 *               $ref: '#/components/schemas/ProjectMember'
 *     ProjectMemberListResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         data:
 *           type: object
 *           properties:
 *             members:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ProjectMember'
 */

/**
 * @openapi
 * /projects:
 *   get:
 *     summary: List accessible projects
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: List of accessible projects
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProjectListResponse'
 *       '401':
 *         description: AUTHENTICATION_REQUIRED, INVALID_TOKEN, TOKEN_EXPIRED
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   post:
 *     summary: Create a project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateProjectRequest'
 *     responses:
 *       '201':
 *         description: Project created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProjectResponse'
 *       '401':
 *         description: AUTHENTICATION_REQUIRED, INVALID_TOKEN, TOKEN_EXPIRED
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '409':
 *         description: PROJECT_KEY_ALREADY_EXISTS or PROJECT_NAME_ALREADY_EXISTS
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
 * /projects/{projectId}:
 *   parameters:
 *     - name: projectId
 *       in: path
 *       required: true
 *       schema:
 *         type: integer
 *         minimum: 1
 *   get:
 *     summary: Get one accessible project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Project details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProjectResponse'
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
 *         description: PROJECT_NOT_FOUND
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
 *     summary: Update a project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProjectRequest'
 *     responses:
 *       '200':
 *         description: Project updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProjectResponse'
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
 *         description: PROJECT_NOT_FOUND
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '409':
 *         description: PROJECT_KEY_ALREADY_EXISTS or PROJECT_NAME_ALREADY_EXISTS
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
 *     summary: Delete a project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Project deleted successfully
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
 *                     project_id:
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
 *         description: PROJECT_NOT_FOUND
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @openapi
 * /projects/{projectId}/status:
 *   parameters:
 *     - name: projectId
 *       in: path
 *       required: true
 *       schema:
 *         type: integer
 *         minimum: 1
 *   patch:
 *     summary: Change project status
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProjectStatusRequest'
 *     responses:
 *       '200':
 *         description: Project status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProjectResponse'
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
 *         description: PROJECT_NOT_FOUND
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '422':
 *         description: VALIDATION_ERROR, INVALID_STATUS, INVALID_STATUS_TRANSITION, INVALID_PROGRESS
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @openapi
 * /projects/{projectId}/members:
 *   parameters:
 *     - name: projectId
 *       in: path
 *       required: true
 *       schema:
 *         type: integer
 *         minimum: 1
 *   get:
 *     summary: List project members
 *     tags: [Project Members]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: List of project members
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProjectMemberListResponse'
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
 *         description: PROJECT_NOT_FOUND
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   post:
 *     summary: Add a project member
 *     tags: [Project Members]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddProjectMemberRequest'
 *     responses:
 *       '201':
 *         description: Project member added successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProjectMemberResponse'
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
 *         description: USER_NOT_FOUND or PROJECT_NOT_FOUND
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '409':
 *         description: PROJECT_MEMBER_ALREADY_EXISTS
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '422':
 *         description: VALIDATION_ERROR, INVALID_MEMBER_ROLE, USER_NOT_ACTIVE
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @openapi
 * /projects/{projectId}/members/{userId}:
 *   parameters:
 *     - name: projectId
 *       in: path
 *       required: true
 *       schema:
 *         type: integer
 *         minimum: 1
 *     - name: userId
 *       in: path
 *       required: true
 *       schema:
 *         type: integer
 *         minimum: 1
 *   patch:
 *     summary: Update a member role
 *     tags: [Project Members]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProjectMemberRoleRequest'
 *     responses:
 *       '200':
 *         description: Project member role updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProjectMemberResponse'
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
 *         description: PROJECT_MEMBER_NOT_FOUND
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '422':
 *         description: VALIDATION_ERROR, INVALID_MEMBER_ROLE, CANNOT_MODIFY_OWNER
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   delete:
 *     summary: Remove a project member
 *     tags: [Project Members]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Project member removed successfully
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
 *                     project_id:
 *                       type: integer
 *                     user_id:
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
 *         description: PROJECT_MEMBER_NOT_FOUND
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '422':
 *         description: CANNOT_MODIFY_OWNER
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
