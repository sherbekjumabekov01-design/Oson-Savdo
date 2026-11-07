'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Clock,
  Sparkles,
  AlertTriangle,
  Snowflake,
  PackageCheck,
  Calendar,
  Layers,
  ArrowUpRight,
  RefreshCw
} from 'lucide-react';
import { apiService } from '@/services/api';
import { HourlySalesDto, AbcAnalysisDto, WeeklyTrendDto } from '@/types/api';

export function AnalyticsView() {
  const [weeklyTrend, setWeeklyTrend] = useState<WeeklyTrendDto | null>(null);
  const [hourlySales, setHourlySales] = useState<HourlySalesDto | null>(null);
  const [abcAnalysis, setAbcAnalysis] = useState<AbcAnalysisDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [abcTab, setAbcTab] = useState<'all' | 'A' | 'B' | 'C' | 'DeadStock'>('all');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [trend, hourly, abc] = await Promise.all([
        apiService.getWeeklyTrend(),
        apiService.getHourlySales(selectedDate),
        apiService.getAbcAnalysis()
      ]);
      setWeeklyTrend(trend);
      setHourlySales(hourly);
      setAbcAnalysis(abc);
    } catch (err: any) {
      console.error('Analitika yuklashda xatolik:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [selectedDate]);

  const filteredAbcItems = (abcAnalysis?.items || []).filter(item => {
    if (abcTab === 'all') return true;
    return item.group === abcTab;
  });

  const maxWeeklyRevenue = Math.max(...(weeklyTrend?.points.map(p => p.revenue) || [100000]), 100000);
  const maxHourlyRevenue = Math.max(...(hourlySales?.points.map(p => p.revenue) || [50000]), 50000);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
            <BarChart3 className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
              Kengaytirilgan Analitika va Tahlil
            </h1>
            <p className="text-xs text-gray-500">
              Haftalik dinamika, soatlik xaridorlar piki va ABC-tahlil (o'lik tovarlar nazorati)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="px-3 py-2 text-xs font-semibold bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={loadAnalytics}
            className="p-2.5 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl border border-gray-200 transition-colors"
            title="Yangilash"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Kartalar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              7 Kunlik Jami Tushum
            </span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-gray-900 mt-2">
            {(weeklyTrend?.totalWeekRevenue || 0).toLocaleString()} <span className="text-xs font-normal text-gray-500">so'm</span>
          </div>
          <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1 font-semibold">
            <ArrowUpRight className="w-3.5 h-3.5" />
            Sof foyda: {(weeklyTrend?.totalWeekProfit || 0).toLocaleString()} so'm
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Eng Gavjum Soat (Pik)
            </span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 mt-2">
            {hourlySales ? `${hourlySales.peakHour}:00 - ${hourlySales.peakHour + 1}:00` : '--:--'}
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Ushbu soatda tushum: {(hourlySales?.peakRevenue || 0).toLocaleString()} so'm
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Top Tovarlar (A-Guruhi)
            </span>
            <Sparkles className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-purple-600 mt-2">
            {abcAnalysis?.groupACount || 0} <span className="text-xs font-normal text-gray-500">ta tovar</span>
          </div>
          <p className="text-xs text-purple-500 mt-1 font-semibold">
            Do'kon tushumining 80%ini keltiruvchi tovarlar
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Muzlagan Pul (O'lik tovar)
            </span>
            <Snowflake className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="text-2xl font-black text-rose-600 mt-2">
            {abcAnalysis?.deadStockCount || 0} <span className="text-xs font-normal text-gray-500">ta tovar</span>
          </div>
          <p className="text-xs text-rose-500 mt-1 font-semibold">
            Umuman sotilmay tokchada yotgan zaxira
          </p>
        </div>
      </div>

      {/* 2 ta Katta Grafik Qatori */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Haftalik Savdo Dinamikasi */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900">7 Kunlik Savdo va Tushum Dinamikasi</h3>
                <p className="text-xs text-gray-400">Kunlar kesimida sotuv hajmi</p>
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                Haftalik
              </span>
            </div>

            {/* Bar Chart */}
            <div className="h-48 flex items-end justify-between gap-2 pt-6">
              {weeklyTrend?.points.map((p, idx) => {
                const heightPercent = Math.max(8, Math.round((p.revenue / maxWeeklyRevenue) * 100));
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] bg-gray-900 text-white px-1.5 py-0.5 rounded shadow whitespace-nowrap">
                      {p.revenue.toLocaleString()} so'm
                    </div>
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className="w-full bg-gradient-to-t from-emerald-600 to-teal-400 rounded-t-lg transition-all group-hover:brightness-110 shadow-sm"
                    />
                    <span className="text-[10px] font-bold text-gray-500 truncate w-full text-center">
                      {p.dayLabel.split(' ')[0]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>Eng past: 0 so'm</span>
            <span>Maksimal: {maxWeeklyRevenue.toLocaleString()} so'm</span>
          </div>
        </div>

        {/* 2. Soatlik Piklar Heatmap */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Kunning Soatlari Bo'yicha Xaridorlar Piki</h3>
                <p className="text-xs text-gray-400">08:00 dan 23:00 gacha kassadagi faollik</p>
              </div>
              <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
                Soatlik
              </span>
            </div>

            {/* Hourly Bars */}
            <div className="h-48 flex items-end justify-between gap-1 pt-6">
              {hourlySales?.points.map((pt, idx) => {
                const heightPercent = Math.max(6, Math.round((pt.revenue / maxHourlyRevenue) * 100));
                const isPeak = pt.hour === hourlySales.peakHour;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1 group h-full justify-end">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[9px] bg-gray-900 text-white px-1 py-0.5 rounded shadow whitespace-nowrap">
                      {pt.revenue.toLocaleString()} ({pt.ordersCount} ta)
                    </div>
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full rounded-t-md transition-all group-hover:scale-105 ${
                        isPeak
                          ? 'bg-gradient-to-t from-amber-600 to-rose-500 shadow-md ring-2 ring-amber-300'
                          : pt.revenue > 0
                          ? 'bg-gradient-to-t from-indigo-500 to-blue-400'
                          : 'bg-gray-100'
                      }`}
                    />
                    <span className="text-[9px] font-mono text-gray-400">{pt.hour}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>Kassir smenasini to'g'ri taqsimlash uchun foydali</span>
            <span className="font-bold text-amber-700">Pik soat: {hourlySales?.peakHour}:00</span>
          </div>
        </div>
      </div>

      {/* ABC Tahlili Jadvali */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-gray-900">
              ABC-Tahlil & O'lik Tovar Monitoringi (Pareto 80/20)
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Qaysi tovarlar do'konga asosiy daromad keltiryapti, qaysilari pulni ushlab yotibdi
            </p>
          </div>

          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setAbcTab('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                abcTab === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Hammasi ({abcAnalysis?.items.length || 0})
            </button>
            <button
              onClick={() => setAbcTab('A')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                abcTab === 'A' ? 'bg-white text-purple-700 shadow-sm font-bold' : 'text-gray-600 hover:text-purple-700'
              }`}
            >
              A Guruhi (Top 80%)
            </button>
            <button
              onClick={() => setAbcTab('B')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                abcTab === 'B' ? 'bg-white text-blue-700 shadow-sm font-bold' : 'text-gray-600 hover:text-blue-700'
              }`}
            >
              B Guruhi (15%)
            </button>
            <button
              onClick={() => setAbcTab('C')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                abcTab === 'C' ? 'bg-white text-amber-700 shadow-sm font-bold' : 'text-gray-600 hover:text-amber-700'
              }`}
            >
              C Guruhi (5%)
            </button>
            <button
              onClick={() => setAbcTab('DeadStock')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                abcTab === 'DeadStock' ? 'bg-white text-rose-700 shadow-sm font-bold' : 'text-gray-600 hover:text-rose-700'
              }`}
            >
              <Snowflake className="w-3.5 h-3.5 text-cyan-500" />
              O'lik Tovar ({abcAnalysis?.deadStockCount || 0})
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/75 text-gray-600 uppercase tracking-wider font-semibold border-b border-gray-200">
              <tr>
                <th className="px-4 py-3.5">Tovar & Kategoriya</th>
                <th className="px-4 py-3.5 text-center">Guruhi</th>
                <th className="px-4 py-3.5 text-right">Jami Tushum</th>
                <th className="px-4 py-3.5 text-right">Sof Foyda</th>
                <th className="px-4 py-3.5 text-center">Sotilgan Miqdor</th>
                <th className="px-4 py-3.5 text-center">Ulushi %</th>
                <th className="px-4 py-3.5 text-center">Qoldiq</th>
                <th className="px-4 py-3.5 text-center">Tavsiya</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredAbcItems.map(item => (
                <tr key={item.productId} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-bold text-gray-900">{item.name}</p>
                    <p className="text-[10px] text-gray-400 font-mono">
                      {item.barcode} • {item.category}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {item.group === 'A' ? (
                      <span className="px-2.5 py-1 bg-purple-100 text-purple-800 rounded-full font-black text-[11px]">
                        A — Top
                      </span>
                    ) : item.group === 'B' ? (
                      <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full font-bold text-[11px]">
                        B — O'rta
                      </span>
                    ) : item.group === 'C' ? (
                      <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full font-bold text-[11px]">
                        C — Kam
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-rose-100 text-rose-800 rounded-full font-bold text-[11px] inline-flex items-center gap-1">
                        <Snowflake className="w-3 h-3 text-cyan-600" /> O'lik Tovar
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-gray-900">
                    {item.revenue.toLocaleString()} so'm
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-emerald-600">
                    {item.profit.toLocaleString()} so'm
                  </td>
                  <td className="px-4 py-3 text-center font-medium text-gray-700">
                    {item.quantitySold} dona
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-indigo-700">
                    {item.revenueSharePercent}%
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-gray-800">
                    {item.currentStock} dona
                  </td>
                  <td className="px-4 py-3 text-center">
                    {item.group === 'A' ? (
                      <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                        Zaxirani doim to'ldirib turing!
                      </span>
                    ) : item.group === 'DeadStock' ? (
                      <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                        Aksiya qilib tezroq soting!
                      </span>
                    ) : (
                      <span className="text-[11px] text-gray-500">Me'yorda buyurtma bering</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
