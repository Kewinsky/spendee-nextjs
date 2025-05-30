import { ChartAreaInteractive } from "@/app/(protected)/dashboard/components/chart-area-interactive";
import { DataTable } from "@/app/(protected)/dashboard/components/data-table";
import { SectionCards } from "@/app/(protected)/dashboard/components/section-cards";

import data from "./data.json";

const Dashboard = () => {
  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <SectionCards />
      <div className="px-4 lg:px-6">
        <ChartAreaInteractive />
      </div>
      <DataTable data={data} />
    </div>
  );
};

export default Dashboard;
