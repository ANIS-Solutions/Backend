import { IApiResponse, IMeta } from '@/types/response.types';
import { Response } from 'express';

class ApiResponse<T> {
  constructor(
    private success: boolean,
    private statusCode: number,
    private message: string,
    private data?: T,
    private meta?: IMeta,
    private accessToken?: string,
  ) {}
  public static success<T>(
    res: Response,
    statusCode: number,
    message: string,
    data?: T,
    meta?: IMeta,
    accessToken?: string,
  ): Response<IApiResponse<T>> {
    const payload: IApiResponse<T> = {
      success: true,
      message,
      data,
      accessToken,
      meta,
    };

    return res.status(statusCode).json(payload) as Response<IApiResponse<T>>;
  }
}
export default ApiResponse;
