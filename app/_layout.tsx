import React from 'react';
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // Ẩn thanh header mặc định để tối ưu giao diện tùy chỉnh
        contentStyle: { backgroundColor: '#F3F4F6' },
      }}
    >
      <Stack.Screen 
        name="select-role" 
        options={{ title: 'Chọn vai trò' }} 
      />
      <Stack.Screen 
        name="login" 
        options={{ title: 'Đăng nhập' }} 
      />
    </Stack>
  );
}