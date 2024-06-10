"use client";

import AnalyticsProvider from "../analytics-provider";
import Toggle from "../toggle";
import EventsTable from "./events-table";
import EventsTabs from "./events-tabs";

export default function AnalyticsEvents({
  staticDomain,
  staticUrl,
  admin,
  demo,
}: {
  staticDomain?: string;
  staticUrl?: string;
  admin?: boolean;
  demo?: boolean;
}) {
  return (
    <AnalyticsProvider {...{ staticDomain, staticUrl, admin, demo }}>
      <div className="py-10">
        <Toggle heading="Events" />
        <div className="mx-auto flex max-w-screen-xl flex-col gap-5 px-2.5 lg:px-20">
          <EventsTabs />
          <EventsTable />
        </div>
      </div>
    </AnalyticsProvider>
  );
}
