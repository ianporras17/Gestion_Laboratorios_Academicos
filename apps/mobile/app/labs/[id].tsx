import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { LabService } from '@/services/labService';
import { LabDetailHeader } from '@/components/labs/LabDetailHeader';
import { LabInfoSection } from '@/components/labs/LabInfoSection';
import { LabResponsiblesSection } from '@/components/labs/LabResponsiblesSection';
import { LabPoliciesSection } from '@/components/labs/LabPoliciesSection';
import { LabHoursSection } from '@/components/labs/LabHoursSection';
import { LabResourcesSection } from '@/components/labs/LabResourcesSection';
import { LabHistorySection } from '@/components/labs/LabHistorySection';

interface Lab {
  id: string;
  name: string;
  internal_code: string;
  location: string;
  description?: string;
  email_contact: string;
  capacity_max?: number;
  is_active: boolean;
  school_department_name?: string;
  responsibles: LabResponsible[];
  policies?: LabPolicies;
  open_hours: LabOpenHour[];
  resources: LabResource[];
  recent_history: LabHistory[];
  created_at: string;
  updated_at: string;
}

interface LabResponsible {
  id: string;
  full_name: string;
  position_title: string;
  phone?: string;
  email: string;
  is_primary: boolean;
}

interface LabPolicies {
  academic_req?: string;
  safety_req?: string;
  notes?: string;
}

interface LabOpenHour {
  id: string;
  weekday: number;
  time_start: string;
  time_end: string;
}

interface LabResource {
  id: string;
  type: string;
  name: string;
  description?: string;
  allowed_roles: string[];
}

interface LabHistory {
  id: string;
  action_type: string;
  detail: string;
  actor_name?: string;
  created_at: string;
}

export default function LabDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [lab, setLab] = useState<Lab | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'responsibles' | 'policies' | 'hours' | 'resources' | 'history'>('info');

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');

  useEffect(() => {
    if (id) {
      loadLab();
    }
  }, [id]);

  const loadLab = async () => {
    try {
      setLoading(true);
      const response = await LabService.getLabById(id!);
      if (response.success) {
        setLab(response.data);
      } else {
        Alert.alert('Error', 'No se pudo cargar el laboratorio');
        router.back();
      }
    } catch (error) {
      console.error('Error loading lab:', error);
      Alert.alert('Error', 'Error al cargar el laboratorio');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLab();
    setRefreshing(false);
  };

  const handleEdit = () => {
    router.push(`/labs/${id}/edit`);
  };

  const handleManageResponsibles = () => {
    router.push(`/labs/${id}/responsibles`);
  };

  const handleManagePolicies = () => {
    router.push(`/labs/${id}/policies`);
  };

  const handleManageHours = () => {
    router.push(`/labs/${id}/hours`);
  };

  const handleViewResources = () => {
    router.push(`/labs/${id}/resources`);
  };

  const handleViewHistory = () => {
    router.push(`/labs/${id}/history`);
  };

  const tabs = [
    { key: 'info', label: 'Información', icon: 'information-circle-outline' },
    { key: 'responsibles', label: 'Responsables', icon: 'people-outline' },
    { key: 'policies', label: 'Políticas', icon: 'document-text-outline' },
    { key: 'hours', label: 'Horarios', icon: 'time-outline' },
    { key: 'resources', label: 'Recursos', icon: 'cube-outline' },
    { key: 'history', label: 'Historial', icon: 'time-outline' },
  ] as const;

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tintColor} />
          <ThemedText style={styles.loadingText}>Cargando laboratorio...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (!lab) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#F44336" />
          <ThemedText style={styles.errorTitle}>Laboratorio no encontrado</ThemedText>
          <ThemedText style={styles.errorSubtitle}>
            El laboratorio que buscas no existe o no tienes permisos para verlo
          </ThemedText>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ThemedText style={styles.backButtonText}>Volver</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={tintColor}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <LabDetailHeader
          lab={lab}
          onEdit={handleEdit}
        />

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsContent}
          >
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.tab,
                  activeTab === tab.key && styles.activeTab
                ]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Ionicons
                  name={tab.icon as any}
                  size={20}
                  color={activeTab === tab.key ? 'white' : tintColor}
                />
                <Text style={[
                  styles.tabText,
                  activeTab === tab.key && styles.activeTabText
                ]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {activeTab === 'info' && (
            <LabInfoSection
              lab={lab}
              onManageResponsibles={handleManageResponsibles}
              onManagePolicies={handleManagePolicies}
              onManageHours={handleManageHours}
            />
          )}

          {activeTab === 'responsibles' && (
            <LabResponsiblesSection
              lab={lab}
              onManage={handleManageResponsibles}
            />
          )}

          {activeTab === 'policies' && (
            <LabPoliciesSection
              lab={lab}
              onManage={handleManagePolicies}
            />
          )}

          {activeTab === 'hours' && (
            <LabHoursSection
              lab={lab}
              onManage={handleManageHours}
            />
          )}

          {activeTab === 'resources' && (
            <LabResourcesSection
              lab={lab}
              onViewAll={handleViewResources}
            />
          )}

          {activeTab === 'history' && (
            <LabHistorySection
              lab={lab}
              onViewAll={handleViewHistory}
            />
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#0a7ea4',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  tabsContainer: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 8,
  },
  tabsContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'white',
    marginRight: 8,
  },
  activeTab: {
    backgroundColor: '#0a7ea4',
  },
  tabText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
    color: '#0a7ea4',
  },
  activeTabText: {
    color: 'white',
  },
  content: {
    flex: 1,
    padding: 16,
  },
});
