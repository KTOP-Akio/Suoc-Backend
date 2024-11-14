import z from "../zod";
import { dotsFetch } from "./fetch";
import { createIdempotencyKey } from "./utils";

const statusSchema = z.enum([
  "created",
  "pending",
  "failed",
  "completed",
  "reversed",
  "canceled",
  "flagged",
]);

const schema = z.object({
  id: z.string(),
  amount: z.string(),
  status: statusSchema,
  status_history: z.array(
    z.object({
      status: statusSchema,
      timestamp: z.string(),
    }),
  ),
});

export const depositFunds = async ({
  dotsAppId,
  amount,
}: {
  dotsAppId: string;
  amount: string;
}) => {
  const response = await dotsFetch(`/apps/${dotsAppId}/deposit`, {
    method: "POST",
    body: {
      amount: Number(amount) * 100, // The amount to deposit in cents
      idempotency_key: await createIdempotencyKey(),
    },
  });

  return schema.parse(response);
};
