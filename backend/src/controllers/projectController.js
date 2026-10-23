const projectService = require("../services/projectService");
const asyncHandler = require("../utils/asyncHandler");

const listProjects = asyncHandler(async (req, res) => {
  const projects = await projectService.getProjects({ user: req.user });

  res.status(200).json({
    success: true,
    data: { projects },
  });
});

const getProject = asyncHandler(async (req, res) => {
  const project = await projectService.getProject({
    user: req.user,
    projectId: req.params.id,
  });

  res.status(200).json({
    success: true,
    data: { project },
  });
});

const createProject = asyncHandler(async (req, res) => {
  const project = await projectService.createProject({
    user: req.user,
    ...req.body,
  });

  res.status(201).json({
    success: true,
    data: { project },
  });
});

const updateProject = asyncHandler(async (req, res) => {
  const project = await projectService.updateProject({
    user: req.user,
    projectId: req.params.id,
    body: req.body,
  });

  res.status(200).json({
    success: true,
    data: { project },
  });
});

const changeProjectStatus = asyncHandler(async (req, res) => {
  const project = await projectService.changeProjectStatus({
    user: req.user,
    projectId: req.params.id,
    status: req.body.status,
  });

  res.status(200).json({
    success: true,
    data: { project },
  });
});

const deleteProject = asyncHandler(async (req, res) => {
  const result = await projectService.deleteProject({
    user: req.user,
    projectId: req.params.id,
  });

  res.status(200).json({
    success: true,
    data: result,
  });
});

module.exports = {
  listProjects,
  getProject,
  createProject,
  updateProject,
  changeProjectStatus,
  deleteProject,
};
