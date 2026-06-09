import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export async function getSession() {
  return getServerSession(authOptions);
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session?.user?.email) return null;
  return prisma.user.findUnique({ where: { email: session.user.email } });
}

const ROLE_HIERARCHY: Record<Role, number> = {
  VIEWER: 1,
  MEMBER: 2,
  PHOTOGRAPHER: 3,
  ADMIN: 4,
};

export function hasMinRole(userRole: Role, required: Role) {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[required];
}

export function canUpload(role: Role) {
  return role === Role.ADMIN || role === Role.PHOTOGRAPHER;
}

export function canInteract(role: Role) {
  return role !== Role.VIEWER;
}

export async function canViewEvent(eventId: string, userId?: string, userRole?: Role) {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) return false;
  if (event.isPublic) return true;
  if (!userId) return false;
  if (userRole && hasMinRole(userRole, Role.MEMBER)) return true;
  return false;
}
