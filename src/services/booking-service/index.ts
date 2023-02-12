import { ForbiddenError, notFoundError } from "@/errors";
import bookingRepository from "@/repositories/booking-repository";
import hotelRepository from "@/repositories/hotel-repository";
import userRepository from "@/repositories/user-repository";
import { verify } from "crypto";
import httpStatus from "http-status";

async function getBooking(userId: number) {
  const booking = await bookingRepository.findByUserId(userId);

  if (!booking) throw notFoundError();

  return {
    booking
  };
}

async function insertBooking(userId: number, roomId: number) {
    try {
        await verifyTicket(userId);
        await verifyRoom(roomId);

        let insert = await bookingRepository.insertBooking(userId,roomId);

        return {
            bookingId: insert.id
        }
    }catch(error){
        throw error
    }

}

async function changeBooking(userId: number, roomId:number ,bookingId: number) {
    const booking = await bookingRepository.findById(bookingId);
  
    if (!booking) throw notFoundError();
  
    try {
        await verifyTicket(userId);
        await verifyRoom(roomId);

        await bookingRepository.deleteBooking(bookingId);
        let insert = await bookingRepository.insertBooking(userId,roomId);

        return {
            bookingId: insert.id
        }
    }catch(error){
        throw error
    }

}

async function verifyRoom(roomId: number) {
    let room = await hotelRepository.findRoomById(roomId);
    let count = await bookingRepository.countBookingForRoom(roomId);

    console.log(count);

    if(!room){
        throw{
            http: httpStatus.NOT_FOUND,
            err: notFoundError()
        }
    }

    else if(count === room.capacity){
        throw {
            http: httpStatus.FORBIDDEN,
            err: ForbiddenError("Room have reached his full capacity")
        }
    }
}

async function verifyTicket(userId: number) {
    let user = await userRepository.findUserTicketAndPayment(userId);
    if(!user || !user.Enrollment[0].id || !user.Enrollment[0].Ticket[0]){
        throw {
            http: httpStatus.FORBIDDEN,
            err: ForbiddenError("User does not have ticket, face-to-face ticket, with accommodation and paid")
        }
    }

    if(user.Enrollment[0].Ticket[0].status !== "PAID" || user.Enrollment[0].Ticket[0].TicketType.isRemote === true || user.Enrollment[0].Ticket[0].TicketType.includesHotel === false){
        throw {
            http: httpStatus.FORBIDDEN,
            err: ForbiddenError("User does not have ticket, face-to-face ticket, with accommodation and paid")
        }
    }
}


const bookingService = {
    getBooking,
    insertBooking,
    changeBooking
};

export default bookingService;
