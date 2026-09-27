"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const argon2 = __importStar(require("argon2"));
const prisma = new client_1.PrismaClient();
async function main() {
    const areas = ['Gachibowli', 'Kondapur', 'Madhapur', 'HITEC City', 'Kukatpally', 'Manikonda'];
    await prisma.notification.deleteMany();
    await prisma.report.deleteMany();
    await prisma.groupJoinRequest.deleteMany();
    await prisma.groupMember.deleteMany();
    await prisma.connection.deleteMany();
    await prisma.blockedUser.deleteMany();
    await prisma.group.deleteMany();
    await prisma.preference.deleteMany();
    await prisma.profile.deleteMany();
    await prisma.user.deleteMany();
    for (let i = 1; i <= 20; i++) {
        const passwordHash = await argon2.hash('Password123!');
        const user = await prisma.user.create({
            data: {
                name: `User ${i}`,
                email: `user${i}@example.com`,
                phone: `90000000${String(i).padStart(2, '0')}`,
                passwordHash,
            },
        });
        await prisma.profile.create({
            data: {
                userId: user.id,
                age: 22 + (i % 7),
                occupationType: i % 3 === 0 ? 'STUDENT' : i % 3 === 1 ? 'EMPLOYEE' : 'INTERN',
                bio: `Looking for a clean roommate in Hyderabad.`,
            },
        });
        const area = areas[i % areas.length];
        const moveDate = new Date();
        moveDate.setDate(moveDate.getDate() + (i % 18));
        await prisma.preference.create({
            data: {
                userId: user.id,
                city: 'Hyderabad',
                area,
                budgetMin: 7000 + (i % 5) * 1500,
                budgetMax: 10000 + (i % 5) * 2000,
                moveInDate: moveDate,
                roomType: i % 2 === 0 ? 'DOUBLE' : 'TRIPLE',
                roommatesRequired: 1 + (i % 3),
                smokingPreference: i % 2 === 0 ? 'NON_SMOKER' : 'NO_PREFERENCE',
                drinkingPreference: i % 3 === 0 ? 'NON_DRINKER' : 'NO_PREFERENCE',
                foodPreference: 'ANY',
                sleepSchedule: i % 2 === 0 ? 'FLEXIBLE' : 'LATE',
                cleanlinessPreference: i % 2 === 0 ? 'MEDIUM' : 'HIGH',
                genderPreference: 'ANY',
            },
        });
    }
    console.log('Seeded 20 users with Hyderabad preferences');
}
main().catch((error) => {
    console.error(error);
    process.exit(1);
}).finally(async () => {
    await prisma.$disconnect();
});
