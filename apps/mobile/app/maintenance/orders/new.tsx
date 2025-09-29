import React, { useState } from 'react';
import { View, Text, TextInput, Button, Switch, Alert, StyleSheet } from 'react-native';
import { MaintenanceApi } from '@/services/maintenance';
import { useRouter } from 'expo-router';

export default function NewOrderScreen() {
  const router = useRouter();
  const [labId, setLabId] = useState('1');
  const [resourceId, setResourceId] = useState('');
  const [fixedId, setFixedId] = useState('');
  const [type, setType] = useState<'PREVENTIVO'|'CORRECTIVO'>('PREVENTIVO');
  const [scheduledAt, setScheduledAt] = useState('');
  const [techName, setTechName] = useState('');
  const [desc, setDesc] = useState('');
  const [notify, setNotify] = useState(true);

  const save = async () => {
    if (!labId || (!resourceId && !fixedId)) {
      Alert.alert('Completar', 'lab_id y (resource_id o fixed_id) son requeridos'); return;
    }
    try {
      const row = await MaintenanceApi.createOrder({
        lab_id: Number(labId),
        resource_id: resourceId ? Number(resourceId) : undefined,
        fixed_id: fixedId ? Number(fixedId) : undefined,
        type,
        scheduled_at: scheduledAt || undefined,
        technician_name: techName || undefined,
        description: desc || undefined,
        notify_on_disponible: notify
      });
      Alert.alert('OK', `Orden #${row.id} creada`);
      router.replace({ pathname:'/maintenance/orders/[id]', params:{ id:String(row.id) } } as any);
    } catch (e:any) {
      Alert.alert('Error', e.message ?? 'No se pudo crear');
    }
  };

  return (
    <View style={{ padding:12 }}>
      <Text style={s.h1}>Nueva Orden de Mantenimiento</Text>
      <TextInput style={s.input} placeholder="lab_id" keyboardType="numeric" value={labId} onChangeText={setLabId}/>
      <TextInput style={s.input} placeholder="resource_id" keyboardType="numeric" value={resourceId} onChangeText={setResourceId}/>
      <TextInput style={s.input} placeholder="fixed_id" keyboardType="numeric" value={fixedId} onChangeText={setFixedId}/>
      <TextInput style={s.input} placeholder="type (PREVENTIVO/CORRECTIVO)" value={type} onChangeText={(v)=>setType(v as any)}/>
      <TextInput style={s.input} placeholder="scheduled_at (YYYY-MM-DDTHH:mm)" value={scheduledAt} onChangeText={setScheduledAt}/>
      <TextInput style={s.input} placeholder="technician_name" value={techName} onChangeText={setTechName}/>
      <TextInput style={s.input} placeholder="description" value={desc} onChangeText={setDesc}/>
      <View style={{ flexDirection:'row', alignItems:'center', gap:10, marginBottom:10 }}>
        <Text>Notificar si vuelve DISPONIBLE</Text>
        <Switch value={notify} onValueChange={setNotify} />
      </View>
      <Button title="Crear" onPress={save} />
    </View>
  );
}

const s = StyleSheet.create({
  h1:{ fontSize:20, fontWeight:'800' },
  input:{ borderWidth:1, borderColor:'#ccc', borderRadius:6, padding:8, marginVertical:6 },
});
