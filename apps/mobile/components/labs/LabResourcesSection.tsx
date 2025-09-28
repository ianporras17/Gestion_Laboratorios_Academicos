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

interface LabResource {
  id: string;
  type: string;
  name: string;
  description?: string;
  allowed_roles: string[];
}

interface Lab {
  id: string;
  name: string;
  resources: LabResource[];
}

interface LabResourcesSectionProps {
  lab: Lab;
  onViewAll: () => void;
}

export function LabResourcesSection({ lab, onViewAll }: LabResourcesSectionProps) {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const iconColor = useThemeColor({}, 'icon');

  const getResourceIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'equipment':
        return 'hardware-chip-outline';
      case 'consumable':
        return 'cube-outline';
      case 'software':
        return 'laptop-outline';
      default:
        return 'cube-outline';
    }
  };

  const getResourceTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'equipment':
        return '#2196F3';
      case 'consumable':
        return '#4CAF50';
      case 'software':
        return '#FF9800';
      default:
        return '#9E9E9E';
    }
  };

  const getResourceTypeName = (type: string) => {
    switch (type.toLowerCase()) {
      case 'equipment':
        return 'Equipo';
      case 'consumable':
        return 'Consumible';
      case 'software':
        return 'Software';
      default:
        return type;
    }
  };

  const groupResourcesByType = () => {
    const grouped: { [key: string]: LabResource[] } = {};
    lab.resources.forEach(resource => {
      if (!grouped[resource.type]) {
        grouped[resource.type] = [];
      }
      grouped[resource.type].push(resource);
    });
    return grouped;
  };

  const groupedResources = groupResourcesByType();

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <ThemedView style={[styles.container, { backgroundColor }]}>
        <View style={styles.header}>
          <ThemedText style={styles.title}>Recursos del Laboratorio</ThemedText>
          <TouchableOpacity style={styles.viewAllButton} onPress={onViewAll}>
            <ThemedText style={[styles.viewAllText, { color: tintColor }]}>
              Ver todos
            </ThemedText>
            <Ionicons name="chevron-forward" size={16} color={tintColor} />
          </TouchableOpacity>
        </View>

        {lab.resources.length > 0 ? (
          <View style={styles.resourcesContent}>
            {Object.entries(groupedResources).map(([type, resources]) => (
              <View key={type} style={styles.typeGroup}>
                <View style={styles.typeHeader}>
                  <Ionicons 
                    name={getResourceIcon(type) as any} 
                    size={20} 
                    color={getResourceTypeColor(type)} 
                  />
                  <ThemedText style={styles.typeName}>
                    {getResourceTypeName(type)} ({resources.length})
                  </ThemedText>
                </View>
                
                <View style={styles.resourcesList}>
                  {resources.slice(0, 3).map((resource) => (
                    <View key={resource.id} style={styles.resourceItem}>
                      <View style={styles.resourceInfo}>
                        <ThemedText style={styles.resourceName}>
                          {resource.name}
                        </ThemedText>
                        {resource.description && (
                          <ThemedText style={styles.resourceDescription} numberOfLines={2}>
                            {resource.description}
                          </ThemedText>
                        )}
                        <View style={styles.rolesContainer}>
                          {resource.allowed_roles.slice(0, 2).map((role, index) => (
                            <View key={index} style={styles.roleBadge}>
                              <ThemedText style={styles.roleText}>
                                {role}
                              </ThemedText>
                            </View>
                          ))}
                          {resource.allowed_roles.length > 2 && (
                            <View style={styles.roleBadge}>
                              <ThemedText style={styles.roleText}>
                                +{resource.allowed_roles.length - 2}
                              </ThemedText>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                  ))}
                  
                  {resources.length > 3 && (
                    <ThemedText style={styles.moreText}>
                      +{resources.length - 3} más recursos
                    </ThemedText>
                  )}
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={48} color={iconColor} />
            <ThemedText style={styles.emptyTitle}>No hay recursos</ThemedText>
            <ThemedText style={styles.emptySubtitle}>
              Este laboratorio no tiene recursos registrados
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
  resourcesContent: {
    gap: 16,
  },
  typeGroup: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
  },
  typeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeName: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  resourcesList: {
    gap: 8,
  },
  resourceItem: {
    backgroundColor: 'white',
    borderRadius: 6,
    padding: 8,
  },
  resourceInfo: {
    flex: 1,
  },
  resourceName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  resourceDescription: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 6,
  },
  rolesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  roleBadge: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  roleText: {
    fontSize: 10,
    color: '#1976d2',
    fontWeight: '500',
  },
  moreText: {
    fontSize: 12,
    opacity: 0.6,
    textAlign: 'center',
    marginTop: 4,
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
