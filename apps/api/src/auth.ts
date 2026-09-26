import { UserRole } from '@prisma/client';
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import { config } from './config.js';
import { prisma } from './db.js';
import { ApiError } from './errors.js';

export type AuthUser = {
  id: string;
  role: UserRole;
  email: string;
};

type AccessTokenPayload = JwtPayload & {
  email: string;
  role: UserRole;
  type: 'access';
};

declare global {
  namespace Express {
    interface Request {
      auth?: AuthUser;
    }
  }
}

export function signToken(user: AuthUser) {
  return jwt.sign(
    { email: user.email, role: user.role, type: 'access' },
    config.jwtSecret,
    {
      algorithm: 'HS256',
      audience: config.tokenAudience,
      expiresIn: '8h',
      issuer: config.tokenIssuer,
      subject: user.id,
    },
  );
}

function readBearerToken(request: Request) {
  const authorization = request.header('authorization');
  if (!authorization) return null;

  const match = /^Bearer\s+(.+)$/i.exec(authorization.trim());
  return match?.[1] ?? null;
}

export const requireAuth: RequestHandler = (request: Request, _response: Response, next: NextFunction) => {
  const token = readBearerToken(request);
  if (!token) return next(new ApiError(401, 'Autenticazione richiesta', 'AUTH_REQUIRED'));

  let payload: AccessTokenPayload;
  try {
    const verified = jwt.verify(token, config.jwtSecret, {
      algorithms: ['HS256'],
      audience: config.tokenAudience,
      issuer: config.tokenIssuer,
    });

    if (
      typeof verified === 'string' ||
      verified.type !== 'access' ||
      typeof verified.sub !== 'string' ||
      typeof verified.email !== 'string' ||
      !Object.values(UserRole).includes(verified.role as UserRole)
    ) {
      return next(new ApiError(401, 'Sessione non valida', 'INVALID_TOKEN'));
    }

    payload = verified as AccessTokenPayload;
  } catch {
    return next(new ApiError(401, 'Sessione non valida o scaduta', 'INVALID_TOKEN'));
  }

  void prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, email: true, role: true, active: true },
  })
    .then((user) => {
      if (!user || !user.active) {
        return next(new ApiError(401, 'Account non disponibile', 'ACCOUNT_INACTIVE'));
      }

      request.auth = { id: user.id, email: user.email, role: user.role };
      return next();
    })
    .catch(next);
};

export function allow(...roles: UserRole[]): RequestHandler {
  return (request, _response, next) => {
    if (!request.auth || !roles.includes(request.auth.role)) {
      return next(new ApiError(403, 'Permessi insufficienti', 'FORBIDDEN'));
    }

    return next();
  };
}
