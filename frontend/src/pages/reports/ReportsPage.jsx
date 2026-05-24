import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getCampaignReport, getCreatorReport, getBrandReport, getFinancialReport, getBrandPerformance, getCreatorPerformance } from "../../api/endpoints";
import DataTable from "../../components/ui/DataTable";
import PageHeader from "../../components/ui/PageHeader";

const tabs = [
  { key: "campaigns", label: "Campaigns" },
  { key: "creators", label: "Creators" },
  { key: "brands", label: "Brands" },
  { key: "financial", label: "Financial" },
  { key: "brand_perf", label: "Brand Performance" },
  { key: "creator_perf", label: "Creator Performance" },
];

const fetchers = {
  campaigns: getCampaignReport,
  creators: getCreatorReport,
  brands: getBrandReport,
  financial: getFinancialReport,
  brand_perf: getBrandPerformance,
  creator_perf: getCreatorPerformance,
};

const tableColumns = {
  campaigns: [
    { key: "name", label: "Name" },
    { key: "brand_name", label: "Brand" },
    { key: "stage", label: "Stage" },
    { key: "creators_count", label: "Creators" },
    { key: "total_payout", label: "Total Payout", render: (r) => r.total_payout != null ? `₹${r.total_payout}` : "—" },
  ],
  creators: [
    { key: "name", label: "Name" },
    { key: "campaigns_count", label: "Campaigns" },
    { key: "total_earned", label: "Earned", render: (r) => r.total_earned != null ? `₹${r.total_earned}` : "—" },
  ],
  brands: [
    { key: "name", label: "Name" },
    { key: "campaigns_count", label: "Campaigns" },
    { key: "total_spent", label: "Spent", render: (r) => r.total_spent != null ? `₹${r.total_spent}` : "—" },
  ],
  financial: [
    { key: "month", label: "Month" },
    { key: "total_payouts", label: "Total Payouts", render: (r) => r.total_payouts != null ? `₹${r.total_payouts}` : "—" },
    { key: "paid", label: "Paid", render: (r) => r.paid != null ? `₹${r.paid}` : "—" },
    { key: "pending", label: "Pending", render: (r) => r.pending != null ? `₹${r.pending}` : "—" },
  ],
  brand_perf: [
    { key: "brand_name", label: "Brand" },
    { key: "campaign_count", label: "Campaigns" },
    { key: "active_campaigns", label: "Active" },
    { key: "total_budget", label: "Budget", render: (r) => r.total_budget != null ? `₹${r.total_budget}` : "—" },
    { key: "total_paid", label: "Paid", render: (r) => r.total_paid != null ? `₹${r.total_paid}` : "—" },
    { key: "total_content_pieces", label: "Content" },
  ],
  creator_perf: [
    { key: "creator_name", label: "Creator" },
    { key: "campaign_count", label: "Campaigns" },
    { key: "total_earned", label: "Earned", render: (r) => r.total_earned != null ? `₹${r.total_earned}` : "—" },
    { key: "avg_engagement_rate", label: "Avg Engagement", render: (r) => r.avg_engagement_rate != null ? `${r.avg_engagement_rate}%` : "—" },
    { key: "total_content", label: "Content" },
    { key: "total_views", label: "Views", render: (r) => r.total_views != null ? r.total_views.toLocaleString() : "—" },
  ],
};

export default function ReportsPage() {
  const [tab, setTab] = useState("campaigns");

  const { data, isLoading } = useQuery({
    queryKey: ["report", tab],
    queryFn: () => fetchers[tab]().then((r) => r.data),
  });

  const items = data?.results || (Array.isArray(data) ? data : []);

  return (
    <div>
      <PageHeader title="Reports" />
      <div style={{ display: "flex", gap: 0, marginBottom: 20, borderBottom: "2px solid #eee" }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: "10px 20px",
              border: "none",
              background: "none",
              cursor: "pointer",
              fontWeight: tab === t.key ? 700 : 400,
              color: tab === t.key ? "#4fc3f7" : "#888",
              borderBottom: tab === t.key ? "2px solid #4fc3f7" : "2px solid transparent",
              marginBottom: -2,
              fontSize: 14,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
      {isLoading ? <p>Loading...</p> : <DataTable columns={tableColumns[tab]} data={items} />}
    </div>
  );
}
