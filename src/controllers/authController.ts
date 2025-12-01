import { ParentModel } from '@models/authModels';
import { RequestHandler } from 'express';

export interface IRegister {
  email: string;
  password: string;
  phone: string;
  firstName: string;
  lastName: string;
  birthDate: Date;
}
export const register: RequestHandler = async (req, res, next) => {
  const { email, password, phone, firstName, lastName, birthDate } =
    req.body as IRegister;
  const existing = await ParentModel.findOne({ email });
  if (!existing)
    return res.status(409).json({ message: 'Email already exists.' });
  const passwordHash: string = password;
  const otp: any = {};
  const user = await ParentModel.create({
    email,
    password: passwordHash,
    phone,
    firstName,
    birthDate,
    lastName,
    otp,
  });
};

export const login: RequestHandler = async (req, res, next) => {
  res.send('login endpoint');
};
export const logout: RequestHandler = async (req, res, next) => {
  res.send('logout endpoint');
};
export const verify_otp: RequestHandler = async (req, res, next) => {
  res.send('verify_otp endpoint');
};
export const verify_email: RequestHandler = async (req, res, next) => {
  res.send('verify_email endpoint');
};
export const change_password: RequestHandler = async (req, res, next) => {
  res.send('change_password endpoint');
};
export const forget_password: RequestHandler = async (req, res, next) => {
  res.send('forget_password endpoint');
};
export const reset_password: RequestHandler = async (req, res, next) => {
  res.send('reset_password endpoint');
};
export const refresh_token: RequestHandler = async (req, res, next) => {
  res.send('refresh_token endpoint');
};
