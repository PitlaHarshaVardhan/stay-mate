import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../prisma/client';
import { requireAdmin } from '../../middleware/auth';

const propertySchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(1500).optional(),
  propertyType: z.enum(['PG', 'HOSTEL', 'FLAT', 'ROOM', 'CO_LIVING', 'APARTMENT']),
  city: z.string().min(2),
  area: z.string().min(2),
  address: z.string().optional(),
  locality: z.string().optional(),
  landmark: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  genderAllowed: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']).optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email().optional(),
  smokingAllowed: z.boolean().optional(),
  drinkingAllowed: z.boolean().optional(),
  petsAllowed: z.boolean().optional(),
  visitorsAllowed: z.boolean().optional(),
  foodAvailable: z.boolean().optional(),
  foodType: z.string().optional(),
  curfewTime: z.string().optional(),
  noticePeriod: z.string().optional(),
  amenities: z.array(z.string()).optional(),
  images: z.array(z.object({
    url: z.string().url(),
    publicId: z.string().optional(),
    sortOrder: z.number().int().min(0).optional(),
    isPrimary: z.boolean().optional(),
  })).optional(),
  rooms: z.array(z.object({
    roomType: z.string().min(1),
    capacity: z.number().int().min(1),
    occupied: z.number().int().min(0).optional(),
    pricePerPerson: z.number().int().min(0),
    securityDeposit: z.number().int().min(0).optional(),
    availableFrom: z.coerce.date().optional(),
    availableBeds: z.number().int().min(0),
    amenities: z.array(z.string()).optional(),
    status: z.enum(['AVAILABLE', 'PARTIALLY_AVAILABLE', 'FULL', 'INACTIVE']).optional(),
  })).optional(),
});

const updatePropertySchema = propertySchema.partial();
const propertyReviewSchema = z.object({
  status: z.enum(['PENDING', 'VERIFIED', 'REJECTED']),
  reason: z.string().optional(),
});

const propertyInterestSchema = z.object({
  roomId: z.string().optional(),
  groupId: z.string().optional(),
  message: z.string().max(500).optional(),
});

const propertyListQuery = z.object({
  city: z.string().optional(),
  area: z.string().optional(),
  propertyType: z.enum(['PG', 'HOSTEL', 'FLAT', 'ROOM', 'CO_LIVING', 'APARTMENT']).optional(),
  genderAllowed: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']).optional(),
  minPrice: z.coerce.number().int().min(0).optional(),
  maxPrice: z.coerce.number().int().min(0).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'DRAFT']).optional(),
  verifiedOnly: z.preprocess((value) => value === 'true' || value === true, z.boolean().optional()).optional(),
});

function getPublicPropertyInclude() {
  return {
    owner: { select: { id: true, name: true, email: true, phone: true } },
    images: { orderBy: { sortOrder: 'asc' as const } },
    amenities: { orderBy: { createdAt: 'asc' as const } },
    rooms: { orderBy: { pricePerPerson: 'asc' as const } },
  };
}

export async function listProperties(req: Request, res: Response, next: NextFunction) {
  try {
    const query = propertyListQuery.parse(req.query);

    const where: Record<string, unknown> = {
      status: 'ACTIVE',
    };

    if (query.city) where.city = query.city;
    if (query.area) where.area = query.area;
    if (query.propertyType) where.propertyType = query.propertyType;
    if (query.genderAllowed) where.genderAllowed = query.genderAllowed;
    if (query.verifiedOnly) where.verificationStatus = 'VERIFIED';
    if (query.status) where.status = query.status;

    const properties = await prisma.property.findMany({
      where,
      include: getPublicPropertyInclude(),
      orderBy: { createdAt: 'desc' },
    });

    const minPrice = query.minPrice ?? 0;
    const maxPrice = query.maxPrice ?? Number.MAX_SAFE_INTEGER;

    const filteredProperties = properties.filter((property: any) => {
      if (property.rooms.length === 0) {
        return minPrice === 0 && maxPrice === Number.MAX_SAFE_INTEGER;
      }

      const roomPrices = property.rooms.map((room: any) => room.pricePerPerson);
      const hasPriceMatch = roomPrices.some((price: number) => price >= minPrice && price <= maxPrice);
      return hasPriceMatch;
    });

    return res.json({ success: true, data: filteredProperties });
  } catch (error) {
    return next(error);
  }
}

export async function getProperty(req: Request, res: Response, next: NextFunction) {
  try {
    const propertyId = String(req.params.id);
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: getPublicPropertyInclude(),
    });

    if (!property) {
      return res.status(404).json({ success: false, error: { code: 'PROPERTY_NOT_FOUND', message: 'Property not found.' } });
    }

    return res.json({ success: true, data: property });
  } catch (error) {
    return next(error);
  }
}

export async function listMyProperties(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }

    const properties = await prisma.property.findMany({
      where: { ownerId: userId },
      include: getPublicPropertyInclude(),
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ success: true, data: properties });
  } catch (error) {
    return next(error);
  }
}

