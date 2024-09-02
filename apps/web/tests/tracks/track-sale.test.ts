import { TrackSaleResponse } from "@/lib/types";
import { randomCustomer, randomId } from "tests/utils/helpers";
import { expect, test } from "vitest";
import { IntegrationHarness } from "../utils/integration";

test("POST /track/sale", async () => {
  const h = new IntegrationHarness();
  const { http } = await h.init();
  const customer = randomCustomer();
  const clickId = "avYirXJbt3gGALMk"; // TODO: Replace this with a valid clickId

  const sale = {
    eventName: "Subscription",
    amount: 100,
    currency: "usd",
    invoiceId: `INV_${randomId()}`,
    paymentProcessor: "stripe",
  };

  await http.post({
    path: "/track/lead",
    body: {
      clickId,
      eventName: "Signup",
      customerId: customer.id,
      customerName: customer.name,
      customerEmail: customer.email,
      customerAvatar: customer.avatar,
    },
  });

  // Add a delay to ensure the lead has been created
  // TODO: Should fix this
  await new Promise((resolve) => setTimeout(resolve, 5000));

  const response = await http.post<TrackSaleResponse>({
    path: "/track/sale",
    body: {
      customerId: customer.id,
      ...sale,
    },
  });

  expect(response.status).toEqual(200);
  expect(response.data).toStrictEqual({
    eventName: sale.eventName,
    customer: {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      avatar: customer.avatar,
    },
    sale: {
      amount: sale.amount,
      currency: sale.currency,
      paymentProcessor: sale.paymentProcessor,
      invoiceId: sale.invoiceId,
      metadata: null,
    },
    customerId: customer.id,
    amount: sale.amount,
    currency: sale.currency,
    paymentProcessor: sale.paymentProcessor,
    metadata: null,
    invoiceId: sale.invoiceId,
  });
});
