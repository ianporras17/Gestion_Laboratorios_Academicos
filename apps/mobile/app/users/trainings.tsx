import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, Alert, FlatList, StyleSheet } from 'react-native';
import { UsersApi } from '@/services/users';

export default function TrainingsScreen() {
  const [rows, setRows] = useState<any[]>([]);
  const [trainingId, setTrainingId] = useState('');
  const [completedAt, setCompletedAt] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [labReqLabId, setLabReqLabId] = useState('');
  const [labReq, setLabReq] = useState<any|null>(null);

  const load = async () => {
    try { setRows(await UsersApi.myTrainings()); }
    catch(e:any){ Alert.alert('Error', e.message); }
  };
  useEffect(()=>{ load(); }, []);

  const add = async () => {
    if (!trainingId) return Alert.alert('Completar','training_id');
    try {
      await UsersApi.upsertTraining({
        training_id: Number(trainingId),
        completed_at: completedAt || undefined,
        expires_at: expiresAt || undefined
      });
      Alert.alert('OK','Registrado'); setCompletedAt(''); setExpiresAt(''); load();
    } catch(e:any){ Alert.alert('Error', e.message); }
  };

  const checkLab = async () => {
    if (!labReqLabId) return;
    try { setLabReq(await UsersApi.labRequirements(Number(labReqLabId))); }
    catch(e:any){ Alert.alert('Error', e.message); }
  };

  return (
    <FlatList
      data={rows}
      keyExtractor={(x,i)=>String(x.id || i)}
      ListHeaderComponent={
        <View style={{ padding:12 }}>
          <Text style={s.h1}>Mis capacitaciones</Text>

          <View style={s.card}>
            <Text style={s.h2}>Agregar / Actualizar</Text>
            <TextInput style={s.input} placeholder="training_id (num)" keyboardType="numeric" value={trainingId} onChangeText={setTrainingId}/>
            <TextInput style={s.input} placeholder="completed_at (ISO opcional)" value={completedAt} onChangeText={setCompletedAt}/>
            <TextInput style={s.input} placeholder="expires_at (ISO opcional)" value={expiresAt} onChangeText={setExpiresAt}/>
            <Button title="Guardar" onPress={add} />
          </View>

          <View style={s.card}>
            <Text style={s.h2}>Requisitos por laboratorio</Text>
            <TextInput style={s.input} placeholder="lab_id" keyboardType="numeric" value={labReqLabId} onChangeText={setLabReqLabId}/>
            <Button title="Verificar elegibilidad" onPress={checkLab} />
            {labReq && (
              <View style={{ marginTop:8 }}>
                <Text style={{ fontWeight:'700' }}>Elegible: {String(labReq.eligible)}</Text>
                {labReq.items?.map((it:any)=>(
                  <Text key={it.training_id} style={{ color: it.valid ? '#16a34a' : '#dc2626' }}>
                    • {it.code} {it.name} — {it.valid ? 'OK' : 'FALTA/EXPIRADO'}
                  </Text>
                ))}
              </View>
            )}
          </View>
        </View>
      }
      renderItem={({item})=>(
        <View style={s.li}>
          <Text style={{ fontWeight:'700' }}>{item.code} {item.name}</Text>
          <Text>Completado: {item.completed_at ? new Date(item.completed_at).toLocaleString() : '—'}</Text>
          <Text>Vence: {item.expires_at ? new Date(item.expires_at).toLocaleString() : '—'}</Text>
        </View>
      )}
      contentContainerStyle={{ padding:12 }}
    />
  );
}
const s = StyleSheet.create({
  h1:{ fontSize:20, fontWeight:'800' },
  h2:{ fontWeight:'800', marginBottom:6 },
  card:{ backgroundColor:'#fff', padding:12, borderRadius:8, marginVertical:8 },
  input:{ borderWidth:1, borderColor:'#ccc', borderRadius:6, padding:8, marginVertical:4 },
  li:{ backgroundColor:'#fff', padding:12, borderRadius:8, marginVertical:6 }
});