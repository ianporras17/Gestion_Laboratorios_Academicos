import { useState } from 'react';
import { Alert, Button, Text, TextInput, View, TouchableOpacity } from 'react-native';
import { api, ApiError } from '../../lib/api';
import { saveToken } from '../../lib/auth';
import { router } from 'expo-router';

export default function Login() {
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const e: Record<string,string> = {};
    if (!email) e.email = 'El correo es obligatorio';
    if (!pwd) e.password = 'La contraseña es obligatoria';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onLogin() {
    if (!validate()) return;
    setLoading(true);
    try {
      const { token } = await api.login(email.trim(), pwd);
      await saveToken(token);
      router.replace('/profile');
    } catch (err: any) {
      if (err instanceof ApiError) {
        Alert.alert('No se pudo iniciar sesión', err.message); // backend suele dar 401: Invalid credentials
      } else {
        Alert.alert('Error', err?.message || 'Error inesperado');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ flex:1, padding:16, justifyContent:'center', gap:12 }}>
      <Text style={{ fontSize:24, fontWeight:'700', textAlign:'center' }}>Iniciar sesión</Text>

      <Text>Correo</Text>
      <TextInput
        placeholder="correo@estudiante.tec.ac.cr"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={t => { setEmail(t); if (errors.email) setErrors({...errors, email:''}); }}
        style={{ borderWidth:1, borderRadius:8, padding:10, borderColor: errors.email ? 'red' : '#ccc' }}
      />
      {errors.email ? <Text style={{ color:'red' }}>{errors.email}</Text> : null}

      <Text>Contraseña</Text>
      <TextInput
        placeholder="********"
        secureTextEntry
        value={pwd}
        onChangeText={t => { setPwd(t); if (errors.password) setErrors({...errors, password:''}); }}
        style={{ borderWidth:1, borderRadius:8, padding:10, borderColor: errors.password ? 'red' : '#ccc' }}
      />
      {errors.password ? <Text style={{ color:'red' }}>{errors.password}</Text> : null}

      <Button title={loading ? 'Entrando…' : 'Entrar'} onPress={onLogin} disabled={loading} />

      <TouchableOpacity onPress={() => router.push('/register')}>
        <Text style={{ textAlign:'center', marginTop:12 }}>¿No tienes cuenta? Regístrate</Text>
      </TouchableOpacity>
    </View>
  );
}
