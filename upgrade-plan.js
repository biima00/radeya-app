const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    const result = await prisma.organization.updateMany({
      data: { 
        plan: 'PRO',
        subscriptionActive: true
      }
    });
    console.log(`🎉 Berhasil mengupgrade ${result.count} organisasi ke paket PRO!`);
  } catch (error) {
    console.error('❌ Gagal melakukan upgrade:', error);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

run();
