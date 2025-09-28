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

interface LabHistory {
  id: string;
  action_type: string;
  detail: string;
  actor_name?: string;
  created_at: string;
}

interface Lab {
  id: string;
  name: string;
  recent_history: LabHistory[];
}

interface LabHistorySectionProps {
  lab: Lab;
  onViewAll: () => void;
}

export function LabHistorySection({ lab, onViewAll }: LabHistorySectionProps) {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const iconColor = useThemeColor({}, 'icon');

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Hace unos minutos';
    } else if (diffInHours < 24) {
      return `Hace ${diffInHours} hora${diffInHours !== 1 ? 's' : ''}`;
    } else if (diffInHours < 48) {
      return 'Ayer';
    } else {
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType.toLowerCase()) {
      case 'lab_created':
        return 'add-circle-outline';
      case 'lab_updated':
        return 'create-outline';
      case 'policies_updated':
        return 'document-text-outline';
      case 'responsible_added':
        return 'person-add-outline';
      case 'responsible_updated':
        return 'person-outline';
      case 'responsible_removed':
        return 'person-remove-outline';
      case 'hours_updated':
        return 'time-outline';
      case 'resource_added':
        return 'cube-outline';
      case 'resource_updated':
        return 'cube-outline';
      case 'resource_removed':
        return 'cube-outline';
      default:
        return 'information-circle-outline';
    }
  };

  const getActionColor = (actionType: string) => {
    switch (actionType.toLowerCase()) {
      case 'lab_created':
        return '#4CAF50';
      case 'lab_updated':
        return '#2196F3';
      case 'policies_updated':
        return '#FF9800';
      case 'responsible_added':
        return '#4CAF50';
      case 'responsible_updated':
        return '#2196F3';
      case 'responsible_removed':
        return '#F44336';
      case 'hours_updated':
        return '#9C27B0';
      case 'resource_added':
        return '#4CAF50';
      case 'resource_updated':
        return '#2196F3';
      case 'resource_removed':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  const getActionName = (actionType: string) => {
    switch (actionType.toLowerCase()) {
      case 'lab_created':
        return 'Laboratorio creado';
      case 'lab_updated':
        return 'Información actualizada';
      case 'policies_updated':
        return 'Políticas actualizadas';
      case 'responsible_added':
        return 'Responsable agregado';
      case 'responsible_updated':
        return 'Responsable actualizado';
      case 'responsible_removed':
        return 'Responsable eliminado';
      case 'hours_updated':
        return 'Horarios actualizados';
      case 'resource_added':
        return 'Recurso agregado';
      case 'resource_updated':
        return 'Recurso actualizado';
      case 'resource_removed':
        return 'Recurso eliminado';
      default:
        return actionType.replace(/_/g, ' ').toLowerCase();
    }
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <ThemedView style={[styles.container, { backgroundColor }]}>
        <View style={styles.header}>
          <ThemedText style={styles.title}>Historial Reciente</ThemedText>
          <TouchableOpacity style={styles.viewAllButton} onPress={onViewAll}>
            <ThemedText style={[styles.viewAllText, { color: tintColor }]}>
              Ver todo
            </ThemedText>
            <Ionicons name="chevron-forward" size={16} color={tintColor} />
          </TouchableOpacity>
        </View>

        {lab.recent_history.length > 0 ? (
          <View style={styles.historyContent}>
            {lab.recent_history.map((history, index) => (
              <View key={history.id} style={styles.historyItem}>
                <View style={styles.historyIcon}>
                  <Ionicons
                    name={getActionIcon(history.action_type) as any}
                    size={20}
                    color={getActionColor(history.action_type)}
                  />
                </View>
                
                <View style={styles.historyContent}>
                  <View style={styles.historyHeader}>
                    <ThemedText style={styles.actionName}>
                      {getActionName(history.action_type)}
                    </ThemedText>
                    <ThemedText style={styles.historyTime}>
                      {formatDate(history.created_at)}
                    </ThemedText>
                  </View>
                  
                  <ThemedText style={styles.historyDetail}>
                    {history.detail}
                  </ThemedText>
                  
                  {history.actor_name && (
                    <ThemedText style={styles.historyActor}>
                      por {history.actor_name}
                    </ThemedText>
                  )}
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="time-outline" size={48} color={iconColor} />
            <ThemedText style={styles.emptyTitle}>No hay historial</ThemedText>
            <ThemedText style={styles.emptySubtitle}>
              Este laboratorio no tiene actividades registradas
            </ThemedText>
          </View>
        )}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 4,
  },
  historyContent: {
    gap: 12,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  historyIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  historyContent: {
    flex: 1,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  actionName: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  historyTime: {
    fontSize: 12,
    opacity: 0.6,
  },
  historyDetail: {
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 2,
  },
  historyActor: {
    fontSize: 12,
    opacity: 0.6,
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
  },
});
