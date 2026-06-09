export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';
import { Role } from '@prisma/client';

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  role: z.enum(['ADMIN', 'PHOTOGRAPHER', 'MEMBER', 'VIEWER']).default('MEMBER'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.errors[0]?.message || 'Invalid input', 400);
    }

    const { name, email, password, role } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return apiError('Email already registered', 409);

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, passwordHash, role: role as Role },
      select: { id: true, name: true, email: true, role: true },
    });

    return apiSuccess(user, 201);
  } catch (err) {
    console.error('Register error:', err);
    return apiError('Registration failed', 500);
  }
}

