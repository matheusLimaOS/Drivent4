import { prisma } from "@/config";

async function findByUserId(userId: number) {
  return prisma.booking.findFirst({
    where: { userId },
    include: {
      Room: true
    }
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

async function updateBooking(bookingId:number, roomId: number) {
  return prisma.booking.update({
    where: {
      id:bookingId
    },
    data:{
      roomId
    }
  });
}

const bookingRepository = {
    findByUserId,
    insertBooking,
    findById,
    countBookingForRoom,
    updateBooking
};

export default bookingRepository;
