import { Suspense } from 'react';
import { LoginForm } from './login-form';
import { Skeleton } from '@/components/ui/skeleton';

export default function LoginPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}>
      <LoginForm />
    </Suspense>
  );
}
