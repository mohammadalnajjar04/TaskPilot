import axiosClient from "../api/axiosClient";
import { PROJECT_ENDPOINTS } from "../api/endpoints";

export const projectService = {
  async list(params) {
    const { data } = await axiosClient.get(PROJECT_ENDPOINTS.list, { params });
    return data.data;
  },

  async get(projectId) {
    const { data } = await axiosClient.get(PROJECT_ENDPOINTS.get(projectId));
    return data.data;
  },

  async create(payload) {
    const { data } = await axiosClient.post(PROJECT_ENDPOINTS.create, payload);
    return data.data;
  },

  async update(projectId, payload) {
    const { data } = await axiosClient.put(
      PROJECT_ENDPOINTS.update(projectId),
      payload
    );
    return data.data;
  },

  async changeStatus(projectId, status) {
    const { data } = await axiosClient.patch(
      PROJECT_ENDPOINTS.changeStatus(projectId),
      { status }
    );
    return data.data;
  },

  async delete(projectId) {
    const { data } = await axiosClient.delete(PROJECT_ENDPOINTS.delete(projectId));
    return data.data;
  },

  async listMembers(projectId) {
    const { data } = await axiosClient.get(PROJECT_ENDPOINTS.members(projectId));
    return data.data;
  },

  async addMember(projectId, payload) {
    const { data } = await axiosClient.post(
      PROJECT_ENDPOINTS.members(projectId),
      payload
    );
    return data.data;
  },

  async updateMember(projectId, userId, payload) {
    const { data } = await axiosClient.patch(
      PROJECT_ENDPOINTS.member(projectId, userId),
      payload
    );
    return data.data;
  },

  async removeMember(projectId, userId) {
    const { data } = await axiosClient.delete(
      PROJECT_ENDPOINTS.member(projectId, userId)
    );
    return data.data;
  },
};
