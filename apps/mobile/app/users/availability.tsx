// app/users/availability.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, TextInput, Button, Alert, StyleSheet, FlatList, Pressable, ActivityIndicator
} from 'react-native';
import axios from 'axios';
import { useRouter } from 'expo-router';

const BASE = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/$/, ''); // Respeta tu /api

type Lab = { id: number; name: string; code: string; location: string; description?: string; policies?: any };
type Type = { id: number; name: string };
type Resource = {
  id: number; lab_id: number; name: string; type_id: number;
  status: 'DISPONIBLE'|'RESERVADO'|'MANTENIMIENTO'|'INACTIVO'; qty_available?: number;
};
type Slot = {
  id?: number;
  lab_id?: number;
  resource_id?: number | null;
  starts_at: string;
  ends_at: string;
  status: 'DISPONIBLE'|'RESERVADO'|'MANTENIMIENTO'|'INACTIVO'|'BLOQUEADO'|'EXCLUSIVO';
  title?: string | null;
  reason?: string | null;
};

export default function UsersAvailability() {
  const router = useRouter();

  // filtros
  const [labId, setLabId] = useState<string>('1');
  const [typeId, setTypeId] = useState<string>('');   // opcional
  const [from, setFrom] = useState<string>(() => new Date(Date.now()).toISOString().slice(0, 10) + 'T00:00:00Z');
  const [to, setTo] = useState<string>(() => new Date(Date.now() + 7*24*60*60*1000).toISOString().slice(0, 10) + 'T23:59:59Z');

  // datos
  const [labs, setLabs] = useState<Lab[]>([]);
  const [types, setTypes] = useState<Type[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);

  // UI
  const [loadingLabs, setLoadingLabs] = useState(false);
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [loadingResources, setLoadingResources] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [selectedResourceId, setSelectedResourceId] = useState<string>(''); // opcional para ver slots por recurso

  // helpers
  const pickError = (e: any) =>
    e?.response?.data?.error || e?.response?.data?.message || e?.message || 'Error inesperado';

  // ==== cargas base ====
  const loadLabs = async () => {
    try {
      setLoadingLabs(true);
      const { data } = await axios.get(`${BASE}/labs`);
      setLabs(Array.isArray(data) ? data : []);
    } catch (e:any) {
      Alert.alert('Error', pickError(e));
    } finally {
      setLoadingLabs(false);
    }
  };

  const loadTypes = async () => {
    try {
      setLoadingTypes(true);
      const { data } = await axios.get(`${BASE}/resource-types`);
      setTypes(Array.isArray(data) ? data : []);
    } catch (e:any) {
      Alert.alert('Error', pickError(e));
    } finally {
      setLoadingTypes(false);
    }
  };


  useEffect(() => {
    loadLabs();
    loadTypes();
  }, []);

  // ==== recursos disponibles ====
  const loadResources = async () => {
    if (!labId) return Alert.alert('Completar', 'lab_id es requerido');
    try {
      setLoadingResources(true);
      const params: any = { lab_id: Number(labId), status: 'DISPONIBLE' };
      if (typeId) params.type_id = Number(typeId);
      const { data } = await axios.get(`${BASE}/resources`, { params });
      setResources(Array.isArray(data) ? data : []);
    } catch (e:any) {
      Alert.alert('Error', pickError(e));
    } finally {
      setLoadingResources(false);
    }
  };

  // ==== disponibilidad (slots) ====
  // intentamos 2 rutas comunes que ya usaste en Mód 1/2:
  //  a) /labs/:id/calendar
  //  b) /calendar/slots?lab_id=...
  const fetchLabSlots = async (lab_id: number, fromISO: string, toISO: string) => {
    // intento A
    try {
      const { data } = await axios.get(`${BASE}/labs/${lab_id}/calendar`, {
        params: { from: fromISO, to: toISO, status: 'DISPONIBLE' }
      });
      return Array.isArray(data?.slots) ? data.slots as Slot[] :
             Array.isArray(data) ? (data as Slot[]) : [];
    } catch (_a) {
      // intento B
      const { data } = await axios.get(`${BASE}/calendar/slots`, {
        params: { lab_id, from: fromISO, to: toISO, status: 'DISPONIBLE' }
      });
      return Array.isArray(data) ? (data as Slot[]) : [];
    }
  };

  // para recurso:
  //  a) /resources/:id/availability
  //  b) /calendar/slots?resource_id=...
  const fetchResourceSlots = async (resource_id: number, fromISO: string, toISO: string) => {
    try {
      const { data } = await axios.get(`${BASE}/resources/${resource_id}/availability`, {
        params: { from: fromISO, to: toISO }
      });
      return Array.isArray(data?.slots) ? data.slots as Slot[] :
             Array.isArray(data) ? (data as Slot[]) : [];
    } catch (_a) {
      const { data } = await axios.get(`${BASE}/calendar/slots`, {
        params: { resource_id, from: fromISO, to: toISO, status: 'DISPONIBLE' }
      });
      return Array.isArray(data) ? (data as Slot[]) : [];
    }
  };

  const viewSlots = async () => {
    if (!labId) return Alert.alert('Completar', 'lab_id es requerido');
    try {
      setLoadingSlots(true);
      const fromISO = from;
      const toISO = to;

      const rid = selectedResourceId ? Number(selectedResourceId) : undefined;
      let rows: Slot[] = [];
      if (rid) {
        rows = await fetchResourceSlots(rid, fromISO, toISO);
      } else {
        rows = await fetchLabSlots(Number(labId), fromISO, toISO);
      }
      // nos quedamos con DISPONIBLE (por si el endpoint no lo filtró)
      rows = rows.filter(s => s.status === 'DISPONIBLE');
      setSlots(rows);
    } catch (e:any) {
      Alert.alert('Error', pickError(e));
    } finally {
      setLoadingSlots(false);
    }
  };

  // ==== políticas del lab (best-effort) ====
  const [labDetail, setLabDetail] = useState<any>(null);
  const loadLabDetail = async () => {
    if (!labId) return;
    try {
      const { data } = await axios.get(`${BASE}/labs/${Number(labId)}`);
      setLabDetail(data);
    } catch (_e) {
      setLabDetail(null);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadLabDetail(); }, [labId]);

  // ==== agrupar por día para “vista semanal/mensual” simple ====
  const grouped = useMemo(() => {
    const byDay: Record<string, Slot[]> = {};
    for (const s of slots) {
      const day = new Date(s.starts_at).toISOString().slice(0,10);
      if (!byDay[day]) byDay[day] = [];
      byDay[day].push(s);
    }
    const days = Object.keys(byDay).sort();
    return days.map(d => ({ day: d, rows: byDay[d].sort((a,b)=>+new Date(a.starts_at)-+new Date(b.starts_at)) }));
  }, [slots]);

  return (
    <FlatList
      data={grouped}
      keyExtractor={(x) => x.day}
      ListHeaderComponent={
        <View style={{ padding:12 }}>
          <Text style={s.h1}>Disponibilidad</Text>

          {/* Parámetros */}
          <View style={s.card}>
            <Text style={s.h2}>Parámetros</Text>

            <TextInput
              style={s.input}
              placeholder="lab_id"
              placeholderTextColor="#94a3b8"
              keyboardType="numeric"
              value={labId}
              onChangeText={setLabId}
            />

            <TextInput
              style={s.input}
              placeholder="type_id (opcional)"
              placeholderTextColor="#94a3b8"
              keyboardType="numeric"
              value={typeId}
              onChangeText={setTypeId}
            />

            <TextInput
              style={s.input}
              placeholder="from (YYYY-MM-DDTHH:mm:ssZ)"
              placeholderTextColor="#94a3b8"
              value={from}
              onChangeText={setFrom}
            />

            <TextInput
              style={s.input}
              placeholder="to (YYYY-MM-DDTHH:mm:ssZ)"
              placeholderTextColor="#94a3b8"
              value={to}
              onChangeText={setTo}
            />

            <View style={s.row}>
              <Pressable style={[s.btn, { backgroundColor:'#10b981' }]} onPress={loadResources}>
                <Text style={s.btnText}>Cargar recursos</Text>
              </Pressable>
              <View style={{ width:8 }} />
              <Pressable style={[s.btn, { backgroundColor:'#0ea5e9' }]} onPress={viewSlots}>
                <Text style={s.btnText}>Ver slots</Text>
              </Pressable>
            </View>

            {(loadingResources || loadingSlots || loadingLabs || loadingTypes) && (
              <ActivityIndicator style={{ marginTop:8 }} />
            )}
          </View>

          {/* Selector de recurso (opcional) */}
          <View style={s.card}>
            <Text style={s.h2}>Recursos DISPONIBLES en Lab {labId}{typeId ? ` · Tipo ${typeId}`:''}</Text>
            {resources.length === 0 && <Text style={s.muted}>Sin recursos listados. Toca “Cargar recursos”.</Text>}

            <View style={{ gap:8, marginTop:8 }}>
              {resources.map(r => (
                <Pressable
                  key={r.id}
                  onPress={() => setSelectedResourceId(String(r.id))}
                  style={[
                    s.item,
                    String(r.id) === selectedResourceId && { borderColor: '#22c55e', backgroundColor:'#ecfdf5' }
                  ]}
                >
                  <Text style={s.itemTitle}>#{r.id} · {r.name}</Text>
                  <Text style={s.sub}>Status: {r.status} · Stock: {r.qty_available ?? '—'}</Text>
                </Pressable>
              ))}
            </View>

            {selectedResourceId ? (
              <Text style={[s.muted, { marginTop:6 }]}>
                Verás slots solo del recurso #{selectedResourceId}. Toca otra vez para cambiar.
              </Text>
            ) : (
              <Text style={[s.muted, { marginTop:6 }]}>
                Sin recurso seleccionado: verás slots del laboratorio completo.
              </Text>
            )}
          </View>

          {/* Políticas del lab (si vienen) */}
          <View style={s.card}>
            <Text style={s.h2}>Políticas / Requisitos</Text>
            {labDetail?.policies ? (
              <View>
                {!!labDetail.policies.academic_requirements && (
                  <Text style={s.p}>Académicos: {labDetail.policies.academic_requirements}</Text>
                )}
                {!!labDetail.policies.safety_requirements && (
                  <Text style={s.p}>Seguridad: {labDetail.policies.safety_requirements}</Text>
                )}
                {!!labDetail.policies.capacity_max && (
                  <Text style={s.p}>Capacidad: {labDetail.policies.capacity_max}</Text>
                )}
              </View>
            ) : (
              <Text style={s.muted}>No hay políticas adjuntas o el endpoint de lab no las incluye.</Text>
            )}
          </View>

          {/* Encabezado de resultados */}
          <Text style={[s.h2, { marginTop:8 }]}>Resultados</Text>
          {slots.length === 0 && <Text style={s.muted}>Sin slots cargados. Toca “Ver slots”.</Text>}
        </View>
      }
      renderItem={({ item }) => (
        <View style={s.card}>
          <Text style={s.day}>{new Date(item.day+'T00:00:00Z').toDateString()}</Text>
          <View style={{ gap:8, marginTop:8 }}>
            {item.rows.map((slt, i) => (
              <View key={`${item.day}-${i}`} style={s.slot}>
                <Text style={s.slotTitle}>
                  {new Date(slt.starts_at).toLocaleTimeString()} – {new Date(slt.ends_at).toLocaleTimeString()}
                </Text>
                {!!slt.title && <Text style={s.sub}>{slt.title}</Text>}
                <Text style={s.tag}>DISPONIBLE</Text>
                <View style={s.row}>
                  <Pressable
                    style={[s.btn, { backgroundColor:'#f59e0b' }]}
                    onPress={() => router.push('/requests/new' as any)}
                  >
                    <Text style={s.btnText}>Solicitar</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
      contentContainerStyle={{ padding:12 }}
    />
  );
}

const s = StyleSheet.create({
  h1:{ fontSize:20, fontWeight:'800', color:'#111' },
  h2:{ fontWeight:'800', color:'#111' },
  row:{ flexDirection:'row', alignItems:'center', marginTop:8 },
  input:{
    borderWidth:1, borderColor:'#cbd5e1', borderRadius:8, padding:10, marginTop:8,
    color:'#111',               // texto del input visible en light/dark
  },
  card:{ backgroundColor:'#fff', borderRadius:10, padding:12, marginBottom:10, elevation:1, borderWidth:1, borderColor:'#e5e7eb' },
  item:{ borderWidth:1, borderColor:'#e5e7eb', borderRadius:8, padding:10, backgroundColor:'#fff' },
  itemTitle:{ fontWeight:'700', color:'#111' },
  sub:{ color:'#6b7280' },
  muted:{ color:'#6b7280', fontStyle:'italic' },
  p:{ color:'#111', marginTop:4 },
  day:{ fontWeight:'800', color:'#111' },
  slot:{ borderWidth:1, borderColor:'#e5e7eb', borderRadius:8, padding:10, backgroundColor:'#f8fafc' },
  slotTitle:{ fontWeight:'700', color:'#111' },
  tag:{ marginTop:4, alignSelf:'flex-start', backgroundColor:'#dcfce7', paddingHorizontal:8, paddingVertical:2, borderRadius:6, color:'#166534', fontWeight:'700' },
  btn:{ borderRadius:8, paddingVertical:10, paddingHorizontal:14, alignItems:'center', marginTop:8 },
  btnText:{ color:'#fff', fontWeight:'700' },
});
