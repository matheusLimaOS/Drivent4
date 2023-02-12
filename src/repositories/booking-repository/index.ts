import { prisma } from "@/config";
import { Enrollment } from "@prisma/client";

async function findByUserId(userId: number) {
  return prisma.booking.findMany({
    where: { userId }
  });
}

async function findById(roomId: number) {
  return prisma.booking.findMany({
    where: { id:roomId }
  });
}

async function insertBooking(userId:number,roomId:number) {
  return prisma.booking.create({
    data: {
      userId,
      roomId
    }
  });
}

async function countBookingForRoom(roomId:number) {
  return prisma.booking.count({
    where: {
      id: roomId
    }
  });
}

const bookingRepository = {
    findByUserId,
    insertBooking,
    findById,
    countBookingForRoom
};

export default bookingRepository;
