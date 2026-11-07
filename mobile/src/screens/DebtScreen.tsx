import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Alert
} from 'react-native';
import {
  BookOpen,
  Search,
  Plus,
  DollarSign,
  Phone,
  Calendar,
  History,
  X,
  ArrowDownLeft,
  ArrowUpRight,
  UserCheck
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { Customer, DebtTransaction } from '../types';
import { apiService } from '../services/api';

export function DebtScreen() {
  const [debtors, setDebtors] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // 1. Qarz to'lash modali
  const [isRepayModalOpen, setIsRepayModalOpen] = useState(false);
  const [activeCustomer, setActiveCustomer] = useState<Customer | null>(null);
  const [repayAmount, setRepayAmount] = useState('');
  const [repayNote, setRepayNote] = useState('');
  const [submittingRepay, setSubmittingRepay] = useState(false);

  // 2. Qarz tarixi (Timeline) modali
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyTransactions, setHistoryTransactions] = useState<DebtTransaction[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // 3. Yangi mijoz qo'shish modali
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('+998 ');

  const fetchDebtors = useCallback(async () => {
    try {
      const data = await apiService.getDebtors();
      setDebtors(data);
    } catch {}
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchDebtors().finally(() => setLoading(false));
  }, [fetchDebtors]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDebtors();
    setRefreshing(false);
  };

  // Qarz to'lash oynasini ochish
  const handleOpenRepay = (customer: Customer) => {
    setActiveCustomer(customer);
    setRepayAmount(customer.totalDebt.toString());
    setRepayNote("Kassada qarz yopildi");
    setIsRepayModalOpen(true);
  };

  // Qarz to'lashni tasdiqlash
  const handleConfirmRepay = async () => {
    if (!activeCustomer) return;

    const amountNum = parseFloat(repayAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Xatolik', 'To\'lov summasini to\'g\'ri kiriting');
      return;
    }

    setSubmittingRepay(true);
    try {
      await apiService.repayDebt(activeCustomer.id, amountNum, repayNote);

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Speech.speak("Qarz to'lovi qabul qilindi", { language: 'uz' });

      setIsRepayModalOpen(false);
      setActiveCustomer(null);
      await fetchDebtors();
    } catch {
      Alert.alert('Xatolik', 'To\'lovni amalga oshirishda xatolik yuz berdi');
    } finally {
      setSubmittingRepay(false);
    }
  };

  // Qarz tarixini ochish
  const handleOpenHistory = async (customer: Customer) => {
    setActiveCustomer(customer);
    setIsHistoryModalOpen(true);
    setLoadingHistory(true);
    try {
      const txs = await apiService.getCustomerTransactions(customer.id);
      setHistoryTransactions(txs);
    } catch {
      setHistoryTransactions([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Yangi qarzdor mijoz yaratish
  const handleSaveNewCustomer = async () => {
    if (!newCustName || newCustPhone.length < 9) {
      Alert.alert('Xatolik', 'Mijoz ismi va telefon raqamini kiriting');
      return;
    }

    try {
      await apiService.createCustomer(newCustName, newCustPhone);
      await fetchDebtors();
      setIsAddCustomerOpen(false);
      setNewCustName('');
      setNewCustPhone('+998 ');
      Alert.alert('Muvaffaqiyatli', 'Mijoz ro\'yxatga qo\'shildi');
    } catch {
      Alert.alert('Xatolik', 'Mijozni saqlashda xatolik yuz berdi');
    }
  };

  const filtered = debtors.filter(
    d =>
      d.fullName.toLowerCase().includes(search.toLowerCase()) ||
      d.phone.includes(search)
  );

  const totalMarketDebt = debtors.reduce((sum, d) => sum + d.totalDebt, 0);

  return (
    <View style={styles.container}>
      {/* 1. Yuqori banner: umumiy nasiya va yangi mijoz tugmasi */}
      <View style={styles.topBanner}>
        <View>
          <Text style={styles.bannerLabel}>Bozordagi Umumiy Nasiya</Text>
          <Text style={styles.bannerSum}>{totalMarketDebt.toLocaleString()} so&apos;m</Text>
          <Text style={styles.bannerSub}>{debtors.length} nafar faol qarzdor</Text>
        </View>

        <TouchableOpacity
          style={styles.addDebtorBtn}
          onPress={() => setIsAddCustomerOpen(true)}
        >
          <Plus size={16} color="#ffffff" />
          <Text style={styles.addDebtorBtnText}>Yangi Mijoz</Text>
        </TouchableOpacity>
      </View>

      {/* 2. Qidiruv paneli */}
      <View style={styles.searchBar}>
        <Search size={16} color="#94a3b8" />
        <TextInput
          style={styles.searchInput}
          placeholder="Mijoz ismi yoki telefoni bo'yicha qidiruv..."
          placeholderTextColor="#94a3b8"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* 3. Qarzdorlar ro'yxati */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#d97706" />
          <Text style={styles.loadingText}>Qarzdorlar yuklanmoqda...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id.toString()}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#d97706']} />
          }
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.debtCard}
              activeOpacity={0.8}
              onPress={() => handleOpenHistory(item)}
            >
              <View style={styles.cardTop}>
                <View style={styles.cardLeft}>
                  <Text style={styles.custName}>{item.fullName}</Text>
                  <View style={styles.phoneRow}>
                    <Phone size={12} color="#94a3b8" />
                    <Text style={styles.custPhone}>{item.phone}</Text>
                  </View>
                </View>

                <View style={styles.cardRight}>
                  <Text style={styles.debtLabel}>Qarzi:</Text>
                  <Text style={styles.debtValue}>{item.totalDebt.toLocaleString()} so&apos;m</Text>
                </View>
              </View>

              <View style={styles.cardBottom}>
                <View style={styles.dateRow}>
                  <Calendar size={12} color="#64748b" />
                  <Text style={styles.dateText}>
                    {item.lastTransactionDate
                      ? new Date(item.lastTransactionDate).toLocaleDateString('uz-UZ')
                      : 'Hozircha harakat yo\'q'}
                  </Text>
                </View>

                <View style={styles.cardButtons}>
                  <TouchableOpacity
                    style={styles.historyBtn}
                    onPress={() => handleOpenHistory(item)}
                  >
                    <History size={12} color="#6366f1" />
                    <Text style={styles.historyBtnText}>Tarix</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.repayBtn}
                    onPress={() => handleOpenRepay(item)}
                  >
                    <DollarSign size={13} color="#ffffff" />
                    <Text style={styles.repayBtnText}>Qarz To&apos;lash</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <BookOpen size={36} color="#475569" />
              <Text style={styles.emptyTitle}>Qarzdor mijozlar yo&apos;q</Text>
              <Text style={styles.emptySubtitle}>Barcha mijozlar o&apos;z vaqtida hisob-kitob qilgan</Text>
            </View>
          }
        />
      )}

      {/* 4. QARZ TO'LASH MODALI */}
      <Modal visible={isRepayModalOpen} animationType="fade" transparent={true}>
        <View style={styles.modalBg}>
          <View style={styles.modalBody}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Qarzni So&apos;ndirish</Text>
              <TouchableOpacity onPress={() => setIsRepayModalOpen(false)}>
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            {activeCustomer && (
              <View style={styles.activeCustInfo}>
                <Text style={styles.activeCustName}>{activeCustomer.fullName}</Text>
                <Text style={styles.activeCustDebt}>
                  Joriy qarzi: {activeCustomer.totalDebt.toLocaleString()} so&apos;m
                </Text>
              </View>
            )}

            <View style={styles.formGroup}>
              <Text style={styles.label}>To&apos;lanayotgan summa (so&apos;m):</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={repayAmount}
                onChangeText={setRepayAmount}
              />

              <Text style={styles.label}>Izoh:</Text>
              <TextInput
                style={styles.input}
                value={repayNote}
                onChangeText={setRepayNote}
                placeholder="Qarz to'landi"
              />

              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={handleConfirmRepay}
                disabled={submittingRepay}
              >
                {submittingRepay ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.confirmBtnText}>To&apos;lovni Qabul Qilish</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 5. QARZ TARIXI (TIMELINE) MODALI */}
      <Modal visible={isHistoryModalOpen} animationType="slide" transparent={true}>
        <View style={styles.modalBg}>
          <View style={[styles.modalBody, { maxHeight: '80%' }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{activeCustomer?.fullName}</Text>
                <Text style={styles.modalSubtitle}>Qarz va to&apos;lovlar tarixi</Text>
              </View>
              <TouchableOpacity onPress={() => setIsHistoryModalOpen(false)}>
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            {loadingHistory ? (
              <View style={{ padding: 30, alignItems: 'center' }}>
                <ActivityIndicator size="small" color="#6366f1" />
              </View>
            ) : historyTransactions.length === 0 ? (
              <View style={{ padding: 30, alignItems: 'center' }}>
                <Text style={{ color: '#64748b', fontSize: 12 }}>Tarix topilmadi.</Text>
              </View>
            ) : (
              <ScrollView style={{ marginTop: 10 }}>
                {historyTransactions.map(tx => {
                  const isRepay = tx.type === 'RepayDebt';

                  return (
                    <View key={tx.id} style={styles.timelineRow}>
                      <View
                        style={[
                          styles.timelineBadge,
                          { backgroundColor: isRepay ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)' }
                        ]}
                      >
                        {isRepay ? (
                          <ArrowDownLeft size={16} color="#10b981" />
                        ) : (
                          <ArrowUpRight size={16} color="#ef4444" />
                        )}
                      </View>

                      <View style={styles.timelineContent}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                          <Text style={{ fontSize: 12, fontWeight: '700', color: '#1e293b' }}>
                            {isRepay ? "Qarz To'landi" : 'Qarz Olindi (Savdo)'}
                          </Text>
                          <Text
                            style={{
                              fontSize: 12,
                              fontWeight: '800',
                              color: isRepay ? '#10b981' : '#ef4444'
                            }}
                          >
                            {isRepay ? '-' : '+'}
                            {tx.amount.toLocaleString()} so&apos;m
                          </Text>
                        </View>

                        {tx.note && (
                          <Text style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{tx.note}</Text>
                        )}
                        <Text style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>
                          {new Date(tx.createdAt).toLocaleString('uz-UZ')}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* 6. YANGI QARZDOR MIJOZ QO'SHISH MODALI */}
      <Modal visible={isAddCustomerOpen} animationType="fade" transparent={true}>
        <View style={styles.modalBg}>
          <View style={styles.modalBody}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Yangi Mijoz Qo&apos;shish</Text>
              <TouchableOpacity onPress={() => setIsAddCustomerOpen(false)}>
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Mijoz Ism-Familiyasi:</Text>
              <TextInput
                style={styles.input}
                placeholder="Masalan: Dilmurod Ergashev"
                value={newCustName}
                onChangeText={setNewCustName}
              />

              <Text style={styles.label}>Telefon Raqami:</Text>
              <TextInput
                style={styles.input}
                keyboardType="phone-pad"
                value={newCustPhone}
                onChangeText={setNewCustPhone}
              />

              <TouchableOpacity style={styles.confirmBtn} onPress={handleSaveNewCustomer}>
                <Text style={styles.confirmBtnText}>Mijozni Saqlash</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a'
  },
  topBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    margin: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)'
  },
  bannerLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
    textTransform: 'uppercase'
  },
  bannerSum: {
    fontSize: 22,
    fontWeight: '800',
    color: '#f59e0b',
    marginTop: 2
  },
  bannerSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2
  },
  addDebtorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d97706',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    gap: 4
  },
  addDebtorBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700'
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    marginHorizontal: 14,
    marginBottom: 10,
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 8
  },
  searchInput: {
    flex: 1,
    paddingVertical: 9,
    fontSize: 12,
    color: '#ffffff'
  },
  listContent: {
    paddingHorizontal: 14,
    paddingBottom: 20,
    gap: 10
  },
  debtCard: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)'
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  cardLeft: {
    flex: 1
  },
  custName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff'
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3
  },
  custPhone: {
    fontSize: 11,
    color: '#94a3b8'
  },
  cardRight: {
    alignItems: 'flex-end'
  },
  debtLabel: {
    fontSize: 10,
    color: '#94a3b8'
  },
  debtValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ef4444'
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)'
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  dateText: {
    fontSize: 10,
    color: '#64748b'
  },
  cardButtons: {
    flexDirection: 'row',
    gap: 6
  },
  historyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4
  },
  historyBtnText: {
    color: '#818cf8',
    fontSize: 11,
    fontWeight: '600'
  },
  repayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d97706',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4
  },
  repayBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700'
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    color: '#94a3b8',
    marginTop: 8,
    fontSize: 12
  },
  emptyBox: {
    padding: 40,
    alignItems: 'center'
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#94a3b8',
    marginTop: 8
  },
  emptySubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 20
  },
  modalBody: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a'
  },
  modalSubtitle: {
    fontSize: 11,
    color: '#64748b'
  },
  activeCustInfo: {
    backgroundColor: '#fffbeb',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10
  },
  activeCustName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#b45309'
  },
  activeCustDebt: {
    fontSize: 11,
    fontWeight: '600',
    color: '#d97706',
    marginTop: 2
  },
  formGroup: {
    gap: 6
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569'
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0f172a'
  },
  confirmBtn: {
    backgroundColor: '#d97706',
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 6
  },
  confirmBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700'
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    gap: 10
  },
  timelineBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center'
  },
  timelineContent: {
    flex: 1
  }
});
