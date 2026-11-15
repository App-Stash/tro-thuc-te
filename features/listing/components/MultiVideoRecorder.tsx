import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';

// Định nghĩa 4 khu vực bắt buộc theo mô hình mới
export type VideoSectionKey = 'bedroom' | 'kitchen' | 'bathroom' | 'living_area';

export interface SectionMeta {
  key: VideoSectionKey;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}

export const REQUIRED_SECTIONS: SectionMeta[] = [
  { key: 'bedroom', title: '1. Phòng Ngủ', description: 'Quay toàn cảnh không gian giường ngủ, cửa sổ, ánh sáng.', icon: 'bed-outline' },
  { key: 'kitchen', title: '2. Khu Bếp', description: 'Quay khu vực nấu nướng, chậu rửa, kệ tủ bếp.', icon: 'restaurant-outline' },
  { key: 'bathroom', title: '3. Khu Vệ Sinh', description: 'Quay bồn rửa, vòi hoa sen, toilet, độ sạch sẽ.', icon: 'water-outline' },
  { key: 'living_area', title: '4. Sinh Hoạt Khác', description: 'Lối đi chung, ban công, chỗ để xe hoặc phòng khách.', icon: 'home-outline' },
];

export interface RecordedVideoItem {
  sectionKey: VideoSectionKey;
  uri: string;
  latitude: number;
  longitude: number;
  recordedAt: string;
  durationSeconds: number;
}

interface MultiVideoRecorderProps {
  onCompleteAll: (videos: RecordedVideoItem[]) => void;
  onCancel: () => void;
}

