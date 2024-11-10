import { PageContent } from "@/ui/layout/page-content";
import { MaxWidthWrapper } from "@dub/ui";
import { SaleTableBusiness } from "./sale-table";

export default function ProgramSales() {
  return (
    <PageContent title="Sales">
      <MaxWidthWrapper>
        <SaleTableBusiness />
      </MaxWidthWrapper>
    </PageContent>
  );
}
