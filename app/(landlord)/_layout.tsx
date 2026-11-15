import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function LandlordLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#10B981', headerShown: false }}>
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Quản lý phòng',
          tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="create-listing"
        options={{
          title: 'Đăng phòng',
          tabBarIcon: ({ color, size }) => <Ionicons name="videocam-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="billing"
        options={{
          title: 'Đối soát',
          tabBarIcon: ({ color, size }) => <Ionicons name="receipt-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Ngân hàng',
          tabBarIcon: ({ color, size }) => <Ionicons name="card-outline" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}