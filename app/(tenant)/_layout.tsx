import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TenantLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#10B981', headerShown: false }}>
      <Tabs.Screen
        name="feed"
        options={{
          title: 'Khám phá phòng',
          tabBarIcon: ({ color, size }) => <Ionicons name="play-circle-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="my-contract"
        options={{
          title: 'Hợp đồng & QR',
          tabBarIcon: ({ color, size }) => <Ionicons name="document-text-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Tài khoản',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}