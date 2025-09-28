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

interface LabResponsible {
  id: string;
  full_name: string;
  position_title: string;
  phone?: string;
  email: string;
  is_primary: boolean;
}

interface Lab {
  id: string;
  name: string;
  responsibles: LabResponsible[];
}

interface LabResponsiblesSectionProps {
  lab: Lab;
  onManage: () => void;
}

export function LabResponsiblesSection({ lab, onManage }: LabResponsiblesSectionProps) {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const iconColor = useThemeColor({}, 'icon');

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <ThemedView style={[styles.container, { backgroundColor }]}>
        <View style={styles.header}>
          <ThemedText style={styles.title}>Responsables del Laboratorio</ThemedText>
          <TouchableOpacity style={styles.manageButton} onPress={onManage}>
            <Ionicons name="settings-outline" size={16} color={tintColor} />
            <ThemedText style={[styles.manageButtonText, { color: tintColor }]}>
              Gestionar
            </ThemedText>
          </TouchableOpacity>
        </View>

        {lab.responsibles.length > 0 ? (
          <View style={styles.responsiblesList}>
            {lab.responsibles.map((responsible) => (
              <View key={responsible.id} style={styles.responsibleCard}>
                <View style={styles.responsibleHeader}>
                  <View style={styles.responsibleInfo}>
                    <ThemedText style={styles.responsibleName}>
                      {responsible.full_name}
                    </ThemedText>
                    <ThemedText style={styles.responsibleTitle}>
                      {responsible.position_title}
                    </ThemedText>
                  </View>
                  {responsible.is_primary && (
                    <View style={styles.primaryBadge}>
                      <ThemedText style={styles.primaryText}>Principal</ThemedText>
                    </View>
                  )}
                </View>

                <View style={styles.contactInfo}>
                  <View style={styles.contactItem}>
                    <Ionicons name="mail-outline" size={16} color={iconColor} />
                    <ThemedText style={styles.contactText}>
                      {responsible.email}
                    </ThemedText>
                  </View>
                  
                  {responsible.phone && (
                    <View style={styles.contactItem}>
                      <Ionicons name="call-outline" size={16} color={iconColor} />
                      <ThemedText style={styles.contactText}>
                        {responsible.phone}
                      </ThemedText>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color={iconColor} />
            <ThemedText style={styles.emptyTitle}>No hay responsables</ThemedText>
            <ThemedText style={styles.emptySubtitle}>
              Este laboratorio no tiene responsables asignados
            </ThemedText>
            <TouchableOpacity style={styles.addButton} onPress={onManage}>
              <Ionicons name="add" size={20} color="white" />
              <ThemedText style={styles.addButtonText}>Agregar Responsable</ThemedText>
            </TouchableOpacity>
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
  responsiblesList: {
    gap: 12,
  },
  responsibleCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
  },
  responsibleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  responsibleInfo: {
    flex: 1,
  },
  responsibleName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  responsibleTitle: {
    fontSize: 14,
    opacity: 0.7,
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
  contactInfo: {
    gap: 6,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
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
    marginBottom: 20,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a7ea4',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
});
