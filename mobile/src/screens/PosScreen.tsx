import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  Animated,
  Easing
} from 'react-native';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import {
  Zap,
  ZapOff,
  Scan,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Banknote,
  CreditCard,
  BookOpen,
  User,
  Search,
  CheckCircle2,
  X,
  AlertCircle,
  Layers
} from 'lucide-react-native';
import { Product, CartItem, Customer, PaymentType, Sale } from '../types';
import { apiService } from '../services/api';
import { useCartStore } from '../store/cartStore';
import { ReceiptModal } from '../components/ReceiptModal';

export function PosScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [loadingScan, setLoadingScan] = useState(false);
  const [lastScannedText, setLastScannedText] = useState<string | null>(null);

  // Savat (Global Zustand Cart Store - tablar o'zgarsa ham o'chib ketmaydi)
  const cartItems = useCartStore(state => state.items);
  const addItem = useCartStore(state => state.addItem);
  const updateQuantity = useCartStore(state => state.updateQuantity);
  const removeCartItem = useCartStore(state => state.removeItem);
  const clearCart = useCartStore(state => state.clearCart);

  // Nasiya / Mijoz tanlash modali
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Yangi mijoz qo'shish
  const [isAddingNewCustomer, setIsAddingNewCustomer] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('+998 ');

  // Chek modali
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Aralash to'lov modali
  const [isMixedModalOpen, setIsMixedModalOpen] = useState(false);
  const [mixedCash, setMixedCash] = useState('');
  const [mixedCard, setMixedCard] = useState('');

  const [submittingSale, setSubmittingSale] = useState(false);

  // Skaner qizil chiziq animatsiyasi
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 140,
          duration: 1600,
          easing: Easing.linear,
          useNativeDriver: true
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 1600,
          easing: Easing.linear,
          useNativeDriver: true
        })
      ])
    ).start();
  }, [scanLineAnim]);

  // Savat hisob-kitoblari
  const totalAmount = cartItems.reduce(
    (sum, it) => sum + it.product.sellingPrice * it.quantity,
    0
  );
  const totalCount = cartItems.reduce((sum, it) => sum + it.quantity, 0);

  // Shtrix-kod o'qilganda ishlaydigan asosiy funksiya
  const handleBarcodeScanned = async (result: BarcodeScanningResult) => {
    const code = result.data;
    if (isLocked || loadingScan || !code) return;

    // 1.5 soniyalik debounce qulfi
    setIsLocked(true);
    setLoadingScan(true);
    setLastScannedText(code);

    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Backend / Mahalliy bazadan mahsulotni qidirish
      const product = await apiService.getProductByBarcode(code);

      // Savatga qo'shish (Zustand do'koniga)
      addItem(product, 1);

      // Ovozli e'lon qilish (Text-to-Speech)
      const speechText = `${product.name}, ${product.sellingPrice.toLocaleString()} so'm`;
      Speech.speak(speechText, {
        language: 'uz',
        rate: 1.0,
        pitch: 1.0
      });
    } catch {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Speech.speak("Mahsulot topilmadi", { language: 'uz' });
    } finally {
      setLoadingScan(false);
      setTimeout(() => {
        setIsLocked(false);
      }, 1500);
    }
  };

  // Tezkor to'lov funksiyasi (Naqd yoki Karta)
  const processDirectPayment = async (type: 'Cash' | 'Card') => {
    if (cartItems.length === 0) {
      Alert.alert('Diqqat', 'Savat bo\'sh! Avval tovarlarni skaner qiling.');
      return;
    }

    setSubmittingSale(true);
    try {
      const createdSale = await apiService.createSale({
        items: cartItems.map(it => ({
          productId: it.product.id,
          quantity: it.quantity,
          unitSellingPrice: it.product.sellingPrice
        })),
        paymentType: type,
        paidAmount: totalAmount,
        customerId: null
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Speech.speak(type === 'Cash' ? "Naqd to'lov qabul qilindi" : "Karta orqali to'landi", {
        language: 'uz'
      });

      clearCart();
      setCompletedSale(createdSale);
      setIsReceiptModalOpen(true);
    } catch {
      Alert.alert('Xatolik', 'To\'lovni amalga oshirishda xatolik yuz berdi');
    } finally {
      setSubmittingSale(false);
    }
  };

  // Nasiya / Qarz to'lovini boshlash
  const openDebtModal = async () => {
    if (cartItems.length === 0) {
      Alert.alert('Diqqat', 'Savat bo\'sh! Avval tovarlarni skaner qiling.');
      return;
    }
    const data = await apiService.getCustomers();
    setCustomers(data);
    setSelectedCustomer(null);
    setIsDebtModalOpen(true);
  };

  // Nasiya sotuvini yakunlash
  const processDebtPayment = async () => {
    if (!selectedCustomer) {
      Alert.alert('Diqqat', 'Nasiyaga savdo qilish uchun mijozni tanlang!');
      return;
    }

    setSubmittingSale(true);
    try {
      const createdSale = await apiService.createSale({
        items: cartItems.map(it => ({
          productId: it.product.id,
          quantity: it.quantity,
          unitSellingPrice: it.product.sellingPrice
        })),
        paymentType: 'Debt',
        paidAmount: 0,
        customerId: selectedCustomer.id
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Speech.speak("Nasiya qarz daftariga yozildi", { language: 'uz' });

      setIsDebtModalOpen(false);
      clearCart();
      setCompletedSale(createdSale);
      setIsReceiptModalOpen(true);
    } catch {
      Alert.alert('Xatolik', 'Nasiyani saqlashda xatolik yuz berdi');
    } finally {
      setSubmittingSale(false);
    }
  };

  // Aralash to'lov (Naqd + Karta + Nasiya)
  const openMixedModal = async () => {
    if (cartItems.length === 0) {
      Alert.alert('Diqqat', 'Savat bo\'sh! Avval tovarlarni skaner qiling.');
      return;
    }
    const data = await apiService.getCustomers();
    setCustomers(data);
    setSelectedCustomer(null);
    setMixedCash('');
    setMixedCard('');
    setIsMixedModalOpen(true);
  };

  const processMixedPayment = async () => {
    const cashVal = parseFloat(mixedCash) || 0;
    const cardVal = parseFloat(mixedCard) || 0;
    const paid = cashVal + cardVal;
    const remainder = Math.max(0, totalAmount - paid);

    if (remainder > 0 && !selectedCustomer) {
      Alert.alert('Diqqat', `Qolgan ${remainder.toLocaleString()} so'm nasiyaga yozilishi uchun mijozni tanlang!`);
      return;
    }

    setSubmittingSale(true);
    try {
      const createdSale = await apiService.createSale({
        items: cartItems.map(it => ({
          productId: it.product.id,
          quantity: it.quantity,
          unitSellingPrice: it.product.sellingPrice
        })),
        paymentType: 'Mixed',
        paidAmount: paid,
        customerId: selectedCustomer?.id || null
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Speech.speak("Aralash to'lov qabul qilindi", { language: 'uz' });

      setIsMixedModalOpen(false);
      clearCart();
      setCompletedSale(createdSale);
      setIsReceiptModalOpen(true);
    } catch {
      Alert.alert('Xatolik', 'Aralash to\'lovda xatolik yuz berdi');
    } finally {
      setSubmittingSale(false);
    }
  };

  // Yangi mijoz qo'shish
  const handleAddNewCustomer = async () => {
    if (!newCustName || newCustPhone.length < 9) {
      Alert.alert('Xatolik', 'Mijoz ismi va telefon raqamini to\'liq kiriting');
      return;
    }

    try {
      const created = await apiService.createCustomer(newCustName, newCustPhone);
      setCustomers(prev => [created, ...prev]);
      setSelectedCustomer(created);
      setIsAddingNewCustomer(false);
      setNewCustName('');
      setNewCustPhone('+998 ');
    } catch {
      Alert.alert('Xatolik', 'Mijoz qo\'shilmadi');
    }
  };

  const filteredCustomers = customers.filter(
    c =>
      c.fullName.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.phone.includes(customerSearch)
  );

  return (
    <View style={styles.container}>
      {/* 1. YUQORI QISM: KAMERA SKANERI */}
      <View style={styles.cameraBox}>
        {!permission?.granted ? (
          <View style={styles.permissionCenter}>
            <AlertCircle size={36} color="#ef4444" />
            <Text style={styles.permissionText}>Kamera ruxsati berilmagan</Text>
            <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
              <Text style={styles.permissionBtnText}>Ruxsat berish</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <CameraView
            style={StyleSheet.absoluteFillObject}
            enableTorch={torchEnabled}
            barcodeScannerSettings={{
              barcodeTypes: ['qr', 'ean13', 'ean8', 'code128', 'code39', 'upc_a']
            }}
            onBarcodeScanned={isLocked ? undefined : handleBarcodeScanned}
          >
            {/* Qoraytirilgan qatlam va ramka */}
            <View style={styles.camOverlay}>
              <View style={[styles.reticle, isLocked && styles.reticleLocked]}>
                {/* Burchak qoliplari */}
                <View style={[styles.corner, styles.tl]} />
                <View style={[styles.corner, styles.tr]} />
                <View style={[styles.corner, styles.bl]} />
                <View style={[styles.corner, styles.br]} />

                {/* Skaner lazer chizig'i */}
                <Animated.View
                  style={[
                    styles.scanLaser,
                    { transform: [{ translateY: scanLineAnim }] }
                  ]}
                />

                {loadingScan && (
                  <View style={styles.camLoading}>
                    <ActivityIndicator size="small" color="#10b981" />
                    <Text style={styles.camLoadingText}>Qidirilmoqda...</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Skaner ustidagi ko'rsatkich va chiroq */}
            <View style={styles.camHeader}>
              <View style={styles.camBadge}>
                <Scan size={14} color="#10b981" />
                <Text style={styles.camBadgeText}>
                  {isLocked
                    ? `O'qildi: ${lastScannedText}`
                    : 'Shtrix-kodni ramkaga tuting'}
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.torchBtn, torchEnabled && styles.torchBtnActive]}
                onPress={() => setTorchEnabled(!torchEnabled)}
              >
                {torchEnabled ? (
                  <Zap size={18} color="#ffffff" />
                ) : (
                  <ZapOff size={18} color="#ffffff" />
                )}
              </TouchableOpacity>
            </View>
          </CameraView>
        )}
      </View>

      {/* 2. O'RTA QISM: SAVAT (CART) */}
      <View style={styles.cartSection}>
        <View style={styles.cartHeader}>
          <View style={styles.cartTitleRow}>
            <ShoppingCart size={16} color="#059669" />
            <Text style={styles.cartTitle}>Savat ({totalCount} ta tovar)</Text>
          </View>

          {cartItems.length > 0 && (
            <TouchableOpacity onPress={clearCart}>
              <Text style={styles.clearCartText}>Tozalash</Text>
            </TouchableOpacity>
          )}
        </View>

        {cartItems.length === 0 ? (
          <View style={styles.emptyCartBox}>
            <ShoppingCart size={32} color="#94a3b8" />
            <Text style={styles.emptyCartText}>Savat bo&apos;sh</Text>
            <Text style={styles.emptyCartSub}>Kamera orqali tovar shtrix-kodini skaner qiling</Text>
          </View>
        ) : (
          <ScrollView style={styles.cartList} showsVerticalScrollIndicator={false}>
            {cartItems.map(item => {
              const itemTotal = item.product.sellingPrice * item.quantity;

              return (
                <View key={item.product.id} style={styles.cartRow}>
                  <View style={styles.cartItemLeft}>
                    <Text style={styles.cartItemName} numberOfLines={1}>
                      {item.product.name}
                    </Text>
                    <Text style={styles.cartItemPrice}>
                      {item.product.sellingPrice.toLocaleString()} so&apos;m / {item.product.unit}
                    </Text>
                  </View>

                  {/* Stepper (+ / -) */}
                  <View style={styles.stepper}>
                    <TouchableOpacity
                      style={styles.stepBtn}
                      onPress={() => updateQuantity(item.product.id, item.quantity - 1)}
                    >
                      <Minus size={12} color="#0f172a" />
                    </TouchableOpacity>

                    <Text style={styles.stepValue}>{item.quantity}</Text>

                    <TouchableOpacity
                      style={styles.stepBtn}
                      onPress={() => updateQuantity(item.product.id, item.quantity + 1)}
                    >
                      <Plus size={12} color="#0f172a" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.cartItemRight}>
                    <Text style={styles.cartItemTotal}>{itemTotal.toLocaleString()} so&apos;m</Text>
                    <TouchableOpacity
                      onPress={() => removeCartItem(item.product.id)}
                      style={styles.trashBtn}
                    >
                      <Trash2 size={14} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* 3. PASTKI QISM: JAMI SUMMA VA TEZKOR TO'LOV TUGMALARI */}
      <View style={styles.checkoutBar}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Jami To&apos;lov:</Text>
          <Text style={styles.totalSum}>{totalAmount.toLocaleString()} so&apos;m</Text>
        </View>

        {submittingSale ? (
          <View style={styles.submittingBox}>
            <ActivityIndicator size="small" color="#059669" />
            <Text style={styles.submittingText}>Tranzaksiya bajarilmoqda...</Text>
          </View>
        ) : (
          <View style={styles.payButtonsRow}>
            {/* 1. Naqd to'lov */}
            <TouchableOpacity
              style={[styles.payBtn, styles.cashBtn]}
              onPress={() => processDirectPayment('Cash')}
            >
              <Banknote size={16} color="#ffffff" />
              <Text style={styles.payBtnText}>Naqd</Text>
            </TouchableOpacity>

            {/* 2. Karta to'lov */}
            <TouchableOpacity
              style={[styles.payBtn, styles.cardBtn]}
              onPress={() => processDirectPayment('Card')}
            >
              <CreditCard size={16} color="#ffffff" />
              <Text style={styles.payBtnText}>Karta</Text>
            </TouchableOpacity>

            {/* 3. Nasiya (Qarz) to'lov */}
            <TouchableOpacity
              style={[styles.payBtn, styles.debtBtn]}
              onPress={openDebtModal}
            >
              <BookOpen size={16} color="#ffffff" />
              <Text style={styles.payBtnText}>Nasiya</Text>
            </TouchableOpacity>

            {/* 4. Aralash to'lov */}
            <TouchableOpacity
              style={[styles.payBtn, styles.mixedBtn]}
              onPress={openMixedModal}
            >
              <Layers size={16} color="#ffffff" />
              <Text style={styles.payBtnText}>Aralash</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* 4. NASIYA / MIJOZ TANLASH MODALI */}
      <Modal visible={isDebtModalOpen} animationType="slide" transparent={true}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHead}>
              <View>
                <Text style={styles.modalTitle}>Nasiyador Mijozni Tanlang</Text>
                <Text style={styles.modalSubtitle}>Qarz summasi: {totalAmount.toLocaleString()} so&apos;m</Text>
              </View>
              <TouchableOpacity onPress={() => setIsDebtModalOpen(false)}>
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* Yangi mijoz qo'shish tugmasi */}
            <View style={styles.customerActionRow}>
              <TouchableOpacity
                style={styles.switchModeBtn}
                onPress={() => setIsAddingNewCustomer(!isAddingNewCustomer)}
              >
                <Plus size={14} color="#d97706" />
                <Text style={styles.switchModeText}>
                  {isAddingNewCustomer ? 'Ro\'yxatdan tanlash' : 'Yangi mijoz kiritish'}
                </Text>
              </TouchableOpacity>
            </View>

            {isAddingNewCustomer ? (
              <View style={styles.newCustBox}>
                <Text style={styles.fieldLabel}>Mijoz To&apos;liq Ismi:</Text>
                <TextInput
                  style={styles.fieldInput}
                  placeholder="Masalan: Jamshid Fayzullayev"
                  placeholderTextColor="#94a3b8"
                  value={newCustName}
                  onChangeText={setNewCustName}
                />

                <Text style={styles.fieldLabel}>Telefon Raqami:</Text>
                <TextInput
                  style={styles.fieldInput}
                  placeholder="+998 90 123-45-67"
                  placeholderTextColor="#94a3b8"
                  keyboardType="phone-pad"
                  value={newCustPhone}
                  onChangeText={setNewCustPhone}
                />

                <TouchableOpacity style={styles.addCustSubmit} onPress={handleAddNewCustomer}>
                  <Text style={styles.addCustSubmitText}>Mijozni Saqlash</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.custListContainer}>
                {/* Qidiruv */}
                <View style={styles.searchBar}>
                  <Search size={14} color="#94a3b8" />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Mijoz ismi yoki telefoni..."
                    placeholderTextColor="#94a3b8"
                    value={customerSearch}
                    onChangeText={setCustomerSearch}
                  />
                </View>

                <ScrollView style={styles.custList} nestedScrollEnabled={true}>
                  {filteredCustomers.map(c => {
                    const isSelected = selectedCustomer?.id === c.id;
                    return (
                      <TouchableOpacity
                        key={c.id}
                        style={[styles.custItem, isSelected && styles.custItemSelected]}
                        onPress={() => setSelectedCustomer(c)}
                      >
                        <View>
                          <Text style={styles.custName}>{c.fullName}</Text>
                          <Text style={styles.custPhone}>{c.phone}</Text>
                        </View>

                        <View style={styles.custRight}>
                          {c.totalDebt > 0 && (
                            <Text style={styles.badgeDebt}>
                              Qarzi: {c.totalDebt.toLocaleString()}
                            </Text>
                          )}
                          {isSelected && <CheckCircle2 size={18} color="#059669" />}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.confirmDebtBtn,
                !selectedCustomer && styles.confirmDebtBtnDisabled
              ]}
              onPress={processDebtPayment}
              disabled={!selectedCustomer || submittingSale}
            >
              <Text style={styles.confirmDebtBtnText}>
                Nasiyani Tasdiqlash ({totalAmount.toLocaleString()} so&apos;m)
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 5. ARALASH TO'LOV MODALI */}
      <Modal visible={isMixedModalOpen} animationType="slide" transparent={true}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHead}>
              <View>
                <Text style={styles.modalTitle}>Aralash To&apos;lov</Text>
                <Text style={styles.modalSubtitle}>Jami: {totalAmount.toLocaleString()} so&apos;m</Text>
              </View>
              <TouchableOpacity onPress={() => setIsMixedModalOpen(false)}>
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={{ marginVertical: 12 }}>
              <Text style={styles.fieldLabel}>💵 Naqd to&apos;lanadigan qismi:</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="0"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                value={mixedCash}
                onChangeText={setMixedCash}
              />

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                <Text style={styles.fieldLabel}>💳 Plastik karta qismi:</Text>
                <TouchableOpacity
                  onPress={() => {
                    const cVal = parseFloat(mixedCash) || 0;
                    const rem = Math.max(0, totalAmount - cVal);
                    setMixedCard(rem.toString());
                  }}
                >
                  <Text style={{ fontSize: 11, color: '#2563eb', fontWeight: 'bold' }}>Qoldiqni kiritish</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.fieldInput}
                placeholder="0"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                value={mixedCard}
                onChangeText={setMixedCard}
              />

              {/* Taqsimot va Nasiya holati */}
              {(() => {
                const cVal = parseFloat(mixedCash) || 0;
                const kVal = parseFloat(mixedCard) || 0;
                const paid = cVal + kVal;
                const rem = totalAmount - paid;
                if (rem > 0) {
                  return (
                    <View style={{ backgroundColor: '#fef3c7', padding: 8, borderRadius: 10, marginTop: 8 }}>
                      <Text style={{ fontSize: 11, color: '#b45309', fontWeight: 'bold' }}>
                        Qolgan {rem.toLocaleString()} so&apos;m nasiyaga yoziladi. Quyidan mijozni tanlang:
                      </Text>
                    </View>
                  );
                } else if (rem < 0) {
                  return (
                    <View style={{ backgroundColor: '#ffe4e6', padding: 8, borderRadius: 10, marginTop: 8 }}>
                      <Text style={{ fontSize: 11, color: '#e11d48', fontWeight: 'bold' }}>
                        Ortiqcha kiritildi: +{Math.abs(rem).toLocaleString()} so&apos;m
                      </Text>
                    </View>
                  );
                }
                return (
                  <View style={{ backgroundColor: '#dcfce7', padding: 8, borderRadius: 10, marginTop: 8 }}>
                    <Text style={{ fontSize: 11, color: '#15803d', fontWeight: 'bold' }}>
                      ✓ Summa to&apos;liq taqsimlandi ({paid.toLocaleString()} so&apos;m)
                    </Text>
                  </View>
                );
              })()}
            </View>

            {/* Qoldiq bo'lsa mijozlar ro'yxati */}
            {(parseFloat(mixedCash) || 0) + (parseFloat(mixedCard) || 0) < totalAmount && (
              <View style={{ maxHeight: 180, marginBottom: 8 }}>
                <Text style={styles.fieldLabel}>Mijozni tanlang (Qarz uchun):</Text>
                <ScrollView style={styles.custList} nestedScrollEnabled={true}>
                  {customers.map(c => {
                    const isSelected = selectedCustomer?.id === c.id;
                    return (
                      <TouchableOpacity
                        key={c.id}
                        style={[styles.custItem, isSelected && styles.custItemSelected]}
                        onPress={() => setSelectedCustomer(c)}
                      >
                        <View>
                          <Text style={styles.custName}>{c.fullName}</Text>
                          <Text style={styles.custPhone}>{c.phone}</Text>
                        </View>
                        <View style={styles.custRight}>
                          {isSelected && <CheckCircle2 size={16} color="#059669" />}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.confirmDebtBtn,
                { backgroundColor: '#7c3aed' },
                submittingSale && styles.confirmDebtBtnDisabled
              ]}
              onPress={processMixedPayment}
              disabled={submittingSale}
            >
              <Text style={styles.confirmDebtBtnText}>
                Aralash To&apos;lovni Qabul Qilish
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 6. CHEK MODALI (RECEIPT MODAL) */}
      <ReceiptModal
        visible={isReceiptModalOpen}
        sale={completedSale}
        onClose={() => {
          setIsReceiptModalOpen(false);
          setCompletedSale(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a'
  },
  cameraBox: {
    height: 190,
    backgroundColor: '#000000',
    position: 'relative',
    overflow: 'hidden'
  },
  permissionCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  permissionText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 8
  },
  permissionBtn: {
    backgroundColor: '#059669',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 10
  },
  permissionBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600'
  },
  camOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center'
  },
  reticle: {
    width: 220,
    height: 140,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    position: 'relative',
    overflow: 'hidden'
  },
  reticleLocked: {
    borderColor: 'rgba(234, 179, 8, 0.9)'
  },
  corner: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderColor: '#10b981'
  },
  tl: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 10 },
  tr: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 10 },
  bl: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 10 },
  br: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 10 },
  scanLaser: {
    height: 2,
    backgroundColor: '#10b981',
    shadowColor: '#10b981',
    shadowRadius: 6,
    shadowOpacity: 1
  },
  camLoading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  camLoadingText: {
    color: '#ffffff',
    fontSize: 11,
    marginTop: 4
  },
  camHeader: {
    position: 'absolute',
    top: 10,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  camBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 6
  },
  camBadgeText: {
    color: '#e2e8f0',
    fontSize: 11,
    fontWeight: '500'
  },
  torchBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  torchBtnActive: {
    backgroundColor: '#059669'
  },
  cartSection: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 12
  },
  cartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  cartTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  cartTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a'
  },
  clearCartText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ef4444'
  },
  emptyCartBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24
  },
  emptyCartText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#64748b',
    marginTop: 8
  },
  emptyCartSub: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 4
  },
  cartList: {
    flex: 1
  },
  cartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc'
  },
  cartItemLeft: {
    flex: 1.2,
    paddingRight: 6
  },
  cartItemName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1e293b'
  },
  cartItemPrice: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 2
  },
  stepBtn: {
    width: 24,
    height: 24,
    backgroundColor: '#ffffff',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center'
  },
  stepValue: {
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 6,
    color: '#0f172a'
  },
  cartItemRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6
  },
  cartItemTotal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a'
  },
  trashBtn: {
    padding: 4
  },
  checkoutBar: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingVertical: 10
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  totalLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500'
  },
  totalSum: {
    fontSize: 18,
    fontWeight: '800',
    color: '#059669'
  },
  submittingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 8
  },
  submittingText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600'
  },
  payButtonsRow: {
    flexDirection: 'row',
    gap: 8
  },
  payBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6
  },
  cashBtn: {
    backgroundColor: '#059669'
  },
  cardBtn: {
    backgroundColor: '#2563eb'
  },
  debtBtn: {
    backgroundColor: '#d97706'
  },
  mixedBtn: {
    backgroundColor: '#7c3aed'
  },
  payBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700'
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end'
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: '85%'
  },
  modalHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a'
  },
  modalSubtitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#d97706',
    marginTop: 2
  },
  customerActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginVertical: 8
  },
  switchModeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  switchModeText: {
    fontSize: 12,
    color: '#d97706',
    fontWeight: '600'
  },
  newCustBox: {
    gap: 6,
    marginBottom: 12
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569'
  },
  fieldInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 12,
    color: '#0f172a'
  },
  addCustSubmit: {
    backgroundColor: '#d97706',
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4
  },
  addCustSubmitText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700'
  },
  custListContainer: {
    marginBottom: 10
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    paddingHorizontal: 8,
    gap: 6,
    marginBottom: 8
  },
  searchInput: {
    flex: 1,
    paddingVertical: 6,
    fontSize: 12,
    color: '#0f172a'
  },
  custList: {
    maxHeight: 180
  },
  custItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    marginBottom: 5,
    borderWidth: 1,
    borderColor: '#f1f5f9'
  },
  custItemSelected: {
    borderColor: '#059669',
    backgroundColor: 'rgba(5, 150, 105, 0.08)'
  },
  custName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1e293b'
  },
  custPhone: {
    fontSize: 10,
    color: '#64748b'
  },
  custRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  badgeDebt: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ef4444',
    backgroundColor: '#fef2f2',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4
  },
  confirmDebtBtn: {
    backgroundColor: '#d97706',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4
  },
  confirmDebtBtnDisabled: {
    opacity: 0.5
  },
  confirmDebtBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700'
  }
});
