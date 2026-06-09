import { NextResponse } from 'next/server';

export type ApiResponse<T> = {
  data: T | null;
  error: string | null;
  status: number;
};

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ data, error: null, status } satisfies ApiResponse<T>, { status });
}

export function apiError(error: string, status = 400) {
  return NextResponse.json({ data: null, error, status } satisfies ApiResponse<null>, { status });
}
