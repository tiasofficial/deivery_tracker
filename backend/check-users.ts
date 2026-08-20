import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log('Registered Users:');
  users.forEach(u => {
    console.log(`- ID: ${u.id}, Name: ${u.name}, Email: "${u.email}", Role: ${u.role}, Hash: ${u.password}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
