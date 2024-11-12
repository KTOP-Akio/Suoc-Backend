"use server";

import { createId } from "@/lib/api/utils";
import { userIsInBeta } from "@/lib/edge-config";
import { prisma } from "@/lib/prisma";
import { storage } from "@/lib/storage";
import { nanoid } from "nanoid";
import z from "../../zod";
import { authUserActionClient } from "../safe-action";

const onboardPartnerSchema = z.object({
  name: z.string(),
  logo: z.string().nullable(),
  country: z.string().nullable(),
  description: z.string().nullable(),
});

// Onboard a new partner
export const onboardPartner = authUserActionClient
  .schema(onboardPartnerSchema)
  .action(async ({ ctx, parsedInput }) => {
    const { user } = ctx;

    const partnersPortalEnabled = await userIsInBeta(
      user.email,
      "partnersPortal",
    );
    if (!partnersPortalEnabled) {
      return {
        ok: false,
        error: "Partners portal feature flag disabled.",
      };
    }

    const { name, logo, country, description } = parsedInput;

    try {
      let partner = await prisma.partner.create({
        data: {
          name,
          country,
          bio: description,
          id: createId({ prefix: "pn_" }),
          users: {
            create: {
              userId: user.id,
              role: "owner",
            },
          },
        },
      });

      if (logo) {
        const { url } = await storage.upload(
          `logos/partners/${partner.id}_${nanoid(7)}`,
          logo,
        );

        partner = await prisma.partner.update({
          where: { id: partner.id },
          data: { logo: url },
        });
      }

      return { ok: true, partnerId: partner.id };
    } catch (e) {
      console.error(e);
      return {
        ok: false,
      };
    }
  });
