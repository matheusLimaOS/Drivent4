import { prisma } from "@/config";
import { Prisma } from "@prisma/client";

async function findByEmail(email: string, select?: Prisma.UserSelect) {
  const params: Prisma.UserFindUniqueArgs = {
    where: {
      email,
    },
  };

  if (select) {
    params.select = select;
  }

  return prisma.user.findUnique(params);
}

async function create(data: Prisma.UserUncheckedCreateInput) {
  return prisma.user.create({
    data,
  });
}

async function findUserTicketAndPayment(userId:number) {
  return prisma.user.findFirst({
    where:{
        id:userId
    },
    include:{
        Enrollment:{
            include:{
                Ticket:{
                    include:{
                        TicketType:true,
                        Payment:true
                    }
                }
            }
        }
    }
  });
}

const userRepository = {
  findByEmail,
  create,
  findUserTicketAndPayment
};

export default userRepository;
