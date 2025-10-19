// scripts/clearUsers.js
import prisma from '../src/prismaClient.js';

async function clearUsers() {
  try {
    await prisma.user.deleteMany({});
    console.log('✅ All users deleted successfully');
  } catch (err) {
    console.error('❌ Error deleting users:', err);
  } finally {
    await prisma.$disconnect();
  }
}

clearUsers();