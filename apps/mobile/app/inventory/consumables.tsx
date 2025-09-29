import React, { useState } from 'react';
import { View, Text, TextInput, Button, FlatList, Alert, StyleSheet } from 'react-native';
import { InventoryApi } from '@/services/inventory';

export default function ConsumablesScreen() {
  const [labId, setLabId] = useState('1');
  const [rows, setRows] = useState<any[]>([]);
  const [open, setOpen] = useState<Record<number, boolean>>({});
  const [form, setForm] = useState<Record<number, { type?: 'IN'|'OUT'|'ADJUST'; qty?: string; reason?: string; notes?: string }>>({});

  const load = async () => {
    try {
      const data = await InventoryApi.listConsumables({ lab_id: Number(labId) });
      setRows(data);
    } catch (e:any) {
      Alert.alert('Error', e.message ?? 'No se pudo cargar');
    }
  };

  const toggle = (id:number) => setOpen(prev => ({ ...prev, [id]: !prev[id] }));
  const edit = (id:number, k:keyof (typeof form)[number], v:string) =>
    setForm(prev => ({ ...prev, [id]: { ...(prev[id]||{}), [k]: v as any } }));

  const move = async (it:any) => {
    const f = form[it.id] || {};
    if (!f.type) { Alert.alert('Completar', 'type es requerido (IN/OUT/ADJUST)'); return; }
    try {
      const r = await InventoryApi.moveConsumable(it.id, {
        lab_id: Number(labId),
        type: f.type,
        qty: f.qty ? Number(f.qty) : undefined,
        reason: f.reason,
        notes: f.notes
      });
      Alert.alert('OK', `Movimiento creado. Stock: ${r.qty_available}`);
      setOpen(prev => ({ ...prev, [it.id]: false }));
      setForm(prev => ({ ...prev, [it.id]: {} }));
      load();
    } catch (e:any) {
      Alert.alert('Error', e.message ?? 'No se pudo mover');
    }
  };

  return (
    <FlatList
      data={rows}
      keyExtractor={(x)=>String(x.id)}
      ListHeaderComponent={
        <View style={{ padding:12 }}>
          <Text style={s.h1}>Consumibles</Text>
          <View style={s.row}>
            <TextInput style={s.input} placeholder="lab_id" keyboardType="numeric" value={labId} onChangeText={setLabId}/>
            <Button title="Cargar" onPress={load} />
          </View>
        </View>
      }
      renderItem={({item})=>(
        <View style={s.card}>
          <Text style={s.h2}>{item.name}</Text>
          <Text style={s.sub}>Stock: {item.qty_available}{item.unit} · Reorden: {item.reorder_point}</Text>

          <Button title={open[item.id] ? 'Cancelar' : 'Mover...'} onPress={()=>toggle(item.id)} />
          {open[item.id] && (
            <View style={s.box}>
              <TextInput style={s.input} placeholder="type (IN/OUT/ADJUST)"
                value={form[item.id]?.type || '' as any} onChangeText={(v)=>edit(item.id,'type',v)} />
              <TextInput style={s.input} placeholder="qty" keyboardType="numeric"
                value={form[item.id]?.qty || ''} onChangeText={(v)=>edit(item.id,'qty',v)} />
              <TextInput style={s.input} placeholder="reason" value={form[item.id]?.reason || ''} onChangeText={(v)=>edit(item.id,'reason',v)} />
              <TextInput style={s.input} placeholder="notes" value={form[item.id]?.notes || ''} onChangeText={(v)=>edit(item.id,'notes',v)} />
              <Button title="Guardar movimiento" onPress={()=>move(item)} />
            </View>
          )}
        </View>
      )}
      contentContainerStyle={{ padding:12 }}
    />
  );
}

const s = StyleSheet.create({
  h1:{ fontSize:20, fontWeight:'800' }, h2:{ fontWeight:'800' }, sub:{ color:'#666' },
  row:{ flexDirection:'row', gap:8, marginTop:8, alignItems:'center' },
  input:{ borderWidth:1, borderColor:'#ccc', borderRadius:6, padding:8, flex:1 },
  card:{ backgroundColor:'#fff', padding:12, borderRadius:8, marginBottom:10, elevation:2 },
  box:{ marginTop:10, gap:8 },
});
