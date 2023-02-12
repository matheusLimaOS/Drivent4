import { invalidDataError } from "@/errors";
import { AuthenticatedRequest } from "@/middlewares";
import bookingService from "@/services/booking-service";
import { Response } from "express";
import httpStatus from "http-status";

export async function getBookingByUser(req: AuthenticatedRequest, res: Response) {
    const { userId } = req;

    try {
        const booking = await bookingService.getBooking(userId);

        return res.status(httpStatus.OK).send(booking);
    } catch (error) {
        return res.sendStatus(httpStatus.NOT_FOUND);
    }
}

export async function insertBooking(req: AuthenticatedRequest, res: Response) {
    const { userId } = req;
    const { roomId } = req.body;
    try {
        if(roomId === undefined || isNaN(roomId)) throw {
            http: httpStatus.BAD_REQUEST,
            err:invalidDataError(["RoomId must be a number"])
        };

        const booking = await bookingService.insertBooking(userId,roomId);

        return res.status(httpStatus.OK).send(booking);
    } catch (error) {
        return res.status(error.http).send(error.err);
    }
}

export async function changeBooking(req: AuthenticatedRequest, res: Response) {
    const { userId } = req;
    const { bookingId } = req.params;
    const { roomId } = req.body;

    try {
        if(bookingId === undefined || isNaN(Number(bookingId))) throw {
            http: httpStatus.BAD_REQUEST,
            err:invalidDataError(["bookingId must be a number"])
        };
        else if(roomId === undefined || isNaN(roomId)) throw {
            http: httpStatus.BAD_REQUEST,
            err:invalidDataError(["RoomId must be a number"])
        };

        const booking = await bookingService.changeBooking(userId,roomId,Number(bookingId));

        return res.status(httpStatus.OK).send(booking);
    } catch (error) {
        return res.status(error.http).send(error.err);
    }
}