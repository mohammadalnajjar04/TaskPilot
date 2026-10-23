const bcrypt = require("bcrypt");
const { validationResult } = require("express-validator");

const userRepository = require("../repositories/userRepository");
const { SALT_ROUNDS } = require("../services/authService");
const { registerValidator } = require("../validators/authValidator");

const DEFAULT_ADMIN = {
  fullName: "System Administrator",
  email: "admin@taskpilot.com",
  password: "Admin@123",
  role: "admin",
  isActive: true,
};

const DUPLICATE_KEY_ERROR_CODE = "23505";

const createDefaultAdmin = async () => {
  const adminExists = await userRepository.findAdminExists();

  if (adminExists) {
    console.log("✔ Default admin already exists.");
    return { created: false };
  }

  const request = { body: { ...DEFAULT_ADMIN } };

  for (const chain of registerValidator) {
    await chain.run(request);
  }

  const validationErrors = validationResult(request);

  if (!validationErrors.isEmpty()) {
    throw new Error(
      `Default admin validation failed: ${validationErrors
        .array()
        .map((error) => error.msg)
        .join(", ")}`
    );
  }

  const passwordHash = await bcrypt.hash(DEFAULT_ADMIN.password, SALT_ROUNDS);

  try {
    await userRepository.createUser({
      fullName: DEFAULT_ADMIN.fullName,
      email: DEFAULT_ADMIN.email,
      passwordHash,
      role: DEFAULT_ADMIN.role,
      isActive: DEFAULT_ADMIN.isActive,
    });
  } catch (error) {
    if (error.code === DUPLICATE_KEY_ERROR_CODE) {
      console.log("✔ Default admin already exists.");
      return { created: false };
    }

    throw error;
  }

  console.log("✔ Default system admin created.");
  return { created: true };
};

module.exports = { createDefaultAdmin, DEFAULT_ADMIN };
