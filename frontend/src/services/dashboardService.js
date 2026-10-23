import axiosClient from "../api/axiosClient";
import { DASHBOARD_ENDPOINTS } from "../api/endpoints";

export const dashboardService = {
  async overview() {
    const { data } = await axiosClient.get(DASHBOARD_ENDPOINTS.overview);
    return data.data;
  },

  async projectsProgress() {
    const { data } = await axiosClient.get(DASHBOARD_ENDPOINTS.projectsProgress);
    return data.data;
  },

  async upcomingTasks(params) {
    const { data } = await axiosClient.get(DASHBOARD_ENDPOINTS.upcomingTasks, {
      params,
    });
    return data.data;
  },
};
