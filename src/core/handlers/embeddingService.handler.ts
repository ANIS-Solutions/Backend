import fs from 'fs';

import config from '@/config/base';
import { IPromptEmbedding } from '@/modules/AiServices/embedding.model';
import axios, { AxiosError, AxiosInstance } from 'axios';
import FormData from 'form-data';

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

// ── Report Types ─────────────────────────────────────────────────────────────

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

  /**
   * Send session data + images to FastAPI /report and return the generated report.
   * Uses multipart/form-data to include both JSON payload and binary image files.
   */
  async generateReport(
    payload: ReportRequestPayload,
  ): Promise<ReportGenerationResult> {
    const form = new FormData();

    // JSON payload as a form field
    const { images, ...jsonPayload } = payload;
    form.append('payload', JSON.stringify(jsonPayload));

    // Attach image files
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
        timeout: 120_000, // LLM generation can take longer
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
