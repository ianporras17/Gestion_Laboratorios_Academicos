import React, { useState } from 'react';
import { View, Text, TextInput, Button, Switch, FlatList, StyleSheet, Alert } from 'react-native';
import { BrowseApi } from '@/services/browse';

export default function BrowseResourcesScreen() {
  const [labId, setLabId] = useState('');
  const [typeId, setTypeId] = useState('');
  const [q, setQ] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [onlyEligible, setOnlyEligible] = useState(true);
  const [rows, setRows] = useState<any[]>([]);

  const load = async () => {
    try { setRows(await BrowseApi.resources({
      lab_id: labId ? Number(labId) : undefined,
      type_id: typeId ? Number(typeId) : undefined,
      q: q || undefined,
      from: from || undefined, to: to || undefined,
      show_all: showAll, only_eligible: onlyEligible
    })); }
    catch(e:any){ Alert.alert('Error', e.message); }
  };

  return (
    <FlatList
      data={rows}
      keyExtractor={(x)=>String(x.id)}
      ListHeaderComponent={
        <View style={{ padding:12 }}>
          <Text style={s.h1}>Buscar recursos</Text>
          <TextInput style={s.input} placeholder="lab_id" keyboardType="numeric" value={labId} onChangeText={setLabId}/>
          <TextInput style={s.input} placeholder="type_id" keyboardType="numeric" value={typeId} onChangeText={setTypeId}/>
          <TextInput style={s.input} placeholder="texto" value={q} onChangeText={setQ}/>
          <TextInput style={s.input} placeholder="from (ISO)" value={from} onChangeText={setFrom}/>
          <TextInput style={s.input} placeholder="to (ISO)" value={to} onChangeText={setTo}/>
          <View style={s.row}>
            <Text>Mostrar todos</Text><Switch value={showAll} onValueChange={setShowAll}/>
            <View style={{ width:12 }}/>
            <Text>Solo elegibles</Text><Switch value={onlyEligible} onValueChange={setOnlyEligible}/>
          </View>
          <Button title="Buscar" onPress={load}/>
        </View>
      }
      renderItem={({item})=>(
        <View style={s.card}>
          <Text style={s.h2}>{item.name}</Text>
          <Text style={s.sub}>Lab {item.lab_id} · Estado: {item.status} · Qty: {item.qty_available}</Text>
          {'eligible' in item && <Text>Elegible: {String(item.eligible)}</Text>}
          {item.next_available_slot && (
            <Text>Siguiente: {new Date(item.next_available_slot.starts_at).toLocaleString()} → {new Date(item.next_available_slot.ends_at).toLocaleString()}</Text>
          )}
        </View>
      )}
      contentContainerStyle={{ padding:12 }}
    />
  );
}
const s = StyleSheet.create({
  h1:{ fontSize:20, fontWeight:'800' }, h2:{ fontWeight:'800' }, sub:{ color:'#666' },
  row:{ flexDirection:'row', alignItems:'center', gap:8, marginVertical:8 },
  input:{ borderWidth:1, borderColor:'#ccc', borderRadius:6, padding:8, marginVertical:4 },
  card:{ backgroundColor:'#fff', padding:12, borderRadius:8, marginVertical:6 }
});
