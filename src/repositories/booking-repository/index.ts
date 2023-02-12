import { prisma } from "@/config";

async function findByUserId(userId: number) {
  return prisma.booking.findFirst({
    where: { userId }
  });
}

async function findById(bookingId: number) {
  return prisma.booking.findFirst({
    where: { id:bookingId }
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
      roomId
    }
  });
}

async function deleteBooking(bookingId:number) {
  return prisma.booking.delete({
    where: {
      id:bookingId
    }
  });
}

const bookingRepository = {
    findByUserId,
    insertBooking,
    findById,
    countBookingForRoom,
    deleteBooking
};

export default bookingRepository;
