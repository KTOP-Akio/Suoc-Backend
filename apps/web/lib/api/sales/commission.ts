import { Program, Sale } from "@prisma/client";

/* 
  Calculate the commission earned for a sale
*/
export const calculateEarnings = ({
  program,
  sales,
  saleAmount,
}: {
  program: Pick<Program, "commissionAmount" | "commissionType">;
  sales: number;
  saleAmount: number;
}) => {
  if (program.commissionAmount === 0) {
    return 0;
  }

  if (program.commissionType === "percentage") {
    return saleAmount * (program.commissionAmount / 100);
  }

  if (program.commissionType === "flat") {
    return sales * program.commissionAmount;
  }

  throw new Error("Invalid commissionType");
};

// Calculate the recurring commission earned for a sale
export const calculateRecurringCommissionEarned = ({
  program,
  sale,
}: {
  program: Pick<Program, "commissionAmount" | "commissionType">;
  sale: Pick<Sale, "amount">;
}) => {
  //
};
