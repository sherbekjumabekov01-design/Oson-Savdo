import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Share,
  Alert
} from 'react-native';
import * as Print from 'expo-print';
import {
  Printer,
  X,
  Share2,
  Copy,
  CheckCircle,
  FileText
} from 'lucide-react-native';
import { Sale } from '../types';

interface Props {
  visible: boolean;
  sale: Sale | null;
  onClose: () => void;
  storeName?: string;
  storePhone?: string;
  storeAddress?: string;
}

export function ReceiptModal({
  visible,
  sale,
  onClose,
  storeName = 'OSON SAVDO',
  storePhone = '+998 71 200-00-00',
  storeAddress = 'Toshkent sh., Savdo markazi'
}: Props) {
  const [paperWidth, setPaperWidth] = useState<'58mm' | '80mm'>('58mm');
  const [copied, setCopied] = useState(false);

  if (!visible || !sale) return null;

  const formattedDate = new Date(sale.createdAt).toLocaleString('uz-UZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Printer uchun termal HTML shablon
  const generateReceiptHtml = () => {
    const is58 = paperWidth === '58mm';
    const widthPx = is58 ? '280px' : '360px';

    const itemsHtml = sale.items
      .map(
        i => `
        <div style="margin-bottom: 4px;">
          <div style="font-weight: bold; font-size: 11px;">${i.productName}</div>
          <div style="display: flex; justify-content: space-between; font-size: 10px; color: #333;">
            <span>${i.quantity} x ${i.unitSellingPrice.toLocaleString()}</span>
            <span style="font-weight: bold;">${i.subtotal.toLocaleString()} so'm</span>
          </div>
        </div>
      `
      )
      .join('');

    const debtSignatureBlock =
      sale.debtAmount > 0
        ? `
        <div style="border-top: 1px dashed #000; padding-top: 6px; margin-top: 6px; font-size: 10px; text-align: center;">
          <p style="font-style: italic; margin-bottom: 8px;">
            Men ${sale.customerName || 'xaridor'} yuqoridagi ${sale.debtAmount.toLocaleString()} so'm qarzni tan olaman.
          </p>
          <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 10px;">
            <span>Xaridor imzosi:</span>
            <span style="border-bottom: 1px solid #000; width: 120px; display: inline-block;"></span>
          </div>
        </div>
      `
        : '';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <style>
          @page { margin: 0; size: auto; }
          body {
            font-family: 'Courier New', monospace;
            margin: 0;
            padding: 8px;
            color: #000;
            background: #fff;
            width: ${widthPx};
            box-sizing: border-box;
          }
          .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 6px; margin-bottom: 6px; }
          .header h1 { margin: 0; font-size: 14px; text-transform: uppercase; font-weight: 900; }
          .header p { margin: 2px 0; font-size: 9px; color: #444; }
          .meta { font-size: 10px; border-bottom: 1px dashed #000; padding-bottom: 6px; margin-bottom: 6px; }
          .row { display: flex; justify-content: space-between; margin: 2px 0; }
          .items { border-bottom: 1px dashed #000; padding-bottom: 6px; margin-bottom: 6px; }
          .totals { font-size: 11px; margin-bottom: 6px; }
          .total-big { font-size: 13px; font-weight: 900; display: flex; justify-content: space-between; margin-top: 4px; }
          .footer { text-align: center; font-size: 9px; margin-top: 8px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${storeName}</h1>
          <p>${storeAddress}</p>
          <p>Tel: ${storePhone}</p>
        </div>

        <div class="meta">
          <div class="row"><span>Chek #:</span><b>#${sale.id}</b></div>
          <div class="row"><span>Sana:</span><span>${formattedDate}</span></div>
          <div class="row"><span>To'lov turi:</span><b>${sale.paymentType === 'Cash' ? 'NAQD PUL' : sale.paymentType === 'Card' ? 'PLASTIK KARTA' : sale.paymentType === 'Mixed' ? 'ARALASH TO\'LOV' : 'NASIYA'}</b></div>
          ${sale.customerName ? `<div class="row"><span>Mijoz:</span><b>${sale.customerName}</b></div>` : ''}
        </div>

        <div class="items">
          ${itemsHtml}
        </div>

        <div class="totals">
          <div class="total-big">
            <span>JAMI:</span>
            <span>${sale.totalAmount.toLocaleString()} so'm</span>
          </div>
          ${sale.paidAmount > 0 ? `<div class="row" style="font-size: 10px;"><span>To'landi:</span><span>${sale.paidAmount.toLocaleString()} so'm</span></div>` : ''}
          ${sale.debtAmount > 0 ? `<div class="row" style="font-size: 11px; font-weight: bold; color: #dc2626;"><span>Qarzga:</span><span>${sale.debtAmount.toLocaleString()} so'm</span></div>` : ''}
        </div>

        ${debtSignatureBlock}

        <div class="footer">
          <p style="font-weight: bold; margin: 0;">XARIDINGIZ UCHUN RAHMAT!</p>
          <p style="margin: 2px 0; color: #666;">Oson Savdo POS orqali chop etildi</p>
        </div>
      </body>
      </html>
    `;
  };

  // Chop etish (Bluetooth / WiFi / Tizim printeri orqali)
  const handlePrint = async () => {
    try {
      const html = generateReceiptHtml();
      await Print.printAsync({ html });
    } catch {
      Alert.alert('Xatolik', 'Printerni ochishda xatolik yuz berdi');
    }
  };

  // Matnli chekni Telegram / WhatsApp / SMS orqali ulashish
  const handleShare = async () => {
    const lines = [
      `=== ${storeName.toUpperCase()} ===`,
      `Chek #${sale.id}`,
      `Sana: ${formattedDate}`,
      '--------------------------------',
      ...sale.items.map(
        i => `${i.productName}\n  ${i.quantity} x ${i.unitSellingPrice.toLocaleString()} = ${i.subtotal.toLocaleString()} so'm`
      ),
      '--------------------------------',
      `JAMI TO'LOV: ${sale.totalAmount.toLocaleString()} so'm`,
      `To'lov usuli: ${sale.paymentType === 'Cash' ? 'Naqd pul' : sale.paymentType === 'Card' ? 'Plastik karta' : sale.paymentType === 'Mixed' ? 'Aralash to\'lov' : 'Nasiya (Qarz)'}`,
      sale.customerName ? `Mijoz: ${sale.customerName}` : '',
      sale.debtAmount > 0 ? `Nasiya qarz summasi: ${sale.debtAmount.toLocaleString()} so'm` : '',
      '--------------------------------',
      'Xaridingiz uchun rahmat!'
    ]
      .filter(Boolean)
      .join('\n');

    try {
      await Share.share({
        message: lines,
        title: `Chek #${sale.id}`
      });
    } catch {
      // ignore
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderTitleBox}>
              <View style={styles.headerIconBg}>
                <Printer size={18} color="#059669" />
              </View>
              <View>
                <Text style={styles.modalTitle}>Chekni Chop Etish</Text>
                <Text style={styles.modalSubtitle}>Savdo muvaffaqiyatli yakunlandi</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* Width Selector */}
          <View style={styles.paperWidthRow}>
            <TouchableOpacity
              style={[styles.widthBtn, paperWidth === '58mm' && styles.widthBtnActive]}
              onPress={() => setPaperWidth('58mm')}
            >
              <Text
                style={[
                  styles.widthBtnText,
                  paperWidth === '58mm' && styles.widthBtnTextActive
                ]}
              >
                58 mm (Standart)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.widthBtn, paperWidth === '80mm' && styles.widthBtnActive]}
              onPress={() => setPaperWidth('80mm')}
            >
              <Text
                style={[
                  styles.widthBtnText,
                  paperWidth === '80mm' && styles.widthBtnTextActive
                ]}
              >
                80 mm (Katta)
              </Text>
            </TouchableOpacity>
          </View>

          {/* Thermal Receipt Paper View */}
          <ScrollView style={styles.receiptScroll} contentContainerStyle={styles.receiptScrollContent}>
            <View
              style={[
                styles.receiptPaper,
                { width: paperWidth === '58mm' ? 260 : 320 }
              ]}
            >
              {/* Do'kon nomi */}
              <View style={styles.paperHeader}>
                <Text style={styles.storeTitle}>{storeName}</Text>
                <Text style={styles.storeSub}>{storeAddress}</Text>
                <Text style={styles.storeSub}>Tel: {storePhone}</Text>
              </View>

              {/* Chek ma'lumotlari */}
              <View style={styles.paperMeta}>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Chek raqami:</Text>
                  <Text style={styles.metaValBold}>#{sale.id}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Sana va vaqt:</Text>
                  <Text style={styles.metaVal}>{formattedDate}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>To&apos;lov turi:</Text>
                  <Text style={styles.metaValBold}>
                    {sale.paymentType === 'Cash'
                      ? 'NAQD'
                      : sale.paymentType === 'Card'
                      ? 'KARTA'
                      : sale.paymentType === 'Mixed'
                      ? 'ARALASH'
                      : 'NASIYA'}
                  </Text>
                </View>
                {sale.customerName && (
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Mijoz:</Text>
                    <Text style={styles.metaValBold}>{sale.customerName}</Text>
                  </View>
                )}
              </View>

              {/* Tovarlar ro'yxati */}
              <View style={styles.itemsBlock}>
                <View style={styles.itemsHeaderRow}>
                  <Text style={styles.colName}>Tovar</Text>
                  <Text style={styles.colSum}>Summa</Text>
                </View>
                {sale.items.map((item, idx) => (
                  <View key={idx} style={styles.itemRow}>
                    <Text style={styles.itemName} numberOfLines={2}>
                      {item.productName}
                    </Text>
                    <View style={styles.itemSubRow}>
                      <Text style={styles.itemQtyPrice}>
                        {item.quantity} x {item.unitSellingPrice.toLocaleString()}
                      </Text>
                      <Text style={styles.itemTotal}>
                        {item.subtotal.toLocaleString()} so&apos;m
                      </Text>
                    </View>
                  </View>
                ))}
              </View>

              {/* Jami hisob */}
              <View style={styles.totalsBlock}>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>JAMI TO&apos;LOV:</Text>
                  <Text style={styles.totalValue}>
                    {sale.totalAmount.toLocaleString()} so&apos;m
                  </Text>
                </View>

                {sale.paidAmount > 0 && (
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>To&apos;landi:</Text>
                    <Text style={styles.metaVal}>
                      {sale.paidAmount.toLocaleString()} so&apos;m
                    </Text>
                  </View>
                )}

                {sale.debtAmount > 0 && (
                  <View style={styles.metaRow}>
                    <Text style={styles.debtLabel}>Nasiyaga yozildi:</Text>
                    <Text style={styles.debtValue}>
                      {sale.debtAmount.toLocaleString()} so&apos;m
                    </Text>
                  </View>
                )}
              </View>

              {/* Qarz imzosi */}
              {sale.debtAmount > 0 && (
                <View style={styles.debtSignatureBlock}>
                  <Text style={styles.debtNote}>
                    Men {sale.customerName || 'xaridor'} yuqoridagi {sale.debtAmount.toLocaleString()} so&apos;m qarzni tan olaman.
                  </Text>
                  <View style={styles.signatureRow}>
                    <Text style={styles.signatureLabel}>Xaridor imzosi:</Text>
                    <View style={styles.signatureLine} />
                  </View>
                </View>
              )}

              {/* Rahmat va footer */}
              <View style={styles.paperFooter}>
                <Text style={styles.thanksText}>XARIDINGIZ UCHUN RAHMAT!</Text>
                <Text style={styles.poweredText}>Oson Savdo POS orqali chop etildi</Text>
              </View>
            </View>
          </ScrollView>

          {/* Actions Bottom Bar */}
          <View style={styles.actionsBar}>
            <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
              <Share2 size={16} color="#334155" />
              <Text style={styles.shareBtnText}>Ulashish</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.printBtn} onPress={handlePrint}>
              <Printer size={16} color="#ffffff" />
              <Text style={styles.printBtnText}>Chop Etish</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.doneBtn} onPress={onClose}>
              <Text style={styles.doneBtnText}>Yopish</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16
  },
  card: {
    backgroundColor: '#ffffff',
    width: '100%',
    maxWidth: 420,
    maxHeight: '90%',
    borderRadius: 24,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: '#f1f5f9'
  },
  modalHeaderTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  headerIconBg: {
    backgroundColor: '#ecfdf5',
    padding: 8,
    borderRadius: 12
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a'
  },
  modalSubtitle: {
    fontSize: 11,
    color: '#64748b'
  },
  closeBtn: {
    padding: 6
  },
  paperWidthRow: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 3,
    marginVertical: 10
  },
  widthBtn: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 9
  },
  widthBtnActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2
  },
  widthBtnText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600'
  },
  widthBtnTextActive: {
    color: '#0f172a',
    fontWeight: '800'
  },
  receiptScroll: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginVertical: 4
  },
  receiptScrollContent: {
    alignItems: 'center',
    paddingVertical: 12
  },
  receiptPaper: {
    backgroundColor: '#ffffff',
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  paperHeader: {
    alignItems: 'center',
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#000000',
    paddingBottom: 8,
    marginBottom: 8
  },
  storeTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 1
  },
  storeSub: {
    fontSize: 9,
    color: '#334155',
    marginTop: 1
  },
  paperMeta: {
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#000000',
    paddingBottom: 6,
    marginBottom: 6
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 1
  },
  metaLabel: {
    fontSize: 10,
    color: '#475569'
  },
  metaVal: {
    fontSize: 10,
    color: '#0f172a'
  },
  metaValBold: {
    fontSize: 10,
    fontWeight: '800',
    color: '#000000'
  },
  itemsBlock: {
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#000000',
    paddingBottom: 8,
    marginBottom: 8
  },
  itemsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderColor: '#cbd5e1',
    paddingBottom: 3,
    marginBottom: 4
  },
  colName: {
    fontSize: 10,
    fontWeight: '700',
    color: '#000000'
  },
  colSum: {
    fontSize: 10,
    fontWeight: '700',
    color: '#000000'
  },
  itemRow: {
    marginVertical: 3
  },
  itemName: {
    fontSize: 10,
    fontWeight: '700',
    color: '#000000'
  },
  itemSubRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 1
  },
  itemQtyPrice: {
    fontSize: 9,
    color: '#475569'
  },
  itemTotal: {
    fontSize: 9,
    fontWeight: '700',
    color: '#000000'
  },
  totalsBlock: {
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#000000',
    paddingBottom: 6,
    marginBottom: 6
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 3
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: '#000000'
  },
  totalValue: {
    fontSize: 13,
    fontWeight: '900',
    color: '#000000'
  },
  debtLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#dc2626'
  },
  debtValue: {
    fontSize: 11,
    fontWeight: '900',
    color: '#dc2626'
  },
  debtSignatureBlock: {
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#000000',
    paddingVertical: 6,
    marginBottom: 6
  },
  debtNote: {
    fontSize: 9,
    fontStyle: 'italic',
    color: '#334155',
    textAlign: 'center',
    marginBottom: 6
  },
  signatureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 4
  },
  signatureLabel: {
    fontSize: 9,
    color: '#000000'
  },
  signatureLine: {
    width: 100,
    borderBottomWidth: 1,
    borderColor: '#000000'
  },
  paperFooter: {
    alignItems: 'center',
    paddingTop: 6
  },
  thanksText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.5
  },
  poweredText: {
    fontSize: 8,
    color: '#64748b',
    marginTop: 2
  },
  actionsBar: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: '#f1f5f9'
  },
  shareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: '#f1f5f9',
    borderRadius: 14
  },
  shareBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155'
  },
  printBtn: {
    flex: 1.3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: '#059669',
    borderRadius: 14
  },
  printBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff'
  },
  doneBtn: {
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 14,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  doneBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b'
  }
});
