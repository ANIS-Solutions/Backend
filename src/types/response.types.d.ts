export interface IApiResponse<T> {
  success: boolean;
  message: string;
  data?: T | undefined;
  meta?: IMeta | undefined;
  accessToken?: string | undefined;
}
export interface IMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
export const buildMeta = (page: number, limit: number, total: number) => {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
};
