const path = require("path");
const swaggerJSDoc = require("swagger-jsdoc");

const swaggerDefinition = {
  openapi: "3.0.3",
  info: {
    title: "TaskPilot API",
    version: "1.0.0",
    description: "REST API for TaskPilot project and task management system",
  },
  servers: [
    {
      url: "http://localhost:5000/api/v1",
      description: "Local development server",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
  },
};

const globDir = (dir) =>
  path.join(__dirname, "..", dir).split(path.sep).join("/");

const options = {
  swaggerDefinition,
  apis: [
    `${globDir("routes")}/*.js`,
    `${globDir("docs")}/*.js`,
  ],
};

const specs = swaggerJSDoc(options);

const swaggerUiOptions = {
  customSiteTitle: "TaskPilot API Docs",
};

module.exports = { specs, swaggerUiOptions };
