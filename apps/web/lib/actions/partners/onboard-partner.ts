"use server";

import { createId } from "@/lib/api/utils";
import { createDotsUser } from "@/lib/dots/create-dots-user";
import { sendVerificationToken } from "@/lib/dots/send-verification-token";
import { userIsInBeta } from "@/lib/edge-config";
import { completeProgramApplications } from "@/lib/partners/complete-program-applications";
import { prisma } from "@/lib/prisma";
import { storage } from "@/lib/storage";
import { onboardPartnerSchema } from "@/lib/zod/schemas/partners";
import { COUNTRY_PHONE_CODES, nanoid } from "@dub/utils";
import { authUserActionClient } from "../safe-action";

// Onboard a new partner
export const onboardPartnerAction = authUserActionClient
  .schema(onboardPartnerSchema)
  .action(async ({ ctx, parsedInput }) => {
    const { user } = ctx;

    const partnersPortalEnabled = await userIsInBeta(
      user.email,
      "partnersPortal",
    );

    if (!partnersPortalEnabled) {
      throw new Error("Partners portal feature flag disabled.");
    }

    const { name, email, image, country, phoneNumber, description } =
      parsedInput;

    // Create the Dots user with DOTS_DEFAULT_APP_ID
    const [firstName, lastName] = name.split(" ");
    const countryCode = COUNTRY_PHONE_CODES[country] || null;

    if (!countryCode) {
      throw new Error("Invalid country code.");
    }

    const dotsUserInfo = {
      firstName,
      lastName: lastName || firstName.slice(0, 1), // Dots requires a last name
      email,
      countryCode: countryCode.toString(),
      phoneNumber,
    };

    const dotsUser = await createDotsUser({
      userInfo: dotsUserInfo,
    });

    const partnerExists = await prisma.partner.findUnique({
      where: {
        dotsUserId: dotsUser.id,
      },
    });

    if (partnerExists) {
      throw new Error("This phone number is already in use.");
    }

    const partnerId = createId({ prefix: "pn_" });

    const imageUrl = await storage
      .upload(`partners/${partnerId}/image_${nanoid(7)}`, image)
      .then(({ url }) => url);

    const [partner, _] = await Promise.all([
      prisma.partner.create({
        data: {
          id: partnerId,
          name,
          email,
          country,
          bio: description,
          dotsUserId: dotsUser.id,
          image: imageUrl,
          users: {
            create: {
              userId: user.id,
              role: "owner",
            },
          },
        },
      }),
      prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          defaultPartnerId: partnerId,
        },
      }),
      sendVerificationToken({
        dotsUserId: dotsUser.id,
      }),
    ]);

    // Complete any outstanding program applications
    await completeProgramApplications(user.id);

    return {
      partnerId: partner.id,
    };
  });
