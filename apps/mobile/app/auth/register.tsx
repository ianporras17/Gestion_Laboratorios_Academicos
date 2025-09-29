import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet } from 'react-native';
import { AuthApi } from '@/services/auth';

export default function RegisterScreen() {
  const [role, setRole] = useState<'ESTUDIANTE'|'DOCENTE'>('ESTUDIANTE');
  const [full, setFull] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass]   = useState('');
  const [program, setProgram] = useState('');
  const [studentId, setStudentId] = useState('');
  const [teacherCode, setTeacherCode] = useState('');
  const [phone, setPhone] = useState('');

  const doReg = async () => {
    if (!full || !email || !pass) return Alert.alert('Completar', 'Nombre, correo y contraseña');
    try {
      const { token, user } = await AuthApi.register({
        role,
        email: email.trim(),
        password: pass,
        full_name: full,
        student_id: role==='ESTUDIANTE' ? (studentId || undefined) : undefined,
        teacher_code: role==='DOCENTE' ? (teacherCode || undefined) : undefined,
        program_department: program || undefined,
        phone: phone || undefined,
      });
      AuthApi.setToken(token);
      Alert.alert('OK', `Cuenta creada: ${user.full_name}`);
    } catch (e:any) {
      Alert.alert('Error', e?.response?.data?.error || e.message || 'No se pudo registrar');
    }
  };

  return (
    <View style={s.container}>
      <Text style={s.h1}>Crear cuenta</Text>
      <TextInput style={s.input} placeholder="ROL (ESTUDIANTE/DOCENTE)" value={role} onChangeText={(v)=>setRole(v as any)} />
      <TextInput style={s.input} placeholder="Nombre completo" value={full} onChangeText={setFull}/>
      <TextInput style={s.input} placeholder="correo institucional" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail}/>
      <TextInput style={s.input} placeholder="contraseña" secureTextEntry value={pass} onChangeText={setPass}/>
      <TextInput style={s.input} placeholder="carrera / departamento" value={program} onChangeText={setProgram}/>
      {role==='ESTUDIANTE' ? (
        <TextInput style={s.input} placeholder="carné" value={studentId} onChangeText={setStudentId}/>
      ) : (
        <TextInput style={s.input} placeholder="código docente" value={teacherCode} onChangeText={setTeacherCode}/>
      )}
      <TextInput style={s.input} placeholder="teléfono" value={phone} onChangeText={setPhone}/>
      <Button title="Registrar" onPress={doReg} />
    </View>
  );
}
const s = StyleSheet.create({
  container:{ flex:1, padding:16, backgroundColor:'#0b1220' },
  h1:{ color:'#f02929ff', fontWeight:'800', fontSize:22, marginBottom:12, backgroundColor:'#000' },
  input:{ backgroundColor:'#f02727ff', borderRadius:8, padding:10, marginBottom:10, color:'#5a0fe4ff' }
});
