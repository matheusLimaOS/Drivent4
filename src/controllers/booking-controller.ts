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