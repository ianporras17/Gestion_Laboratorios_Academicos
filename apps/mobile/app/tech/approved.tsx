import React, { useState } from 'react';
import { View, Text, TextInput, Button, FlatList, Alert, ActivityIndicator, StyleSheet, Switch } from 'react-native';
import { TechApi } from '@/services/tech';

type ApprovedRow = any;

export default function ApprovedRequestsScreen() {
  const [labId, setLabId] = useState('1');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [overdue, setOverdue] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<ApprovedRow[]>([]);
  const [openAssign, setOpenAssign] = useState<Record<number, boolean>>({});
  const [assignForm, setAssignForm] = useState<Record<number, {
    resource_id?: string; fixed_id?: string; qty?: string; due_at?: string; notes?: string; user_id?: string;
  }>>({});
  const [precheck, setPrecheck] = useState<Record<number, any>>({});

  const load = async () => {
    try {
      setLoading(true);
      const data = await TechApi.listApproved({
        lab_id: labId ? Number(labId) : undefined,
        from: from || undefined,
        to: to || undefined,
        overdue
      });
      setRows(data);
    } catch (e:any) {
      Alert.alert('Error', e.message ?? 'No se pudo cargar');
    } finally {
      setLoading(false);
    }
  };

  const doPrecheck = async (id: number) => {
    try {
      const r = await TechApi.precheck(id);
      setPrecheck(prev => ({ ...prev, [id]: r }));
      if (!r.request_ok) Alert.alert('Atención', 'La solicitud no está APROBADA');
      if (!r.requirements_ok) Alert.alert('Requisitos', 'El usuario no cumple requisitos');
    } catch (e:any) {
      Alert.alert('Error', e.message ?? 'No se pudo validar');
    }
  };

  const toggleAssign = (id:number) => setOpenAssign(prev => ({ ...prev, [id]: !prev[id] }));
  const editAssign = (id:number, k:keyof (typeof assignForm)[number], v:string) =>
    setAssignForm(prev => ({ ...prev, [id]: { ...(prev[id]||{}), [k]: v } }));

  const doAssign = async (r: ApprovedRow) => {
    const f = assignForm[r.id] || {};
    if (!f.resource_id && !f.fixed_id) {
      Alert.alert('Completar', 'resource_id o fixed_id es requerido'); return;
    }
    try {
      const payload = {
        request_id: r.id,
        lab_id: r.lab_id,
        user_id: f.user_id ? Number(f.user_id) : undefined,
        resource_id: f.resource_id ? Number(f.resource_id) : undefined,
        fixed_id: f.fixed_id ? Number(f.fixed_id) : undefined,
        qty: f.qty ? Number(f.qty) : 1,
        due_at: f.due_at || undefined,
        notes: f.notes || undefined,
      };
      const res = await TechApi.createAssignment(payload);
      Alert.alert('OK', `Asignación #${res.id} creada`);
      setOpenAssign(prev => ({ ...prev, [r.id]: false }));
      setAssignForm(prev => ({ ...prev, [r.id]: {} }));
    } catch (e:any) {
      Alert.alert('Error', e.message ?? 'No se pudo asignar');
    }
  };

  return (
    <FlatList
      data={rows}
      keyExtractor={(x)=>String(x.id)}
      ListHeaderComponent={
        <View style={{ padding:12 }}>
          <Text style={s.h1}>Solicitudes Aprobadas</Text>
          <View style={s.row}>
            <TextInput style={s.input} placeholder="lab_id" keyboardType="numeric" value={labId} onChangeText={setLabId}/>
            <TextInput style={s.input} placeholder="from (YYYY-MM-DD)" value={from} onChangeText={setFrom}/>
            <TextInput style={s.input} placeholder="to (YYYY-MM-DD)" value={to} onChangeText={setTo}/>
          </View>
          <View style={[s.row, { alignItems:'center' }]}>
            <Text style={{ color:'#555' }}>Solo vencidas</Text>
            <Switch value={overdue} onValueChange={setOverdue} />
            <View style={{ width:8 }} />
            <Button title="Buscar" onPress={load} />
          </View>
          {loading && <ActivityIndicator style={{ marginTop:10 }} />}
        </View>
      }
      renderItem={({item}) => {
        const pc = precheck[item.id];
        return (
          <View style={s.card}>
            <Text style={s.h2}>#{item.id} • {item.requester_name} · {item.requester_email}</Text>
            <Text style={s.sub}>Lab {item.lab_id} • {new Date(item.requested_from).toLocaleString()} → {new Date(item.requested_to).toLocaleString()}</Text>
            {!!item.is_overdue && <Text style={{ color:'#ef4444', fontWeight:'700' }}>VENCIDA</Text>}
            <Text style={{ marginTop:4 }}>{item.purpose}</Text>
            <Text style={s.muted}>Ítems: {item.items?.length || 0}</Text>

            <View style={s.row}>
              <Button title="Precheck" onPress={() => doPrecheck(item.id)} />
              <View style={{ width:8 }} />
              <Button title={openAssign[item.id] ? "Cancelar" : "Entregar..."} onPress={() => toggleAssign(item.id)} />
            </View>

            {pc && (
              <View style={s.box}>
                <Text style={s.boxTitle}>Precheck</Text>
                <Text>request_ok: {String(pc.request_ok)} · requirements_ok: {String(pc.requirements_ok)}</Text>
                {(pc.availability||[]).map((a:any)=>(
                  <Text key={a.item_id} style={s.li}>
                    • Item {a.item_id}: {a.reason} {a.resource ? `(stock ${a.resource.qty_available})` : ''}
                  </Text>
                ))}
              </View>
            )}

            {openAssign[item.id] && (
              <View style={s.box}>
                <Text style={s.boxTitle}>Crear asignación</Text>
                <TextInput style={s.input} placeholder="user_id (opcional)" keyboardType="numeric"
                  value={assignForm[item.id]?.user_id || ''} onChangeText={(v)=>editAssign(item.id,'user_id',v)} />
                <TextInput style={s.input} placeholder="resource_id" keyboardType="numeric"
                  value={assignForm[item.id]?.resource_id || ''} onChangeText={(v)=>editAssign(item.id,'resource_id',v)} />
                <TextInput style={s.input} placeholder="fixed_id" keyboardType="numeric"
                  value={assignForm[item.id]?.fixed_id || ''} onChangeText={(v)=>editAssign(item.id,'fixed_id',v)} />
                <TextInput style={s.input} placeholder="qty" keyboardType="numeric"
                  value={assignForm[item.id]?.qty || ''} onChangeText={(v)=>editAssign(item.id,'qty',v)} />
                <TextInput style={s.input} placeholder="due_at (YYYY-MM-DDTHH:mm)" 
                  value={assignForm[item.id]?.due_at || ''} onChangeText={(v)=>editAssign(item.id,'due_at',v)} />
                <TextInput style={s.input} placeholder="notes"
                  value={assignForm[item.id]?.notes || ''} onChangeText={(v)=>editAssign(item.id,'notes',v)} />
                <Button title="Crear" onPress={() => doAssign(item)} />
              </View>
            )}
          </View>
        );
      }}
      contentContainerStyle={{ padding:12 }}
    />
  );
}

const s = StyleSheet.create({
  h1:{ fontSize:20, fontWeight:'800' },
  row:{ flexDirection:'row', gap:8, marginTop:8 },
  input:{ borderWidth:1, borderColor:'#ccc', borderRadius:6, padding:8, flex:1 },
  card:{ backgroundColor:'#fff', borderRadius:8, padding:12, marginBottom:10, elevation:2 },
  h2:{ fontWeight:'800' }, sub:{ color:'#666' }, muted:{ color:'#777', marginTop:4 },
  box:{ marginTop:10, padding:10, backgroundColor:'#f8fafc', borderRadius:8, borderWidth:1, borderColor:'#e5e7eb' },
  boxTitle:{ fontWeight:'700', marginBottom:6 },
  li:{ color:'#333', marginTop:4 },
});
