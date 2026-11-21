import { prisma } from '../../prisma/client';

const publicInclude = {
  owner: { select: { id: true, name: true, email: true, phone: true } },
  images: { orderBy: { sortOrder: 'asc' as const } },
  amenities: { orderBy: { createdAt: 'asc' as const } },
  rooms: { orderBy: { pricePerPerson: 'asc' as const } },
};

export const propertiesRepository = {
  publicInclude,
  findMany(where: Record<string, unknown>) {
    return prisma.property.findMany({ where: where as any, include: publicInclude, orderBy: { createdAt: 'desc' } });
  },
  findById(id: string) {
    return prisma.property.findUnique({ where: { id }, include: publicInclude });
  },
  findOwnerRole(userId: string) {
    return prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  },
  findRawById(id: string) {
    return prisma.property.findUnique({ where: { id } });
  },
  findMyProperties(ownerId: string) {
    return prisma.property.findMany({ where: { ownerId }, include: publicInclude, orderBy: { createdAt: 'desc' } });
  },
  findAdminProperties() {
    return prisma.property.findMany({ include: publicInclude, orderBy: { createdAt: 'desc' } });
  },
  createProperty(ownerId: string, data: Record<string, unknown>, amenities: string[] = [], images: any[] = [], rooms: any[] = []) {
    return prisma.$transaction(async (tx) => {
      const created = await tx.property.create({ data: { ownerId, ...data, status: 'ACTIVE', verificationStatus: 'PENDING' } as any });
      if (amenities.length) await tx.propertyAmenity.createMany({ data: amenities.map((name) => ({ propertyId: created.id, name: name as never })) });
      if (images.length) await tx.propertyImage.createMany({ data: images.map((image) => ({ propertyId: created.id, url: image.url, publicId: image.publicId, sortOrder: image.sortOrder ?? 0, isPrimary: image.isPrimary ?? false })) });
      if (rooms.length) await tx.propertyRoom.createMany({ data: rooms.map((room) => ({ propertyId: created.id, roomType: room.roomType, capacity: room.capacity, occupied: room.occupied ?? 0, pricePerPerson: room.pricePerPerson, securityDeposit: room.securityDeposit, availableFrom: room.availableFrom ? new Date(room.availableFrom) : null, availableBeds: room.availableBeds, amenities: room.amenities ?? [], status: room.status ?? 'AVAILABLE' })) });
      return tx.property.findUnique({ where: { id: created.id }, include: publicInclude });
    });
  },
  updateProperty(id: string, data: Record<string, unknown>) {
    return prisma.property.update({ where: { id }, data: data as any });
  },
  replaceAmenities(id: string, amenities: string[]) {
    return prisma.$transaction(async (tx) => {
      await tx.propertyAmenity.deleteMany({ where: { propertyId: id } });
      if (amenities.length) await tx.propertyAmenity.createMany({ data: amenities.map((name) => ({ propertyId: id, name: name as never })) });
    });
  },
  replaceImages(id: string, images: any[]) {
    return prisma.$transaction(async (tx) => {
      await tx.propertyImage.deleteMany({ where: { propertyId: id } });
      if (images.length) await tx.propertyImage.createMany({ data: images.map((image) => ({ propertyId: id, url: image.url, publicId: image.publicId, sortOrder: image.sortOrder ?? 0, isPrimary: image.isPrimary ?? false })) });
    });
  },
  replaceRooms(id: string, rooms: any[]) {
    return prisma.$transaction(async (tx) => {
      await tx.propertyRoom.deleteMany({ where: { propertyId: id } });
      if (rooms.length) await tx.propertyRoom.createMany({ data: rooms.map((room) => ({ propertyId: id, roomType: room.roomType, capacity: room.capacity, occupied: room.occupied ?? 0, pricePerPerson: room.pricePerPerson, securityDeposit: room.securityDeposit, availableFrom: room.availableFrom ? new Date(room.availableFrom) : null, availableBeds: room.availableBeds, amenities: room.amenities ?? [], status: room.status ?? 'AVAILABLE' })) });
    });
  },
  updateWithRelations(id: string, rest: Record<string, unknown>, amenities: string[] | undefined, images: any[] | undefined, rooms: any[] | undefined) {
    return prisma.$transaction(async (tx) => {
      await tx.property.update({ where: { id }, data: rest as any });
      if (amenities) {
        await tx.propertyAmenity.deleteMany({ where: { propertyId: id } });
        if (amenities.length) await tx.propertyAmenity.createMany({ data: amenities.map((name) => ({ propertyId: id, name: name as never })) });
      }
      if (images) {
        await tx.propertyImage.deleteMany({ where: { propertyId: id } });
        if (images.length) await tx.propertyImage.createMany({ data: images.map((image) => ({ propertyId: id, url: image.url, publicId: image.publicId, sortOrder: image.sortOrder ?? 0, isPrimary: image.isPrimary ?? false })) });
      }
      if (rooms) {
        await tx.propertyRoom.deleteMany({ where: { propertyId: id } });
        if (rooms.length) await tx.propertyRoom.createMany({ data: rooms.map((room) => ({ propertyId: id, roomType: room.roomType, capacity: room.capacity, occupied: room.occupied ?? 0, pricePerPerson: room.pricePerPerson, securityDeposit: room.securityDeposit, availableFrom: room.availableFrom ? new Date(room.availableFrom) : null, availableBeds: room.availableBeds, amenities: room.amenities ?? [], status: room.status ?? 'AVAILABLE' })) });
      }
      return tx.property.findUnique({ where: { id }, include: publicInclude });
    });
  },
  findSaved(userId: string, propertyId: string) {
    return prisma.savedProperty.findUnique({ where: { userId_propertyId: { userId, propertyId } } });
  },
  unsave(id: string) {
    return prisma.savedProperty.delete({ where: { id } });
  },
  save(userId: string, propertyId: string) {
    return prisma.savedProperty.create({ data: { userId, propertyId } });
  },
  findInterest(userId: string, propertyId: string, roomId?: string) {
    return prisma.propertyInterest.findFirst({ where: { userId, propertyId, roomId: roomId ?? undefined } });
  },
  createInterest(data: Record<string, unknown>) {
    return prisma.propertyInterest.create({ data: data as any });
  },
  createInterestNotification(ownerId: string) {
    return prisma.notification.create({
      data: { userId: ownerId, type: 'GROUP_JOIN_REQUEST', title: 'New property inquiry', message: 'Someone is interested in one of your listings.' },
    });
  },
};
