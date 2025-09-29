import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet } from 'react-native';
import { AuthApi } from '@/services/auth';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [pass,  setPass]  = useState('');

  const doLogin = async () => {
    if (!email || !pass) return Alert.alert('Completar', 'Correo y contraseña');
    try {
      const { token, user } = await AuthApi.login({ email: email.trim(), password: pass });
      AuthApi.setToken(token);
      Alert.alert('OK', `Bienvenido ${user.full_name}`);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error || e.message || 'No se pudo iniciar sesión');
    }
  };

  return (
    <View style={s.container}>
      <Text style={s.h1}>Iniciar sesión</Text>
      <TextInput
        style={s.input}
        placeholder="correo@estudiantec.cr"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={s.input}
        placeholder="contraseña"
        secureTextEntry
        value={pass}
        onChangeText={setPass}
      />
      <Button title="Entrar" onPress={doLogin} />
    </View>
  );
}

const s = StyleSheet.create({
  container:{ flex:1, padding:16, backgroundColor:'#cad1ddff' },
  h1:{ color:'#f00b0bff', fontWeight:'800', fontSize:22, marginBottom:12, backgroundColor:'#000' },
  input:{ backgroundColor:'#fff', borderRadius:8, padding:10, marginBottom:10 }
});
