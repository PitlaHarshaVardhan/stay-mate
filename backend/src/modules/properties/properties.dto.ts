import { z } from 'zod';

export const propertySchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().max(1500).optional(),
  propertyType: z.enum(['PG', 'HOSTEL', 'FLAT', 'ROOM', 'CO_LIVING', 'APARTMENT']),
  city: z.string().trim().min(2),
  area: z.string().trim().min(2),
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
}).strict();

export const propertyListQuerySchema = z.object({
  city: z.string().optional(),
  area: z.string().optional(),
  propertyType: z.enum(['PG', 'HOSTEL', 'FLAT', 'ROOM', 'CO_LIVING', 'APARTMENT']).optional(),
  genderAllowed: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']).optional(),
  minPrice: z.coerce.number().int().min(0).optional(),
  maxPrice: z.coerce.number().int().min(0).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'DRAFT']).optional(),
  verifiedOnly: z.preprocess((value) => value === 'true' || value === true, z.boolean().optional()).optional(),
}).strict();

export const propertyReviewSchema = z.object({
  status: z.enum(['PENDING', 'VERIFIED', 'REJECTED']),
  reason: z.string().max(1000).optional(),
}).strict();

export const propertyInterestSchema = z.object({
  roomId: z.string().optional(),
  groupId: z.string().optional(),
  message: z.string().max(500).optional(),
}).strict();
