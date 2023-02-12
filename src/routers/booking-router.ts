import { Router } from "express";
import { authenticateToken } from "@/middlewares";
import { getBookingByUser } from "@/controllers/booking-controller";
const bookingRouter = Router();

bookingRouter
  .all("/*", authenticateToken)
  .get("/", getBookingByUser)

export { bookingRouter };
