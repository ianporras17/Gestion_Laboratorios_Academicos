import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet } from 'react-native';
import { InventoryApi } from '@/services/inventory';

export default function FixedStatusScreen() {
  const [labId, setLabId] = useState('1');
  const [fixedId, setFixedId] = useState('');
  const [status, setStatus] = useState<'DISPONIBLE'|'RESERVADO'|'MANTENIMIENTO'|'INACTIVO'>('DISPONIBLE');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');

  const save = async () => {
    if (!fixedId) return Alert.alert('Completar', 'fixed_id es requerido');
    try {
      await InventoryApi.updateFixedStatus(Number(fixedId), {
        lab_id: Number(labId), status, reason: reason || undefined, notes: notes || undefined
      });
      Alert.alert('OK', 'Estado actualizado');
      setReason(''); setNotes('');
    } catch (e:any) {
      Alert.alert('Error', e.message ?? 'No se pudo actualizar');
    }
  };

  return (
    <View style={{ padding:12 }}>
      <Text style={s.h1}>Estado de equipo fijo</Text>
      <TextInput style={s.input} placeholder="lab_id" keyboardType="numeric" value={labId} onChangeText={setLabId}/>
      <TextInput style={s.input} placeholder="fixed_id" keyboardType="numeric" value={fixedId} onChangeText={setFixedId}/>
      <TextInput style={s.input} placeholder="status (DISPONIBLE/RESERVADO/MANTENIMIENTO/INACTIVO)" value={status} onChangeText={(v)=>setStatus(v as any)}/>
      <TextInput style={s.input} placeholder="reason" value={reason} onChangeText={setReason}/>
      <TextInput style={s.input} placeholder="notes" value={notes} onChangeText={setNotes}/>
      <Button title="Guardar" onPress={save} />
    </View>
  );
}

const s = StyleSheet.create({
  h1:{ fontSize:20, fontWeight:'800' },
  input:{ borderWidth:1, borderColor:'#ccc', borderRadius:6, padding:8, marginVertical:6 },
});
