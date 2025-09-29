import React, { useState } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet, Alert } from 'react-native';
import { BrowseApi } from '@/services/browse';

export default function BrowseCalendarScreen() {
  const [labId, setLabId] = useState('');
  const [resId, setResId] = useState('');
  const [from, setFrom] = useState(''); const [to, setTo] = useState('');
  const [rows, setRows] = useState<any[]>([]);

  const load = async () => {
    if (!labId) return Alert.alert('Completar','lab_id');
    try {
      setRows(await BrowseApi.calendar({
        lab_id: Number(labId),
        resource_id: resId ? Number(resId) : undefined,
        from: from || undefined, to: to || undefined
      }));
    } catch(e:any){ Alert.alert('Error', e.message); }
  };

  return (
    <FlatList
      data={rows}
      keyExtractor={(x)=>String(x.id)}
      ListHeaderComponent={
        <View style={{ padding:12 }}>
          <Text style={s.h1}>Calendario</Text>
          <TextInput style={s.input} placeholder="lab_id" keyboardType="numeric" value={labId} onChangeText={setLabId}/>
          <TextInput style={s.input} placeholder="resource_id (opcional)" keyboardType="numeric" value={resId} onChangeText={setResId}/>
          <TextInput style={s.input} placeholder="from (ISO)" value={from} onChangeText={setFrom}/>
          <TextInput style={s.input} placeholder="to (ISO)" value={to} onChangeText={setTo}/>
          <Button title="Cargar" onPress={load}/>
        </View>
      }
      renderItem={({item})=>(
        <View style={s.card}>
          <Text>#{item.id} · {item.status} · {item.title || '(sin título)'}</Text>
          <Text style={s.sub}>{new Date(item.starts_at).toLocaleString()} → {new Date(item.ends_at).toLocaleString()}</Text>
          {!!item.resource_id && <Text>resource_id: {item.resource_id}</Text>}
          {!!item.reason && <Text>Motivo: {item.reason}</Text>}
        </View>
      )}
      contentContainerStyle={{ padding:12 }}
    />
  );
}
const s = StyleSheet.create({
  h1:{ fontSize:20, fontWeight:'800' }, sub:{ color:'#666' },
  input:{ borderWidth:1, borderColor:'#ccc', borderRadius:6, padding:8, marginVertical:4 },
  card:{ backgroundColor:'#fff', padding:12, borderRadius:8, marginVertical:6 }
});
