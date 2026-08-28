import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useAuthStore } from '../../../store/auth';
import { styles, fontStyle } from '../AdminStyles';
import { apiClient } from '../../../api/client';

export default function ProfileTab() {
  const { user } = useAuthStore();
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    password: '',
  });
  const [profileStatus, setProfileStatus] = useState<string | null>(null);

  const handleUpdateProfile = async () => {
    if (!profileForm.name.trim() || !profileForm.phone.trim()) {
      setProfileStatus('Name and phone number are required');
      return;
    }

    try {
      await apiClient.put(`/users/${user?.id}`, {
        id: user?.id,
        name: profileForm.name,
        email: profileForm.email || null,
        phone: profileForm.phone,
        password: profileForm.password || null,
      });
      setProfileStatus('Profile credentials updated successfully!');
      setTimeout(() => setProfileStatus(null), 3000);
    } catch (err) {
      setProfileStatus('Failed to update credentials');
    }
  };

  return (
    <View style={styles.sectionCard}>
      <Text style={[styles.sectionTitle, { fontSize: 16, fontWeight: '800', fontFamily: fontStyle, marginBottom: 20 }]}>ADMIN CONSOLE SECURITY</Text>
      <View style={styles.formContainer}>
        <Text style={styles.inputLabel}>ADMIN NAME</Text>
        <TextInput style={styles.textInput} value={profileForm.name} onChangeText={(val) => setProfileForm({ ...profileForm, name: val })} />
        <View style={styles.spacer} />
        
        <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
        <TextInput style={styles.textInput} value={profileForm.email} onChangeText={(val) => setProfileForm({ ...profileForm, email: val })} />
        <View style={styles.spacer} />
        
        <Text style={styles.inputLabel}>NEW ACCESS PASSWORD</Text>
        <TextInput style={styles.textInput} placeholder="Enter new password" placeholderTextColor="#94A3B8" value={profileForm.password} onChangeText={(val) => setProfileForm({ ...profileForm, password: val })} secureTextEntry />
        
        {profileStatus && <Text style={styles.statusText}>{profileStatus}</Text>}
        <TouchableOpacity style={styles.saveBtn} onPress={handleUpdateProfile}>
          <Text style={styles.saveBtnText}>COMMIT CHANGES</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
