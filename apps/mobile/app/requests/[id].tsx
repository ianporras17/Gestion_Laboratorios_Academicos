import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter  } from 'expo-router';
import { RequestsApi } from '@/services/requests';
import type { RequestDetail, RequestMessage } from '@/types/requests';

export default function RequestDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const reqId = Number(id);

  const [data, setData] = useState<RequestDetail | null>(null);
  const [reviewer_note, setNote] = useState('');
  const [message, setMessage] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await RequestsApi.get(reqId);
      setData(r);
    } catch (e:any) {
      Alert.alert('Error', e.message ?? 'No se pudo cargar');
    } finally {
      setRefreshing(false);
    }
  }, [reqId]);

  useEffect(() => { load(); }, [load]);

  const approve = async () => {
    try {
      await RequestsApi.approve(reqId, { reviewer_id: 1, reviewer_note });
      setNote('');
      Alert.alert('OK', 'Aprobada');
      load();
    } catch (e:any) {
      Alert.alert('Error', e.message ?? 'No se pudo aprobar');
    }
  };
  const reject = async () => {
    try {
      await RequestsApi.reject(reqId, { reviewer_id: 1, reviewer_note });
      setNote('');
      Alert.alert('OK', 'Rechazada');
      load();
    } catch (e:any) {
      Alert.alert('Error', e.message ?? 'No se pudo rechazar');
    }
  };
  const needInfo = async () => {
    try {
      await RequestsApi.needInfo(reqId, { reviewer_id: 1, reviewer_note, message });
      setNote(''); setMessage('');
      Alert.alert('OK', 'Se solicitó información');
      load();
    } catch (e:any) {
      Alert.alert('Error', e.message ?? 'No se pudo actualizar');
    }
  };
  const addMsg = async () => {
    if (!message) return;
    try {
      const m: RequestMessage = await RequestsApi.addMessage(reqId, { sender: 'USUARIO', message });
      setData(prev => prev ? ({ ...prev, messages: [...prev.messages, m] }) : prev);
      setMessage('');
    } catch (e:any) {
      Alert.alert('Error', e.message ?? 'No se pudo enviar el mensaje');
    }
  };

  const messages = useMemo(() => data?.messages ?? [], [data]);

  if (!data) {
    return (
      <View style={{flex:1,justifyContent:'center',alignItems:'center'}}>
        <Text>Cargando...</Text>
      </View>
    );
  }

  // Header con metadatos y acciones (no-scroll, se renderiza como header de la lista)
  const Header = (
    <View>
      <View style={s.card}>
        <Text style={s.h1}>Solicitud #{data.id}</Text>
        <Text style={s.sub}>
          Lab #{data.lab_id} · {data.status} {data.requirements_ok ? '' : '· (revisar requisitos)'}
        </Text>
        <Text style={s.sub}>
          {data.requester_name} ({data.requester_role}) · {data.requester_email}
        </Text>
        {!!data.requester_program && <Text style={s.sub}>{data.requester_program}</Text>}
        <Text style={{ marginTop:6 }}>{data.purpose}</Text>
        <Text style={s.sub}>
          {new Date(data.requested_from).toLocaleString()} — {new Date(data.requested_to).toLocaleString()} · {data.priority}
        </Text>
      </View>

      <View style={s.card}>
        <Text style={s.h2}>Recursos</Text>
        {(data.items ?? []).length === 0 ? (
          <Text>(sin ítems)</Text>
        ) : (
          (data.items ?? []).map(it => (
            <Text key={it.id}>• {it.resource_id ? `Recurso #${it.resource_id}` : 'Espacio del LAB'}  (qty {it.qty})</Text>
          ))
        )}
      </View>

      <View style={s.card}>
        <Text style={s.h2}>Acciones</Text>
        <TextInput
          style={s.input}
          placeholder="Nota del revisor / motivo"
          value={reviewer_note}
          onChangeText={setNote}
        />
        <Button title="Aprobar" onPress={approve} />
        <View style={{height:6}} />
        <Button title="Rechazar" onPress={reject} />
        <View style={{height:6}} />
        <TextInput
          style={s.input}
          placeholder="Mensaje para solicitar información"
          value={message}
          onChangeText={setMessage}
        />
        <Button title="Solicitar información" onPress={needInfo} />
      </View>

      <View style={{height:8}} />
      <View style={{flexDirection:'row', gap:8, flexWrap:'wrap'}}>
        <Button title="Asignaciones" onPress={() => router.push(`/requests/${reqId}/assignments` as const)} />
        <Button title="Consumos" onPress={() => router.push(`/requests/${reqId}/consumptions` as const)} />
        <Button title="Beneficios" onPress={() => router.push(`/requests/${reqId}/benefits` as const)} />
      </View>

      <View style={s.card}>
        <Text style={s.h2}>Mensajes</Text>
        {messages.length === 0 && <Text style={{color:'#555'}}>(No hay mensajes aún)</Text>}
      </View>
    </View>
  );

  // Footer con caja de envío de mensaje
  const Footer = (
    <View style={[s.card, { marginBottom: 24 }]}>
      <TextInput
        style={s.input}
        placeholder="Escribe un mensaje"
        value={message}
        onChangeText={setMessage}
      />
      <Button title="Enviar mensaje" onPress={addMsg}/>
    </View>
  );

  return (
    <FlatList
      data={messages}
      keyExtractor={(m) => String(m.id)}
      renderItem={({ item }) => (
        <View style={[s.card, { paddingVertical: 8 }]}>
          <Text style={{fontWeight:'700'}}>{item.sender}</Text>
          <Text>{item.message}</Text>
          <Text style={{color:'#666', fontSize:12}}>{new Date(item.created_at).toLocaleString()}</Text>
        </View>
      )}
      ListHeaderComponent={Header}
      ListFooterComponent={Footer}
      contentContainerStyle={{ padding: 12 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
    />
  );
}

const s = StyleSheet.create({
  h1:{ fontSize:20, fontWeight:'800' },
  sub:{ color:'#555', marginTop:2 },
  card:{ backgroundColor:'#fff', padding:12, borderRadius:8, marginBottom:10, elevation:2 },
  h2:{ fontWeight:'800', marginBottom:6 },
  input:{ borderWidth:1, borderColor:'#ccc', borderRadius:6, padding:8, marginVertical:6 },
});
