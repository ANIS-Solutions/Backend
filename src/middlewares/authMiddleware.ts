import { ParentModel } from '@models/authModels';
import { verifyToken } from '@services/authService';
import AppError from '@utils/AppError';
import { catchAsync } from '@utils/catchAsync';
import HttpStatusCode from '@utils/HttpStatusCode';
import { NextFunction, Request, Response } from 'express';

export const authMiddleware = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // const authHeader = req.headers.authorization?.split(' ')[1];
    let token;
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
      return next(
        new AppError(
          'You are not logged in! log in firstly.',
          HttpStatusCode.UNAUTHORIZED,
        ),
      );
    }
    // try {
    //   const payload = verifyToken(authHeader);
    //   if (!payload) {
    //     return res.status(HttpStatusCode.UNAUTHORIZED).send({
    //       message: 'Unauthorized destination for user.',
    //     });
    //   }
    // } catch (err) {
    //   return res
    //     .status(HttpStatusCode.UNAUTHORIZED)
    //     .send({ message: 'Unauthorized destination for user.', error: err });
    // }
    // try {
    const decoded = verifyToken(token);
    // console.log(decoded);
    // } catch (err) {
    //   console.log(err, '===========');
    //   return next(
    //     new AppError(
    //       err, //'Invalid or expired token. Please log in again.',
    //       HttpStatusCode.UNAUTHORIZED,
    //     ),
    //   );
    // }

    const stillUser = await ParentModel.findById(decoded.userId);
    if (!stillUser) {
      return next(
        new AppError('The user no longer exists.', HttpStatusCode.UNAUTHORIZED),
      );
    }
    console.log((decoded.exp! - parseInt(`${Date.now() / 1000}`, 10)) / 60);

    if (decoded.iat && !stillUser.changePasswordAfter(decoded.iat)) {
      return next(
        new AppError(
          'Token Expired, Please log in again!',
          HttpStatusCode.UNAUTHORIZED,
        ),
      );
    }
    // const ss = new Date(+decoded.iat!).toISOString();
    req.user = decoded;

    next();
  },
);