export async function createProperty(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (!user || (user.role !== 'PROPERTY_OWNER' && user.role !== 'ADMIN')) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Only property owners or admins can create listings.' } });
    }

    const payload = propertySchema.parse(req.body);

    const property = await prisma.$transaction(async (tx: any) => {
      const created = await tx.property.create({
        data: {
          ownerId: userId,
          name: payload.name,
          description: payload.description,
          propertyType: payload.propertyType,
          city: payload.city,
          area: payload.area,
          address: payload.address,
          locality: payload.locality,
          landmark: payload.landmark,
          latitude: payload.latitude,
          longitude: payload.longitude,
          genderAllowed: payload.genderAllowed,
          contactPhone: payload.contactPhone,
          contactEmail: payload.contactEmail,
          smokingAllowed: payload.smokingAllowed ?? false,
          drinkingAllowed: payload.drinkingAllowed ?? false,
          petsAllowed: payload.petsAllowed ?? false,
          visitorsAllowed: payload.visitorsAllowed ?? true,
          foodAvailable: payload.foodAvailable ?? false,
          foodType: payload.foodType,
          curfewTime: payload.curfewTime,
          noticePeriod: payload.noticePeriod,
          status: 'ACTIVE',
          verificationStatus: 'PENDING',
        },
      });

      if (payload.amenities?.length) {
        await tx.propertyAmenity.createMany({
          data: payload.amenities.map((name) => ({
            propertyId: created.id,
            name: name as never,
          })),
        });
      }

      if (payload.images?.length) {
        await tx.propertyImage.createMany({
          data: payload.images.map((image) => ({
            propertyId: created.id,
            url: image.url,
            publicId: image.publicId,
            sortOrder: image.sortOrder ?? 0,
            isPrimary: image.isPrimary ?? false,
          })),
        });
      }

      if (payload.rooms?.length) {
        await tx.propertyRoom.createMany({
          data: payload.rooms.map((room) => ({
            propertyId: created.id,
            roomType: room.roomType,
            capacity: room.capacity,
            occupied: room.occupied ?? 0,
            pricePerPerson: room.pricePerPerson,
            securityDeposit: room.securityDeposit,
            availableFrom: room.availableFrom ? new Date(room.availableFrom) : null,
            availableBeds: room.availableBeds,
            amenities: room.amenities ?? [],
            status: room.status ?? 'AVAILABLE',
          })),
        });
      }

      return tx.property.findUnique({
        where: { id: created.id },
        include: getPublicPropertyInclude(),
      });
    });

    return res.status(201).json({ success: true, data: property, message: 'Property listing created.' });
  } catch (error) {
    return next(error);
  }
}

export async function updateProperty(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }

    const propertyId = String(req.params.id);
    const existing = await prisma.property.findUnique({ where: { id: propertyId } });
    if (!existing) {
      return res.status(404).json({ success: false, error: { code: 'PROPERTY_NOT_FOUND', message: 'Property not found.' } });
    }

    if (existing.ownerId !== userId && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'You can only edit your own listings.' } });
    }

    const payload = updatePropertySchema.parse(req.body);
    const { amenities, images, rooms, ...rest } = payload;

    const updated = await prisma.$transaction(async (tx: any) => {
      await tx.property.update({
        where: { id: propertyId },
        data: {
          ...rest,
          smokingAllowed: rest.smokingAllowed ?? undefined,
          drinkingAllowed: rest.drinkingAllowed ?? undefined,
          petsAllowed: rest.petsAllowed ?? undefined,
          visitorsAllowed: rest.visitorsAllowed ?? undefined,
          foodAvailable: rest.foodAvailable ?? undefined,
        },
      });

      if (amenities) {
        await tx.propertyAmenity.deleteMany({ where: { propertyId } });
        if (amenities.length) {
          await tx.propertyAmenity.createMany({
            data: amenities.map((name) => ({ propertyId, name: name as never })),
          });
        }
      }

      if (images) {
        await tx.propertyImage.deleteMany({ where: { propertyId } });
        if (images.length) {
          await tx.propertyImage.createMany({
            data: images.map((image) => ({
              propertyId,
              url: image.url,
              publicId: image.publicId,
              sortOrder: image.sortOrder ?? 0,
              isPrimary: image.isPrimary ?? false,
            })),
          });
        }
      }

      if (rooms) {
        await tx.propertyRoom.deleteMany({ where: { propertyId } });
        if (rooms.length) {
          await tx.propertyRoom.createMany({
            data: rooms.map((room) => ({
              propertyId,
              roomType: room.roomType,
              capacity: room.capacity,
              occupied: room.occupied ?? 0,
              pricePerPerson: room.pricePerPerson,
              securityDeposit: room.securityDeposit,
              availableFrom: room.availableFrom ? new Date(room.availableFrom) : null,
              availableBeds: room.availableBeds,
              amenities: room.amenities ?? [],
              status: room.status ?? 'AVAILABLE',
            })),
          });
        }
      }

      return tx.property.findUnique({
        where: { id: propertyId },
        include: getPublicPropertyInclude(),
      });
    });

    return res.json({ success: true, data: updated, message: 'Property updated.' });
  } catch (error) {
    return next(error);
  }
}

