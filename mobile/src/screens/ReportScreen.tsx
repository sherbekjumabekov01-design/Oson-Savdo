import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import {
  BarChart3,
  DollarSign,
  Banknote,
  CreditCard,
  BookOpen,
  TrendingUp,
  Receipt,
  Calendar
} from 'lucide-react-native';
import { DailyReport } from '../types';
import { apiService } from '../services/api';

export function ReportScreen() {
  const [report, setReport] = useState<DailyReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReport = useCallback(async () => {
    try {
      const data = await apiService.getDailyReport();
      setReport(data);
    } catch {}
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchReport().finally(() => setLoading(false));
  }, [fetchReport]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchReport();
    setRefreshing(false);
  };

  const todayStr = new Date().toLocaleDateString('uz-UZ', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#059669']} />
      }
    >
      {/* Sana va Sarlavha */}
      <View style={styles.header}>
        <View style={styles.dateBadge}>
          <Calendar size={13} color="#10b981" />
          <Text style={styles.dateBadgeText}>{todayStr}</Text>
        </View>
        <Text style={styles.title}>Kunlik Hisobot va Kassa</Text>
        <Text style={styles.subtitle}>Bugungi barcha savdolar va tushumlar ko&apos;rsatkichi</Text>
      </View>

      {loading && !report ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#059669" />
          <Text style={styles.loadingText}>Hisobot hisoblanmoqda...</Text>
        </View>
      ) : (
        <View style={styles.cardsGrid}>
          {/* Asosiy Banner: Jami Tushum */}
          <View style={styles.mainCard}>
            <Text style={styles.mainCardLabel}>Bugungi Jami Savdo (Oborot)</Text>
            <Text style={styles.mainCardValue}>
              {(report?.totalRevenue || 0).toLocaleString()} so&apos;m
            </Text>
            <Text style={styles.mainCardCount}>
              {report?.salesCount || 0} ta chek amalga oshirildi
            </Text>
          </View>

          {/* Yalpi Foyda */}
          <View style={styles.profitCard}>
            <View style={styles.profitHeader}>
              <View style={styles.profitBadge}>
                <TrendingUp size={16} color="#10b981" />
              </View>
              <Text style={styles.profitLabel}>Yalpi Foyda (Sotuv - Tannarx)</Text>
            </View>
            <Text style={styles.profitValue}>
              +{(report?.totalProfit || 0).toLocaleString()} so&apos;m
            </Text>
          </View>

          {/* To'lov turlari taqsimoti */}
          <Text style={styles.sectionHeader}>To&apos;lov turlari bo&apos;yicha taqsimot</Text>

          {/* Naqd tushum */}
          <View style={styles.splitCard}>
            <View style={styles.splitLeft}>
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                <Banknote size={18} color="#10b981" />
              </View>
              <View>
                <Text style={styles.splitName}>Naqd Tushum</Text>
                <Text style={styles.splitSub}>Kassaga kirgan naqd pul</Text>
              </View>
            </View>
            <Text style={[styles.splitValue, { color: '#10b981' }]}>
              {(report?.cashRevenue || 0).toLocaleString()} so&apos;m
            </Text>
          </View>

          {/* Karta tushumi */}
          <View style={styles.splitCard}>
            <View style={styles.splitLeft}>
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(37, 99, 235, 0.15)' }]}>
                <CreditCard size={18} color="#3b82f6" />
              </View>
              <View>
                <Text style={styles.splitName}>Plastik Karta</Text>
                <Text style={styles.splitSub}>Terminal orqali to&apos;lovlar</Text>
              </View>
            </View>
            <Text style={[styles.splitValue, { color: '#3b82f6' }]}>
              {(report?.cardRevenue || 0).toLocaleString()} so&apos;m
            </Text>
          </View>

          {/* Nasiyaga berilgan */}
          <View style={styles.splitCard}>
            <View style={styles.splitLeft}>
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                <BookOpen size={18} color="#ef4444" />
              </View>
              <View>
                <Text style={styles.splitName}>Nasiya (Qarzga)</Text>
                <Text style={styles.splitSub}>Bozorga chiqqan qarzlar</Text>
              </View>
            </View>
            <Text style={[styles.splitValue, { color: '#ef4444' }]}>
              {(report?.debtIssued || 0).toLocaleString()} so&apos;m
            </Text>
          </View>

          {/* Undirilgan / Qaytarilgan qarz */}
          <View style={styles.splitCard}>
            <View style={styles.splitLeft}>
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                <DollarSign size={18} color="#f59e0b" />
              </View>
              <View>
                <Text style={styles.splitName}>Undirilgan Qarz</Text>
                <Text style={styles.splitSub}>Bugun mijozlar to&apos;lagan nasiya</Text>
              </View>
            </View>
            <Text style={[styles.splitValue, { color: '#f59e0b' }]}>
              {(report?.debtCollected || 0).toLocaleString()} so&apos;m
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a'
  },
  content: {
    padding: 16,
    paddingBottom: 30
  },
  header: {
    marginBottom: 16
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
    marginBottom: 6
  },
  dateBadgeText: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '700'
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff'
  },
  subtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2
  },
  centerBox: {
    padding: 40,
    alignItems: 'center'
  },
  loadingText: {
    color: '#94a3b8',
    marginTop: 8,
    fontSize: 12
  },
  cardsGrid: {
    gap: 12
  },
  mainCard: {
    backgroundColor: '#059669',
    borderRadius: 18,
    padding: 18,
    shadowColor: '#059669',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6
  },
  mainCardLabel: {
    fontSize: 12,
    color: '#d1fae5',
    fontWeight: '600',
    textTransform: 'uppercase'
  },
  mainCardValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 4
  },
  mainCardCount: {
    fontSize: 12,
    color: '#a7f3d0',
    marginTop: 6
  },
  profitCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)'
  },
  profitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6
  },
  profitBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    padding: 6,
    borderRadius: 8
  },
  profitLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600'
  },
  profitValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#10b981'
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    marginTop: 10,
    marginBottom: 2
  },
  splitCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)'
  },
  splitLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center'
  },
  splitName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff'
  },
  splitSub: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2
  },
  splitValue: {
    fontSize: 14,
    fontWeight: '800'
  }
});
