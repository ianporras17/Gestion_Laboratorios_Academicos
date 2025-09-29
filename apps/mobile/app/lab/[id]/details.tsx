import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TextInput, Button, Alert, ScrollView, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter  } from 'expo-router';
import { LabsApi } from '../../../services/labs';              // 👈 relativo
import type {
  Lab, LabContact, LabPolicies, LabHour,
  FixedResource, Consumable, LabHistory
} from '../../../types/labs';                 
                 // 👈 relativo

export default function LabDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const labId = Number(id);

  const [lab, setLab] = useState<Lab | null>(null);

  // Contactos
  const [contacts, setContacts] = useState<LabContact[]>([]);
  const [cName, setCName] = useState(''); const [cRole, setCRole] = useState('');
  const [cPhone, setCPhone] = useState(''); const [cEmail, setCEmail] = useState('');

  // Políticas
  const [pol, setPol] = useState<LabPolicies | null>(null);
  const [reqAcad, setReqAcad] = useState(''); const [reqSafe, setReqSafe] = useState(''); const [capMax, setCapMax] = useState('');

  // Horarios
  const [hours, setHours] = useState<LabHour[]>([]);
  const [hDay, setHDay] = useState('1'); const [hOpen, setHOpen] = useState('08:00'); const [hClose, setHClose] = useState('12:00');

  // Recursos fijos
  const [fixed, setFixed] = useState<FixedResource[]>([]);
  const [frName, setFrName] = useState(''); const [frCode, setFrCode] = useState(''); const [frStatus, setFrStatus] = useState('DISPONIBLE'); const [frDate, setFrDate] = useState('');

  // Consumibles
  const [cons, setCons] = useState<Consumable[]>([]);
  const [cnName, setCnName] = useState(''); const [cnUnit, setCnUnit] = useState('unid'); const [cnReorder, setCnReorder] = useState('0'); const [cnQty, setCnQty] = useState('0');

  // Historial
  const [history, setHistory] = useState<LabHistory[]>([]);

  const loadAll = useCallback(async () => {
    try {
      const [labD, cts, p, hs, fr, co, hi] = await Promise.all([
        LabsApi.get(labId),
        LabsApi.listContacts(labId),
        LabsApi.getPolicies(labId),
        LabsApi.getHours(labId),
        LabsApi.listFixedResources(labId),
        LabsApi.listConsumables(labId),
        LabsApi.history(labId),
      ]);
      setLab(labD);
      setContacts(cts);
      setPol(p);
      setReqAcad(p?.academic_requirements || '');
      setReqSafe(p?.safety_requirements || '');
      setCapMax(p?.capacity_max ? String(p.capacity_max) : '');
      setHours(hs);
      setFixed(fr);
      setCons(co);
      setHistory(hi);
    } catch (e:any) {
      Alert.alert('Error', e.message ?? 'No se pudo cargar');
    }
  }, [labId]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Actions
  const addContact = async () => {
    if (!cName || !cRole || !cEmail) return Alert.alert('Completar', 'Nombre, cargo y correo son obligatorios');
    const r = await LabsApi.addContact(labId, { name: cName, role: cRole, phone: cPhone || undefined, email: cEmail });
    setContacts(prev => [r, ...prev]);
    setCName(''); setCRole(''); setCPhone(''); setCEmail('');
  };

  const savePolicies = async () => {
    const r = await LabsApi.upsertPolicies(labId, {
      academic_requirements: reqAcad || undefined,
      safety_requirements: reqSafe || undefined,
      capacity_max: capMax ? Number(capMax) : undefined,
    });
    setPol(r);
    Alert.alert('OK', 'Políticas guardadas');
  };

  const addHour = async () => {
    const updated = await LabsApi.setHours(labId, [
      ...hours.map(h => ({ day_of_week: h.day_of_week, opens: h.opens, closes: h.closes })),
      { day_of_week: Number(hDay), opens: hOpen.length===5?`${hOpen}:00`:hOpen, closes: hClose.length===5?`${hClose}:00`:hClose }
    ]);
    setHours(updated);
  };

  const addFixed = async () => {
    if (!frName || !frCode) return Alert.alert('Completar', 'Nombre y código de inventario obligatorios');
    const r = await LabsApi.addFixedResource(labId, {
      name: frName, inventory_code: frCode, status: frStatus as any, last_maintenance_date: frDate || undefined
    });
    setFixed(prev => [r, ...prev]); setFrName(''); setFrCode(''); setFrStatus('DISPONIBLE'); setFrDate('');
  };

  const addConsumable = async () => {
    if (!cnName || !cnUnit) return Alert.alert('Completar', 'Nombre y unidad obligatorios');
    const r = await LabsApi.addConsumable(labId, {
      name: cnName, unit: cnUnit, reorder_point: Number(cnReorder||0), qty_available: Number(cnQty||0)
    });
    setCons(prev => [r, ...prev]); setCnName(''); setCnUnit('unid'); setCnReorder('0'); setCnQty('0');
  };

  if (!lab) return <View style={{flex:1,justifyContent:'center',alignItems:'center'}}><Text>Cargando...</Text></View>;

  return (
    
    <ScrollView contentContainerStyle={s.container}>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
        <Button title="Calendario" onPress={() => router.push(`/lab/${labId}/calendar`)} />
        <Button title="Catálogo" onPress={() => router.push(`/lab/${labId}/catalog`)} />
      </View>

      <Text style={s.h1}>{lab.name}</Text>

      <Text style={s.h1}>{lab.name}</Text>
      <Text style={s.sub}>{lab.code} · {lab.location}</Text>

      {/* CONTACTOS */}
      <View style={s.card}>
        <Text style={s.h2}>Contactos</Text>
        <TextInput style={s.input} placeholder="Nombre" value={cName} onChangeText={setCName}/>
        <TextInput style={s.input} placeholder="Cargo" value={cRole} onChangeText={setCRole}/>
        <TextInput style={s.input} placeholder="Teléfono" value={cPhone} onChangeText={setCPhone}/>
        <TextInput style={s.input} placeholder="Correo" value={cEmail} onChangeText={setCEmail}/>
        <Button title="Agregar contacto" onPress={addContact}/>
        {contacts.map(c => <Text key={c.id} style={s.li}>• {c.name} ({c.role}) – {c.email}</Text>)}
      </View>

      {/* POLÍTICAS */}
      <View style={s.card}>
        <Text style={s.h2}>Políticas</Text>
        <TextInput style={s.input} placeholder="Requisitos académicos" value={reqAcad} onChangeText={setReqAcad}/>
        <TextInput style={s.input} placeholder="Requisitos de seguridad" value={reqSafe} onChangeText={setReqSafe}/>
        <TextInput style={s.input} placeholder="Capacidad máxima" keyboardType="numeric" value={capMax} onChangeText={setCapMax}/>
        <Button title="Guardar políticas" onPress={savePolicies}/>
        {pol ? <Text style={s.muted}>Actualizado</Text> : null}
      </View>

      {/* HORARIOS */}
      <View style={s.card}>
        <Text style={s.h2}>Horarios</Text>
        <TextInput style={s.input} placeholder="Día (0=Dom ... 6=Sáb)" keyboardType="numeric" value={hDay} onChangeText={setHDay}/>
        <TextInput style={s.input} placeholder="Abre (HH:mm)" value={hOpen} onChangeText={setHOpen}/>
        <TextInput style={s.input} placeholder="Cierra (HH:mm)" value={hClose} onChangeText={setHClose}/>
        <Button title="Agregar/Actualizar día" onPress={addHour}/>
        {hours.map(h => <Text key={h.id} style={s.li}>• {h.day_of_week}: {h.opens} - {h.closes}</Text>)}
      </View>

      {/* RECURSOS FIJOS */}
      <View style={s.card}>
        <Text style={s.h2}>Recursos fijos</Text>
        <TextInput style={s.input} placeholder="Nombre" value={frName} onChangeText={setFrName}/>
        <TextInput style={s.input} placeholder="Código de inventario" value={frCode} onChangeText={setFrCode}/>
        <TextInput style={s.input} placeholder="Estado (DISPONIBLE/RESERVADO/MANTENIMIENTO/INACTIVO)" value={frStatus} onChangeText={setFrStatus}/>
        <TextInput style={s.input} placeholder="Último mantenimiento (YYYY-MM-DD)" value={frDate} onChangeText={setFrDate}/>
        <Button title="Agregar recurso" onPress={addFixed}/>
        {fixed.map(f => <Text key={f.id} style={s.li}>• {f.inventory_code} {f.name} [{f.status}]</Text>)}
      </View>

      {/* CONSUMIBLES */}
      <View style={s.card}>
        <Text style={s.h2}>Consumibles</Text>
        <TextInput style={s.input} placeholder="Nombre" value={cnName} onChangeText={setCnName}/>
        <TextInput style={s.input} placeholder="Unidad (ml/g/unid)" value={cnUnit} onChangeText={setCnUnit}/>
        <TextInput style={s.input} placeholder="Punto de reorden" keyboardType="numeric" value={cnReorder} onChangeText={setCnReorder}/>
        <TextInput style={s.input} placeholder="Cantidad disponible" keyboardType="numeric" value={cnQty} onChangeText={setCnQty}/>
        <Button title="Agregar consumible" onPress={addConsumable}/>
        {cons.map(c => <Text key={c.id} style={s.li}>• {c.name} {c.qty_available}{c.unit} (reorden {c.reorder_point})</Text>)}
      </View>

      {/* HISTORIAL */}
      <View style={s.card}>
        <Text style={s.h2}>Historial</Text>
        {history.map(h => <Text key={h.id} style={s.li}>• {h.action} – {new Date(h.created_at).toLocaleString()}</Text>)}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:{ padding:16 },
  h1:{ fontSize:22, fontWeight:'700' },
  sub:{ color:'#555', marginBottom:12 },
  card:{ backgroundColor:'#fff', borderRadius:8, padding:12, marginBottom:12, elevation:2 },
  h2:{ fontSize:16, fontWeight:'600', marginBottom:8 },
  input:{ borderWidth:1, borderColor:'#ccc', borderRadius:6, padding:8, marginTop:6, marginBottom:6 },
  li:{ marginTop:6, color:'#333' },
  muted:{ color:'#666', marginTop:6 },
});
