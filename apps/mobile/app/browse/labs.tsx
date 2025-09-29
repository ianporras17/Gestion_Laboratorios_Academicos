import React, { useState } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet, Alert } from 'react-native';
import { BrowseApi } from '@/services/browse';

export default function BrowseLabsScreen() {
  const [q, setQ] = useState(''); const [loc, setLoc] = useState('');
  const [rows, setRows] = useState<any[]>([]);

  const load = async () => {
    try { setRows(await BrowseApi.labs({ q: q||undefined, location: loc||undefined })); }
    catch(e:any){ Alert.alert('Error', e.message); }
  };

  return (
    <FlatList
      data={rows}
      keyExtractor={(x)=>String(x.id)}
      ListHeaderComponent={
        <View style={{ padding:12 }}>
          <Text style={s.h1}>Buscar laboratorios</Text>
          <TextInput style={s.input} placeholder="texto" value={q} onChangeText={setQ}/>
          <TextInput style={s.input} placeholder="ubicación" value={loc} onChangeText={setLoc}/>
          <Button title="Buscar" onPress={load}/>
        </View>
      }
      renderItem={({item})=>(
        <View style={s.card}>
          <Text style={s.h2}>{item.name} · {item.code}</Text>
          <Text style={s.sub}>{item.location}</Text>
          {!!item.description && <Text>{item.description}</Text>}
          {'eligible' in item && <Text style={{ color: item.eligible ? '#16a34a' : '#dc2626' }}>
            Elegible: {String(item.eligible)}
          </Text>}
        </View>
      )}
      contentContainerStyle={{ padding:12 }}
    />
  );
}
const s = StyleSheet.create({
  h1:{ fontSize:20, fontWeight:'800' }, h2:{ fontWeight:'800' }, sub:{ color:'#666' },
  input:{ borderWidth:1, borderColor:'#ccc', borderRadius:6, padding:8, marginVertical:4 },
  card:{ backgroundColor:'#fff', padding:12, borderRadius:8, marginVertical:6 }
});
