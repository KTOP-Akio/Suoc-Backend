import LinksContainer from "@/components/app/links/links-container";
import { useAddEditLinkModal } from "@/components/app/modals/add-edit-link-modal";
import dynamic from "next/dynamic";
import { MaxWidthWrapper } from "ui";
const AppLayout = dynamic(() => import("@/components/layout/app"), {
  ssr: false,
});

export default function Links() {
  const { AddEditLinkModal, AddEditLinkButton } = useAddEditLinkModal();

  return (
    <AppLayout>
      <AddEditLinkModal />
      <div className="flex h-36 items-center border-b border-gray-200 bg-white">
        <MaxWidthWrapper>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl text-gray-600">My Dub.sh Links</h1>
            <AddEditLinkButton />
          </div>
        </MaxWidthWrapper>
      </div>
      <LinksContainer AddEditLinkButton={AddEditLinkButton} />
    </AppLayout>
  );
}
