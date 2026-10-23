const express = require("express");

const projectController = require("../controllers/projectController");
const projectValidator = require("../validators/projectValidator");
const validateRequest = require("../middleware/validateRequest");
const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authenticate);

router.get("/", projectController.listProjects);

router.post(
  "/",
  projectValidator.createProjectValidator,
  validateRequest,
  projectController.createProject
);

router.get(
  "/:id",
  projectValidator.projectIdValidator,
  validateRequest,
  projectController.getProject
);

router.put(
  "/:id",
  projectValidator.projectIdValidator,
  projectValidator.updateProjectValidator,
  validateRequest,
  projectController.updateProject
);

router.patch(
  "/:id/status",
  projectValidator.projectIdValidator,
  projectValidator.changeProjectStatusValidator,
  validateRequest,
  projectController.changeProjectStatus
);

router.delete(
  "/:id",
  projectValidator.projectIdValidator,
  validateRequest,
  projectController.deleteProject
);

module.exports = router;
