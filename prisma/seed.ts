import { PrismaClient, Role, MediaType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@club.edu' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@club.edu',
      passwordHash,
      role: Role.ADMIN,
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    },
  });

  const photographer = await prisma.user.upsert({
    where: { email: 'photo@club.edu' },
    update: {},
    create: {
      name: 'Alex Photographer',
      email: 'photo@club.edu',
      passwordHash,
      role: Role.PHOTOGRAPHER,
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=photo',
    },
  });

  const member = await prisma.user.upsert({
    where: { email: 'member@club.edu' },
    update: {},
    create: {
      name: 'Jordan Member',
      email: 'member@club.edu',
      passwordHash,
      role: Role.MEMBER,
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=member',
    },
  });

  await prisma.user.upsert({
    where: { email: 'viewer@club.edu' },
    update: {},
    create: {
      name: 'Sam Viewer',
      email: 'viewer@club.edu',
      passwordHash,
      role: Role.VIEWER,
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=viewer',
    },
  });

  const event = await prisma.event.create({
    data: {
      name: 'Annual Cultural Fest 2025',
      description: 'A celebration of arts, music, and dance featuring performances from all departments.',
      category: 'Cultural',
      date: new Date('2025-03-15'),
      coverImageUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800',
      isPublic: true,
      createdById: admin.id,
      albums: {
        create: [
          {
            name: 'Opening Ceremony',
            description: 'Photos from the grand opening',
          },
          {
            name: 'Dance Performances',
            description: 'Highlights from dance competitions',
          },
        ],
      },
    },
    include: { albums: true },
  });

  const privateEvent = await prisma.event.create({
    data: {
      name: 'Club Retreat 2025',
      description: 'Private members-only retreat photos.',
      category: 'Trip',
      date: new Date('2025-02-20'),
      isPublic: false,
      createdById: admin.id,
      albums: {
        create: { name: 'Day 1', description: 'Arrival and team building' },
      },
    },
    include: { albums: true },
  });

  const album = event.albums[0];
  const placeholderUrl = 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1200';

  const media = await prisma.media.create({
    data: {
      albumId: album.id,
      eventId: event.id,
      uploadedById: photographer.id,
      url: placeholderUrl,
      thumbnailUrl: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400',
      type: MediaType.PHOTO,
      tags: ['celebration', 'crowd', 'festival', 'stage'],
      size: 1024000,
      width: 1200,
      height: 800,
    },
  });

  await prisma.like.create({
    data: { mediaId: media.id, userId: member.id },
  });

  await prisma.comment.create({
    data: {
      mediaId: media.id,
      userId: member.id,
      content: 'Amazing shot! Love the energy in this photo.',
    },
  });

  await prisma.favourite.create({
    data: { mediaId: media.id, userId: member.id },
  });

  await prisma.notification.create({
    data: {
      userId: photographer.id,
      type: 'LIKE',
      message: 'Jordan Member liked your photo',
      relatedMediaId: media.id,
      triggeredBy: member.id,
    },
  });

  console.log('Seed complete:', {
    users: 4,
    events: 2,
    albums: event.albums.length + privateEvent.albums.length,
    media: 1,
  });
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
