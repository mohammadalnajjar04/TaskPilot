import axiosClient from "../api/axiosClient";
import { TASK_ENDPOINTS } from "../api/endpoints";

export const taskService = {
  async list(params) {
    const { data } = await axiosClient.get(TASK_ENDPOINTS.list, { params });
    return data.data;
  },

  async get(taskId) {
    const { data } = await axiosClient.get(TASK_ENDPOINTS.get(taskId));
    return data.data;
  },

  async create(payload) {
    const { data } = await axiosClient.post(TASK_ENDPOINTS.create, payload);
    return data.data;
  },

  async update(taskId, payload) {
    const { data } = await axiosClient.put(TASK_ENDPOINTS.update(taskId), payload);
    return data.data;
  },

  async changeStatus(taskId, status) {
    const { data } = await axiosClient.patch(
      TASK_ENDPOINTS.changeStatus(taskId),
      { status }
    );
    return data.data;
  },

  async delete(taskId) {
    const { data } = await axiosClient.delete(TASK_ENDPOINTS.delete(taskId));
    return data.data;
  },

  async listComments(taskId) {
    const { data } = await axiosClient.get(TASK_ENDPOINTS.comments(taskId));
    return data.data;
  },

  async addComment(taskId, payload) {
    const { data } = await axiosClient.post(
      TASK_ENDPOINTS.comments(taskId),
      payload
    );
    return data.data;
  },

  async updateComment(taskId, commentId, payload) {
    const { data } = await axiosClient.put(
      TASK_ENDPOINTS.comment(taskId, commentId),
      payload
    );
    return data.data;
  },

  async deleteComment(taskId, commentId) {
    const { data } = await axiosClient.delete(
      TASK_ENDPOINTS.comment(taskId, commentId)
    );
    return data.data;
  },

  async listAttachments(taskId) {
    const { data } = await axiosClient.get(TASK_ENDPOINTS.attachments(taskId));
    return data.data;
  },

  async getAttachment(taskId, attachmentId) {
    const { data } = await axiosClient.get(
      TASK_ENDPOINTS.attachment(taskId, attachmentId)
    );
    return data.data;
  },

  async uploadAttachment(taskId, formData) {
    const { data } = await axiosClient.post(
      TASK_ENDPOINTS.attachments(taskId),
      formData
    );
    return data.data;
  },

  async deleteAttachment(taskId, attachmentId) {
    const { data } = await axiosClient.delete(
      TASK_ENDPOINTS.attachment(taskId, attachmentId)
    );
    return data.data;
  },
};
