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
import { CameraView, BarcodeScanningResult } from 'expo-camera';
import {
  Package,
  Search,
  Plus,
  Barcode,
  AlertTriangle,
  Camera,
  X,
  Tag,
  Trash2,
  Edit3
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Product } from '../types';
import { apiService } from '../services/api';

export function InventoryScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filterLowStockOnly, setFilterLowStockOnly] = useState(false);

  // Yangi tovar qo'shish yoki tahrirlash modali
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  // Forma qiymatlari
  const [barcode, setBarcode] = useState('');
  const [name, setName] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [unit, setUnit] = useState('dona');
  const [minStockAlert, setMinStockAlert] = useState('5');
  const [savingProduct, setSavingProduct] = useState(false);

  const fetchProducts = useCallback(async () => {
    try {
      const data = await apiService.getProducts();
      setProducts(data);
    } catch {}
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchProducts().finally(() => setLoading(false));
  }, [fetchProducts]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProducts();
    setRefreshing(false);
  };

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setBarcode('');
    setName('');
    setCostPrice('');
    setSellingPrice('');
    setStockQuantity('');
    setUnit('dona');
    setMinStockAlert('5');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setBarcode(p.barcode);
    setName(p.name);
    setCostPrice(p.costPrice.toString());
    setSellingPrice(p.sellingPrice.toString());
    setStockQuantity(p.stockQuantity.toString());
    setUnit(p.unit || 'dona');
    setMinStockAlert((p.minStockAlert || 5).toString());
    setIsAddModalOpen(true);
  };

  // Yangi tovar qo'shishda shtrix-kod skaneri
  const handleBarcodeScanned = async (res: BarcodeScanningResult) => {
    if (!res.data) return;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setBarcode(res.data);
    setIsCameraActive(false);
  };

  // Tovarni saqlash yoki yangilash
  const handleSaveProduct = async () => {
    if (!barcode.trim() || !name.trim()) {
      Alert.alert('Xatolik', 'Shtrix-kod va tovar nomini to\'ldiring');
      return;
    }

    const costNum = parseFloat(costPrice) || 0;
    const sellNum = parseFloat(sellingPrice) || 0;
    const stockNum = parseFloat(stockQuantity) || 0;
    const minAlertNum = parseFloat(minStockAlert) || 5;

    if (sellNum <= 0) {
      Alert.alert('Xatolik', 'Sotish narxini to\'g\'ri kiriting');
      return;
    }

    setSavingProduct(true);
    try {
      const payload = {
        barcode: barcode.trim(),
        name: name.trim(),
        costPrice: costNum,
        sellingPrice: sellNum,
        stockQuantity: stockNum,
        unit,
        minStockAlert: minAlertNum
      };

      if (editingProduct) {
        await apiService.updateProduct(editingProduct.id, payload);
        Alert.alert('Muvaffaqiyatli', 'Tovar ma\'lumotlari yangilandi!');
      } else {
        await apiService.createProduct(payload);
        Alert.alert('Muvaffaqiyatli', 'Yangi tovar omborga qo\'shildi!');
      }

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsAddModalOpen(false);
      setEditingProduct(null);

      // Formani tozalash
      setBarcode('');
      setName('');
      setCostPrice('');
      setSellingPrice('');
      setStockQuantity('');

      await fetchProducts();
    } catch {
      Alert.alert('Xatolik', 'Tovarni saqlashda xatolik yuz berdi');
    } finally {
      setSavingProduct(false);
    }
  };

  const handleDeleteProduct = () => {
    if (!editingProduct) return;
    Alert.alert(
      'O\'chirishni tasdiqlang',
      `"${editingProduct.name}" tovarini o'chirishni xohlaysizmi?`,
      [
        { text: 'Bekor qilish', style: 'cancel' },
        {
          text: 'O\'chirish',
          style: 'destructive',
          onPress: async () => {
            await apiService.deleteProduct(editingProduct.id);
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setIsAddModalOpen(false);
            setEditingProduct(null);
            await fetchProducts();
          }
        }
      ]
    );
  };

  const filtered = products.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode.includes(search);
    const matchesLow = filterLowStockOnly ? (p.isLowStock || p.stockQuantity <= p.minStockAlert) : true;
    return matchesSearch && matchesLow;
  });

  const lowStockCount = products.filter(p => p.isLowStock || p.stockQuantity <= p.minStockAlert).length;

  return (
    <View style={styles.container}>
      {/* 1. Yuqori qidiruv va filter paneli */}
      <View style={styles.headerBar}>
        <View style={styles.searchBox}>
          <Search size={15} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Nomi yoki shtrix-kodi..."
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <TouchableOpacity
          style={styles.addBtn}
          onPress={handleOpenCreate}
        >
          <Plus size={16} color="#ffffff" />
          <Text style={styles.addBtnText}>Tovar</Text>
        </TouchableOpacity>
      </View>

      {/* 2. Kam qolganlar tezkor filtri */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.chip, !filterLowStockOnly && styles.chipActive]}
          onPress={() => setFilterLowStockOnly(false)}
        >
          <Text style={[styles.chipText, !filterLowStockOnly && styles.chipTextActive]}>
            Barchasi ({products.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.chip, filterLowStockOnly && styles.chipActiveRed]}
          onPress={() => setFilterLowStockOnly(!filterLowStockOnly)}
        >
          <AlertTriangle size={12} color={filterLowStockOnly ? '#ffffff' : '#ef4444'} />
          <Text style={[styles.chipText, filterLowStockOnly && styles.chipTextActiveRed]}>
            Kam qolganlar ({lowStockCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* 3. Tovarlar ro'yxati */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#059669" />
          <Text style={styles.loadingText}>Tovarlar yuklanmoqda...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id.toString()}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#059669']} />
          }
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const isLow = item.isLowStock || item.stockQuantity <= item.minStockAlert;

            return (
              <TouchableOpacity
                style={[styles.productCard, isLow && styles.productCardLow]}
                onPress={() => handleOpenEdit(item)}
                activeOpacity={0.7}
              >
                <View style={styles.prodTop}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={styles.prodName}>{item.name}</Text>
                      <Edit3 size={12} color="#64748b" style={{ marginLeft: 6 }} />
                    </View>
                    <View style={styles.barcodeRow}>
                      <Barcode size={12} color="#94a3b8" />
                      <Text style={styles.prodBarcode}>{item.barcode}</Text>
                    </View>
                  </View>

                  <View style={styles.prodPriceBox}>
                    <Text style={styles.prodSellingPrice}>
                      {item.sellingPrice.toLocaleString()} so&apos;m
                    </Text>
                    <Text style={styles.prodCostPrice}>
                      Tannarx: {item.costPrice.toLocaleString()} so&apos;m
                    </Text>
                  </View>
                </View>

                <View style={styles.prodBottom}>
                  <View style={styles.stockInfo}>
                    <Text style={styles.stockLabel}>Ombordagi qoldiq:</Text>
                    <Text
                      style={[
                        styles.stockQty,
                        isLow ? styles.stockQtyRed : styles.stockQtyGreen
                      ]}
                    >
                      {item.stockQuantity} {item.unit}
                    </Text>
                  </View>

                  {isLow && (
                    <View style={styles.alertBadge}>
                      <AlertTriangle size={11} color="#ef4444" />
                      <Text style={styles.alertBadgeText}>
                        Kam qoldi (&le; {item.minStockAlert})
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Package size={36} color="#475569" />
              <Text style={styles.emptyTitle}>Tovarlar topilmadi</Text>
            </View>
          }
        />
      )}

      {/* 4. KAMERA BILAN YANGI TOVAR QO'SHISH YOKI TAHRIRLASH MODALI */}
      <Modal visible={isAddModalOpen} animationType="slide" transparent={true}>
        <View style={styles.modalBg}>
          <View style={styles.modalBody}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingProduct ? 'Tovarni Tahrirlash' : 'Yangi Tovar Kiritish'}
              </Text>
              <TouchableOpacity onPress={() => setIsAddModalOpen(false)}>
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Kamera bilan shtrix-kod skanerlash qismi */}
              <Text style={styles.fieldLabel}>Shtrix-kod (Skaner yoki Qo&apos;lda):</Text>
              <View style={styles.barcodeInputRow}>
                <TextInput
                  style={[styles.fieldInput, { flex: 1, marginBottom: 0 }]}
                  placeholder="Shtrix-kod"
                  value={barcode}
                  onChangeText={setBarcode}
                />
                <TouchableOpacity
                  style={styles.scanCodeBtn}
                  onPress={() => setIsCameraActive(!isCameraActive)}
                >
                  <Camera size={16} color="#ffffff" />
                  <Text style={styles.scanCodeBtnText}>
                    {isCameraActive ? 'Yopish' : 'Skaner'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Mini Kamera ramkasi */}
              {isCameraActive && (
                <View style={styles.miniCamBox}>
                  <CameraView
                    style={StyleSheet.absoluteFillObject}
                    barcodeScannerSettings={{
                      barcodeTypes: ['qr', 'ean13', 'ean8', 'code128', 'code39', 'upc_a']
                    }}
                    onBarcodeScanned={handleBarcodeScanned}
                  />
                  <View style={styles.miniCamHint}>
                    <Text style={styles.miniCamHintText}>
                      Shtrix-kodni kameraga to&apos;g&apos;rilang
                    </Text>
                  </View>
                </View>
              )}

              {/* Tovar Nomi */}
              <Text style={styles.fieldLabel}>Tovar Nomi:</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="Masalan: Pepsi 1.5L"
                value={name}
                onChangeText={setName}
              />

              {/* Narxlar */}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Tannarx (so&apos;m):</Text>
                  <TextInput
                    style={styles.fieldInput}
                    keyboardType="numeric"
                    placeholder="10000"
                    value={costPrice}
                    onChangeText={setCostPrice}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Sotish Narxi (so&apos;m):</Text>
                  <TextInput
                    style={styles.fieldInput}
                    keyboardType="numeric"
                    placeholder="14000"
                    value={sellingPrice}
                    onChangeText={setSellingPrice}
                  />
                </View>
              </View>

              {/* Qoldiq va Birlik */}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Qoldiq Soni:</Text>
                  <TextInput
                    style={styles.fieldInput}
                    keyboardType="numeric"
                    placeholder="50"
                    value={stockQuantity}
                    onChangeText={setStockQuantity}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>O&apos;lchov Birligi:</Text>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="dona / kg"
                    value={unit}
                    onChangeText={setUnit}
                  />
                </View>
              </View>

              <Text style={styles.fieldLabel}>Ogohlantirish chegarasi (kam qolganda):</Text>
              <TextInput
                style={styles.fieldInput}
                keyboardType="numeric"
                placeholder="5"
                value={minStockAlert}
                onChangeText={setMinStockAlert}
              />

              {/* Saqlash yoki Yangilash tugmasi */}
              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleSaveProduct}
                disabled={savingProduct}
              >
                {savingProduct ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.submitBtnText}>
                    {editingProduct ? 'O‘zgarishlarni Saqlash' : 'Omborga Saqlash'}
                  </Text>
                )}
              </TouchableOpacity>

              {/* Tahrirlash rejimida o'chirish tugmasi */}
              {editingProduct && (
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={handleDeleteProduct}
                >
                  <Trash2 size={16} color="#ef4444" />
                  <Text style={styles.deleteBtnText}>Tovarni O‘chirish</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
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
  headerBar: {
    flexDirection: 'row',
    padding: 14,
    gap: 10,
    backgroundColor: '#0f172a'
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 10,
    gap: 8
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    fontSize: 12,
    color: '#ffffff'
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 4
  },
  addBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700'
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    marginBottom: 10,
    gap: 8
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 5
  },
  chipActive: {
    backgroundColor: '#059669'
  },
  chipActiveRed: {
    backgroundColor: '#ef4444'
  },
  chipText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600'
  },
  chipTextActive: {
    color: '#ffffff'
  },
  chipTextActiveRed: {
    color: '#ffffff'
  },
  listContent: {
    paddingHorizontal: 14,
    paddingBottom: 20,
    gap: 10
  },
  productCard: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)'
  },
  productCardLow: {
    borderColor: 'rgba(239, 68, 68, 0.4)',
    backgroundColor: '#201626'
  },
  prodTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  prodName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff'
  },
  barcodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3
  },
  prodBarcode: {
    fontSize: 10,
    color: '#94a3b8',
    fontFamily: 'monospace'
  },
  prodPriceBox: {
    alignItems: 'flex-end'
  },
  prodSellingPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: '#10b981'
  },
  prodCostPrice: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2
  },
  prodBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)'
  },
  stockInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  stockLabel: {
    fontSize: 11,
    color: '#94a3b8'
  },
  stockQty: {
    fontSize: 12,
    fontWeight: '800'
  },
  stockQtyGreen: {
    color: '#ffffff'
  },
  stockQtyRed: {
    color: '#ef4444'
  },
  alertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4
  },
  alertBadgeText: {
    color: '#ef4444',
    fontSize: 10,
    fontWeight: '700'
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 8
  },
  emptyBox: {
    padding: 40,
    alignItems: 'center'
  },
  emptyTitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 8
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end'
  },
  modalBody: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: '90%'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a'
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
    marginTop: 8,
    marginBottom: 4
  },
  fieldInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 12,
    color: '#0f172a',
    marginBottom: 4
  },
  barcodeInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4
  },
  scanCodeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4
  },
  scanCodeBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600'
  },
  miniCamBox: {
    height: 120,
    borderRadius: 10,
    overflow: 'hidden',
    marginVertical: 6,
    backgroundColor: '#000000',
    justifyContent: 'flex-end'
  },
  miniCamHint: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 4,
    alignItems: 'center'
  },
  miniCamHintText: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: '600'
  },
  submitBtn: {
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 20
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700'
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ef4444',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    marginBottom: 24
  },
  deleteBtnText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '700'
  }
});
