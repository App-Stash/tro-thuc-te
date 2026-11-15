import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface UnlockedLandlordCardProps {
  roomTitle: string;
  exactAddress: string;
  landlordName: string;
  landlordPhone: string;
}

export function UnlockedLandlordCard({
  roomTitle,
  exactAddress,
  landlordName,
  landlordPhone,
}: UnlockedLandlordCardProps) {
  const handleCallLandlord = () => {
    if (landlordPhone) {
      Linking.openURL(`tel:${landlordPhone}`);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="lock-open" size={18} color="#059669" />
        <Text style={styles.headerText}>🔓 Thông Tin Đã Mở Khóa (Hợp đồng hiệu lực)</Text>
      </View>

      <Text style={styles.title}>{roomTitle}</Text>

      <View style={styles.row}>
        <Ionicons name="location-outline" size={16} color="#065F46" />
        <Text style={styles.detailText}>
          <Text style={styles.bold}>Địa chỉ chính xác:</Text> {exactAddress}
        </Text>
      </View>

      <View style={styles.row}>
        <Ionicons name="person-outline" size={16} color="#065F46" />
        <Text style={styles.detailText}>
          <Text style={styles.bold}>Chủ nhà:</Text> {landlordName}
        </Text>
      </View>

      <TouchableOpacity style={styles.callBtn} onPress={handleCallLandlord}>
        <Ionicons name="call" size={16} color="#FFF" />
        <Text style={styles.callBtnText}>Gọi ngay: {landlordPhone}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  headerText: { color: '#065F46', fontWeight: 'bold', fontSize: 13 },
  title: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 8 },
  detailText: { flex: 1, fontSize: 13, color: '#374151', lineHeight: 19 },
  bold: { fontWeight: 'bold', color: '#111827' },
  callBtn: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
    marginTop: 8,
  },
  callBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
});