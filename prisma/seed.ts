import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client.js";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const pool = new Pool({ connectionString: process.env["DATABASE_URL"] });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const hashedPassword = await bcrypt.hash("mentor@123", 10);

  await prisma.user.upsert({
    where: { email: "mentor@sikhbo.com" },
    update: {},
    create: {
      name: "Sikhbo Mentor",
      email: "mentor@sikhbo.com",
      password: hashedPassword,
      role: "MENTOR",
    },
  });

  console.log("✅ Seed complete: Mentor account ready");
  console.log("   Email:    mentor@sikhbo.com");
  console.log("   Password: mentor@123");
}

main()
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
