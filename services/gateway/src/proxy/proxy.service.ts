import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { SERVICE_PORTS } from '@dum360/shared';

interface ProxyRequest {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;
  body?: unknown;
  query?: Record<string, string>;
  headers?: Record<string, string>;
}

/**
 * Lightweight HTTP proxy to downstream microservices.
 * All internal services are on the same Docker network.
 */
@Injectable()
export class ProxyService {
  private readonly logger = new Logger(ProxyService.name);

  private baseUrl(service: keyof typeof SERVICE_PORTS): string {
    const host = process.env[`${service}_HOST`] ?? service.toLowerCase();
    const port = SERVICE_PORTS[service];
    return `http://${host}:${port}`;
  }

  /** Forward a request to a downstream service and return the parsed JSON response. */
  async forward<T = unknown>(service: keyof typeof SERVICE_PORTS, req: ProxyRequest): Promise<T> {
    const url = new URL(req.path, this.baseUrl(service));
    if (req.query) {
      Object.entries(req.query).forEach(([k, v]) => url.searchParams.set(k, v));
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...req.headers,
    };

    const start = Date.now();
    this.logger.debug(`→ ${req.method} ${url.toString()}`);

    try {
      const response = await fetch(url.toString(), {
        method: req.method,
        headers,
        body: req.body ? JSON.stringify(req.body) : undefined,
      });

      const elapsed = Date.now() - start;
      this.logger.debug(`← ${response.status} ${req.method} ${url.pathname} (${elapsed}ms)`);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new HttpException(
          error,
          response.status,
        );
      }

      // 204 No Content
      if (response.status === 204) return undefined as T;

      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof HttpException) throw error;

      this.logger.error(`Proxy error: ${req.method} ${service}/${req.path}`, error);
      throw new HttpException(
        { error: 'Service Unavailable', message: `${service} service unreachable` },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}