export default function MultiVideoRecorder({ onCompleteAll, onCancel }: MultiVideoRecorderProps) {
  // Quyền phần cứng
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  const [locationGranted, setLocationGranted] = useState<boolean | null>(null);

  // Quản lý trạng thái quay theo từng bước khu vực
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const currentSection = REQUIRED_SECTIONS[activeStepIndex];

  const cameraRef = useRef<CameraView>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);

  // Dữ liệu GPS & thời gian thực
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('');

  // Lưu trữ danh sách video đã quay xong của các mục
  const [recordedVideos, setRecordedVideos] = useState<Record<VideoSectionKey, RecordedVideoItem | null>>({
    bedroom: null,
    kitchen: null,
    bathroom: null,
    living_area: null,
  });

  // Trạng thái xem trước video của khu vực vừa quay
  const [previewUri, setPreviewUri] = useState<string | null>(null);

  const MAX_DURATION = 30; // Tối đa 30 giây mỗi video để dung lượng tối ưu

  // 1. Xin quyền Camera, Micro và GPS ngay khi khởi chạy
  useEffect(() => {
    (async () => {
      if (!cameraPermission?.granted) await requestCameraPermission();
      if (!micPermission?.granted) await requestMicPermission();

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationGranted(false);
        Alert.alert('Yêu cầu định vị GPS', 'Ứng dụng cần quyền GPS để xác thực vị trí phòng thực tế.');
        return;
      }
      setLocationGranted(true);

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setCurrentLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    })();
  }, []);

  // 2. Đồng hồ thời gian thực & đếm giây quay
  useEffect(() => {
    const clockInterval = setInterval(() => {
      setCurrentTimeStr(new Date().toLocaleString('vi-VN'));
    }, 1000);

    let timer: NodeJS.Timeout | null = null;
    if (isRecording) {
      timer = setInterval(() => {
        setSeconds((prev) => {
          if (prev + 1 >= MAX_DURATION) {
            stopRecording();
            return MAX_DURATION;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      setSeconds(0);
    }

    return () => {
      clearInterval(clockInterval);
      if (timer) clearInterval(timer);
    };
  }, [isRecording]);

  const startRecording = async () => {
    if (!cameraRef.current || isRecording) return;
    if (!currentLocation) {
      Alert.alert('Đang định vị...', 'Vui lòng chờ một nhịp để hệ thống khóa tọa độ GPS.');
      return;
    }

    try {
      setIsRecording(true);
      const timestamp = new Date().toISOString();

      const video = await cameraRef.current.recordAsync({ maxDuration: MAX_DURATION });
      setIsRecording(false);

      if (video?.uri) {
        const newItem: RecordedVideoItem = {
          sectionKey: currentSection.key,
          uri: video.uri,
          latitude: currentLocation.lat,
          longitude: currentLocation.lng,
          recordedAt: timestamp,
          durationSeconds: seconds,
        };

        // Lưu tạm vào bộ nhớ
        setRecordedVideos((prev) => ({ ...prev, [currentSection.key]: newItem }));
        setPreviewUri(video.uri);
      }
    } catch (error) {
      setIsRecording(false);
      Alert.alert('Lỗi', 'Không thể quay video lúc này. Vui lòng thử lại.');
    }
  };

  const stopRecording = () => {
    if (cameraRef.current && isRecording) {
      cameraRef.current.stopRecording();
      setIsRecording(false);
    }
  };

  const player = useVideoPlayer(previewUri ?? '', (p) => {
    p.loop = true;
    if (previewUri) p.play();
  });

  // Kiểm tra quyền
  if (!cameraPermission?.granted || !micPermission?.granted || locationGranted === false) {
    return (
      <View style={styles.centerBox}>
        <Ionicons name="shield-alert-outline" size={56} color="#EF4444" />
        <Text style={styles.errorTitle}>Cần cấp quyền phần cứng</Text>
        <Text style={styles.infoText}>Ứng dụng yêu cầu Camera, Micro và Vị trí để xác thực video chống tin ảo.</Text>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={async () => {
            await requestCameraPermission();
            await requestMicPermission();
            const { status } = await Location.requestForegroundPermissionsAsync();
            setLocationGranted(status === 'granted');
          }}
        >
          <Text style={styles.btnText}>Cấp quyền ngay</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // MÀN HÌNH XEM TRƯỚC KHI CHUYỂN SANG KHU VỰC TIẾP THEO
  if (previewUri) {
    const isLastStep = activeStepIndex === REQUIRED_SECTIONS.length - 1;

    return (
      <View style={styles.container}>
        <VideoView style={styles.previewVideo} player={player} nativeControls={false} />

        <View style={styles.watermarkBadge}>
          <Text style={styles.watermarkTitle}>✅ ĐÃ XÁC THỰC: {currentSection.title.toUpperCase()}</Text>
          <Text style={styles.watermarkText}>🕒 {currentTimeStr}</Text>
          <Text style={styles.watermarkText}>
            📍 GPS: {currentLocation?.lat.toFixed(4)}, {currentLocation?.lng.toFixed(4)}
          </Text>
        </View>

        <View style={styles.previewActions}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.retakeBtn]}
            onPress={() => {
              setPreviewUri(null);
              setRecordedVideos((prev) => ({ ...prev, [currentSection.key]: null }));
            }}
          >
            <Ionicons name="refresh" size={18} color="#FFF" />
            <Text style={styles.btnText}>Quay lại</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.confirmBtn]}
            onPress={() => {
              setPreviewUri(null);
              if (!isLastStep) {
                setActiveStepIndex((prev) => prev + 1);
              } else {
                // Đã hoàn thành đủ 4 video khu vực
                const finalArray = Object.values(recordedVideos).filter(Boolean) as RecordedVideoItem[];
                onCompleteAll(finalArray);
              }
            }}
          >
            <Text style={styles.btnText}>{isLastStep ? 'Hoàn tất toàn bộ' : 'Tiếp tục mục sau ➔'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // GIAO DIỆN CHÍNH: DANH SÁCH TIẾN ĐỘ & CAMERA QUAY TRỰC TIẾP
  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing="back" mode="video" videoQuality="720p">
        {/* Top Bar: Hiển thị tiến độ quay 4 khu vực */}
        <View style={styles.topHeader}>
          <TouchableOpacity style={styles.exitBtn} onPress={onCancel}>
            <Ionicons name="close" size={24} color="#FFF" />
          </TouchableOpacity>

          <View style={styles.stepsIndicator}>
            {REQUIRED_SECTIONS.map((sec, idx) => {
              const isDone = !!recordedVideos[sec.key];
              const isCurrent = idx === activeStepIndex;
              return (
                <View
                  key={sec.key}
                  style={[
                    styles.stepDot,
                    isDone && styles.stepDone,
                    isCurrent && styles.stepCurrent,
                  ]}
                />
              );
            })}
          </View>
        </View>

        {/* Thông tin hướng dẫn khu vực hiện tại */}
        <View style={styles.instructionBanner}>
          <View style={styles.badgeRow}>
            <Ionicons name={currentSection.icon} size={18} color="#10B981" />
            <Text style={styles.instructionTitle}>{currentSection.title}</Text>
          </View>
          <Text style={styles.instructionDesc}>{currentSection.description}</Text>
          <Text style={styles.gpsLiveText}>
            📍 GPS: {currentLocation ? `${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}` : 'Đang định vị...'}
          </Text>
        </View>

        {/* Bottom Bar: Nút bấm quay trực tiếp */}
        <View style={styles.bottomBar}>
          <Text style={styles.timerText}>
            {isRecording ? `Đang quay: 00:${seconds < 10 ? `0${seconds}` : seconds} / 00:${MAX_DURATION}` : 'Chạm để bắt đầu quay (Tối đa 30s)'}
          </Text>

          <TouchableOpacity
            style={[styles.recordOuterBtn, isRecording && styles.recordingBorder]}
            onPress={() => {
              if (isRecording) {
                stopRecording();
              } else {
                startRecording();
              }
            }}
          >
            <View style={isRecording ? styles.stopInnerSquare : styles.recordInnerCircle} />
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1, justifyContent: 'space-between' },
  previewVideo: { flex: 1 },
  centerBox: { flex: 1, backgroundColor: '#111827', justifyContent: 'center', alignItems: 'center', padding: 24 },
  errorTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginTop: 12 },
  infoText: { color: '#D1D5DB', textAlign: 'center', marginTop: 8, marginBottom: 20 },
  topHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 50, paddingHorizontal: 16 },
  exitBtn: { backgroundColor: 'rgba(0,0,0,0.5)', padding: 8, borderRadius: 20 },
  stepsIndicator: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  stepDot: { width: 28, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.3)' },
  stepDone: { backgroundColor: '#10B981' },
  stepCurrent: { backgroundColor: '#3B82F6', width: 40 },
  instructionBanner: { marginHorizontal: 16, backgroundColor: 'rgba(0,0,0,0.75)', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#374151' },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  instructionTitle: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  instructionDesc: { color: '#D1D5DB', fontSize: 13, marginBottom: 6 },
  gpsLiveText: { color: '#10B981', fontSize: 11, fontFamily: 'monospace' },
  watermarkBadge: { position: 'absolute', top: 50, left: 16, right: 16, backgroundColor: 'rgba(0,0,0,0.8)', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#10B981' },
  watermarkTitle: { color: '#10B981', fontWeight: 'bold', fontSize: 13, marginBottom: 4 },
  watermarkText: { color: '#FFF', fontSize: 12, fontFamily: 'monospace' },
  bottomBar: { alignItems: 'center', paddingBottom: 40, backgroundColor: 'rgba(0,0,0,0.4)', paddingTop: 16 },
  timerText: { color: '#FFF', fontSize: 13, marginBottom: 16, fontWeight: '500' },
  recordOuterBtn: { width: 76, height: 76, borderRadius: 38, borderWidth: 4, borderColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
  recordingBorder: { borderColor: '#EF4444' },
  recordInnerCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#EF4444' },
  stopInnerSquare: { width: 30, height: 30, borderRadius: 6, backgroundColor: '#EF4444' },
  previewActions: { position: 'absolute', bottom: 40, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  actionBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  retakeBtn: { backgroundColor: '#4B5563' },
  confirmBtn: { backgroundColor: '#10B981' },
  primaryBtn: { backgroundColor: '#10B981', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
});