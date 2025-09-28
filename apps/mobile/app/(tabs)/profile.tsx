import { useEffect, useState } from 'react';
import { Alert, Button, ScrollView, Text, TextInput, View } from 'react-native';
import { api } from '@/lib/api';
import { clearToken } from '../../lib/auth';
import { router } from 'expo-router';

export default function ProfileScreen() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [certs, setCerts] = useState<any[]>([]);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [career, setCareer] = useState('');

  const [certCode, setCertCode] = useState('');
  const [certDate, setCertDate] = useState('');

  async function load() {
    setLoading(true);
    try {
      const data = await api.me();
      setUser(data.user);
      setCerts(data.certifications || []);
      setFullName(data.user.full_name || '');
      setPhone(data.user.phone || '');
      setCareer(data.user.career_or_department || '');
    } catch (e:any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function onSave() {
    try {
      const { user } = await api.updateMe({ full_name: fullName, phone, career_or_department: career });
      setUser(user);
      Alert.alert('Listo', 'Perfil actualizado');
    } catch (e:any) {
      Alert.alert('Error', e.message);
    }
  }

  async function onAddCert() {
    if (!certCode || !certDate) return Alert.alert('Valida', 'Código y fecha son obligatorios');
    try {
      await api.addCert(certCode, certDate);
      setCertCode(''); setCertDate('');
      await load();
      Alert.alert('OK', 'Certificación agregada');
    } catch (e:any) { Alert.alert('Error', e.message); }
  }

  async function logout() {
    await clearToken();
    router.replace('/login');
  }

  if (loading) return <View style={{flex:1,alignItems:'center',justifyContent:'center'}}><Text>Cargando...</Text></View>;

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: '700' }}>Mi Perfil</Text>

      <View style={{ gap: 8 }}>
        <Text>Nombre completo</Text>
        <TextInput value={fullName} onChangeText={setFullName} style={{ borderWidth:1, borderRadius:8, padding:10 }} />
        <Text>Teléfono</Text>
        <TextInput value={phone} onChangeText={setPhone} keyboardType="phone-pad" style={{ borderWidth:1, borderRadius:8, padding:10 }} />
        <Text>Carrera/Departamento</Text>
        <TextInput value={career} onChangeText={setCareer} style={{ borderWidth:1, borderRadius:8, padding:10 }} />
        <Button title="Guardar cambios" onPress={onSave} />
      </View>

      <View style={{ height:1, backgroundColor:'#e5e5e5', marginVertical: 8 }} />

      <Text style={{ fontSize: 18, fontWeight: '600' }}>Certificaciones</Text>
      {certs.map((c, i) => (
        <View key={i} style={{ padding: 10, borderWidth: 1, borderRadius: 8, marginBottom: 8 }}>
          <Text style={{ fontWeight:'600' }}>{c.code} — {c.name || ''}</Text>
          <Text>Fecha: {c.obtained_at}</Text>
        </View>
      ))}

      <View style={{ gap: 8 }}>
        <Text style={{ fontWeight:'600' }}>Agregar certificación</Text>
        <Text>Código</Text>
        <TextInput value={certCode} onChangeText={setCertCode} placeholder="SEG-LAB-INDUCCION" style={{ borderWidth:1, borderRadius:8, padding:10 }} />
        <Text>Fecha (YYYY-MM-DD)</Text>
        <TextInput value={certDate} onChangeText={setCertDate} placeholder="2025-09-01" style={{ borderWidth:1, borderRadius:8, padding:10 }} />
        <Button title="Agregar" onPress={onAddCert} />
      </View>

      <View style={{ height:1, backgroundColor:'#e5e5e5', marginVertical: 8 }} />
      <Button title="Cerrar sesión" color="#b91c1c" onPress={logout} />
    </ScrollView>
  );
}
