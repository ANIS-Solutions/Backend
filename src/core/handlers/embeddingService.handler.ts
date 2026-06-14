import config from '@/config/base';
import { IPromptEmbedding } from '@/modules/AiServices/embedding.model';
import axios, { AxiosError, AxiosInstance } from 'axios';

import logger from '../utils/logger.js';
import { signM2MToken } from './jwt.handler.js';

interface EmbeddingRequest {
  safe_baseline: string;
  active_threats: Record<string, string>;
}

interface EmbeddingResponse {
  embeddings: IPromptEmbedding;
  labels: string[];
}

class EmbeddingService {
  private readonly client: AxiosInstance;
  private readonly targetService = 'embedding-service';

  constructor() {
    this.client = axios.create({
      baseURL: config.EMBEDDING_SERVICE_URL,
      timeout: 30_000,
      headers: { 'Content-Type': 'application/json' },
    });

    this.client.interceptors.request.use((axiosConfig) => {
      const token = signM2MToken('core-api', this.targetService);
      axiosConfig.headers.Authorization = `Bearer ${token}`;
      return axiosConfig;
    });

    this.client.interceptors.response.use(
      (res) => res,
      (err: AxiosError<{ detail?: string }>) => {
        const status = err.response?.status;
        const detail = err.response?.data?.detail ?? err.message;
        return Promise.reject(
          new Error(`[EmbeddingService] ${status ?? 'NETWORK'}: ${detail}`),
        );
      },
    );
  }

  async generateEmbeddings(
    safeBaseline: string,
    activeThreats: Record<string, string>,
  ): Promise<IPromptEmbedding> {
    const body: EmbeddingRequest = {
      safe_baseline: safeBaseline,
      active_threats: activeThreats,
    };

    const { data } = await this.client.post<EmbeddingResponse>(
      '/embeddings',
      body,
    );

    return data.embeddings;
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.client.get('/health');
      return true;
    } catch {
      return false;
    }
  }
}

export const embeddingService = new EmbeddingService();
