/**
 * @openapi
 * tags:
 *   - name: Task Comments
 *     description: Task comment operations
 *   - name: Task Attachments
 *     description: Task attachment operations
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     TaskComment:
 *       type: object
 *       properties:
 *         comment_id:
 *           type: integer
 *         task_id:
 *           type: integer
 *         user_id:
 *           type: integer
 *         comment_text:
 *           type: string
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *         full_name:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *     CreateTaskCommentRequest:
 *       type: object
 *       required:
 *         - comment_text
 *       properties:
 *         comment_text:
 *           type: string
 *           minLength: 1
 *       example:
 *         comment_text: Authentication endpoint is ready for review.
 *     UpdateTaskCommentRequest:
 *       type: object
 *       required:
 *         - comment_text
 *       properties:
 *         comment_text:
 *           type: string
 *           minLength: 1
 *     TaskCommentResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         data:
 *           type: object
 *           properties:
 *             comment:
 *               $ref: '#/components/schemas/TaskComment'
 *     TaskCommentListResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         data:
 *           type: object
 *           properties:
 *             comments:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TaskComment'
 *     TaskAttachment:
 *       type: object
 *       properties:
 *         attachment_id:
 *           type: integer
 *         task_id:
 *           type: integer
 *         uploaded_by:
 *           type: integer
 *         file_name:
 *           type: string
 *         mime_type:
 *           type: string
 *         file_size:
 *           type: integer
 *           minimum: 1
 *         uploaded_at:
 *           type: string
 *           format: date-time
 *         uploader_user_id:
 *           type: integer
 *         uploader_full_name:
 *           type: string
 *         uploader_email:
 *           type: string
 *           format: email
 *         download_url:
 *           type: string
 *       example:
 *         attachment_id: 1
 *         task_id: 2
 *         uploaded_by: 1
 *         file_name: taskpilot-erd.pdf
 *         mime_type: application/pdf
 *         file_size: 245000
 *         uploaded_at: "2026-08-05T10:00:00.000Z"
 *         uploader_user_id: 1
 *         uploader_full_name: Test User
 *         uploader_email: test.user@example.com
 *         download_url: /uploads/task-attachments/example.pdf
 *     TaskAttachmentResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         data:
 *           type: object
 *           properties:
 *             attachment:
 *               $ref: '#/components/schemas/TaskAttachment'
 *     TaskAttachmentListResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         data:
 *           type: object
 *           properties:
 *             attachments:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TaskAttachment'
 */

/**
 * @openapi
 * /tasks/{taskId}/comments:
 *   parameters:
 *     - name: taskId
 *       in: path
 *       required: true
 *       schema:
 *         type: integer
 *         minimum: 1
 *   get:
 *     summary: List task comments
 *     tags: [Task Comments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: List of task comments
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TaskCommentListResponse'
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
 *   post:
 *     summary: Create a task comment
 *     tags: [Task Comments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTaskCommentRequest'
 *     responses:
 *       '201':
 *         description: Task comment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TaskCommentResponse'
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
 */

/**
 * @openapi
 * /tasks/{taskId}/comments/{commentId}:
 *   parameters:
 *     - name: taskId
 *       in: path
 *       required: true
 *       schema:
 *         type: integer
 *         minimum: 1
 *     - name: commentId
 *       in: path
 *       required: true
 *       schema:
 *         type: integer
 *         minimum: 1
 *   put:
 *     summary: Update a task comment
 *     tags: [Task Comments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateTaskCommentRequest'
 *     responses:
 *       '200':
 *         description: Task comment updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TaskCommentResponse'
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
 *         description: COMMENT_NOT_FOUND or TASK_NOT_FOUND
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
 *     summary: Delete a task comment
 *     tags: [Task Comments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Task comment deleted successfully
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
 *                     comment_id:
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
 *         description: COMMENT_NOT_FOUND or TASK_NOT_FOUND
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
 * /tasks/{taskId}/attachments:
 *   parameters:
 *     - name: taskId
 *       in: path
 *       required: true
 *       schema:
 *         type: integer
 *         minimum: 1
 *   get:
 *     summary: List task attachments
 *     tags: [Task Attachments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: List of task attachments
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TaskAttachmentListResponse'
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
 *   post:
 *     summary: Upload a task attachment
 *     tags: [Task Attachments]
 *     security:
 *       - bearerAuth: []
 *     description: >-
 *       Uploads a single file with maximum size of 5 MB.
 *       The multipart field name must be "file".
 *       Allowed MIME types: image/jpeg, image/png, image/webp,
 *       application/pdf, text/plain, application/zip.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       '201':
 *         description: Attachment uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TaskAttachmentResponse'
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
 *       '413':
 *         description: FILE_TOO_LARGE
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '422':
 *         description: FILE_REQUIRED, UNSUPPORTED_FILE_TYPE, VALIDATION_ERROR
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '500':
 *         description: UPLOAD_ERROR
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @openapi
 * /tasks/{taskId}/attachments/{attachmentId}:
 *   parameters:
 *     - name: taskId
 *       in: path
 *       required: true
 *       schema:
 *         type: integer
 *         minimum: 1
 *     - name: attachmentId
 *       in: path
 *       required: true
 *       schema:
 *         type: integer
 *         minimum: 1
 *   get:
 *     summary: Get attachment metadata
 *     tags: [Task Attachments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Attachment metadata
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TaskAttachmentResponse'
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
 *         description: ATTACHMENT_NOT_FOUND or TASK_NOT_FOUND
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
 *     summary: Delete a task attachment
 *     tags: [Task Attachments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Attachment deleted successfully
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
 *                     deleted:
 *                       $ref: '#/components/schemas/TaskAttachment'
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
 *         description: ATTACHMENT_NOT_FOUND or TASK_NOT_FOUND
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
