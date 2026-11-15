import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { buildVietQRImageUrl } from '../../../services/vietqr';

interface VietQRPaymentBoxProps {
  bankBin: string;
  bankAccount: string;
  amount: number;
  paymentCode: string;
}

export function VietQRPaymentBox({ bankBin, bankAccount, amount, paymentCode }: VietQRPaymentBoxProps) {
  const qrUrl = buildVietQRImageUrl({
    bankBin,
    accountNumber: bankAccount,
    amount,
    addInfo: paymentCode,
  });

  const handleCopyCode = async () => {
    await Clipboard.setStringAsync(paymentCode);
    Alert.alert('Đã sao chép', `Đã copy mã nội dung chuyển khoản: ${paymentCode}`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quét mã QR bằng App Ngân hàng bất kỳ</Text>
      <Image source={{ uri: qrUrl }} style={styles.qrImage} />

      <TouchableOpacity style={styles.codeBox} onPress={handleCopyCode}>
        <Text style={styles.codeLabel}>Nội dung CK: </Text>
        <Text style={styles.codeValue}>{paymentCode}</Text>
        <Ionicons name="copy-outline" size={16} color="#EF4444" style={{ marginLeft: 6 }} />
      </TouchableOpacity>

      <Text style={styles.note}>
        Hệ thống tự động gạch nợ và trích 1% phí nền tảng ngay sau khi nhận được giao dịch.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
  },
  title: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 12 },
  qrImage: { width: 220, height: 220, resizeMode: 'contain', marginBottom: 12 },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  codeLabel: { fontSize: 12, color: '#7F1D1D' },
  codeValue: { fontSize: 13, fontWeight: 'bold', color: '#DC2626', fontFamily: 'monospace' },
  note: { fontSize: 11, color: '#6B7280', textAlign: 'center', lineHeight: 16 },
});