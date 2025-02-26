import z from "@/lib/zod";
import { clickEventSchema, clickEventSchemaTB } from "./clicks";
import { CustomerSchema } from "./customers";
import { commonDeprecatedEventFields } from "./deprecated";
import { linkEventSchema } from "./links";

export const trackSaleRequestSchema = z.object({
  externalId: z
    .string()
    .trim()
    .max(100)
    .default("") // Remove this after migrating users from customerId to externalId
    .describe(
      "This is the unique identifier for the customer in the client's app. This is used to track the customer's journey.",
    ),
  customerId: z
    .string()
    .trim()
    .max(100)
    .nullish()
    .default(null)
    .describe(
      "This is the unique identifier for the customer in the client's app. This is used to track the customer's journey.",
    )
    .openapi({ deprecated: true }),
  amount: z
    .number({ required_error: "amount is required" })
    .int()
    .min(0, "amount cannot be negative")
    .describe("The amount of the sale. Should be passed in cents."),
  paymentProcessor: z
    .enum(["stripe", "shopify", "paddle"])
    .describe("The payment processor via which the sale was made."),
  eventName: z
    .string()
    .max(255)
    .optional()
    .default("Purchase")
    .describe(
      "The name of the sale event. It can be used to track different types of event for example 'Purchase', 'Upgrade', 'Payment', etc.",
    )
    .openapi({ example: "Purchase" }),
  invoiceId: z
    .string()
    .nullish()
    .default(null)
    .describe(
      "The invoice ID of the sale. Can be used as a idempotency key – only one sale event can be recorded for a given invoice ID.",
    ),
  currency: z
    .string()
    .default("usd")
    .transform((val) => val.toLowerCase())
    .describe("The currency of the sale. Accepts ISO 4217 currency codes."),
  metadata: z
    .record(z.unknown())
    .nullish()
    .default(null)
    .describe("Additional metadata to be stored with the sale event."),
  leadEventName: z
    .string()
    .nullish()
    .default(null)
    .describe(
      "The name of the lead event that occurred before the sale (case-sensitive). This is used to associate the sale event with a particular lead event (instead of the latest lead event, which is the default behavior).",
    )
    .openapi({ example: "Cloned template 1481267" }),
});

export const trackSaleResponseSchema = z.object({
  eventName: z.string(),
  customer: z
    .object({
      id: z.string(),
      name: z.string().nullable(),
      email: z.string().nullable(),
      avatar: z.string().nullable(),
      externalId: z.string().nullable(),
    })
    .nullable(),
  sale: z
    .object({
      amount: z.number(),
      currency: z.string(),
      paymentProcessor: z.string(),
      invoiceId: z.string().nullable(),
      metadata: z.record(z.unknown()).nullable(),
    })
    .nullable(),
});

export const saleEventSchemaTB = clickEventSchemaTB
  .omit({ timestamp: true })
  .merge(
    z.object({
      timestamp: z.string().optional(), //autogenerated by Tinybird
      event_id: z.string(),
      event_name: z.string().default("Purchase"),
      customer_id: z.string(),
      payment_processor: z.string(),
      amount: z.number(),
      invoice_id: z.string().default(""),
      currency: z.string().default("usd"),
      metadata: z.string().default(""),
    }),
  );

// response from tinybird endpoint
export const saleEventSchemaTBEndpoint = z.object({
  event: z.literal("sale"),
  timestamp: z.string(),
  event_id: z.string(),
  event_name: z.string(),
  customer_id: z.string(),
  payment_processor: z.string(),
  invoice_id: z.string(),
  saleAmount: z.number(),
  click_id: z.string(),
  link_id: z.string(),
  url: z.string(),
  continent: z.string().nullable(),
  country: z.string().nullable(),
  city: z.string().nullable(),
  region: z.string().nullable(),
  region_processed: z.string().nullable(),
  device: z.string().nullable(),
  browser: z.string().nullable(),
  os: z.string().nullable(),
  referer: z.string().nullable(),
  referer_url: z.string().nullable(),
  referer_url_processed: z.string().nullable(),
  qr: z.number().nullable(),
  ip: z.string().nullable(),
});

// response from dub api
export const saleEventResponseSchema = z
  .object({
    event: z.literal("sale"),
    timestamp: z.coerce.string(),
    eventId: z.string(),
    eventName: z.string(),
    // nested objects
    link: linkEventSchema,
    click: clickEventSchema,
    customer: CustomerSchema,
    sale: trackSaleRequestSchema.pick({
      amount: true,
      invoiceId: true,
      paymentProcessor: true,
    }),
    saleAmount: z
      .number()
      .describe("Deprecated. Use `sale.amount` instead.")
      .openapi({ deprecated: true }),
    invoice_id: z
      .string()
      .describe("Deprecated. Use `sale.invoiceId` instead.")
      .openapi({ deprecated: true }),
    payment_processor: z
      .string()
      .describe("Deprecated. Use `sale.paymentProcessor` instead."),
  })
  .merge(commonDeprecatedEventFields)
  .openapi({ ref: "SaleEvent" });
