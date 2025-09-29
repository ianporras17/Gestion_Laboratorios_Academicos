import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

export default function LabHome() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  return (
    <View style={s.container}>
      <Text style={s.h1}>Laboratorio #{id}</Text>
      <View style={s.row}>
        <Button title="Calendario" onPress={() => router.push(`/lab/${id}/calendar`)} />
      </View>
      <View style={s.row}>
        <Button title="Catálogo de recursos" onPress={() => router.push(`/lab/${id}/catalog`)} />
      </View>
    </View>
  );
}
const s = StyleSheet.create({
  container:{ flex:1, padding:16, gap:12 },
  h1:{ fontSize:20, fontWeight:'700', marginBottom:6 },
  row:{ marginVertical:4 },
});
