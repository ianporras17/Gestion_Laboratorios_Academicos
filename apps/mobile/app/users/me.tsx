    import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet } from 'react-native';
import { UsersApi } from '@/services/users';

export default function MeScreen() {
  const [me, setMe] = useState<any>(null);
  const [full, setFull] = useState(''); const [prog, setProg] = useState('');
  const [phone, setPhone] = useState(''); const [studentId, setStudentId] = useState('');
  const [teacher, setTeacher] = useState('');

  const load = async () => {
    try { const r = await UsersApi.me(); setMe(r);
      setFull(r.full_name||''); setProg(r.program_department||''); setPhone(r.phone||'');
      setStudentId(r.student_id||''); setTeacher(r.teacher_code||'');
    } catch(e:any){ Alert.alert('Error', e.message); }
  };
  useEffect(()=>{ load(); }, []);

  const save = async () => {
    try {
      await UsersApi.updateMe({
        full_name: full || undefined,
        program_department: prog || undefined,
        phone: phone || undefined,
        student_id: studentId || undefined,
        teacher_code: teacher || undefined
      });
      Alert.alert('OK','Perfil actualizado'); load();
    } catch(e:any){ Alert.alert('Error', e.message); }
  };

  if (!me) return <View style={s.center}><Text>Cargando...</Text></View>;

  return (
    <View style={s.container}>
      <Text style={s.h1}>Mi perfil</Text>
      <Text style={s.sub}>{me.email} · {me.role}</Text>

      <TextInput style={s.input} placeholder="Nombre" value={full} onChangeText={setFull}/>
      <TextInput style={s.input} placeholder="Carrera/Departamento" value={prog} onChangeText={setProg}/>
      <TextInput style={s.input} placeholder="Teléfono" value={phone} onChangeText={setPhone}/>
      <TextInput style={s.input} placeholder="Carné (si estudiante)" value={studentId} onChangeText={setStudentId}/>
      <TextInput style={s.input} placeholder="Código docente (si docente)" value={teacher} onChangeText={setTeacher}/>

      <Button title="Guardar" onPress={save} />
    </View>
  );
}
const s = StyleSheet.create({
  center:{ flex:1, alignItems:'center', justifyContent:'center' },
  container:{ flex:1, padding:16, backgroundColor:'#0b1220' },
  h1:{ color:'#fff', fontWeight:'800', fontSize:22, marginBottom:6 },
  sub:{ color:'#a3a3a3', marginBottom:12 },
  input:{ backgroundColor:'#fff', borderRadius:8, padding:10, marginBottom:10 }
});
