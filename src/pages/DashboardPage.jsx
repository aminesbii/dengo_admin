import { useQuery } from "../hooks/useQuery";
import { orderApi, statsApi } from "../lib/api";
import { useState, useEffect } from "react";
import { DollarSignIcon, PackageIcon, ShoppingBagIcon, UsersIcon, ArrowUpRight } from "lucide-react";
import { capitalizeText, formatDate, getOrderStatusBadge } from "../lib/utils";
import { useTheme } from "../context/ThemeContext";
import { ResponsiveLine } from "@nivo/line";
import { ResponsivePie } from "@nivo/pie";
import { HomeIcon} from "lucide-react";



function DashboardPage() {
  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: orderApi.getAll,
  });

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboardStats"],
    queryFn: statsApi.getDashboard,
  });

  const { theme } = useTheme();
  const isDark = theme === "dark";

  const recentOrders = ordersData?.orders?.slice(0, 5) || [];

  // --- Theme Constants (Matching the Image) ---
  const colors = {
    primary: "#22c55e", // green-500
    secondary: "#10b981", // Emerald
    accent: "#f59e0b", // Amber
    textMain: isDark ? "#ffffff" : "#0f172a",
    textMuted: isDark ? "#94a3b8" : "#64748b",
    cardBg: isDark ? "#111827" : "#ffffff",
    border: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
  };

  const nivoTheme = {
    textColor: colors.textMuted,
    fontSize: 11,
    axis: { ticks: { text: { fill: colors.textMuted } } },
    grid: { line: { stroke: colors.border, strokeWidth: 1 } },
    tooltip: {
      container: {
        background: colors.cardBg,
        color: colors.textMain,
        borderRadius: "8px",
        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
      },
    },
  };

  // --- Data Transformation ---
  const lineData = [{
    id: "Revenue",
    data: (statsData?.revenueByDay || []).map((d, i) => ({ x: d?.name || `Day ${i + 1}`, y: d?.value || 0 }))
  }];

  const pieData = (statsData?.productsByCategory || []).map((c) => ({
    id: c?.name || "",
    label: c?.name || "",
    value: c?.value || 0
  }));

  const [hoveredSlice, setHoveredSlice] = useState(null);

  return (
    <div className="space-y-6">

            {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Dashboard
          </h1>
          <p className="text-base-content/70 mt-1">
            Overview of your business performance
          </p>
        </div>
        </div>

      {/* MAIN GRID LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ROW 1: TOP KPI CARDS (Matches top row of image) */}
        <div className="lg:col-span-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Orders", val: statsData?.totalOrders, icon: <ShoppingBagIcon size={18}/> },
            { label: "Approved", val: "36", icon: <PackageIcon size={18}/> },
            { label: "Total Customers", val: statsData?.totalCustomers, icon: <UsersIcon size={18}/> },
            { label: "Total Revenue", val: `$${statsData?.totalRevenue?.toLocaleString()}`, icon: <DollarSignIcon size={18}/> },
          ].map((stat, i) => (
            <div key={i} className="bg-base-100 rounded-2xl p-5 border border-base-300 shadow-sm flex justify-between items-start">
              <div>
                <p className="text-sm font-medium opacity-60">{stat.label}</p>
                <h3 className="text-2xl font-bold mt-2">{statsLoading ? "..." : stat.val}</h3>
                <span className="text-xs text-success flex items-center gap-1 mt-1 font-semibold">
                  <ArrowUpRight size={12}/> +8.2%
                </span>
              </div>
              <div className="bg-base-200 p-2 rounded-lg">{stat.icon}</div>
            </div>
          ))}
        </div>

        {/* ROW 2: PRIMARY ANALYTICS (Left 8 cols) & MINI STATS (Right 4 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-base-100 rounded-3xl p-6 border border-base-300 shadow-sm">
            <h3 className="font-bold text-lg mb-6">Sales Dynamics</h3>
            <div className="h-[300px]">
              <ResponsiveLine
                data={lineData}
                margin={{ top: 20, right: 20, bottom: 50, left: 50 }}
                xScale={{ type: "point" }}
                yScale={{ type: "linear", min: "auto", max: "auto" }}
                curve="monotoneX"
                axisBottom={{ tickSize: 0, tickPadding: 15 }}
                axisLeft={{ tickSize: 0, tickPadding: 15 }}
                enableArea={true}
                areaOpacity={0.05}
                colors={[colors.primary]}
                theme={nivoTheme}
                pointSize={8}
                pointColor="#ffffff"
                pointBorderWidth={2}
                pointBorderColor={{ from: "serieColor" }}
                useMesh={true}
              />
            </div>
          </div>
        </div>

        {/* SIDEBAR: DONUT & MINI DATA (Matches right side of image) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-base-100 rounded-3xl p-6 border border-base-300 shadow-sm h-full">
            <h3 className="font-bold text-lg mb-4 text-center">Category Split</h3>
            <div className="h-[200px]">
              <ResponsivePie
                data={pieData}
                margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                innerRadius={0.75}
                padAngle={2}
                cornerRadius={5}
                colors={{ scheme: 'nivo' }}
                enableArcLabels={false}
                enableArcLinkLabels={false}
                theme={nivoTheme}
                isInteractive={true}
                activeOuterRadiusOffset={isDark ? 14 : 16}
                motionConfig="wobbly"
                onMouseEnter={(datum) => setHoveredSlice(datum.id)}
                onMouseLeave={() => setHoveredSlice(null)}
                tooltip={({ datum }) => (
                  <div style={{ padding: 8, background: colors.cardBg, color: colors.textMain, borderRadius: 8, boxShadow: '0 6px 18px rgba(0,0,0,0.12)' }}>
                    <div style={{ fontWeight: 700 }}>{datum.id}</div>
                    <div style={{ fontSize: 12, opacity: 0.85 }}>{datum.value}</div>
                  </div>
                )}
              />
            </div>
            <div className="mt-4 space-y-2">
              {pieData.slice(0, 3).map((item, i) => (
                <div key={i} className="flex justify-between items-center text-sm">
                  <span className="opacity-60 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{background: colors.primary}} /> {item.id}
                  </span>
                  <span className="font-bold">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ROW 3: RECENT ORDERS TABLE (Matches bottom section of image) */}
        <div className="lg:col-span-12">
          <div className="bg-base-100 rounded-3xl border border-base-300 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-base-300 flex justify-between items-center">
              <h3 className="font-bold text-lg">Customer Orders</h3>
              <button className="btn btn-ghost btn-sm">View All</button>
            </div>
            <div className="overflow-x-auto">
              <table className="table table-md">
                <thead className="bg-base-200/50">
                  <tr>
                    <th>Profile</th>
                    <th className="hidden md:table-cell">Location</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Price</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order._id} className="hover:bg-base-200/30 transition-colors">
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="avatar placeholder">
                            <div className="bg-neutral text-neutral-content rounded-full w-8">
                              <span>{order?.shippingAddress?.fullName?.[0] ?? "U"}</span>
                            </div>
                          </div>
                          <span className="font-bold text-sm">{order?.shippingAddress?.fullName ?? "Unknown"}</span>
                        </div>
                      </td>
                      <td className="hidden md:table-cell opacity-60 text-xs">Unknown</td>
                      <td className="text-xs">{formatDate(order?.createdAt)}</td>
                      <td>
                        <div className={`badge badge-sm font-bold ${getOrderStatusBadge(order?.status)}`}>
                          {capitalizeText(order?.status || "")}
                        </div>
                      </td>
                      <td className="font-bold text-sm">${(order?.totalPrice ?? 0).toFixed(0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default DashboardPage;