import { prisma } from "@/config";
import { Enrollment } from "@prisma/client";

async function findByUserId(userId: number) {
  return prisma.booking.findMany({
    where: { userId }
  });
}

const bookingRepository = {
    findByUserId
};

export default bookingRepository;
