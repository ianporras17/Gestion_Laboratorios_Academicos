import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet, FlatList } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { ControlApi } from '@/services/control';
import type { Benefit } from '@/types/control';


export default function BenefitsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const requestId = Number(id);

  const [items, setItems] = useState<Benefit[]>([]);
  const [userId, setUserId] = useState('1');
  const [hours, setHours] = useState('0');
  const [credits, setCredits] = useState('0');
  const [certUrl, setCertUrl] = useState('');
  const [notes, setNotes] = useState('');

  const load = async () => {
    try { setItems(await ControlApi.listBenefits(requestId)); }
    catch (e:any) { Alert.alert('Error', e.message ?? 'No se pudo cargar'); }
  };

  //eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [requestId]);

  const add = async () => {
    if (!userId) return Alert.alert('Completar','user_id');
    try {
      const row = await ControlApi.addBenefit(requestId, {
        user_id: Number(userId),
        hours: Number(hours || 0),
        credits: Number(credits || 0),
        certificate_url: certUrl || undefined,
        notes: notes || undefined
      });
      setUserId('1'); setHours('0'); setCredits('0'); setCertUrl(''); setNotes('');
      Alert.alert('OK', `Beneficio #${row.id} agregado`);
      load();
    } catch (e:any) { Alert.alert('Error', e.message ?? 'No se pudo agregar'); }
  };

  return (
    <View style={{ flex:1, padding:12 }}>
      <View style={s.card}>
        <Text style={s.h2}>Registrar beneficio</Text>
        <TextInput style={s.input} placeholder="user_id" keyboardType="numeric" value={userId} onChangeText={setUserId}/>
        <TextInput style={s.input} placeholder="hours" keyboardType="numeric" value={hours} onChangeText={setHours}/>
        <TextInput style={s.input} placeholder="credits" keyboardType="numeric" value={credits} onChangeText={setCredits}/>
        <TextInput style={s.input} placeholder="certificate_url (opcional)" value={certUrl} onChangeText={setCertUrl}/>
        <TextInput style={s.input} placeholder="Notas (opcional)" value={notes} onChangeText={setNotes}/>
        <Button title="Agregar" onPress={add} />
      </View>

      <FlatList
        data={items}
        keyExtractor={(i)=>String(i.id)}
        ListEmptyComponent={<Text>No hay beneficios</Text>}
        renderItem={({item})=>(
          <View style={s.row}>
            <Text style={s.title}>#{item.id} · user {item.user_id} · horas {item.hours} · créditos {item.credits}</Text>
            {!!item.certificate_url && <Text style={s.sub}>{item.certificate_url}</Text>}
            {!!item.notes && <Text style={s.sub}>{item.notes}</Text>}
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