export async function toggleSavedProperty(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }

    const propertyId = String(req.params.id);
    const property = await prisma.property.findUnique({ where: { id: propertyId } });
    if (!property) {
      return res.status(404).json({ success: false, error: { code: 'PROPERTY_NOT_FOUND', message: 'Property not found.' } });
    }

    const existing = await prisma.savedProperty.findUnique({
      where: { userId_propertyId: { userId, propertyId } },
    });

    if (existing) {
      await prisma.savedProperty.delete({ where: { id: existing.id } });
      return res.json({ success: true, data: { saved: false }, message: 'Property removed from saved list.' });
    }

    const saved = await prisma.savedProperty.create({
      data: { userId, propertyId },
    });

    return res.status(201).json({ success: true, data: { saved: true, savedProperty: saved }, message: 'Property saved.' });
  } catch (error) {
    return next(error);
  }
}

export async function requestPropertyInterest(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }

    const propertyId = String(req.params.id);
    const payload = propertyInterestSchema.parse(req.body);

    const property = await prisma.property.findUnique({ where: { id: propertyId } });
    if (!property) {
      return res.status(404).json({ success: false, error: { code: 'PROPERTY_NOT_FOUND', message: 'Property not found.' } });
    }

    const existing = await prisma.propertyInterest.findFirst({
      where: { userId, propertyId, roomId: payload.roomId ?? undefined },
    });

    if (existing) {
      return res.status(409).json({ success: false, error: { code: 'ALREADY_INTERESTED', message: 'You already expressed interest in this property.' } });
    }

    const interest = await prisma.propertyInterest.create({
      data: {
        userId,
        propertyId,
        roomId: payload.roomId,
        groupId: payload.groupId,
        message: payload.message,
        status: 'PENDING',
      },
    });

    await prisma.notification.create({
      data: {
        userId: property.ownerId,
        type: 'GROUP_JOIN_REQUEST',
        title: 'New property inquiry',
        message: 'Someone is interested in one of your listings.',
      },
    });

    return res.status(201).json({ success: true, data: interest, message: 'Property interest submitted.' });
  } catch (error) {
    return next(error);
  }
}

export async function reviewProperty(req: Request, res: Response, next: NextFunction) {
  try {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Admin access required.' } });
    }

    const propertyId = String(req.params.id);
    const payload = propertyReviewSchema.parse(req.body);

    const property = await prisma.property.findUnique({ where: { id: propertyId } });
    if (!property) {
      return res.status(404).json({ success: false, error: { code: 'PROPERTY_NOT_FOUND', message: 'Property not found.' } });
    }

    const updated = await prisma.property.update({
      where: { id: propertyId },
      data: {
        verificationStatus: payload.status,
        status: payload.status === 'VERIFIED' ? 'ACTIVE' : 'INACTIVE',
      },
    });

    return res.json({ success: true, data: updated, message: 'Property status updated.' });
  } catch (error) {
    return next(error);
  }
}

export async function matchGroupToProperties(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }

    const groupId = String(req.params.groupId);
    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group) {
      return res.status(404).json({ success: false, error: { code: 'GROUP_NOT_FOUND', message: 'Group not found.' } });
    }

    const properties = await prisma.property.findMany({
      where: {
        status: 'ACTIVE',
        verificationStatus: 'VERIFIED',
        city: group.city,
      },
      include: getPublicPropertyInclude(),
    });

    const matches = properties
      .map((property: any) => {
        const roomPrices = property.rooms.map((room: any) => room.pricePerPerson);
        const minRoomPrice = Math.min(...roomPrices, Number.POSITIVE_INFINITY);
        const maxRoomPrice = Math.max(...roomPrices, 0);

        const budgetScore =
          maxRoomPrice < group.budgetMin || minRoomPrice > group.budgetMax
            ? 0
            : Math.max(0, 1 - Math.abs((group.budgetMin + group.budgetMax) / 2 - minRoomPrice) / Math.max(1, group.budgetMax - group.budgetMin + 1));

        const locationScore = property.area === group.area ? 1 : property.city === group.city ? 0.7 : 0.2;
        const areaFitScore = property.rooms.some((room: any) => room.status === 'AVAILABLE' || room.status === 'PARTIALLY_AVAILABLE') ? 1 : 0.5;
        const recommendedRoom = property.rooms
          .filter((room: any) => room.status !== 'INACTIVE')
          .sort((a: any, b: any) => a.pricePerPerson - b.pricePerPerson)[0];

        const score = Math.round((locationScore * 0.45 + budgetScore * 0.35 + areaFitScore * 0.2) * 100);

        return {
          property,
          recommendedRoom,
          score,
          matches: {
            location: locationScore,
            budget: budgetScore,
            availability: areaFitScore,
          },
        };
      })
      .filter((match: any) => match.score > 0)
      .sort((a: any, b: any) => b.score - a.score);

    return res.json({ success: true, data: matches });
  } catch (error) {
    return next(error);
  }
}

export async function getPropertyAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Admin access required.' } });
    }

    const properties = await prisma.property.findMany({
      include: getPublicPropertyInclude(),
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ success: true, data: properties });
  } catch (error) {
    return next(error);
  }
}
