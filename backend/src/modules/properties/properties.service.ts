import { conflict, forbidden, notFound } from '../../errors/AppError';
import { prisma } from '../../prisma/client';
import { propertiesRepository } from './properties.repository';

export const propertiesService = {
  async list(query: Record<string, unknown>) {
    const where: Record<string, unknown> = { status: 'ACTIVE' };
    for (const key of ['city', 'area', 'propertyType', 'genderAllowed']) {
      if (query[key]) where[key] = query[key];
    }
    if (query.verifiedOnly) where.verificationStatus = 'VERIFIED';
    if (query.status) where.status = query.status;
    const properties = await propertiesRepository.findMany(where);
    const minPrice = (query.minPrice as number) ?? 0;
    const maxPrice = (query.maxPrice as number) ?? Number.MAX_SAFE_INTEGER;
    return properties.filter((property: any) => {
      if (property.rooms.length === 0) return minPrice === 0 && maxPrice === Number.MAX_SAFE_INTEGER;
      return property.rooms.some((room: any) => room.pricePerPerson >= minPrice && room.pricePerPerson <= maxPrice);
    });
  },
  get(id: string) {
    return propertiesRepository.findById(id).then((property) => {
      if (!property) throw notFound('Property not found.', 'PROPERTY_NOT_FOUND');
      return property;
    });
  },
  listMine(userId: string) {
    return propertiesRepository.findMyProperties(userId);
  },
  async create(userId: string, role: string | undefined, input: any) {
    if (role !== 'PROPERTY_OWNER' && role !== 'ADMIN') {
      throw forbidden('Only property owners or admins can create listings.');
    }
    const { amenities = [], images = [], rooms = [], ...rest } = input;
    return propertiesRepository.createProperty(userId, rest, amenities, images, rooms);
  },
  async update(userId: string, role: string | undefined, id: string, input: any) {
    const existing = await propertiesRepository.findRawById(id);
    if (!existing) throw notFound('Property not found.', 'PROPERTY_NOT_FOUND');
    if (existing.ownerId !== userId && role !== 'ADMIN') {
      throw forbidden('You can only edit your own listings.');
    }
    const { amenities, images, rooms, ...rest } = input;
    return propertiesRepository.updateWithRelations(id, rest, amenities, images, rooms);
  },
  async toggleSaved(userId: string, propertyId: string) {
    if (!await propertiesRepository.findRawById(propertyId)) {
      throw notFound('Property not found.', 'PROPERTY_NOT_FOUND');
    }
    const existing = await propertiesRepository.findSaved(userId, propertyId);
    if (existing) {
      await propertiesRepository.unsave(existing.id);
      return { saved: false };
    }
    const savedProperty = await propertiesRepository.save(userId, propertyId);
    return { saved: true, savedProperty };
  },
  async requestInterest(userId: string, propertyId: string, input: any) {
    const property = await propertiesRepository.findRawById(propertyId);
    if (!property) throw notFound('Property not found.', 'PROPERTY_NOT_FOUND');
    if (await propertiesRepository.findInterest(userId, propertyId, input.roomId)) {
      throw conflict('You already expressed interest in this property.', 'ALREADY_INTERESTED');
    }
    const interest = await propertiesRepository.createInterest({
      userId, propertyId, roomId: input.roomId, groupId: input.groupId, message: input.message, status: 'PENDING',
    });
    await propertiesRepository.createInterestNotification(property.ownerId);
    return interest;
  },
  async review(role: string | undefined, id: string, input: { status: 'PENDING' | 'VERIFIED' | 'REJECTED'; reason?: string }) {
    if (role !== 'ADMIN') throw forbidden('Admin access required.');
    if (!await propertiesRepository.findRawById(id)) {
      throw notFound('Property not found.', 'PROPERTY_NOT_FOUND');
    }
    const updated = await propertiesRepository.updateProperty(id, {
      verificationStatus: input.status,
      status: input.status === 'VERIFIED' ? 'ACTIVE' : 'INACTIVE',
    });
    return updated;
  },
  async matchGroup(groupId: string) {
    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group) throw notFound('Group not found.', 'GROUP_NOT_FOUND');
    const properties = await propertiesRepository.findMany({ status: 'ACTIVE', verificationStatus: 'VERIFIED', city: group.city });
    return properties
      .map((property: any) => {
        const roomPrices = property.rooms.map((room: any) => room.pricePerPerson);
        const minRoomPrice = Math.min(...roomPrices, Number.POSITIVE_INFINITY);
        const maxRoomPrice = Math.max(...roomPrices, 0);
        const budgetScore = maxRoomPrice < group.budgetMin || minRoomPrice > group.budgetMax
          ? 0
          : Math.max(0, 1 - Math.abs((group.budgetMin + group.budgetMax) / 2 - minRoomPrice) / Math.max(1, group.budgetMax - group.budgetMin + 1));
        const locationScore = property.area === group.area ? 1 : property.city === group.city ? 0.7 : 0.2;
        const areaFitScore = property.rooms.some((room: any) => room.status === 'AVAILABLE' || room.status === 'PARTIALLY_AVAILABLE') ? 1 : 0.5;
        const recommendedRoom = property.rooms.filter((room: any) => room.status !== 'INACTIVE').sort((a: any, b: any) => a.pricePerPerson - b.pricePerPerson)[0];
        const score = Math.round((locationScore * 0.45 + budgetScore * 0.35 + areaFitScore * 0.2) * 100);
        return { property, recommendedRoom, score, matches: { location: locationScore, budget: budgetScore, availability: areaFitScore } };
      })
      .filter((match: any) => match.score > 0)
      .sort((a: any, b: any) => b.score - a.score);
  },
  adminList(role: string | undefined) {
    if (role !== 'ADMIN') throw forbidden('Admin access required.');
    return propertiesRepository.findAdminProperties();
  },
};
