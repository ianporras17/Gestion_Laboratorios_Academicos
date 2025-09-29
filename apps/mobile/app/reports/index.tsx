// app/reports/index.tsx
import React, { useState } from 'react';
import {
  View, Text, TextInput, Button, FlatList, Pressable,
  StyleSheet, Alert, Linking, ActivityIndicator
} from 'react-native';
import { ReportsApi } from '@/services/reports';
import { Link } from 'expo-router';

type Tab = 'usage' | 'inventory' | 'maintenance';

export default function ReportsScreen() {
  const [tab, setTab] = useState<Tab>('usage');
  const [labId, setLabId] = useState('1');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [limit, setLimit] = useState('20'); // solo para "usage"
  const [loading, setLoading] = useState(false);

  const [usage, setUsage] = useState<any | null>(null);
  const [inv, setInv] = useState<any | null>(null);
  const [maint, setMaint] = useState<any | null>(null);

  const load = async () => {
    if (!labId) return Alert.alert('Completar', 'lab_id es requerido');
    try {
      setLoading(true);
      if (tab === 'usage') {
        const data = await ReportsApi.usage({
          lab_id: Number(labId),
          from: from || undefined,
          to: to || undefined,
          limit: Number(limit || 20),
        });
        setUsage(data);
      } else if (tab === 'inventory') {
        const data = await ReportsApi.inventory({
          lab_id: Number(labId),
          from: from || undefined,
          to: to || undefined,
        });
        setInv(data);
      } else {
        const data = await ReportsApi.maintenance({
          lab_id: Number(labId),
          from: from || undefined,
          to: to || undefined,
        });
        setMaint(data);
      }
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'No se pudo cargar');
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (!labId) return Alert.alert('Completar', 'lab_id es requerido');
    const url = ReportsApi.buildCsvUrl(tab, {
      lab_id: Number(labId),
      from: from || undefined,
      to: to || undefined,
      limit: Number(limit || 20),
    });
    Linking.openURL(url);
  };

  let items: Array<{ key: string; kind: 'title' | 'row'; text: string }> = [];

  if (tab === 'usage' && usage) {
    items.push({ key: 'u_t1', kind: 'title', text: 'Recursos más usados' });
    (usage.resources_top || []).forEach((r: any, i: number) => {
      items.push({
        key: `u_r_${i}`,
        kind: 'row',
        text: `• ${r.resource_name} (#${r.resource_id}) — asignaciones: ${r.assignments_count}, qty: ${r.qty_assigned}`,
      });
    });
    items.push({ key: 'u_t2', kind: 'title', text: 'Usuarios más frecuentes' });
    (usage.users_top || []).forEach((u: any, i: number) => {
      const label = u.name || u.email || `user_id:${u.user_id ?? '—'}`;
      items.push({
        key: `u_u_${i}`,
        kind: 'row',
        text: `• ${label} — asignaciones: ${u.assignments_count}, qty: ${u.qty_assigned}`,
      });
    });
  }

  if (tab === 'inventory' && inv) {
    items.push({ key: 'i_t1', kind: 'title', text: 'Recursos por estado' });
    (inv.resources_status || []).forEach((s: any, i: number) => {
      items.push({ key: `i_s_${i}`, kind: 'row', text: `• ${s.status}: ${s.count}` });
    });

    items.push({ key: 'i_t2', kind: 'title', text: 'Consumibles críticos (<= reorden)' });
    (inv.consumables_critical || []).forEach((c: any, i: number) => {
      items.push({
        key: `i_c_${i}`,
        kind: 'row',
        text: `• ${c.name}: ${c.qty_available}${c.unit} (reorden ${c.reorder_point})`,
      });
    });

    items.push({ key: 'i_t3', kind: 'title', text: 'Consumos en el periodo' });
    (inv.consumptions_period || []).forEach((c: any, i: number) => {
      items.push({
        key: `i_p_${i}`,
        kind: 'row',
        text: `• ${c.consumable_name}: ${c.qty_consumed}`,
      });
    });
  }

  if (tab === 'maintenance' && maint) {
    items.push({ key: 'm_t1', kind: 'title', text: 'Resumen' });
    if (maint.summary) {
      items.push({
        key: 'm_s1',
        kind: 'row',
        text: `• Eventos: ${maint.summary.events_count}`,
      });
      items.push({
        key: 'm_s2',
        kind: 'row',
        text: `• Downtime prom.: ${(Number(maint.summary.avg_seconds) / 3600).toFixed(2)} h`,
      });
      items.push({
        key: 'm_s3',
        kind: 'row',
        text: `• Downtime total: ${(Number(maint.summary.total_seconds) / 3600).toFixed(2)} h`,
      });
    }
    items.push({ key: 'm_t2', kind: 'title', text: 'Por recurso' });
    (maint.maintenance_by_resource || []).forEach((r: any, i: number) => {
      items.push({
        key: `m_r_${i}`,
        kind: 'row',
        text: `• resource_id: ${r.resource_id ?? 'LAB'} — eventos: ${r.events_count}, avg: ${(Number(r.avg_seconds) / 3600).toFixed(2)} h, total: ${(Number(r.total_seconds) / 3600).toFixed(2)} h`,
      });
    });
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(it) => it.key}
      ListHeaderComponent={
        <View style={{ padding: 12 }}>
          <Text style={s.h1}>Reportes Operativos</Text>

          {/* atajo a tu reporte legacy ya existente */}
          <Link href="/reports/usage" asChild>
            <Pressable style={[s.btn, { backgroundColor: '#334155' }]}>
              <Text style={s.btnTxt}>Ir a “Reporte de uso (legacy)”</Text>
            </Pressable>
          </Link>

          {/* tabs */}
          <View style={s.tabs}>
            <Pressable onPress={() => setTab('usage')} style={[s.tab, tab === 'usage' && s.tabActive]}>
              <Text style={[s.tabTxt, tab === 'usage' && s.tabTxtActive]}>Uso</Text>
            </Pressable>
            <Pressable onPress={() => setTab('inventory')} style={[s.tab, tab === 'inventory' && s.tabActive]}>
              <Text style={[s.tabTxt, tab === 'inventory' && s.tabTxtActive]}>Inventario</Text>
            </Pressable>
            <Pressable onPress={() => setTab('maintenance')} style={[s.tab, tab === 'maintenance' && s.tabActive]}>
              <Text style={[s.tabTxt, tab === 'maintenance' && s.tabTxtActive]}>Mantenimiento</Text>
            </Pressable>
          </View>

          {/* filtros */}
          <View style={s.row}>
            <TextInput style={s.input} placeholder="lab_id" keyboardType="numeric" value={labId} onChangeText={setLabId} />
            <TextInput style={s.input} placeholder="from (YYYY-MM-DD)" value={from} onChangeText={setFrom} />
            <TextInput style={s.input} placeholder="to (YYYY-MM-DD)" value={to} onChangeText={setTo} />
          </View>
          {tab === 'usage' && (
            <View style={[s.row, { marginTop: 8 }]}>
              <TextInput
                style={s.input}
                placeholder="limit (top N)"
                keyboardType="numeric"
                value={limit}
                onChangeText={setLimit}
              />
            </View>
          )}

          <View style={[s.row, { marginTop: 8 }]}>
            <Button title="Buscar" onPress={load} />
            <View style={{ width: 8 }} />
            <Button title="Exportar CSV" onPress={exportCSV} />
          </View>

          {loading && <ActivityIndicator style={{ marginTop: 10 }} />}
        </View>
      }
      renderItem={({ item }) =>
        item.kind === 'title' ? (
          <Text style={s.section}>{item.text}</Text>
        ) : (
          <View style={s.rowItem}>
            <Text style={s.itemTxt}>{item.text}</Text>
          </View>
        )
      }
      contentContainerStyle={{ padding: 12 }}
    />
  );
}

const s = StyleSheet.create({
  h1: { fontSize: 20, fontWeight: '800', marginBottom: 8 },
  tabs: { flexDirection: 'row', gap: 8, marginTop: 8 },
  tab: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#e5e7eb' },
  tabActive: { backgroundColor: '#2563eb' },
  tabTxt: { color: '#111827', fontWeight: '700' },
  tabTxtActive: { color: '#fff' },
  row: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 6, padding: 8, flex: 1 },
  section: { fontWeight: '800', marginTop: 14, marginBottom: 6 },
  rowItem: { backgroundColor: '#fff', padding: 10, borderRadius: 8, marginBottom: 8, elevation: 1 },
  itemTxt: { color: '#111827' },
  btn: { padding: 10, borderRadius: 8, alignItems: 'center', marginBottom: 8 },
  btnTxt: { color: '#fff', fontWeight: '700' },
});
