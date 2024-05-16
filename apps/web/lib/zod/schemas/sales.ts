import z from "@/lib/zod";
import { clickEventSchemaTB } from "./clicks";

export const trackSaleRequestSchema = z.object({
  customerId: z.string(),
  paymentProcessor: z.enum(["stripe", "shopify", "paddle"]),
  invoiceId: z.string().nullish(),
  amount: z.number().int().positive().default(0),
  currency: z.string().default("usd"),
  metadata: z.record(z.unknown()).nullish(),
});

export const saleEventSchemaTB = clickEventSchemaTB
  .omit({ timestamp: true })
  .and(
    z.object({
      timestamp: z.string().optional(), //autogenerated by Tinybird
      event_id: z.string(),
      customer_id: z.string(),
      payment_processor: z.string(),
      invoice_id: z.string().nullable().default(""),
      amount: z.number(),
      currency: z.string(),
      metadata: z.string(),
    }),
  );
