import { Prisma } from '@prisma/client';
import type { ErrorRequestHandler, Request } from 'express';
import { z } from 'zod';

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code = 'API_ERROR',
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const notFound = (resource: string) => new ApiError(404, `${resource} non trovato`, 'NOT_FOUND');
export const conflict = (message: string) => new ApiError(409, message, 'CONFLICT');

function requestId(request: Request) {
  return request.requestId;
}

function normalizeError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  if (typeof error === 'object' && error !== null && 'type' in error && error.type === 'entity.too.large') {
    return new ApiError(413, 'Il corpo della richiesta supera la dimensione consentita', 'PAYLOAD_TOO_LARGE');
  }

  if (error instanceof z.ZodError) {
    return new ApiError(422, 'I dati inviati non sono validi', 'VALIDATION_ERROR', error.flatten());
  }

  if (error instanceof SyntaxError && 'body' in error) {
    return new ApiError(400, 'Il corpo della richiesta non è JSON valido', 'INVALID_JSON');
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return conflict('Esiste già una risorsa con gli stessi dati univoci');
      case 'P2003':
        return new ApiError(409, 'La risorsa è collegata a dati non validi', 'RELATION_CONFLICT');
      case 'P2025':
        return notFound('Risorsa');
      default:
        return new ApiError(500, 'Errore durante l’operazione sul database', 'DATABASE_ERROR');
    }
  }

  if (
    error instanceof Prisma.PrismaClientInitializationError ||
    error instanceof Prisma.PrismaClientRustPanicError
  ) {
    return new ApiError(503, 'Il servizio dati non è momentaneamente disponibile', 'DATABASE_UNAVAILABLE');
  }

  return new ApiError(500, 'Errore interno del servizio', 'INTERNAL_ERROR');
}

export const errorHandler: ErrorRequestHandler = (error, request, response, _next) => {
  const normalized = normalizeError(error);
  const id = requestId(request);

  if (normalized.statusCode >= 500) {
    console.error(JSON.stringify({
      level: 'error',
      requestId: id,
      method: request.method,
      path: request.originalUrl,
      code: normalized.code,
      error: error instanceof Error ? error.message : String(error),
    }));
  }

  response.status(normalized.statusCode).json({
    error: normalized.message,
    code: normalized.code,
    requestId: id,
    ...(normalized.details ? { details: normalized.details } : {}),
  });
};
