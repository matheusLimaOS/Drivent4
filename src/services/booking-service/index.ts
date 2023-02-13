import { ForbiddenError, notFoundError } from "@/errors";
import bookingRepository from "@/repositories/booking-repository";
import hotelRepository from "@/repositories/hotel-repository";
import userRepository from "@/repositories/user-repository";
import httpStatus from "http-status";

async function getBooking(userId: number) {
    const booking = await bookingRepository.findByUserId(userId);

    if (!booking) throw {
        http: httpStatus.NOT_FOUND,
        err: notFoundError()
    }
    
    delete booking.Room.createdAt;
    delete booking.Room.updatedAt;

    return {
        id: booking.id,
        Room: booking.Room
    };
}

async function insertBooking(userId: number, roomId: number) {
    const booking = await bookingRepository.findByUserId(userId);

    if (booking) throw {
        http: httpStatus.FORBIDDEN,
        err: ForbiddenError("User already have a booking")
    }

    try {
        await verifyTicket(userId);
        await verifyRoom(roomId);

        let insert = await bookingRepository.insertBooking(userId, roomId);

        return {
            bookingId: insert.id
        }
    } catch (error) {
        if(!error.http){
            throw {
                http: httpStatus.BAD_REQUEST,
                err: error
            }
        }
        else{
            throw error
        }
    }

}

async function changeBooking(userId: number, roomId: number, bookingId: number) {
    const booking = await bookingRepository.findById(bookingId);

    if (!booking) throw {
        http: httpStatus.NOT_FOUND,
        err: notFoundError()
    }

    if(booking.userId !== userId){
        throw {
            http: httpStatus.FORBIDDEN,
            err: ForbiddenError("User does not have a booking")
        }
    }

    try {
        await verifyRoom(roomId);
        
        let changed = await bookingRepository.updateBooking(bookingId,roomId);

        return {
            bookingId: changed.id
        }
    } catch (error) {
        if(!error.http){
            throw {
                http: httpStatus.BAD_REQUEST,
                err: error
            }
        }
        else{
            throw error
        }
    }

}

async function verifyRoom(roomId: number) {
    let room = await hotelRepository.findRoomById(roomId);
    let count = await bookingRepository.countBookingForRoom(roomId);

    if (!room) {
        throw {
            http: httpStatus.NOT_FOUND,
            err: notFoundError()
        }
    }

    else if (count === room.capacity) {
        throw {
            http: httpStatus.FORBIDDEN,
            err: ForbiddenError("Room have reached his full capacity")
        }
    }
}

async function verifyTicket(userId: number) {
    let user = await userRepository.findUserTicketAndPayment(userId);
    if(user.Enrollment.length===0){
        throw {
            http: httpStatus.FORBIDDEN,
            err: ForbiddenError("User does not have ticket, face-to-face ticket, with accommodation and paid")
        }
    }
    else if(user.Enrollment[0].Ticket.length===0){
        throw {
            http: httpStatus.FORBIDDEN,
            err: ForbiddenError("User does not have ticket, face-to-face ticket, with accommodation and paid")
        }
    }

    else if(user.Enrollment[0].Ticket[0].status !== "PAID"){
        throw {
            http: httpStatus.FORBIDDEN,
            err: ForbiddenError("User does not have ticket, face-to-face ticket, with accommodation and paid")
        }
    }

    else if(user.Enrollment[0].Ticket[0].TicketType.includesHotel === false){
        throw {
            http: httpStatus.FORBIDDEN,
            err: ForbiddenError("User does not have ticket, face-to-face ticket, with accommodation and paid")
        }
    }
    
    else if ( user.Enrollment[0].Ticket[0].TicketType.isRemote === true ) {
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
