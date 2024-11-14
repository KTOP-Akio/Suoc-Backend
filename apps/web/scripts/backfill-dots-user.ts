import { createDotsUser } from "@/lib/dots/create-dots-user";
import { retrieveDotsUser } from "@/lib/dots/retrieve-dots-user";
import { prisma } from "@/lib/prisma";
import "dotenv-flow/config";

const partnerId = "pn_DlsZeePb38RVcnrfbD0SrKzB";
const dotsAppId = "f821f11e-f5d0-44f9-8f6c-adb4816c5f03";

// REMEMBER TO CHANGE TO PROD ENVS FIRST OR THIS WONT WORK
async function main() {
  const partner = await prisma.partner.findUnique({
    where: {
      id: partnerId,
    },
  });

  if (!partner?.dotsUserId) {
    console.log("No Dots user ID found");
    return;
  }

  const dotsUser = await retrieveDotsUser({
    dotsUserId: partner.dotsUserId,
    partner,
  });

  const userInfo = {
    firstName: dotsUser.first_name,
    lastName: dotsUser.last_name,
    email: dotsUser.email,
    countryCode: dotsUser.phone_number.country_code,
    phoneNumber: dotsUser.phone_number.phone_number,
  };
  console.log(userInfo);

  const res = await createDotsUser({
    userInfo,
    dotsAppId,
  });

  console.log(res);
}

main();
