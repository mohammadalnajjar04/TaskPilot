const bcrypt = require("bcrypt");

const userRepository = require("../repositories/userRepository");
const activityLogRepository = require("../repositories/activityLogRepository");
const { generateAccessToken } = require("../utils/jwt");
const {
  ConflictError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
} = require("../utils/errors");

const SALT_ROUNDS = 12;

const registerUser = async ({ fullName, email, password }) => {
  const trimmedFullName = fullName.trim();
  const normalizedEmail = email.toLowerCase();

  const exists = await userRepository.emailExists(normalizedEmail);
  if (exists) {
    throw new ConflictError(
      "Email is already registered",
      "EMAIL_ALREADY_EXISTS"
    );
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await userRepository.createUser({
    fullName: trimmedFullName,
    email: normalizedEmail,
    passwordHash,
  });

  const accessToken = generateAccessToken(user);

  await activityLogRepository.logActivity({
    userId: user.user_id,
    activityType: "REGISTER_USER",
    description: `User registered: ${user.email}`,
  });

  return { user, accessToken };
};

const loginUser = async ({ email, password }) => {
  const normalizedEmail = email.toLowerCase();

  const user = await userRepository.findByEmail(normalizedEmail);

  if (!user) {
    throw new UnauthorizedError(
      "Invalid email or password",
      "INVALID_CREDENTIALS"
    );
  }

  if (!user.is_active) {
    throw new ForbiddenError("Account is disabled", "ACCOUNT_DISABLED");
  }

  const passwordMatches = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatches) {
    throw new UnauthorizedError(
      "Invalid email or password",
      "INVALID_CREDENTIALS"
    );
  }

  const safeUser = { ...user };
  delete safeUser.password_hash;

  const accessToken = generateAccessToken(user);

  await userRepository.updateLastLogin(user.user_id);

  await activityLogRepository.logActivity({
    userId: user.user_id,
    activityType: "LOGIN_USER",
    description: `User logged in: ${user.email}`,
  });

  return { user: safeUser, accessToken };
};

const getCurrentUser = async (userId) => {
  const user = await userRepository.findById(userId);

  if (!user) {
    throw new NotFoundError("User not found");
  }

  if (!user.is_active) {
    throw new ForbiddenError("Account is disabled", "ACCOUNT_DISABLED");
  }

  return user;
};

module.exports = {
  registerUser,
  loginUser,
  getCurrentUser,
  SALT_ROUNDS,
};
