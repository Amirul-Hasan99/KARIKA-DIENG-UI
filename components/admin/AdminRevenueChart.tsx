"use client";

import React, { useState, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import { formatRupiah } from "@/lib/utils";
import { Order } from "@/types";
import { TrendingUp, Calendar, AlertCircle } from "@/components/ui/FlaticonCompat";

// Dynamically import echarts-for-react to prevent SSR hydration and canvas sizing issues in Next.js App Router
const ReactECharts = dynamic(() => import("echarts-for-react"), {
  ssr: false,
  loading: () => (
    <div className="h-[320px] w-full flex items-center justify-center bg-slate-50/50 rounded-xl animate-pulse">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
        <div className="h-4 w-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <span>Memuat visualisasi statistik pendapatan...</span>
      </div>
    </div>
  ),
});

export type PeriodFilter = "7d" | "30d" | "monthly" | "yearly";

interface AdminRevenueChartProps {
  orders: Order[];
  isLoading?: boolean;
}

// Format short Rupiah for Y-axis (e.g. 500rb, 1,2jt)
function formatShortRupiah(value: number): string {
  if (value === 0) return "Rp 0";
  if (value >= 1_000_000_000) {
    const formatted = (value / 1_000_000_000).toFixed(1).replace(/\.0$/, "");
    return `Rp ${formatted}M`;
  }
  if (value >= 1_000_000) {
    const formatted = (value / 1_000_000).toFixed(1).replace(/\.0$/, "");
    return `Rp ${formatted}jt`;
  }
  if (value >= 1_000) {
    const formatted = Math.round(value / 1_000);
    return `Rp ${formatted}rb`;
  }
  return `Rp ${value}`;
}

const MONTH_NAMES_ID = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des"
];

