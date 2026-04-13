export interface IMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface IFieldError {
  field: string;
  message: string;
}

export interface IApiResponse<T> {
  success: boolean;
  status: 'success' | 'fail' | 'error';
  message: string;
  data?: T;
  meta?: IMeta;
  accessToken?: string;
  qrcode?: string;
  errors?: IFieldError[];
  devInfo?: Record<string, unknown>;
}

export const buildMeta: {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
} = (page: number, limit: number, total: number) => {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
};
