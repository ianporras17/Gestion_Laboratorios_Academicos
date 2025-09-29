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

  const submit = async () => {
    if (!lab_id || !requester_name || !requester_email || !requester_role || !purpose || !requested_from || !requested_to) {
      return Alert.alert('Completar', 'Llena los campos obligatorios');
    }
    try {
      const payload = {
        lab_id: Number(lab_id),
        requester_name, requester_email, requester_role, requester_program,
        purpose, priority,
        requested_from, requested_to,
        headcount: Number(headcount || 1),
        items
      };
        const r = await RequestsApi.create(payload);
        Alert.alert('OK', 'Solicitud creada', [
        {
            text: 'Ver',
            onPress: () => {
            // navegación inmediata sin bloquearte por tipos
            router.replace(`/requests/${r.id}` as any);
            },
        },
        ]);
    } catch (e:any) {
      Alert.alert('Error', e.message ?? 'No se pudo crear la solicitud');
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 12 }}>
      <View style={s.card}>
        <Text style={s.h2}>Datos generales</Text>
        <TextInput style={s.input} placeholder="lab_id" keyboardType="numeric" value={lab_id} onChangeText={setLabId} />
        <TextInput style={s.input} placeholder="Nombre solicitante" value={requester_name} onChangeText={setName} />
        <TextInput style={s.input} placeholder="Correo solicitante" value={requester_email} onChangeText={setEmail} />
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

      <Button title="Crear solicitud" onPress={submit} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  card:{ backgroundColor:'#fff', padding:12, borderRadius:8, marginBottom:8, elevation:2 },
  h2:{ fontWeight:'700', marginBottom:6 },
  sub:{ color:'#555', marginBottom:6 },
  input:{ borderWidth:1, borderColor:'#ccc', borderRadius:6, padding:8, marginVertical:4 },
});
