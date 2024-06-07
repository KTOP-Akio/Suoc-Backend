import z from "@/lib/zod";
import { clickEventSchemaTB } from "./clicks";

export const trackSaleRequestSchema = z.object({
  // Required
  customerId: z
    .string({ required_error: "customerId is required" })
    .trim()
    .min(1, "customerId is required")
    .max(100)
    .describe(
      "This is the unique identifier for the customer in the client's app. This is used to track the customer's journey.",
    ),
  amount: z
    .number({ required_error: "amount is required" })
    .int()
    .positive()
    .describe("The amount of the sale. Should be passed in cents."),
  paymentProcessor: z
    .enum(["stripe", "shopify", "paddle"])
    .describe("The payment processor via which the sale was made."),

  // Optional
  eventName: z
    .string()
    .max(50)
    .optional()
    .default("Purchased")
    .describe(
      "The name of the sale event. It can be used to track different types of event for example 'Purchase', 'Subscription', 'Upgrade', etc.",
    )
    .openapi({ example: "Purchased" }),
  invoiceId: z
    .string()
    .nullish()
    .default(null)
    .describe("The invoice ID of the sale."),
  currency: z
    .string()
    .default("usd")
    .describe("The currency of the sale. Accepts ISO 4217 currency codes."),
  metadata: z
    .record(z.unknown())
    .nullish()
    .default(null)
    .describe("Additional metadata to be stored with the sale event."),
});

export const trackSaleResponseSchema = z.object({
  customerId: z.string(),
  amount: z.number(),
  paymentProcessor: z.string(),
  invoiceId: z.string().nullable(),
  currency: z.string(),
  metadata: z.record(z.unknown()).nullable(),
  eventName: z.string(),
});

export const saleEventSchemaTB = clickEventSchemaTB
  .omit({ timestamp: true })
  .and(
    z.object({
      timestamp: z.string().optional(), //autogenerated by Tinybird
      event_id: z.string(),
      customer_id: z.string(),
      event_name: z.string().default("Purchased"),
      payment_processor: z.string(),
      amount: z.number(),
      invoice_id: z.string().default(""),
      currency: z.string().default("usd"),
      metadata: z.string().default(""),
    }),
  );
