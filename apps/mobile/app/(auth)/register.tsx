import { useState } from 'react';
import { Alert, Button, Text, TextInput, View, TouchableOpacity } from 'react-native';
import { api, ApiError } from '../../lib/api';
import { saveToken } from '../../lib/auth';
import { router } from 'expo-router';

const STUDENT_DOMAINS = ['@estudiante.tec.ac.cr', '@estudiantec.cr'];
const TEACHER_DOMAINS = ['@itcr.ac.cr'];

function domainMatchesRole(email: string, role: 'student'|'teacher') {
  const em = (email || '').toLowerCase().trim();
  const arr = role === 'student' ? STUDENT_DOMAINS : TEACHER_DOMAINS;
  return arr.some(d => em.endsWith(d));
}

export default function Register() {
  const [role, setRole] = useState<'student'|'teacher'>('student');
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [fullName, setFullName] = useState('');
  const [idCode, setIdCode] = useState('');
  const [career, setCareer] = useState('');
  const [phone, setPhone] = useState('');

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!email) e.email = 'El correo es obligatorio';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Formato de correo inválido';
    else if (!domainMatchesRole(email, role)) e.email = `El correo no coincide con el rol ${role}`;

    if (!pwd) e.password = 'La contraseña es obligatoria';
    else if (pwd.length < 8) e.password = 'Mínimo 8 caracteres';

    if (!fullName) e.full_name = 'Requerido';
    if (!idCode) e.id_code = 'Requerido';
    if (!career) e.career_or_department = 'Requerido';
    // phone es opcional

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onRegister() {
    if (!validate()) return;
    setLoading(true);
    try {
      const { token } = await api.register({
        email: email.trim(),
        password: pwd,
        role,
        full_name: fullName,
        id_code: idCode,
        career_or_department: career,
        phone: phone || undefined
      });
      await saveToken(token);
      router.replace('/profile'); // navegación pública (sin el nombre del grupo)
    } catch (err: any) {
      if (err instanceof ApiError) {
        // Mapear errores del backend a campos (express-validator)
        const map: Record<string,string> = {};
        err.details?.forEach(d => {
          const key = (d.param || d.path || 'general') as string;
          if (!map[key]) map[key] = d.msg || 'Dato inválido';
        });
        setErrors(map);
        // Además muestra un toast/alert resumido
        Alert.alert('Registro inválido', err.message);
      } else {
        Alert.alert('Error', err?.message || 'Error inesperado');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ flex:1, padding:16, justifyContent:'center', gap:12 }}>
      <Text style={{ fontSize:24, fontWeight:'700', textAlign:'center' }}>Crear cuenta</Text>

      <Text>Rol (student/teacher)</Text>
      <TextInput
        value={role}
        onChangeText={(t)=> setRole(t==='teacher'?'teacher':'student')}
        style={{ borderWidth:1, borderRadius:8, padding:10, borderColor: errors.role ? 'red' : '#ccc' }}
      />
      {errors.role ? <Text style={{ color:'red' }}>{errors.role}</Text> : null}

      <Text>Correo institucional</Text>
      <TextInput
        placeholder="alguien@estudiante.tec.ac.cr"
        autoCapitalize="none" keyboardType="email-address"
        value={email} onChangeText={t => { setEmail(t); if (errors.email) setErrors({...errors, email:''}); }}
        style={{ borderWidth:1, borderRadius:8, padding:10, borderColor: errors.email ? 'red' : '#ccc' }}
      />
      {errors.email ? <Text style={{ color:'red' }}>{errors.email}</Text> : null}

      <Text>Contraseña</Text>
      <TextInput
        placeholder="********" secureTextEntry
        value={pwd} onChangeText={t => { setPwd(t); if (errors.password) setErrors({...errors, password:''}); }}
        style={{ borderWidth:1, borderRadius:8, padding:10, borderColor: errors.password ? 'red' : '#ccc' }}
      />
      {errors.password ? <Text style={{ color:'red' }}>{errors.password}</Text> : null}

      <Text>Nombre completo</Text>
      <TextInput
        value={fullName} onChangeText={t => { setFullName(t); if (errors.full_name) setErrors({...errors, full_name:''}); }}
        style={{ borderWidth:1, borderRadius:8, padding:10, borderColor: errors.full_name ? 'red' : '#ccc' }}
      />
      {errors.full_name ? <Text style={{ color:'red' }}>{errors.full_name}</Text> : null}

      <Text>Carné/Código</Text>
      <TextInput
        value={idCode} onChangeText={t => { setIdCode(t); if (errors.id_code) setErrors({...errors, id_code:''}); }}
        style={{ borderWidth:1, borderRadius:8, padding:10, borderColor: errors.id_code ? 'red' : '#ccc' }}
      />
      {errors.id_code ? <Text style={{ color:'red' }}>{errors.id_code}</Text> : null}

      <Text>Carrera/Departamento</Text>
      <TextInput
        value={career} onChangeText={t => { setCareer(t); if (errors.career_or_department) setErrors({...errors, career_or_department:''}); }}
        style={{ borderWidth:1, borderRadius:8, padding:10, borderColor: errors.career_or_department ? 'red' : '#ccc' }}
      />
      {errors.career_or_department ? <Text style={{ color:'red' }}>{errors.career_or_department}</Text> : null}

      <Text>Teléfono (opcional)</Text>
      <TextInput
        value={phone} onChangeText={setPhone} keyboardType="phone-pad"
        style={{ borderWidth:1, borderRadius:8, padding:10, borderColor: '#ccc' }}
      />

      <Button title={loading ? 'Registrando…' : 'Registrarme'} onPress={onRegister} disabled={loading} />

      <TouchableOpacity onPress={() => router.replace('/login')}>
        <Text style={{ textAlign:'center', marginTop:12 }}>¿Ya tienes cuenta? Inicia sesión</Text>
      </TouchableOpacity>
    </View>
  );
}
