import { intervals } from "@/lib/analytics/constants";
import {
  CommissionInterval,
  CommissionType,
  ProgramEnrollmentStatus,
  ProgramType,
} from "@dub/prisma/client";
import { z } from "zod";
import { LinkSchema } from "./links";
import { parseDateSchema } from "./utils";

export const ProgramSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  logo: z.string().nullable(),
  brandColor: z.string().nullable(),
  domain: z.string().nullable(),
  url: z.string().nullable(),
  type: z.nativeEnum(ProgramType),
  cookieLength: z.number(),
  commissionAmount: z.number(),
  commissionType: z.nativeEnum(CommissionType),
  recurringCommission: z.boolean(),
  recurringDuration: z.number().nullable(),
  recurringInterval: z.nativeEnum(CommissionInterval).nullable(),
  isLifetimeRecurring: z.boolean().nullable(),
  wordmark: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createProgramSchema = z.object({
  name: z.string(),
  commissionType: z.nativeEnum(CommissionType),
  commissionAmount: z.number(),
  recurringCommission: z.boolean(),
  recurringInterval: z.nativeEnum(CommissionInterval).nullable(),
  recurringDuration: z.number().nullable(),
  isLifetimeRecurring: z.boolean().nullable(),
  cookieLength: z.number().min(1).max(180),
  domain: z.string().nullable(),
  url: z.string().nullable(),
});

export const ProgramEnrollmentSchema = z.object({
  partnerId: z.string(),
  programId: z.string(),
  program: ProgramSchema,
  status: z.nativeEnum(ProgramEnrollmentStatus),
  link: LinkSchema.pick({
    id: true,
    shortLink: true,
    domain: true,
    key: true,
    url: true,
    clicks: true,
    leads: true,
    sales: true,
    saleAmount: true,
  }).nullable(),
  commissionAmount: z.number().nullable(),
  createdAt: z.date(),
});

export const ProgramInviteSchema = z.object({
  id: z.string(),
  email: z.string(),
  shortLink: z.string(),
  createdAt: z.date(),
});

export const getProgramMetricsQuerySchema = z.object({
  interval: z.enum(intervals).default("1y"),
  start: parseDateSchema.optional(),
  end: parseDateSchema.optional(),
});

export const PartnerProgramInviteSchema = z.object({
  id: z.string(),
  email: z.string(),
  program: ProgramSchema,
});
