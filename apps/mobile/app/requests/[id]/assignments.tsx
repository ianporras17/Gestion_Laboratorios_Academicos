import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet, FlatList } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { ControlApi } from '@/services/control';

import type { Assignment } from '@/types/control';

export default function AssignmentsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const requestId = Number(id);

  const [items, setItems] = useState<Assignment[]>([]);
  const [resourceId, setResourceId] = useState('');
  const [fixedId, setFixedId] = useState('');
  const [qty, setQty] = useState('1');
  const [dueAt, setDueAt] = useState('');
  const [notes, setNotes] = useState('');

  const load = async () => {
    try {
      setItems(await ControlApi.listAssignments(requestId));
    } catch (e:any) { Alert.alert('Error', e.message ?? 'No se pudo cargar'); }
  };
  //eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [requestId]);

  const assign = async () => {
    if (!resourceId && !fixedId) return Alert.alert('Completar', 'resource_id o fixed_id');
    if (resourceId && fixedId) return Alert.alert('Validación', 'No ambos a la vez');
    try {
      const created = await ControlApi.createAssignments(requestId, [{
        resource_id: resourceId ? Number(resourceId) : undefined,
        fixed_id: fixedId ? Number(fixedId) : undefined,
        qty: Number(qty || 1),
        due_at: dueAt || undefined,
        notes: notes || undefined
      }]);
      setResourceId(''); setFixedId(''); setQty('1'); setDueAt(''); setNotes('');
      Alert.alert('OK', `Asignado (#${created[0].id})`);
      load();
    } catch (e:any) { Alert.alert('Error', e.message ?? 'No se pudo asignar'); }
  };

  const markReturn = async (a: Assignment) => {
    try {
      const upd = await ControlApi.returnAssignment(a.id, { status: 'DEVUELTO' });
      setItems(prev => prev.map(x => x.id === a.id ? upd : x));
    } catch (e:any) { Alert.alert('Error', e.message ?? 'No se pudo devolver'); }
  };

  return (
    <View style={{ flex:1, padding:12 }}>
      <View style={s.card}>
        <Text style={s.h2}>Registrar asignación</Text>
        <TextInput style={s.input} placeholder="resource_id (opcional)" keyboardType="numeric" value={resourceId} onChangeText={setResourceId}/>
        <TextInput style={s.input} placeholder="fixed_id (opcional)" keyboardType="numeric" value={fixedId} onChangeText={setFixedId}/>
        <TextInput style={s.input} placeholder="qty" keyboardType="numeric" value={qty} onChangeText={setQty}/>
        <TextInput style={s.input} placeholder="due_at ISO (opcional)" value={dueAt} onChangeText={setDueAt}/>
        <TextInput style={s.input} placeholder="Notas (opcional)" value={notes} onChangeText={setNotes}/>
        <Button title="Asignar" onPress={assign} />
      </View>

      <FlatList
        data={items}
        keyExtractor={(i)=>String(i.id)}
        ListEmptyComponent={<Text>No hay asignaciones</Text>}
        renderItem={({item})=>(
          <View style={s.row}>
            <Text style={s.title}>
              #{item.id} · {item.resource_id ? `Recurso ${item.resource_id}` : `Fijo ${item.fixed_id}`} · qty {item.qty}
            </Text>
            <Text style={s.sub}>
              {item.status} · {item.due_at ? `vence ${new Date(item.due_at).toLocaleString()}` : 'sin vencimiento'}
            </Text>
            {item.status !== 'DEVUELTO' && <Button title="Marcar devolución" onPress={()=>markReturn(item)} />}
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
