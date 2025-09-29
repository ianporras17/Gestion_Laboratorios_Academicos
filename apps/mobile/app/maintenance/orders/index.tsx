import React, { useState } from 'react';
import { View, Text, TextInput, Button, FlatList, Alert, StyleSheet } from 'react-native';
import { MaintenanceApi } from '@/services/maintenance';
import { useRouter } from 'expo-router';

export default function OrdersListScreen() {
  const router = useRouter();
  const [labId, setLabId] = useState('1');
  const [status, setStatus] = useState('');
  const [rows, setRows] = useState<any[]>([]);
  const [completeForm, setCompleteForm] = useState<Record<number,{ result_status?: string; used_parts?: string; notes?: string }>>({});

  const load = async () => {
    try {
      const data = await MaintenanceApi.listOrders({
        lab_id: labId ? Number(labId) : undefined,
        status: status || undefined
      });
      setRows(data);
    } catch (e:any) {
      Alert.alert('Error', e.message ?? 'No se pudo cargar');
    }
  };

  const start = async (id:number) => {
    try { await MaintenanceApi.start(id, {}); Alert.alert('OK','Iniciada'); load(); } catch (e:any){ Alert.alert('Error', e.message); }
  };
  const cancel = async (id:number) => {
    try { await MaintenanceApi.cancel(id, {}); Alert.alert('OK','Cancelada'); load(); } catch (e:any){ Alert.alert('Error', e.message); }
  };
  const complete = async (id:number) => {
    const f = completeForm[id] || {};
    try { 
      await MaintenanceApi.complete(id, {
        result_status: f.result_status as any,
        used_parts: f.used_parts,
        notes: f.notes
      });
      Alert.alert('OK','Completada');
      setCompleteForm(prev => ({ ...prev, [id]: {} }));
      load();
    } catch (e:any){ Alert.alert('Error', e.message); }
  };

  const edit = (id:number, k:keyof (typeof completeForm)[number], v:string) =>
    setCompleteForm(prev => ({ ...prev, [id]: { ...(prev[id]||{}), [k]: v } }));

  return (
    <FlatList
      data={rows}
      keyExtractor={(x)=>String(x.id)}
      ListHeaderComponent={
        <View style={{ padding:12 }}>
          <Text style={s.h1}>Órdenes de mantenimiento</Text>
          <View style={s.row}>
            <TextInput style={s.input} placeholder="lab_id" keyboardType="numeric" value={labId} onChangeText={setLabId}/>
            <TextInput style={s.input} placeholder="status (PENDIENTE/EN_PROCESO/...)" value={status} onChangeText={setStatus}/>
          </View>
          <View style={{ marginTop:8 }}>
            <Button title="Buscar" onPress={load} />
          </View>
        </View>
      }
      renderItem={({item})=>(
        <View style={s.card}>
          <Text style={s.h2}>#{item.id} · {item.type} · {item.status}</Text>
          <Text style={s.sub}>Lab {item.lab_id} · {new Date(item.created_at).toLocaleString()}</Text>
          {item.resource_id ? <Text>resource_id: {item.resource_id}</Text> : item.fixed_id ? <Text>fixed_id: {item.fixed_id}</Text> : null}
          {!!item.scheduled_at && <Text>Programado: {new Date(item.scheduled_at).toLocaleString()}</Text>}
          {!!item.technician_name && <Text>Técnico: {item.technician_name}</Text>}
          {!!item.description && <Text>Desc: {item.description}</Text>}

          <View style={s.row}>
            <Button title="Detalle" onPress={()=>router.push({ pathname:'/maintenance/orders/[id]', params:{ id:String(item.id)} } as any)} />
            <View style={{ width:6 }} />
            <Button title="Iniciar" onPress={()=>start(item.id)} />
            <View style={{ width:6 }} />
            <Button title="Cancelar" onPress={()=>cancel(item.id)} />
          </View>

          <View style={s.box}>
            <Text style={s.boxTitle}>Completar</Text>
            <TextInput style={s.input} placeholder="result_status (DISPONIBLE/INACTIVO/MANTENIMIENTO/RESERVADO)"
              value={completeForm[item.id]?.result_status || ''} onChangeText={(v)=>edit(item.id,'result_status',v)} />
            <TextInput style={s.input} placeholder="used_parts" value={completeForm[item.id]?.used_parts || ''} onChangeText={(v)=>edit(item.id,'used_parts',v)} />
            <TextInput style={s.input} placeholder="notes" value={completeForm[item.id]?.notes || ''} onChangeText={(v)=>edit(item.id,'notes',v)} />
            <Button title="Completar" onPress={()=>complete(item.id)} />
          </View>
        </View>
      )}
      contentContainerStyle={{ padding:12 }}
    />
  );
}

const s = StyleSheet.create({
  h1:{ fontSize:20, fontWeight:'800' }, h2:{ fontWeight:'800' }, sub:{ color:'#666' },
  row:{ flexDirection:'row', gap:8, marginTop:8 },
  input:{ borderWidth:1, borderColor:'#ccc', borderRadius:6, padding:8, flex:1 },
  card:{ backgroundColor:'#fff', padding:12, borderRadius:8, marginBottom:10, elevation:2 },
  box:{ marginTop:8, gap:8 }, boxTitle:{ fontWeight:'700' }
});
