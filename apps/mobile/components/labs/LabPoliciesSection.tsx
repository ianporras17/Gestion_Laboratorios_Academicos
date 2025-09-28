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

interface LabPolicies {
  academic_req?: string;
  safety_req?: string;
  notes?: string;
}

interface Lab {
  id: string;
  name: string;
  policies?: LabPolicies;
}

interface LabPoliciesSectionProps {
  lab: Lab;
  onManage: () => void;
}

export function LabPoliciesSection({ lab, onManage }: LabPoliciesSectionProps) {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const iconColor = useThemeColor({}, 'icon');

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <ThemedView style={[styles.container, { backgroundColor }]}>
        <View style={styles.header}>
          <ThemedText style={styles.title}>Políticas del Laboratorio</ThemedText>
          <TouchableOpacity style={styles.manageButton} onPress={onManage}>
            <Ionicons name="settings-outline" size={16} color={tintColor} />
            <ThemedText style={[styles.manageButtonText, { color: tintColor }]}>
              Gestionar
            </ThemedText>
          </TouchableOpacity>
        </View>

        {lab.policies ? (
          <View style={styles.policiesContent}>
            {lab.policies.academic_req && (
              <View style={styles.policyCard}>
                <View style={styles.policyHeader}>
                  <Ionicons name="school-outline" size={20} color="#2196F3" />
                  <ThemedText style={styles.policyTitle}>Requisitos Académicos</ThemedText>
                </View>
                <ThemedText style={styles.policyText}>
                  {lab.policies.academic_req}
                </ThemedText>
              </View>
            )}

            {lab.policies.safety_req && (
              <View style={styles.policyCard}>
                <View style={styles.policyHeader}>
                  <Ionicons name="shield-checkmark-outline" size={20} color="#FF9800" />
                  <ThemedText style={styles.policyTitle}>Requisitos de Seguridad</ThemedText>
                </View>
                <ThemedText style={styles.policyText}>
                  {lab.policies.safety_req}
                </ThemedText>
              </View>
            )}

            {lab.policies.notes && (
              <View style={styles.policyCard}>
                <View style={styles.policyHeader}>
                  <Ionicons name="document-text-outline" size={20} color="#9C27B0" />
                  <ThemedText style={styles.policyTitle}>Notas Adicionales</ThemedText>
                </View>
                <ThemedText style={styles.policyText}>
                  {lab.policies.notes}
                </ThemedText>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={48} color={iconColor} />
            <ThemedText style={styles.emptyTitle}>No hay políticas definidas</ThemedText>
            <ThemedText style={styles.emptySubtitle}>
              Este laboratorio no tiene políticas establecidas
            </ThemedText>
            <TouchableOpacity style={styles.addButton} onPress={onManage}>
              <Ionicons name="add" size={20} color="white" />
              <ThemedText style={styles.addButtonText}>Definir Políticas</ThemedText>
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
  policiesContent: {
    gap: 16,
  },
  policyCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
  },
  policyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  policyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  policyText: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
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
