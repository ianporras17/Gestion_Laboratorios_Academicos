// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabsLayout() {
  return (
    <Tabs 
      screenOptions={{ 
        headerTitleAlign: 'center',
        tabBarActiveTintColor: '#0a7ea4',
        tabBarInactiveTintColor: '#687076',
      }}
    >
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }} 
      />
      <Tabs.Screen 
        name="labs" 
        options={{ 
          title: 'Laboratorios',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="flask-outline" size={size} color={color} />
          ),
        }} 
      />
      <Tabs.Screen 
        name="explore" 
        options={{ 
          title: 'Explorar',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search-outline" size={size} color={color} />
          ),
        }} 
      />
      <Tabs.Screen 
        name="profile" 
        options={{ 
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }} 
      />
    </Tabs>
  );
}
