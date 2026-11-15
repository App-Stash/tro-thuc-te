import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { supabase } from './supabase';

export async function uploadVideoToCloudStorage(
  localUri: string,
  roomId: string,
  sectionName: string
): Promise<string> {
  const filePath = `${roomId}/${sectionName}_${Date.now()}.mp4`;

  // Đọc file video dạng base64 từ bộ nhớ tạm điện thoại
  const base64Data = await FileSystem.readAsStringAsync(localUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  // Upload lên bucket 'room-videos'
  const { error } = await supabase.storage
    .from('room-videos')
    .upload(filePath, decode(base64Data), {
      contentType: 'video/mp4',
      upsert: true,
    });

  if (error) throw error;

  // Lấy Public URL để phát trên Feed
  const { data } = supabase.storage.from('room-videos').getPublicUrl(filePath);
  return data.publicUrl;
}