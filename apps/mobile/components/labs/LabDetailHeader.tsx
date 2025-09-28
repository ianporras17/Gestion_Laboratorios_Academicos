import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
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

interface LabDetailHeaderProps {
  lab: Lab;
  onEdit: () => void;
}

const { width } = Dimensions.get('window');

export function LabDetailHeader({ lab, onEdit }: LabDetailHeaderProps) {
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
    });
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      {/* Status Bar */}
      <View style={styles.statusBar}>
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { 
            backgroundColor: lab.is_active ? '#4CAF50' : '#F44336' 
          }]}>
            <Text style={styles.statusText}>
              {lab.is_active ? 'Activo' : 'Inactivo'}
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.editButton} onPress={onEdit}>
          <Ionicons name="create-outline" size={20} color={tintColor} />
        </TouchableOpacity>
      </View>

      {/* Title */}
      <View style={styles.titleContainer}>
        <ThemedText style={styles.name} numberOfLines={2}>
          {lab.name}
        </ThemedText>
        <ThemedText style={styles.code}>
          {lab.internal_code}
        </ThemedText>
      </View>

      {/* Quick Info */}
      <View style={styles.quickInfo}>
        <View style={styles.infoItem}>
          <Ionicons name="location-outline" size={16} color={iconColor} />
          <ThemedText style={styles.infoText} numberOfLines={1}>
            {lab.location}
          </ThemedText>
        </View>

        {lab.school_department_name && (
          <View style={styles.infoItem}>
            <Ionicons name="school-outline" size={16} color={iconColor} />
            <ThemedText style={styles.infoText} numberOfLines={1}>
              {lab.school_department_name}
            </ThemedText>
          </View>
        )}

        <View style={styles.infoItem}>
          <Ionicons name="mail-outline" size={16} color={iconColor} />
          <ThemedText style={styles.infoText} numberOfLines={1}>
            {lab.email_contact}
          </ThemedText>
        </View>
      </View>

      {/* Description */}
      {lab.description && (
        <View style={styles.descriptionContainer}>
          <ThemedText style={styles.description} numberOfLines={3}>
            {lab.description}
          </ThemedText>
        </View>
      )}

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Ionicons name="people-outline" size={20} color={tintColor} />
          <ThemedText style={styles.statNumber}>
            {lab.responsibles.length}
          </ThemedText>
          <ThemedText style={styles.statLabel}>
            Responsable{lab.responsibles.length !== 1 ? 's' : ''}
          </ThemedText>
        </View>

        <View style={styles.statItem}>
          <Ionicons name="cube-outline" size={20} color={tintColor} />
          <ThemedText style={styles.statNumber}>
            {lab.resources.length}
          </ThemedText>
          <ThemedText style={styles.statLabel}>
            Recurso{lab.resources.length !== 1 ? 's' : ''}
          </ThemedText>
        </View>

        {lab.capacity_max && (
          <View style={styles.statItem}>
            <Ionicons name="person-outline" size={20} color={tintColor} />
            <ThemedText style={styles.statNumber}>
              {lab.capacity_max}
            </ThemedText>
            <ThemedText style={styles.statLabel}>
              Capacidad
            </ThemedText>
          </View>
        )}

        <View style={styles.statItem}>
          <Ionicons name="time-outline" size={20} color={tintColor} />
          <ThemedText style={styles.statNumber}>
            {lab.open_hours.length}
          </ThemedText>
          <ThemedText style={styles.statLabel}>
            Horario{lab.open_hours.length !== 1 ? 's' : ''}
          </ThemedText>
        </View>
      </View>

      {/* Last Updated */}
      <View style={styles.lastUpdated}>
        <ThemedText style={styles.lastUpdatedText}>
          Última actualización: {formatDate(lab.updated_at)}
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 60,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusContainer: {
    flex: 1,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  editButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f0f8ff',
  },
  titleContainer: {
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  code: {
    fontSize: 16,
    opacity: 0.7,
    fontFamily: 'monospace',
  },
  quickInfo: {
    marginBottom: 16,
    gap: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  descriptionContainer: {
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    opacity: 0.8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 4,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
    textAlign: 'center',
  },
  lastUpdated: {
    alignItems: 'center',
  },
  lastUpdatedText: {
    fontSize: 12,
    opacity: 0.6,
  },
});
