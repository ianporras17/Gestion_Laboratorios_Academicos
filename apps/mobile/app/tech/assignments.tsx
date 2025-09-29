import React, { useState } from 'react';
import { View, Text, TextInput, Button, FlatList, Alert, StyleSheet } from 'react-native';
import { TechApi } from '@/services/tech';

export default function AssignmentsScreen() {
  const [labId, setLabId] = useState('1');
  const [requestId, setRequestId] = useState('');
  const [rows, setRows] = useState<any[]>([]);
  const [notes, setNotes] = useState<Record<number,string>>({});

  const load = async () => {
    try {
      const data = await TechApi.listAssignments({
        lab_id: labId ? Number(labId) : undefined,
        request_id: requestId ? Number(requestId) : undefined
      });
      setRows(data);
    } catch (e:any) {
      Alert.alert('Error', e.message ?? 'No se pudo cargar');
    }
  };

  const setNote = (id:number, v:string) => setNotes(prev => ({ ...prev, [id]: v }));

  const act = async (kind:'return'|'lost'|'damaged', id:number) => {
    try {
      const n = notes[id] || '';
      if (kind === 'return') await TechApi.returnAssignment(id, { notes: n });
      if (kind === 'lost') await TechApi.markLost(id, { notes: n });
      if (kind === 'damaged') await TechApi.markDamaged(id, { notes: n });
      Alert.alert('OK', 'Actualizado');
      setNotes(prev => ({ ...prev, [id]: '' }));
      load();
    } catch (e:any) {
      Alert.alert('Error', e.message ?? 'No se pudo actualizar');
    }
  };

  return (
    <FlatList
      data={rows}
      keyExtractor={(x)=>String(x.id)}
      ListHeaderComponent={
        <View style={{ padding:12 }}>
          <Text style={s.h1}>Asignaciones</Text>
          <View style={s.row}>
            <TextInput style={s.input} placeholder="lab_id" keyboardType="numeric" value={labId} onChangeText={setLabId}/>
            <TextInput style={s.input} placeholder="request_id" keyboardType="numeric" value={requestId} onChangeText={setRequestId}/>
          </View>
          <View style={{ marginTop:8 }}>
            <Button title="Buscar" onPress={load} />
          </View>
        </View>
      }
      renderItem={({item})=>(
        <View style={s.card}>
          <Text style={s.h2}>#{item.id} · {item.status}</Text>
          <Text style={s.sub}>Req #{item.request_id} · Lab {item.lab_id}</Text>
          <Text>{item.resource_name ? `Recurso: ${item.resource_name}` : item.fixed_name ? `Equipo fijo: ${item.fixed_name}` : '—'}</Text>
          <Text style={s.sub}>Qty {item.qty} · {new Date(item.assigned_at).toLocaleString()}</Text>
          {!!item.due_at && <Text style={s.sub}>Due: {new Date(item.due_at).toLocaleString()}</Text>}

          <TextInput style={s.input} placeholder="Notas" value={notes[item.id] || ''} onChangeText={(v)=>setNote(item.id, v)} />

          <View style={s.row}>
            <Button title="Devolver" onPress={() => act('return', item.id)} />
            <View style={{ width:6 }} />
            <Button title="Perdido" onPress={() => act('lost', item.id)} />
            <View style={{ width:6 }} />
            <Button title="Dañado" onPress={() => act('damaged', item.id)} />
          </View>
        </View>
      )}
      contentContainerStyle={{ padding:12 }}
    />
  );
}

const s = StyleSheet.create({
  h1:{ fontSize:20, fontWeight:'800' },
  h2:{ fontWeight:'800' }, sub:{ color:'#666' },
  row:{ flexDirection:'row', gap:8, marginTop:8 },
  input:{ borderWidth:1, borderColor:'#ccc', borderRadius:6, padding:8, marginTop:8, flex:1 },
  card:{ backgroundColor:'#fff', padding:12, borderRadius:8, marginBottom:10, elevation:2 },
});