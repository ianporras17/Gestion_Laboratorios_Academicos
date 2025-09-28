import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { router } from 'expo-router';
import { getToken } from '../lib/auth';

export default function Index() {
  useEffect(() => {
    (async () => {
      const t = await getToken();
      router.replace(t ? '/profile' : '/login');
    })();
  }, []);
  return (
    <View style={{flex:1,alignItems:'center',justifyContent:'center'}}>
      <ActivityIndicator size="large" />
    </View>
  );
}
