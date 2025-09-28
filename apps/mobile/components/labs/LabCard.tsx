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
  responsible_count: number;
  resource_count: number;
  created_at: string;
  updated_at: string;
}

interface LabCardProps {
  lab: Lab;
  onPress: () => void;
}

const { width } = Dimensions.get('window');

export function LabCard({ lab, onPress }: LabCardProps) {
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
    <TouchableOpacity
      style={[styles.card, { backgroundColor }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <ThemedText style={styles.name} numberOfLines={1}>
            {lab.name}
          </ThemedText>
          <View style={styles.badgeContainer}>
            <View style={[styles.statusBadge, { 
              backgroundColor: lab.is_active ? '#4CAF50' : '#F44336' 
            }]}>
              <Text style={styles.statusText}>
                {lab.is_active ? 'Activo' : 'Inactivo'}
              </Text>
            </View>
          </View>
        </View>
        <ThemedText style={styles.code} numberOfLines={1}>
          {lab.internal_code}
        </ThemedText>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={16} color={iconColor} />
          <ThemedText style={styles.infoText} numberOfLines={1}>
            {lab.location}
          </ThemedText>
        </View>

        {lab.school_department_name && (
          <View style={styles.infoRow}>
            <Ionicons name="school-outline" size={16} color={iconColor} />
            <ThemedText style={styles.infoText} numberOfLines={1}>
              {lab.school_department_name}
            </ThemedText>
          </View>
        )}

        {lab.description && (
          <ThemedText style={styles.description} numberOfLines={2}>
            {lab.description}
          </ThemedText>
        )}

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Ionicons name="people-outline" size={16} color={tintColor} />
            <ThemedText style={styles.statText}>
              {lab.responsible_count} responsable{lab.responsible_count !== 1 ? 's' : ''}
            </ThemedText>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="cube-outline" size={16} color={tintColor} />
            <ThemedText style={styles.statText}>
              {lab.resource_count} recurso{lab.resource_count !== 1 ? 's' : ''}
            </ThemedText>
          </View>
          {lab.capacity_max && (
            <View style={styles.statItem}>
              <Ionicons name="person-outline" size={16} color={tintColor} />
              <ThemedText style={styles.statText}>
                Cap. {lab.capacity_max}
              </ThemedText>
            </View>
          )}
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <ThemedText style={styles.dateText}>
          Actualizado: {formatDate(lab.updated_at)}
        </ThemedText>
        <Ionicons name="chevron-forward" size={20} color={iconColor} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  header: {
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  badgeContainer: {
    flexShrink: 0,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  code: {
    fontSize: 14,
    opacity: 0.7,
    fontFamily: 'monospace',
  },
  content: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  description: {
    fontSize: 14,
    opacity: 0.8,
    marginTop: 8,
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
    marginLeft: 4,
    opacity: 0.8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  dateText: {
    fontSize: 12,
    opacity: 0.6,
  },
});
