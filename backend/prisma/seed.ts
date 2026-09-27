import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

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
