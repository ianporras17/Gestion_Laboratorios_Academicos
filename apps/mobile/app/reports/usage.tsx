import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet, FlatList } from 'react-native';
import { ControlApi } from '@/services/control';

type Row = { kind: 'resources'|'consumables', item_name: string, total_qty: number };
type Report = { assignments: Row[]; consumptions: Row[] };

export default function UsageReport() {
  const [labId, setLabId] = useState('');
  const [from, setFrom] = useState('2025-10-01T00:00:00Z'); 
  const [to, setTo] = useState('2025-10-31T23:59:59Z');
  const [data, setData] = useState<Report | null>(null);

  const run = async () => {
    if (!labId || !from || !to) return Alert.alert('Completar','lab_id, from, to');
    try { setData(await ControlApi.reportUsage(Number(labId), from, to)); }
    catch (e:any) { Alert.alert('Error', e.message ?? 'No se pudo generar'); }
  };

  return (
    <View style={{ flex:1, padding:12 }}>
      <View style={s.card}>
        <Text style={s.h2}>Parámetros</Text>
        <TextInput style={s.input} placeholder="lab_id" keyboardType="numeric" value={labId} onChangeText={setLabId}/>
        <TextInput style={s.input} placeholder="from ISO" value={from} onChangeText={setFrom}/>
        <TextInput style={s.input} placeholder="to ISO" value={to} onChangeText={setTo}/>
        <Button title="Generar" onPress={run}/>
      </View>

      {data && (
        <View style={{gap:12}}>
          <View style={s.card}>
            <Text style={s.h2}>Equipos asignados</Text>
            <FlatList
              data={data.assignments}
              keyExtractor={(r, i)=>`a-${i}`}
              ListEmptyComponent={<Text>(sin datos)</Text>}
              renderItem={({item})=>(
                <View style={s.row}>
                  <Text style={s.title}>{item.item_name}</Text>
                  <Text style={s.sub}>Total: {item.total_qty}</Text>
                </View>
              )}
            />
          </View>
          <View style={s.card}>
            <Text style={s.h2}>Consumos de materiales</Text>
            <FlatList
              data={data.consumptions}
              keyExtractor={(r, i)=>`c-${i}`}
              ListEmptyComponent={<Text>(sin datos)</Text>}
              renderItem={({item})=>(
                <View style={s.row}>
                  <Text style={s.title}>{item.item_name}</Text>
                  <Text style={s.sub}>Total: {item.total_qty}</Text>
                </View>
              )}
            />
          </View>
        </View>
      )}
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
