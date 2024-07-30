"use server";

import { prisma } from "@/lib/prisma";
import { flattenValidationErrors } from "next-safe-action";
import { generateOTP } from "../auth";
import { EMAIL_OTP_EXPIRY_IN } from "../auth/constants";
import { hashPassword } from "../auth/password";
import { signUpSchema } from "../zod/schemas/auth";
import { throwIfAuthenticated } from "./middlewares/throw-if-authenticated";
import { actionClient } from "./safe-action";

// Sign up a new user using email and password
export const createNewAccountAction = actionClient
  .schema(signUpSchema, {
    handleValidationErrorsShape: (ve) =>
      flattenValidationErrors(ve).fieldErrors,
  })
  .use(throwIfAuthenticated)
  .action(async ({ parsedInput }) => {
    const { email, password } = parsedInput;

    // Check user with email exists
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (user) {
      throw new Error("An user with this email already exists.");
    }

    // Create an account
    const newUser = await prisma.user.create({
      data: {
        email,
        passwordHash: await hashPassword(password),
      },
    });

    if (!newUser) {
      throw new Error("Failed to create an account. Please try again.");
    }

    // Generate the OTP
    const code = generateOTP();

    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: code,
        expires: new Date(Date.now() + EMAIL_OTP_EXPIRY_IN * 1000),
      },
    });

    // Send email with generated OTP
    // await sendEmail({
    //   subject: `${process.env.NEXT_PUBLIC_APP_NAME}: OTP to verify your account`,
    //   email,
    //   react: VerifyEmail({
    //     email,
    //     code,
    //   }),
    // });

    return {
      user: {
        id: newUser.id,
        email: newUser.email,
      },
    };
  });
