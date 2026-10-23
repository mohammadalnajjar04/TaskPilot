const authService = require("../services/authService");
const asyncHandler = require("../utils/asyncHandler");

const register = asyncHandler(async (req, res) => {
  const { fullName, email, password } = req.body;

  const { user, accessToken } = await authService.registerUser({
    fullName,
    email,
    password,
  });

  res.status(201).json({
    success: true,
    data: { user, accessToken },
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const { user, accessToken } = await authService.loginUser({
    email,
    password,
  });

  res.status(200).json({
    success: true,
    data: { user, accessToken },
  });
});

const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getCurrentUser(req.user.user_id);

  res.status(200).json({
    success: true,
    data: { user },
  });
});

module.exports = {
  register,
  login,
  getMe,
};