export const AdminRevenueChart: React.FC<AdminRevenueChartProps> = ({
  orders,
  isLoading = false,
}) => {
  const [period, setPeriod] = useState<PeriodFilter>("7d");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Filter settled orders only (valid revenue)
  const settledOrders = useMemo(() => {
    return orders.filter(
      (o) =>
        o.payment_status === "settlement" &&
        o.created_at &&
        !isNaN(new Date(o.created_at).getTime())
    );
  }, [orders]);

  // Aggregate data according to selected period
  const { labels, values, counts, totalRevenue, totalCount } = useMemo(() => {
    const now = new Date();
    const map = new Map<string, { revenue: number; count: number }>();
    const labelList: string[] = [];

    if (period === "7d") {
      // Last 7 days including today (from day -6 to day 0)
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        const key = `${y}-${m}-${day}`;
        const displayLabel = `${d.getDate()} ${MONTH_NAMES_ID[d.getMonth()]}`;
        map.set(key, { revenue: 0, count: 0 });
        labelList.push(displayLabel);
      }

      settledOrders.forEach((o) => {
        const od = new Date(o.created_at);
        const y = od.getFullYear();
        const m = String(od.getMonth() + 1).padStart(2, "0");
        const day = String(od.getDate()).padStart(2, "0");
        const key = `${y}-${m}-${day}`;
        if (map.has(key)) {
          const prev = map.get(key)!;
          prev.revenue += Number(o.total_amount) || 0;
          prev.count += 1;
        }
      });
    } else if (period === "30d") {
      // Last 30 days
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        const key = `${y}-${m}-${day}`;
        const displayLabel = `${d.getDate()} ${MONTH_NAMES_ID[d.getMonth()]}`;
        map.set(key, { revenue: 0, count: 0 });
        labelList.push(displayLabel);
      }

      settledOrders.forEach((o) => {
        const od = new Date(o.created_at);
        const y = od.getFullYear();
        const m = String(od.getMonth() + 1).padStart(2, "0");
        const day = String(od.getDate()).padStart(2, "0");
        const key = `${y}-${m}-${day}`;
        if (map.has(key)) {
          const prev = map.get(key)!;
          prev.revenue += Number(o.total_amount) || 0;
          prev.count += 1;
        }
      });
    } else if (period === "monthly") {
      // 12 months for current year
      const currentYear = now.getFullYear();
      for (let m = 0; m < 12; m++) {
        const key = `${currentYear}-${String(m + 1).padStart(2, "0")}`;
        const displayLabel = `${MONTH_NAMES_ID[m]} ${currentYear}`;
        map.set(key, { revenue: 0, count: 0 });
        labelList.push(displayLabel);
      }

      settledOrders.forEach((o) => {
        const od = new Date(o.created_at);
        if (od.getFullYear() === currentYear) {
          const key = `${currentYear}-${String(od.getMonth() + 1).padStart(2, "0")}`;
          if (map.has(key)) {
            const prev = map.get(key)!;
            prev.revenue += Number(o.total_amount) || 0;
            prev.count += 1;
          }
        }
      });
    } else if (period === "yearly") {
      // Group by year
      const yearsSet = new Set<number>();
      yearsSet.add(now.getFullYear());
      settledOrders.forEach((o) => {
        const od = new Date(o.created_at);
        yearsSet.add(od.getFullYear());
      });

      const sortedYears = Array.from(yearsSet).sort((a, b) => a - b);
      sortedYears.forEach((yr) => {
        map.set(String(yr), { revenue: 0, count: 0 });
        labelList.push(String(yr));
      });

      settledOrders.forEach((o) => {
        const od = new Date(o.created_at);
        const yr = String(od.getFullYear());
        if (map.has(yr)) {
          const prev = map.get(yr)!;
          prev.revenue += Number(o.total_amount) || 0;
          prev.count += 1;
        }
      });
    }

    const valList: number[] = [];
    const cntList: number[] = [];
    let totRev = 0;
    let totCnt = 0;

    map.forEach((data) => {
      valList.push(data.revenue);
      cntList.push(data.count);
      totRev += data.revenue;
      totCnt += data.count;
    });

    return {
      labels: labelList,
      values: valList,
      counts: cntList,
      totalRevenue: totRev,
      totalCount: totCnt,
    };
  }, [settledOrders, period]);

  // ECharts Option Configuration
  const option = useMemo(() => {
    return {
      color: ["#E58A16"],
      animationDuration: 750,
      tooltip: {
        trigger: "axis",
        backgroundColor: "rgba(255, 255, 255, 0.96)",
        borderColor: "#E2E8F0",
        borderWidth: 1,
        textStyle: {
          color: "#0F172A",
          fontSize: 12,
        },
        padding: [10, 14],
        extraCssText: "box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1); border-radius: 12px;",
        formatter: (params: any) => {
          if (!params || !params.length) return "";
          const p = params[0];
          const dataIndex = p.dataIndex;
          const label = p.name || labels[dataIndex] || "";
          const rev = Number(p.value) || 0;
          const cnt = counts[dataIndex] || 0;

          return `
            <div style="font-family: inherit;">
              <div style="font-size: 11px; font-weight: 700; color: #64748B; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">
                ${label}
              </div>
              <div style="display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 4px;">
                <span style="font-size: 12px; color: #475569; display: flex; align-items: center; gap: 6px;">
                  <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #E58A16;"></span>
                  Pendapatan
                </span>
                <span style="font-size: 13px; font-weight: 800; color: #0F172A;">
                  ${formatRupiah(rev)}
                </span>
              </div>
              <div style="display: flex; align-items: center; justify-content: space-between; gap: 16px;">
                <span style="font-size: 12px; color: #475569; display: flex; align-items: center; gap: 6px;">
                  <span style="display: inline-block; width: 8px; height: 8px; border-radius: 2px; background: #CBD5E1;"></span>
                  Pesanan Sukses
                </span>
                <span style="font-size: 12px; font-weight: 700; color: #334155;">
                  ${cnt} pesanan
                </span>
              </div>
            </div>
          `;
        },
      },
      grid: {
        left: 20,
        right: 20,
        top: 25,
        bottom: 30,
        containLabel: true,
      },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: labels,
        axisLine: {
          show: true,
          lineStyle: { color: "#E2E8F0" },
        },
        axisTick: { show: false },
        axisLabel: {
          color: "#64748B",
          fontSize: 11,
          fontFamily: "inherit",
          margin: 12,
          formatter: (val: string) => {
            // Shorten on 30d if too dense
            if (period === "30d") {
              const parts = val.split(" ");
              return parts[0]; // just show date number
            }
            return val;
          },
        },
      },
      yAxis: {
        type: "value",
        min: 0,
        splitLine: {
          show: true,
          lineStyle: {
            color: "#F1F5F9",
            type: "dashed",
          },
        },
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: "#64748B",
          fontSize: 11,
          fontFamily: "inherit",
          formatter: (v: number) => formatShortRupiah(v),
        },
      },
      series: [
        {
          name: "Pendapatan",
          type: "line",
          data: values,
          smooth: 0.35,
          showSymbol: true,
          symbol: "circle",
          symbolSize: period === "30d" ? 4 : 7,
          itemStyle: {
            color: "#E58A16",
            borderWidth: 2,
            borderColor: "#FFFFFF",
          },
          lineStyle: {
            width: 3,
            color: "#E58A16",
          },
          areaStyle: {
            opacity: 0.14,
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: "#E58A16" },
                { offset: 1, color: "rgba(229, 138, 22, 0.01)" },
              ],
            },
          },
        },
      ],
    };
  }, [labels, values, counts, period]);

  const filterButtons: { id: PeriodFilter; label: string }[] = [
    { id: "7d", label: "7 Hari Terakhir" },
    { id: "30d", label: "30 Hari Terakhir" },
    { id: "monthly", label: "Bulanan" },
    { id: "yearly", label: "Tahunan" },
  ];

  return (
    <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs transition-all">
      {/* Header and Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Statistik Pendapatan
            </h3>
            <span className="hidden xs:inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700 border border-amber-200">
              <TrendingUp className="h-3 w-3" />
              <span>{formatRupiah(totalRevenue)}</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Perkembangan omzet toko berdasarkan periode.
          </p>
        </div>

        {/* Filter Period Buttons */}
        <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl self-start sm:self-auto overflow-x-auto max-w-full">
          {filterButtons.map((btn) => (
            <button
              key={btn.id}
              onClick={() => setPeriod(btn.id)}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition whitespace-nowrap ${
                period === btn.id
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Body */}
      {isLoading ? (
        <div className="h-[320px] w-full flex items-center justify-center bg-slate-50/50 rounded-xl animate-pulse">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <div className="h-4 w-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            <span>Memuat data transaksi...</span>
          </div>
        </div>
      ) : orders.length === 0 ? (
        <div className="h-[280px] w-full flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-xl bg-slate-50/40 p-6 text-center">
          <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
            <Calendar className="h-5 w-5" />
          </div>
          <p className="text-xs font-bold text-slate-700">Belum Ada Riwayat Transaksi</p>
          <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
            Grafik pendapatan akan otomatis terbentuk begitu terdapat pesanan yang berhasil dibayar pelanggan.
          </p>
        </div>
      ) : (
        <div className="relative w-full">
          {mounted && (
            <ReactECharts
              option={option}
              notMerge={true}
              lazyUpdate={true}
              style={{ height: "320px", width: "100%" }}
              opts={{ renderer: "canvas" }}
            />
          )}
        </div>
      )}

      {/* Bottom Summary Footer */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#E58A16]"></span>
          <span className="font-medium">
            Total {period === "7d" ? "7 Hari" : period === "30d" ? "30 Hari" : period === "monthly" ? "Tahun Ini" : "Semua Tahun"}:
          </span>
          <strong className="text-slate-900 font-bold">{formatRupiah(totalRevenue)}</strong>
        </div>
        <div>
          <span>Transaksi Sukses: </span>
          <strong className="text-slate-800 font-semibold">{totalCount} transaksi</strong>
        </div>
      </div>
    </div>
  );
};
