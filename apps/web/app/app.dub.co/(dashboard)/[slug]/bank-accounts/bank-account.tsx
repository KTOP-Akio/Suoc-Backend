"use client";

import useWorkspace from "@/lib/swr/use-workspace";
import { useAddBankAccountModal } from "@/ui/modals/add-bank-account-modal";
import { Badge, Button } from "@dub/ui";
import { CreditCard } from "lucide-react";

export const BankAccount = () => {
  const { bankAccountName, maskedAccountNumber, bankAccountVerified } =
    useWorkspace();

  const { AddBankAccountModal, setShowAddBankAccountModal } =
    useAddBankAccountModal();

  return (
    <>
      <AddBankAccountModal />
      <div className="flex items-center gap-5 rounded-lg border bg-white p-5">
        <div className="hidden h-12 w-12 items-center justify-center rounded-full border border-neutral-300 sm:inline-flex">
          <CreditCard className="h-5 w-5 text-gray-600" />
        </div>

        <div className="flex grow flex-col gap-1">
          <div className="text-base font-semibold text-gray-700">
            {bankAccountName ?? "Add your bank account"}
          </div>
          <div className="text-sm text-neutral-500">
            {maskedAccountNumber
              ? `*******${maskedAccountNumber}`
              : "Add your bank account"}
          </div>
        </div>

        <div>
          {bankAccountName ? (
            bankAccountVerified ? (
              <Badge variant="blue">VERIFIED</Badge>
            ) : (
              <Badge variant="gray">PENDING VERIFICATION</Badge>
            )
          ) : (
            <Button
              text="Add bank account"
              onClick={() => setShowAddBankAccountModal(true)}
            />
          )}
        </div>
      </div>
    </>
  );
};
