import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet, FlatList } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { ControlApi } from '@/services/control';
import type { Consumption } from '@/types/control';


export default function ConsumptionsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const requestId = Number(id);

  const [items, setItems] = useState<Consumption[]>([]);
  const [consumableId, setConsumableId] = useState('');
  const [qty, setQty] = useState('1');
  const [notes, setNotes] = useState('');

  const load = async () => {
    try { setItems(await ControlApi.listConsumptions(requestId)); }
    catch (e:any) { Alert.alert('Error', e.message ?? 'No se pudo cargar'); }
  };
  //eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [requestId]);

  const add = async () => {
    if (!consumableId || !qty) return Alert.alert('Completar', 'consumable_id y qty');
    try {
      const row = await ControlApi.createConsumption(requestId, {
        consumable_id: Number(consumableId), qty: Number(qty), notes: notes || undefined
      });
      setConsumableId(''); setQty('1'); setNotes('');
      Alert.alert('OK', `Consumo #${row.id} registrado`);
      load();
    } catch (e:any) { Alert.alert('Error', e.message ?? 'No se pudo registrar'); }
  };

  return (
    <View style={{ flex:1, padding:12 }}>
      <View style={s.card}>
        <Text style={s.h2}>Registrar consumo</Text>
        <TextInput style={s.input} placeholder="consumable_id" keyboardType="numeric" value={consumableId} onChangeText={setConsumableId}/>
        <TextInput style={s.input} placeholder="qty" keyboardType="numeric" value={qty} onChangeText={setQty}/>
        <TextInput style={s.input} placeholder="Notas (opcional)" value={notes} onChangeText={setNotes}/>
        <Button title="Registrar" onPress={add} />
      </View>

      <FlatList
        data={items}
        keyExtractor={(i)=>String(i.id)}
        ListEmptyComponent={<Text>No hay consumos</Text>}
        renderItem={({item})=>(
          <View style={s.row}>
            <Text style={s.title}>#{item.id} · Consumible {item.consumable_id} · qty {item.qty}</Text>
            <Text style={s.sub}>{new Date(item.used_at).toLocaleString()}</Text>
            {!!item.notes && <Text style={s.sub}>{item.notes}</Text>}
          </View>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  card:{ backgroundColor:'#fff', padding:12, borderRadius:8, marginBottom:8, elevation:2 },
  h2:{ fontWeight:'800', marginBottom:6 },
  input:{ borderWidth:1, borderColor:'#ccc', borderRadius:6, padding:8, marginVertical:4 },
  row:{ backgroundColor:'#fff', padding:12, borderRadius:8, marginVertical:6, elevation:1 },
  title:{ fontWeight:'700' },
  sub:{ color:'#555', marginTop:2 }
});
