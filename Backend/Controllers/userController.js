import { asyncHandler } from "../Middlerwares/asyncHandler.js";
import { AppError } from "../Utils/appError.js";
import { users } from "../Model/index.js";
import { sendToken } from "../Utils/jwtToken.js";
import bcrypt from "bcrypt";

export const createUser = asyncHandler(async (req, res, next) => {
  const { name, email, password } = req.body || {};

  if (!name || !email || !password) {
    return next(new AppError("Please enter all fields"), 400);
  }

  const user = await users.create({ name, email, password });

  sendToken(user, 200, res);
});

export const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email.trim() || !password.trim()) {
    return next(new AppError("Please enter email and password", 400));
  }

  const user = await users.findOne({
    where: { email },
    attributes: { include: ["password"] },
    raw: true,
  });

  if (!user) {
    return next(new AppError("Incorrect email or password", 401));
  }

  const isPassword = await bcrypt.compare(password, user.password);

  if (!isPassword) {
    return next(new AppError("Incorrect email or password", 401));
  }

  sendToken(user, 200, res);
});

export const getUsers = asyncHandler(async (req, res, next) => {
  const usersData = await users.findAll();

  res.status(200).json({
    status: "success",
    total: usersData.length,
    data: {
      users: usersData,
    },
  });
});

export const deleteUser = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;
  const user = await users.findByPk(userId);

  if (!user) {
    return next(new AppError("No user found with provided ID", 404));
  }

  await users.destroy({ where: { userId: userId } });

  res.status(204).json({
    status: "success",
    data: null,
  });
});

export const updateUser = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;
  const { name, email } = req.body || {};

  const user = await users.findByPk(userId);

  if (!user) {
    return next(new AppError("No user found with provided ID", 404));
  }

  if (!name && !email) {
    return next(new AppError("Please provide at least one field", 400));
  }

  if (name) user.name = name;
  if (email) user.email = email;

  await user.save();

  res.status(200).json({
    status: "success",
    data: {
      user,
    },
  });
});
