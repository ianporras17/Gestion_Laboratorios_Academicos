import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { RequestsApi } from '@/services/requests';

export default function NewRequest() {
  const router = useRouter();
  const { labId } = useLocalSearchParams<{ labId?: string }>();

  const [lab_id, setLabId] = useState<string>(labId ?? '');
  const [requester_name, setName] = useState('');
  const [requester_email, setEmail] = useState('');
  const [requester_role, setRole] = useState('ESTUDIANTE');
  const [requester_program, setProgram] = useState('');
  const [purpose, setPurpose] = useState('');
  const [priority, setPriority] = useState<'NORMAL'|'ALTA'>('NORMAL');
  const [requested_from, setFrom] = useState('');
  const [requested_to, setTo] = useState('');
  const [headcount, setHeadcount] = useState('1');

  // items: ids separados por coma
  const [resourceIds, setResourceIds] = useState('');
  const items = useMemo(() => {
    if (!resourceIds.trim()) return [{ qty: 1 }]; // solo espacio del lab
    return resourceIds
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .map(n => ({ resource_id: Number(n), qty: 1 }));
  }, [resourceIds]);

  // ➕ Preview (validación)
  const [preview, setPreview] = useState<null | {
    availability_ok: boolean;
    availability_conflicts: any[];
    requirements_ok: boolean;
    missing_requirements: any[];
  }>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingCreate, setLoadingCreate] = useState(false);

  const doPreview = async () => {
    if (!lab_id || !requested_from || !requested_to) {
      return Alert.alert('Completar', 'Lab, desde y hasta (ISO).');
    }
    try {
      setLoadingPreview(true);
      const data = await RequestsApi.preview({
        lab_id: Number(lab_id),
        from: requested_from,
        to: requested_to,
        items,
      } as any);
      setPreview(data);
      if (!data.availability_ok) {
        Alert.alert('Atención', 'Hay conflictos de disponibilidad. Revisa el detalle abajo.');
      }
      if (!data.requirements_ok) {
        Alert.alert('Atención', 'No cumples algunos requisitos. Revisa el detalle abajo.');
      }
    } catch (e:any) {
      Alert.alert('Error', e?.response?.data?.error || e.message || 'No se pudo validar');
    } finally {
      setLoadingPreview(false);
    }
  };

  const submit = async () => {
    if (!lab_id || !requester_name || !requester_email || !requester_role || !purpose || !requested_from || !requested_to) {
      return Alert.alert('Completar', 'Llena los campos obligatorios');
    }
    try {
      setLoadingCreate(true);
      const payload = {
        lab_id: Number(lab_id),
        requester_name, requester_email, requester_role, requester_program,
        purpose, priority,
        requested_from, requested_to,
        headcount: Number(headcount || 1),
        items
      };
      const r: any = await RequestsApi.create(payload);
      // Manejo flexible: { id } o { request: {...} }
      const newId = r?.id ?? r?.request?.id;
      if (!newId) {
        return Alert.alert('Creado', 'Solicitud creada, pero no se obtuvo el ID');
      }
      Alert.alert('OK', 'Solicitud creada', [
        { text: 'Ver', onPress: () => router.replace(`/requests/${newId}` as any) },
      ]);
    } catch (e:any) {
      Alert.alert('Error', e?.response?.data?.error ?? e.message ?? 'No se pudo crear la solicitud');
    } finally {
      setLoadingCreate(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 12 }}>
      <View style={s.card}>
        <Text style={s.h2}>Datos generales</Text>
        <TextInput style={s.input} placeholder="lab_id" keyboardType="numeric" value={lab_id} onChangeText={setLabId} />
        <TextInput style={s.input} placeholder="Nombre solicitante" value={requester_name} onChangeText={setName} />
        <TextInput style={s.input} placeholder="Correo solicitante" value={requester_email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <TextInput style={s.input} placeholder="Rol (ESTUDIANTE/DOCENTE/...)" value={requester_role} onChangeText={setRole} />
        <TextInput style={s.input} placeholder="Carrera/Programa" value={requester_program} onChangeText={setProgram} />
        <TextInput style={s.input} placeholder="Objetivo/Purpose" value={purpose} onChangeText={setPurpose} />
        <TextInput style={s.input} placeholder="Prioridad (NORMAL/ALTA)" value={priority} onChangeText={t => setPriority((t as any) || 'NORMAL')} />
        <TextInput style={s.input} placeholder="Desde (ISO YYYY-MM-DDTHH:mm:ss)" value={requested_from} onChangeText={setFrom} />
        <TextInput style={s.input} placeholder="Hasta (ISO YYYY-MM-DDTHH:mm:ss)" value={requested_to} onChangeText={setTo} />
        <TextInput style={s.input} placeholder="Personas (headcount)" keyboardType="numeric" value={headcount} onChangeText={setHeadcount} />
      </View>

      <View style={s.card}>
        <Text style={s.h2}>Recursos (opcional)</Text>
        <Text style={s.sub}>IDs de recursos separados por coma. Déjalo vacío para reservar solo el espacio del lab.</Text>
        <TextInput style={s.input} placeholder="e.g. 2,5,7" value={resourceIds} onChangeText={setResourceIds} />
      </View>

      {/* ➕ Botón de preview */}
      <View style={{ marginBottom: 8 }}>
        <Button title={loadingPreview ? 'Validando...' : 'Preview (validar)'} onPress={doPreview} />
      </View>

      {/* Resultado preview */}
      {!!preview && (
        <View style={s.card}>
          <Text style={s.h2}>Resultado Preview</Text>
          <Text style={s.okBad}>Disponibilidad: {preview.availability_ok ? 'OK' : 'Conflictos'}</Text>
          {!preview.availability_ok && (
            <Text style={s.prejson}>{JSON.stringify(preview.availability_conflicts, null, 2)}</Text>
          )}
          <Text style={s.okBad}>Requisitos: {preview.requirements_ok ? 'OK' : 'Faltantes'}</Text>
          {!preview.requirements_ok && (
            <Text style={s.prejson}>{JSON.stringify(preview.missing_requirements, null, 2)}</Text>
          )}
        </View>
      )}

      <Button title={loadingCreate ? 'Creando...' : 'Crear solicitud'} onPress={submit} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  card:{ backgroundColor:'#fff', padding:12, borderRadius:8, marginBottom:8, elevation:2 },
  h2:{ fontWeight:'700', marginBottom:6 },
  sub:{ color:'#555', marginBottom:6 },
  input:{ borderWidth:1, borderColor:'#ccc', borderRadius:6, padding:8, marginVertical:4 },
  okBad:{ fontWeight:'700', marginTop:6 },
  prejson:{ color:'#333', fontSize:12, marginTop:6 }
});
