import { useState, useEffect } from 'react';
import { useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { Alert } from 'react-native';

export function useVerifiedCamera() {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [locationGranted, setLocationGranted] = useState(false);
  const [currentCoords, setCurrentCoords] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    (async () => {
      if (!cameraPermission?.granted) {
        await requestCameraPermission();
      }
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        setLocationGranted(true);
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        setCurrentCoords({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
      } else {
        Alert.alert('Yêu cầu quyền GPS', 'Bạn phải bật vị trí GPS để xác thực video thực tế của phòng trọ.');
      }
    })();
  }, []);

  const refreshLocation = async () => {
    if (!locationGranted) return null;
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
    setCurrentCoords(coords);
    return coords;
  };

  return {
    hasPermissions: Boolean(cameraPermission?.granted && locationGranted),
    currentCoords,
    refreshLocation,
  };
}