import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator
} from 'react-native';
import {
  Scan,
  BookOpen,
  Package,
  BarChart3,
  Settings,
  Server,
  Store,
  Wifi,
  WifiOff,
  CheckCircle2,
  XCircle
} from 'lucide-react-native';
import { PosScreen } from './src/screens/PosScreen';
import { DebtScreen } from './src/screens/DebtScreen';
import { InventoryScreen } from './src/screens/InventoryScreen';
import { ReportScreen } from './src/screens/ReportScreen';
import { apiService } from './src/services/api';
import { useCartStore } from './src/store/cartStore';

type Tab = 'pos' | 'debt' | 'inventory' | 'report';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('pos');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [ipInput, setIpInput] = useState('http://192.168.13.37:5050/api');
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const [testingConnection, setTestingConnection] = useState(false);

  const cartTotalItems = useCartStore(state => state.getTotalItemsCount());

  // Tarmoq holatini tekshirish
  const checkBackendStatus = async () => {
    const ok = await apiService.checkHealth();
    setIsOnline(ok);
  };

  useEffect(() => {
    apiService.getApiUrl().then(url => {
      setIpInput(url);
      checkBackendStatus();
    });

    const interval = setInterval(checkBackendStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleTestConnection = async () => {
    setTestingConnection(true);
    const tempUrl = ipInput.trim();
    if (!tempUrl) {
      Alert.alert('Xatolik', 'API manzilini kiriting');
      setTestingConnection(false);
      return;
    }

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3500);
      const res = await fetch(`${tempUrl}/products?search=ping`, { signal: controller.signal });
      clearTimeout(timer);

      if (res.ok) {
        setIsOnline(true);
        Alert.alert('Aloqa ajoyib! ✅', 'Backend server bilan muvaffaqiyatli bog\'lanildi.');
      } else {
        setIsOnline(false);
        Alert.alert('Server xatosi', `Server javob berdi, lekin holat kodi: ${res.status}`);
      }
    } catch {
      setIsOnline(false);
      Alert.alert(
        'Ulanib bo\'lmadi ❌',
        'Server topilmadi. Kompyuteringiz va telefoningiz bir xil Wi-Fi tarmog\'iga ulanganini va kompyuter IP manzilini tekshiring.'
      );
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSaveApiUrl = async () => {
    if (!ipInput.trim()) {
      Alert.alert('Xatolik', 'API manzilini kiriting');
      return;
    }
    await apiService.setApiUrl(ipInput.trim());
    setIsSettingsOpen(false);
    checkBackendStatus();
    Alert.alert('Muvaffaqiyatli', 'Backend API manzili yangilandi!');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

      {/* Yuqori Header */}
      <View style={styles.topHeader}>
        <View style={styles.headerLeft}>
          <View style={styles.storeIconCircle}>
            <Store size={16} color="#ffffff" />
          </View>
          <View>
            <Text style={styles.storeName}>OsonSavdo POS</Text>
            <Text style={styles.storeTagline}>Kassir va Do&apos;kondor Tizimi</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          {/* Tarmoq Status Indikatori */}
          <TouchableOpacity
            style={[
              styles.statusBadge,
              isOnline ? styles.statusBadgeOnline : styles.statusBadgeOffline
            ]}
            onPress={() => setIsSettingsOpen(true)}
          >
            {isOnline ? (
              <>
                <Wifi size={12} color="#10b981" />
                <Text style={styles.statusTextOnline}>Serverda</Text>
              </>
            ) : (
              <>
                <WifiOff size={12} color="#f59e0b" />
                <Text style={styles.statusTextOffline}>Lokal</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingsIconBtn}
            onPress={() => setIsSettingsOpen(true)}
          >
            <Settings size={18} color="#94a3b8" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Faol Ekran */}
      <View style={styles.screenWrapper}>
        {activeTab === 'pos' && <PosScreen />}
        {activeTab === 'debt' && <DebtScreen />}
        {activeTab === 'inventory' && <InventoryScreen />}
        {activeTab === 'report' && <ReportScreen />}
      </View>

      {/* Pastki Tab-Navigatsiya (BottomTabs) */}
      <View style={styles.bottomTabBar}>
        {/* 1. Kassa va Skaner */}
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'pos' && styles.tabBtnActive]}
          onPress={() => setActiveTab('pos')}
        >
          <View style={styles.iconWithBadge}>
            <Scan size={20} color={activeTab === 'pos' ? '#10b981' : '#94a3b8'} />
            {cartTotalItems > 0 && (
              <View style={styles.cartBadgeCircle}>
                <Text style={styles.cartBadgeText}>{cartTotalItems}</Text>
              </View>
            )}
          </View>
          <Text style={[styles.tabTitle, activeTab === 'pos' && styles.tabTitleActiveGreen]}>
            Kassa (POS)
          </Text>
        </TouchableOpacity>

        {/* 2. Qarz Daftari */}
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'debt' && styles.tabBtnActive]}
          onPress={() => setActiveTab('debt')}
        >
          <BookOpen size={20} color={activeTab === 'debt' ? '#f59e0b' : '#94a3b8'} />
          <Text style={[styles.tabTitle, activeTab === 'debt' && styles.tabTitleActiveAmber]}>
            Nasiya
          </Text>
        </TouchableOpacity>

        {/* 3. Tovar va Ombor */}
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'inventory' && styles.tabBtnActive]}
          onPress={() => setActiveTab('inventory')}
        >
          <Package size={20} color={activeTab === 'inventory' ? '#3b82f6' : '#94a3b8'} />
          <Text style={[styles.tabTitle, activeTab === 'inventory' && styles.tabTitleActiveBlue]}>
            Ombor
          </Text>
        </TouchableOpacity>

        {/* 4. Kunlik Hisobot */}
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'report' && styles.tabBtnActive]}
          onPress={() => setActiveTab('report')}
        >
          <BarChart3 size={20} color={activeTab === 'report' ? '#a855f7' : '#94a3b8'} />
          <Text style={[styles.tabTitle, activeTab === 'report' && styles.tabTitleActivePurple]}>
            Hisobot
          </Text>
        </TouchableOpacity>
      </View>

      {/* Backend API Server Sozlamasi Modali */}
      <Modal visible={isSettingsOpen} transparent={true} animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.settingsBox}>
            <View style={styles.settingsTitleRow}>
              <Server size={20} color="#059669" />
              <Text style={styles.settingsTitle}>Backend Server Sozlamasi</Text>
            </View>

            <Text style={styles.settingsText}>
              Do‘kon kompyuteringizdagi API manzilini kiriting (telefon bilan bir xil Wi-Fi da bo‘lishi shart):
            </Text>

            <TextInput
              style={styles.settingsInput}
              value={ipInput}
              onChangeText={setIpInput}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="http://192.168.1.5:5050/api"
            />

            {/* Tezkor manzil tanlash tugmalari */}
            <View style={styles.presetsRow}>
              <TouchableOpacity
                style={styles.presetChip}
                onPress={() => setIpInput('http://192.168.13.37:5050/api')}
              >
                <Text style={styles.presetChipText}>Bu kompyuter (192.168.13.37)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.presetChip}
                onPress={() => setIpInput('http://10.0.2.2:5050/api')}
              >
                <Text style={styles.presetChipText}>Emulator (10.0.2.2)</Text>
              </TouchableOpacity>
            </View>

            {/* Aloqani sinab ko'rish */}
            <TouchableOpacity
              style={styles.testBtn}
              onPress={handleTestConnection}
              disabled={testingConnection}
            >
              {testingConnection ? (
                <ActivityIndicator size="small" color="#059669" />
              ) : (
                <Text style={styles.testBtnText}>⚡ Aloqani sinab ko‘rish</Text>
              )}
            </TouchableOpacity>

            <View style={styles.settingsButtons}>
              <TouchableOpacity
                style={styles.settingsCancel}
                onPress={() => setIsSettingsOpen(false)}
              >
                <Text style={styles.settingsCancelText}>Bekor qilish</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.settingsSave}
                onPress={handleSaveApiUrl}
              >
                <Text style={styles.settingsSaveText}>Saqlash</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a'
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b'
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  storeIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center'
  },
  storeName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff'
  },
  storeTagline: {
    fontSize: 10,
    color: '#94a3b8'
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12
  },
  statusBadgeOnline: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)'
  },
  statusBadgeOffline: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)'
  },
  statusTextOnline: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10b981'
  },
  statusTextOffline: {
    fontSize: 10,
    fontWeight: '700',
    color: '#f59e0b'
  },
  settingsIconBtn: {
    padding: 6
  },
  screenWrapper: {
    flex: 1
  },
  bottomTabBar: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingVertical: 8,
    paddingHorizontal: 8,
    justifyContent: 'space-around',
    alignItems: 'center'
  },
  tabBtn: {
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12
  },
  tabBtnActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)'
  },
  iconWithBadge: {
    position: 'relative'
  },
  cartBadgeCircle: {
    position: 'absolute',
    top: -4,
    right: -10,
    backgroundColor: '#10b981',
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4
  },
  cartBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800'
  },
  tabTitle: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 4,
    fontWeight: '600'
  },
  tabTitleActiveGreen: {
    color: '#10b981',
    fontWeight: '700'
  },
  tabTitleActiveAmber: {
    color: '#f59e0b',
    fontWeight: '700'
  },
  tabTitleActiveBlue: {
    color: '#3b82f6',
    fontWeight: '700'
  },
  tabTitleActivePurple: {
    color: '#a855f7',
    fontWeight: '700'
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 24
  },
  settingsBox: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18
  },
  settingsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a'
  },
  settingsText: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 18,
    marginBottom: 12
  },
  settingsInput: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0f172a',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    marginBottom: 10
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12
  },
  presetChip: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  presetChipText: {
    fontSize: 10,
    color: '#334155',
    fontWeight: '600'
  },
  testBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#059669',
    backgroundColor: '#f0fdf4',
    marginBottom: 14
  },
  testBtnText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '700'
  },
  settingsButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10
  },
  settingsCancel: {
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  settingsCancelText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600'
  },
  settingsSave: {
    backgroundColor: '#059669',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8
  },
  settingsSaveText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700'
  }
});
