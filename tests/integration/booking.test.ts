import app, { init } from "@/app";
import { prisma } from "@/config";
import faker from "@faker-js/faker";
import { TicketStatus } from "@prisma/client";
import httpStatus from "http-status";
import * as jwt from "jsonwebtoken";
import supertest from "supertest";
import { createEnrollmentWithAddress, createUser, createTicketTypeWithHotel, createTicket, createPayment, createHotel, createRoomWithHotelId, createBooking, createTicketTypeWithoutHotel } from "../factories";
import { cleanDb, generateValidToken } from "../helpers";

beforeAll(async () => {
    await init();
    await cleanDb();
});

beforeEach(async () => {
    await cleanDb();
})

const server = supertest(app);

describe("GET /booking", () => {
    it("should respond with status 401 if no token is given", async () => {
        const response = await server.get("/booking");

        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    it("should respond with status 401 if given token is not valid", async () => {
        const token = faker.lorem.word();

        const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    it("should respond with status 401 if there is no session for given token", async () => {
        const userWithoutSession = await createUser();
        const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

        const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    describe("when token is valid", () => {
        it("should respond with status 200 when there is booking for the user", async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            const enrollment = await createEnrollmentWithAddress(user);
            const ticketType = await createTicketTypeWithHotel();
            const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
            await createPayment(ticket.id, ticketType.price);
            const createdHotel = await createHotel();
            const createdRoom = await createRoomWithHotelId(createdHotel.id);

            delete createdRoom.createdAt;
            delete createdRoom.updatedAt;


            const createdBooking = await createBooking(user.id, createdRoom.id);

            const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);

            expect(response.status).toBe(httpStatus.OK);
            expect(response.body).toEqual(expect.objectContaining({
                id: createdBooking.id,
                Room: createdRoom
            }))
        });

        it("should respond with status 404 when there is no booking for the user", async () => {
            const user = await createUser();
            const token = await generateValidToken(user);

            const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);

            expect(response.status).toBe(httpStatus.NOT_FOUND);
        });
    });
});

describe("POST /booking", () => {
    it("should respond with status 401 if no token is given", async () => {
        const response = await server.post("/booking");

        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    it("should respond with status 401 if given token is not valid", async () => {
        const token = faker.lorem.word();

        const response = await server.post("/booking").set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    it("should respond with status 401 if there is no session for given token", async () => {
        const userWithoutSession = await createUser();
        const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

        const response = await server.post("/booking").set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    describe("when token is valid", () => {
        describe("when body is not valid", () => {
            it("should respond with status 400 when body is not present", async () => {
                const user = await createUser();
                const token = await generateValidToken(user);

                const response = await server.post("/booking").set("Authorization", `Bearer ${token}`)

                expect(response.status).toBe(httpStatus.BAD_REQUEST);
            });

            it("should respond with status 400 when body is not valid", async () => {
                const user = await createUser();
                const token = await generateValidToken(user);

                const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({
                    data:{
                        roomId : "teste"
                    }
                })

                expect(response.status).toBe(httpStatus.BAD_REQUEST);
            });
        })

        describe("when body is valid", () => {

            it("should respond with status 200 and create new booking", async () => {
                const user = await createUser();
                const token = await generateValidToken(user);
                const enrollment = await createEnrollmentWithAddress(user);
                const ticketType = await createTicketTypeWithHotel();
                const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
                await createPayment(ticket.id, ticketType.price);
                const createdHotel = await createHotel();
                const createdRoom = await createRoomWithHotelId(createdHotel.id);

                const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({"roomId": createdRoom.id});

                expect(response.status).toBe(httpStatus.OK);
                const createdBooking = await prisma.booking.findUnique({
                    where:{
                        id: response.body.bookingId
                    }
                })
                expect(createdBooking).toBeDefined();
            });

            it("should respond with status 403 when ticketType is remote", async () => {
                const user = await createUser();
                const token = await generateValidToken(user);
                const enrollment = await createEnrollmentWithAddress(user);
                const ticketType = await createTicketTypeWithHotel(true);
                const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
                await createPayment(ticket.id, ticketType.price);
                const createdHotel = await createHotel();
                const createdRoom = await createRoomWithHotelId(createdHotel.id);

                const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({"roomId": createdRoom.id});

                expect(response.status).toBe(httpStatus.FORBIDDEN);
            });

            it("should respond with status 403 when ticket its not PAID", async () => {
                const user = await createUser();
                const token = await generateValidToken(user);
                const enrollment = await createEnrollmentWithAddress(user);
                const ticketType = await createTicketTypeWithHotel();
                const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED);
                await createPayment(ticket.id, ticketType.price);
                const createdHotel = await createHotel();
                const createdRoom = await createRoomWithHotelId(createdHotel.id);

                const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({"roomId": createdRoom.id});
                
                expect(response.status).toBe(httpStatus.FORBIDDEN);
            });

            it("should respond with status 403 when ticket does not includes hotel", async () => {
                const user = await createUser();
                const token = await generateValidToken(user);
                const enrollment = await createEnrollmentWithAddress(user);
                const ticketType = await createTicketTypeWithoutHotel();
                const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
                await createPayment(ticket.id, ticketType.price);
                const createdHotel = await createHotel();
                const createdRoom = await createRoomWithHotelId(createdHotel.id);

                const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({"roomId": createdRoom.id});
                
                expect(response.status).toBe(httpStatus.FORBIDDEN);
            });

            it("should respond with status 403 when user does not have a enrollment", async () => {
                const user = await createUser();
                const token = await generateValidToken(user);
                const createdHotel = await createHotel();
                const createdRoom = await createRoomWithHotelId(createdHotel.id);

                const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({"roomId": createdRoom.id});

                expect(response.status).toBe(httpStatus.FORBIDDEN);
            });

            it("should respond with status 403 when user does not have a ticket", async () => {
                const user = await createUser();
                const token = await generateValidToken(user);
                const createdHotel = await createHotel();
                const createdRoom = await createRoomWithHotelId(createdHotel.id);
                await createEnrollmentWithAddress(user);

                const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({"roomId": createdRoom.id});

                expect(response.status).toBe(httpStatus.FORBIDDEN);
            });

            it("should respond with status 403 when user already has a booking", async () => {
                const user = await createUser();
                const token = await generateValidToken(user);
                const enrollment = await createEnrollmentWithAddress(user);
                const ticketType = await createTicketTypeWithHotel();
                const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
                await createPayment(ticket.id, ticketType.price);
                const createdHotel = await createHotel();
                const createdRoom = await createRoomWithHotelId(createdHotel.id);
                await createBooking(user.id,createdRoom.id)

                const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({"roomId": createdRoom.id});

                expect(response.status).toBe(httpStatus.FORBIDDEN);
            });

            it("should respond with status 404 when room does not exist", async () => {
                const user = await createUser();
                const token = await generateValidToken(user);
                const enrollment = await createEnrollmentWithAddress(user);
                const ticketType = await createTicketTypeWithHotel();
                const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
                await createPayment(ticket.id, ticketType.price);
                const createdHotel = await createHotel();
                const createdRoom = await createRoomWithHotelId(createdHotel.id);

                const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({"roomId": createdRoom.id + 1});
                
                expect(response.status).toBe(httpStatus.NOT_FOUND);
            });


            it("should respond with status 403 when room it is full", async () => {
                const user = await createUser();
                const token = await generateValidToken(user);
                const enrollment = await createEnrollmentWithAddress(user);
                const ticketType = await createTicketTypeWithHotel(true);
                const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED);
                await createPayment(ticket.id, ticketType.price);
                const createdHotel = await createHotel();
                const createdRoom = await createRoomWithHotelId(createdHotel.id);

                await createBooking(user.id, createdRoom.id);
                await createBooking(user.id, createdRoom.id);
                await createBooking(user.id, createdRoom.id);

                const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({"roomId": createdRoom.id});
                
                expect(response.status).toBe(httpStatus.FORBIDDEN);
            });
        });
    });
});

describe("PUT /booking/:bookingId", () => {
    it("should respond with status 401 if no token is given", async () => {
        const response = await server.put("/booking/"+1);

        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    it("should respond with status 401 if given token is not valid", async () => {
        const token = faker.lorem.word();

        const response = await server.put("/booking/"+1).set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    it("should respond with status 401 if there is no session for given token", async () => {
        const userWithoutSession = await createUser();
        const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

        const response = await server.put("/booking/"+1).set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    describe("when token is valid", () => {
        describe("when body is not valid", () => {
            it("should respond with status 400 when body is not present", async () => {
                const user = await createUser();
                const token = await generateValidToken(user);

                const response = await server.put("/booking/"+1).set("Authorization", `Bearer ${token}`)

                expect(response.status).toBe(httpStatus.BAD_REQUEST);
            });

            it("should respond with status 400 when body is not valid", async () => {
                const user = await createUser();
                const token = await generateValidToken(user);

                const response = await server.put("/booking/"+1).set("Authorization", `Bearer ${token}`).send({
                    data:{
                        roomId : "teste"
                    }
                })

                expect(response.status).toBe(httpStatus.BAD_REQUEST);
            });
        })

        describe("when params is not valid", () => {
            it("should respond with status 400 when body is not valid", async () => {
                const user = await createUser();
                const token = await generateValidToken(user);

                const response = await server.put("/booking/"+"a").set("Authorization", `Bearer ${token}`).send({
                    data:{
                        roomId : "teste"
                    }
                })

                expect(response.status).toBe(httpStatus.BAD_REQUEST);
            });
        })

        describe("when body is valid", () => {

            it("should respond with status 200 and change the booking", async () => {
                const user = await createUser();
                const token = await generateValidToken(user);
                const enrollment = await createEnrollmentWithAddress(user);
                const ticketType = await createTicketTypeWithHotel();
                const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
                await createPayment(ticket.id, ticketType.price);
                const createdHotel = await createHotel();
                const createdRoom = await createRoomWithHotelId(createdHotel.id);
                const createdBooking = await createBooking(user.id,createdRoom.id);
                const newCreatedRoom = await createRoomWithHotelId(createdHotel.id);

                const response = await server.put("/booking/" + createdBooking.id).set("Authorization", `Bearer ${token}`).send({"roomId": newCreatedRoom.id});

                expect(response.status).toBe(httpStatus.OK);
                const changedBooking = await prisma.booking.findUnique({
                    where:{
                        id: response.body.bookingId
                    }
                })
                expect(changedBooking).toBeDefined();
                expect(changedBooking.roomId).toEqual(newCreatedRoom.id);
            });

            it("should respond with status 403 when user does not have a booking", async () => {
                const user = await createUser();
                const newUser = await createUser();
                const token = await generateValidToken(newUser);
                const enrollment = await createEnrollmentWithAddress(user);
                const ticketType = await createTicketTypeWithHotel();
                const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
                await createPayment(ticket.id, ticketType.price);
                const createdHotel = await createHotel();
                const createdRoom = await createRoomWithHotelId(createdHotel.id);
                const createdBooking = await createBooking(user.id,createdRoom.id);

                const response = await server.put("/booking/" + createdBooking.id).set("Authorization", `Bearer ${token}`).send({"roomId": createdRoom.id + 1});

                expect(response.status).toBe(httpStatus.FORBIDDEN);
            });

            it("should respond with status 404 when room does not exist", async () => {
                const user = await createUser();
                const token = await generateValidToken(user);
                const enrollment = await createEnrollmentWithAddress(user);
                const ticketType = await createTicketTypeWithHotel(true);
                const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED);
                await createPayment(ticket.id, ticketType.price);
                const createdHotel = await createHotel();
                const createdRoom = await createRoomWithHotelId(createdHotel.id);
                const createdBooking = await createBooking(user.id,createdRoom.id);


                const response = await server.put("/booking/" + createdBooking.id).set("Authorization", `Bearer ${token}`).send({"roomId": createdRoom.id + 1});
                
                expect(response.status).toBe(httpStatus.NOT_FOUND);
            });


            it("should respond with status 403 when room it is full", async () => {
                const user = await createUser();
                const token = await generateValidToken(user);
                const enrollment = await createEnrollmentWithAddress(user);
                const ticketType = await createTicketTypeWithHotel(true);
                const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED);
                await createPayment(ticket.id, ticketType.price);
                const createdHotel = await createHotel();
                const createdRoom = await createRoomWithHotelId(createdHotel.id);
                const createdBooking = await createBooking(user.id,createdRoom.id);
                const newCreatedRoom = await createRoomWithHotelId(createdHotel.id);

                await createBooking(user.id, newCreatedRoom.id);
                await createBooking(user.id, newCreatedRoom.id);
                await createBooking(user.id, newCreatedRoom.id);

                const response = await server.put("/booking/" + createdBooking.id).set("Authorization", `Bearer ${token}`).send({"roomId": newCreatedRoom.id});
                
                expect(response.status).toBe(httpStatus.FORBIDDEN);
            });

            it("should respond with status 404 bookingId does not exist", async () => {
                const user = await createUser();
                const token = await generateValidToken(user);

                const response = await server.put("/booking/" + 7).set("Authorization", `Bearer ${token}`).send({"roomId": 17});
                
                expect(response.status).toBe(httpStatus.NOT_FOUND);
            });

        });
    });
});