import { Router } from "express";
import { authenticateToken } from "@/middlewares";
import { getBookingByUser, insertBooking } from "@/controllers/booking-controller";
const bookingRouter = Router();

bookingRouter
  .all("/*", authenticateToken)
  .get("/", getBookingByUser)
  .post("/", insertBooking);

export { bookingRouter };
