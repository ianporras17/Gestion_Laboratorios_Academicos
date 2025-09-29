import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { MaintenanceApi } from '@/services/maintenance';

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const orderId = Number(id);
  const [row, setRow] = useState<any>(null);
  const [resStat, setResStat] = useState('');
  const [parts, setParts] = useState('');
  const [notes, setNotes] = useState('');

  const load = async () => {
    try { const r = await MaintenanceApi.getOrder(orderId); setRow(r); }
    catch (e:any) { Alert.alert('Error', e.message ?? 'No se pudo cargar'); }
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(()=>{ load(); }, [id]);

  const start = async () => { try{ await MaintenanceApi.start(orderId, {}); Alert.alert('OK','Iniciada'); load(); }catch(e:any){Alert.alert('Error', e.message);} };
  const cancel = async () => { try{ await MaintenanceApi.cancel(orderId, {}); Alert.alert('OK','Cancelada'); load(); }catch(e:any){Alert.alert('Error', e.message);} };
  const complete = async () => {
    try{
      await MaintenanceApi.complete(orderId, { result_status: resStat as any, used_parts: parts || undefined, notes: notes || undefined });
      Alert.alert('OK','Completada'); setResStat(''); setParts(''); setNotes(''); load();
    }catch(e:any){ Alert.alert('Error', e.message); }
  };

  if (!row) return <View style={{flex:1,justifyContent:'center',alignItems:'center'}}><Text>Cargando...</Text></View>;

  return (
    <View style={{ padding:12 }}>
      <Text style={s.h1}>Orden #{row.id}</Text>
      <Text style={s.sub}>Lab {row.lab_id} · {row.type} · {row.status}</Text>
      {row.resource_id ? <Text>resource_id: {row.resource_id}</Text> : row.fixed_id ? <Text>fixed_id: {row.fixed_id}</Text> : null}
      {!!row.scheduled_at && <Text>Programado: {new Date(row.scheduled_at).toLocaleString()}</Text>}
      {!!row.technician_name && <Text>Técnico: {row.technician_name}</Text>}
      {!!row.description && <Text>Desc: {row.description}</Text>}

      <View style={{ height:8 }} />
      <View style={s.row}>
        <Button title="Iniciar" onPress={start} />
        <View style={{ width:6 }} />
        <Button title="Cancelar" onPress={cancel} />
      </View>

      <View style={s.box}>
        <Text style={s.boxTitle}>Completar</Text>
        <TextInput style={s.input} placeholder="result_status (DISPONIBLE/INACTIVO/MANTENIMIENTO/RESERVADO)" value={resStat} onChangeText={setResStat}/>
        <TextInput style={s.input} placeholder="used_parts" value={parts} onChangeText={setParts}/>
        <TextInput style={s.input} placeholder="notes" value={notes} onChangeText={setNotes}/>
        <Button title="Completar" onPress={complete} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  h1:{ fontSize:20, fontWeight:'800' }, sub:{ color:'#666' },
  row:{ flexDirection:'row', gap:8 },
  box:{ marginTop:10, gap:8, backgroundColor:'#f8fafc', borderRadius:8, padding:10, borderWidth:1, borderColor:'#e5e7eb' },
  boxTitle:{ fontWeight:'700' },
  input:{ borderWidth:1, borderColor:'#ccc', borderRadius:6, padding:8 },
});
