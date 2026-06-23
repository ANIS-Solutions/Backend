import fs from 'fs';

import config from '@/config/base';
import { IPromptEmbedding } from '@/modules/AiServices/embedding.model';
import axios, { AxiosError, AxiosInstance } from 'axios';
import FormData from 'form-data';

import { signM2MToken } from './jwt.handler.js';

interface EmbeddingRequest {
  safe_baseline: string;
  active_threats: Record<string, string>;
}

interface EmbeddingResponse {
  embeddings: IPromptEmbedding;
  labels: string[];
}

interface ReportImageHighlight {
  resultId: number;
  sessionId: number;
  timestamp: number;
  embedding: number[];
}

export interface ReportRequestPayload {
  childId: string;
  totalSessions: number;
  sessionEmbeddings: number[][];
  imageHighlights: ReportImageHighlight[];
  images: { path: string; filename: string }[];
}

interface ActivityEntry {
  tag: string;
  percentage: number;
}

export interface ReportGenerationResult {
  reportText: string;
  semanticSummary: string;
  activityDistribution: ActivityEntry[];
}

class EmbeddingService {
  private readonly client: AxiosInstance;
  private readonly targetService = 'embedding-service';

  constructor() {
    this.client = axios.create({
      baseURL: config.FASTAPI_INTERNAL_URL,
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

  async generateReport(
    payload: ReportRequestPayload,
  ): Promise<ReportGenerationResult> {
    const form = new FormData();

    const { images, ...jsonPayload } = payload;
    form.append('payload', JSON.stringify(jsonPayload));

    for (const img of images) {
      form.append('images', fs.createReadStream(img.path), {
        filename: img.filename,
        contentType: 'image/png',
      });
    }

    const { data } = await this.client.post<ReportGenerationResult>(
      '/report',
      form,
      {
        headers: {
          ...form.getHeaders(),
        },
        timeout: 120_000,
      },
    );

    return data;
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
