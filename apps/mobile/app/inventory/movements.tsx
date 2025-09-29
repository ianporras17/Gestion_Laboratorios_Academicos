import React, { useState } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet, Alert } from 'react-native';
import { InventoryApi } from '@/services/inventory';

export default function MovementsScreen() {
  const [labId, setLabId] = useState('1');
  const [fixedId, setFixedId] = useState('');
  const [consumableId, setConsumableId] = useState('');
  const [rows, setRows] = useState<any[]>([]);

  const load = async () => {
    try {
      const data = await InventoryApi.listMovements({
        lab_id: labId ? Number(labId) : undefined,
        fixed_id: fixedId ? Number(fixedId) : undefined,
        consumable_id: consumableId ? Number(consumableId) : undefined,
        limit: 200
      });
      setRows(data);
    } catch (e:any) {
      Alert.alert('Error', e.message ?? 'No se pudo cargar');
    }
  };

  return (
    <FlatList
      data={rows}
      keyExtractor={(x)=>String(x.id)}
      ListHeaderComponent={
        <View style={{ padding:12 }}>
          <Text style={s.h1}>Movimientos de Inventario</Text>
          <View style={s.row}>
            <TextInput style={s.input} placeholder="lab_id" keyboardType="numeric" value={labId} onChangeText={setLabId}/>
            <TextInput style={s.input} placeholder="fixed_id" keyboardType="numeric" value={fixedId} onChangeText={setFixedId}/>
            <TextInput style={s.input} placeholder="consumable_id" keyboardType="numeric" value={consumableId} onChangeText={setConsumableId}/>
          </View>
          <View style={{ marginTop:8 }}>
            <Button title="Buscar" onPress={load} />
          </View>
        </View>
      }
      renderItem={({item})=>(
        <View style={s.card}>
          <Text>#{item.id} · {item.type} · {item.qty ?? '—'}</Text>
          <Text style={s.sub}>Lab {item.lab_id} · {new Date(item.created_at).toLocaleString()}</Text>
          {!!item.consumable_id && <Text>consumable_id: {item.consumable_id}</Text>}
          {!!item.fixed_id && <Text>fixed_id: {item.fixed_id}</Text>}
          {!!item.reason && <Text>Motivo: {item.reason}</Text>}
          {!!item.notes && <Text>Notas: {item.notes}</Text>}
        </View>
      )}
      contentContainerStyle={{ padding:12 }}
    />
  );
}

const s = StyleSheet.create({
  h1:{ fontSize:20, fontWeight:'800' }, sub:{ color:'#666' },
  row:{ flexDirection:'row', gap:8, marginTop:8 },
  input:{ borderWidth:1, borderColor:'#ccc', borderRadius:6, padding:8, flex:1 },
  card:{ backgroundColor:'#fff', padding:12, borderRadius:8, marginBottom:10, elevation:2 },
});
