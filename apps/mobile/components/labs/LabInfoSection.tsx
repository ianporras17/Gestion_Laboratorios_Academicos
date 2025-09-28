import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';

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
  responsibles: any[];
  policies?: any;
  open_hours: any[];
  resources: any[];
  recent_history: any[];
  created_at: string;
  updated_at: string;
}

interface LabInfoSectionProps {
  lab: Lab;
  onManageResponsibles: () => void;
  onManagePolicies: () => void;
  onManageHours: () => void;
}

export function LabInfoSection({ 
  lab, 
  onManageResponsibles, 
  onManagePolicies, 
  onManageHours 
}: LabInfoSectionProps) {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const iconColor = useThemeColor({}, 'icon');

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getWeekdayName = (weekday: number) => {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[weekday];
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Información Básica */}
      <ThemedView style={[styles.section, { backgroundColor }]}>
        <ThemedText style={styles.sectionTitle}>Información Básica</ThemedText>
        
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <ThemedText style={styles.infoLabel}>Código Interno</ThemedText>
            <ThemedText style={styles.infoValue}>{lab.internal_code}</ThemedText>
          </View>
          
          <View style={styles.infoItem}>
            <ThemedText style={styles.infoLabel}>Ubicación</ThemedText>
            <ThemedText style={styles.infoValue}>{lab.location}</ThemedText>
          </View>
          
          <View style={styles.infoItem}>
            <ThemedText style={styles.infoLabel}>Email de Contacto</ThemedText>
            <ThemedText style={styles.infoValue}>{lab.email_contact}</ThemedText>
          </View>
          
          {lab.capacity_max && (
            <View style={styles.infoItem}>
              <ThemedText style={styles.infoLabel}>Capacidad Máxima</ThemedText>
              <ThemedText style={styles.infoValue}>{lab.capacity_max} personas</ThemedText>
            </View>
          )}
          
          <View style={styles.infoItem}>
            <ThemedText style={styles.infoLabel}>Estado</ThemedText>
            <View style={styles.statusContainer}>
              <View style={[
                styles.statusDot, 
                { backgroundColor: lab.is_active ? '#4CAF50' : '#F44336' }
              ]} />
              <ThemedText style={styles.infoValue}>
                {lab.is_active ? 'Activo' : 'Inactivo'}
              </ThemedText>
            </View>
          </View>
          
          <View style={styles.infoItem}>
            <ThemedText style={styles.infoLabel}>Creado</ThemedText>
            <ThemedText style={styles.infoValue}>{formatDate(lab.created_at)}</ThemedText>
          </View>
        </View>
      </ThemedView>

      {/* Responsables */}
      <ThemedView style={[styles.section, { backgroundColor }]}>
        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>Responsables</ThemedText>
          <TouchableOpacity style={styles.manageButton} onPress={onManageResponsibles}>
            <Ionicons name="settings-outline" size={16} color={tintColor} />
            <ThemedText style={[styles.manageButtonText, { color: tintColor }]}>
              Gestionar
            </ThemedText>
          </TouchableOpacity>
        </View>
        
        {lab.responsibles.length > 0 ? (
          <View style={styles.responsiblesList}>
            {lab.responsibles.slice(0, 3).map((responsible, index) => (
              <View key={responsible.id} style={styles.responsibleItem}>
                <View style={styles.responsibleInfo}>
                  <ThemedText style={styles.responsibleName}>
                    {responsible.full_name}
                  </ThemedText>
                  <ThemedText style={styles.responsibleTitle}>
                    {responsible.position_title}
                  </ThemedText>
                  <ThemedText style={styles.responsibleEmail}>
                    {responsible.email}
                  </ThemedText>
                </View>
                {responsible.is_primary && (
                  <View style={styles.primaryBadge}>
                    <ThemedText style={styles.primaryText}>Principal</ThemedText>
                  </View>
                )}
              </View>
            ))}
            {lab.responsibles.length > 3 && (
              <ThemedText style={styles.moreText}>
                +{lab.responsibles.length - 3} más
              </ThemedText>
            )}
          </View>
        ) : (
          <ThemedText style={styles.emptyText}>
            No hay responsables asignados
          </ThemedText>
        )}
      </ThemedView>

      {/* Políticas */}
      <ThemedView style={[styles.section, { backgroundColor }]}>
        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>Políticas</ThemedText>
          <TouchableOpacity style={styles.manageButton} onPress={onManagePolicies}>
            <Ionicons name="settings-outline" size={16} color={tintColor} />
            <ThemedText style={[styles.manageButtonText, { color: tintColor }]}>
              Gestionar
            </ThemedText>
          </TouchableOpacity>
        </View>
        
        {lab.policies ? (
          <View style={styles.policiesContent}>
            {lab.policies.academic_req && (
              <View style={styles.policyItem}>
                <ThemedText style={styles.policyLabel}>Requisitos Académicos</ThemedText>
                <ThemedText style={styles.policyText} numberOfLines={3}>
                  {lab.policies.academic_req}
                </ThemedText>
              </View>
            )}
            
            {lab.policies.safety_req && (
              <View style={styles.policyItem}>
                <ThemedText style={styles.policyLabel}>Requisitos de Seguridad</ThemedText>
                <ThemedText style={styles.policyText} numberOfLines={3}>
                  {lab.policies.safety_req}
                </ThemedText>
              </View>
            )}
            
            {lab.policies.notes && (
              <View style={styles.policyItem}>
                <ThemedText style={styles.policyLabel}>Notas</ThemedText>
                <ThemedText style={styles.policyText} numberOfLines={3}>
                  {lab.policies.notes}
                </ThemedText>
              </View>
            )}
          </View>
        ) : (
          <ThemedText style={styles.emptyText}>
            No hay políticas definidas
          </ThemedText>
        )}
      </ThemedView>

      {/* Horarios */}
      <ThemedView style={[styles.section, { backgroundColor }]}>
        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>Horarios de Funcionamiento</ThemedText>
          <TouchableOpacity style={styles.manageButton} onPress={onManageHours}>
            <Ionicons name="settings-outline" size={16} color={tintColor} />
            <ThemedText style={[styles.manageButtonText, { color: tintColor }]}>
              Gestionar
            </ThemedText>
          </TouchableOpacity>
        </View>
        
        {lab.open_hours.length > 0 ? (
          <View style={styles.hoursList}>
            {lab.open_hours.slice(0, 5).map((hour, index) => (
              <View key={hour.id} style={styles.hourItem}>
                <ThemedText style={styles.hourDay}>
                  {getWeekdayName(hour.weekday)}
                </ThemedText>
                <ThemedText style={styles.hourTime}>
                  {hour.time_start} - {hour.time_end}
                </ThemedText>
              </View>
            ))}
            {lab.open_hours.length > 5 && (
              <ThemedText style={styles.moreText}>
                +{lab.open_hours.length - 5} más
              </ThemedText>
            )}
          </View>
        ) : (
          <ThemedText style={styles.emptyText}>
            No hay horarios definidos
          </ThemedText>
        )}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  manageButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  infoGrid: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    opacity: 0.7,
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 2,
    justifyContent: 'flex-end',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  responsiblesList: {
    gap: 12,
  },
  responsibleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  responsibleInfo: {
    flex: 1,
  },
  responsibleName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  responsibleTitle: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 2,
  },
  responsibleEmail: {
    fontSize: 12,
    opacity: 0.6,
  },
  primaryBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  primaryText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  policiesContent: {
    gap: 12,
  },
  policyItem: {
    marginBottom: 8,
  },
  policyLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  policyText: {
    fontSize: 14,
    opacity: 0.8,
    lineHeight: 20,
  },
  hoursList: {
    gap: 8,
  },
  hourItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  hourDay: {
    fontSize: 14,
    fontWeight: '500',
  },
  hourTime: {
    fontSize: 14,
    opacity: 0.7,
  },
  emptyText: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: 'center',
    paddingVertical: 16,
  },
  moreText: {
    fontSize: 12,
    opacity: 0.6,
    textAlign: 'center',
    marginTop: 8,
  },
});
