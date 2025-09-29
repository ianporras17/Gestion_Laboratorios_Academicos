import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { UsersApi, type UserHistoryRow } from '@/services/users';
import * as FileSystem from 'expo-file-system';

const kinds: UserHistoryRow['kind'][] = ['RESERVA','ASIGNACION','CONSUMO','BENEFICIO','CAPACITACION'];

export default function UserHistoryScreen() {
  const [rows, setRows] = useState<UserHistoryRow[]>([]);
  const [filter, setFilter] = useState<UserHistoryRow['kind'] | 'ALL'>('ALL');

  const load = async () => {
    try {
      const data = await UsersApi.history();
      setRows(data);
    } catch (e:any) {
      Alert.alert('Error', e?.response?.data?.error || e.message || 'No se pudo cargar historial');
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = filter === 'ALL' ? rows : rows.filter(r => r.kind === filter);

  const exportCsv = async () => {
    try {
      const csv = await UsersApi.historyCsv(); // texto CSV

      // ⚠️ Evitar error de tipos: acceder vía alias any
      const FS: any = FileSystem as any;
      const baseDir: string = (FS.documentDirectory ?? FS.cacheDirectory ?? '') as string;

      if (!baseDir) {
        Alert.alert('Error', 'No se encontró un directorio de documentos/cache válido');
        return;
      }

      const filename = `${baseDir}historial_labtec.csv`;
      await FileSystem.writeAsStringAsync(filename, csv);

      // Si luego instalas expo-sharing, puedes compartir:
      // import * as Sharing from 'expo-sharing';
      // await Sharing.shareAsync(filename, { mimeType: 'text/csv', dialogTitle: 'Historial (CSV)' });

      Alert.alert('Exportado', `Archivo guardado:\n${filename}`);
    } catch (e:any) {
      Alert.alert('Error', e?.message || 'No se pudo exportar CSV');
    }
  };

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.container}>
      <Text style={s.h1}>Historial</Text>

      <View style={s.filters}>
        <Chip label="Todos" active={filter==='ALL'} onPress={() => setFilter('ALL')} />
        {kinds.map(k => <Chip key={k} label={k} active={filter===k} onPress={() => setFilter(k)} />)}
      </View>

      {filtered.map((r, i) => (
        <View key={`${r.kind}-${i}-${r.ref_id}`} style={s.item}>
          <Text style={s.title}>{r.kind} · {r.ref_id}</Text>
          <Text style={s.meta}>{r.at ? new Date(r.at).toLocaleString() : '-'}</Text>
          {!!r.state && <Text style={s.meta}>Estado: {r.state}</Text>}
          {!!r.purpose && <Text style={s.meta}>Detalle: {r.purpose}</Text>}
          {r.hours!=null && <Text style={s.meta}>Horas: {r.hours}</Text>}
          {r.credits!=null && <Text style={s.meta}>Créditos: {r.credits}</Text>}
        </View>
      ))}

      {!filtered.length && <Text style={s.empty}>No hay registros.</Text>}

      <View style={{ height: 12 }} />
      <Pressable onPress={exportCsv} style={s.btn}>
        <Text style={s.btnText}>Exportar CSV</Text>
      </Pressable>
    </ScrollView>
  );
}

function Chip({ label, active, onPress }: { label: string; active?: boolean; onPress: ()=>void }) {
  return (
    <Pressable onPress={onPress} style={[s.chip, active && s.chipActive]}>
      <Text style={[s.chipText, active && s.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  screen:{ flex:1, backgroundColor:'#0b1220' },
  container:{ padding:16, gap:10 },
  h1:{ color:'#fff', fontSize:20, fontWeight:'800' },
  filters:{ flexDirection:'row', flexWrap:'wrap', gap:8, marginVertical:8 },
  chip:{ paddingVertical:6, paddingHorizontal:10, borderRadius:999, borderWidth:1, borderColor:'#334155' },
  chipActive:{ backgroundColor:'#1f2937' },
  chipText:{ color:'#94a3b8', fontWeight:'600' },
  chipTextActive:{ color:'#fff' },
  item:{ backgroundColor:'#111827', borderRadius:10, padding:12 },
  title:{ color:'#fff', fontWeight:'700' },
  meta:{ color:'#cbd5e1', marginTop:4, fontSize:12 },
  empty:{ color:'#94a3b8', marginTop:12, textAlign:'center' },
  btn:{ backgroundColor:'#0ea5e9', borderRadius:10, padding:12, alignItems:'center' },
  btnText:{ color:'#fff', fontWeight:'800' }
});
