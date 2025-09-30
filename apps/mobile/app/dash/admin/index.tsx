import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

export default function AdminDashboard() {
  const router = useRouter();
  const go = (p: string) => router.push(p as any);
  const logout = () => router.replace("/auth/login" as any);

  const [labId, setLabId] = useState<string>("");

  return (
    <SafeAreaView style={s.screen}>
      <ScrollView contentContainerStyle={s.container}>
        <Text style={s.title}>Dashboard ADMIN</Text>
        <Text style={s.subtitle}>Gestión institucional, catálogo y laboratorios</Text>

        {/* ---- Gestión institucional ---- */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Institucional</Text>
          <View style={s.grid}>
            <Tile label="Usuarios/Roles" emoji="👥" onPress={() => go("/admin/users")} />
            <Tile label="Parámetros"     emoji="⚙️" onPress={() => go("/admin/settings")} />
            <Tile label="Auditoría"      emoji="🧾" onPress={() => go("/admin/audit")} />
            <Tile label="Reportes 4.4"   emoji="📈" onPress={() => go("/reports")} />
          </View>
        </View>

        {/* ---- Catálogo/Estructura ---- */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Catálogo y estructura</Text>
          <View style={s.grid}>
            <Tile label="Departamentos"   emoji="🏫" onPress={() => go("/admin/departments")} />
            <Tile label="Tipos de recurso" emoji="🧩" onPress={() => go("/admin/resource-types")} />
            <Tile label="Buscar labs"     emoji="🔎" onPress={() => go("/browse/labs")} />
          </View>
        </View>

        {/* ---- Laboratorios (atajos por ID) ---- */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Laboratorios (por ID)</Text>

          <View style={s.card}>
            <Text style={s.cardText}>Ingresa un ID de laboratorio para abrir acciones rápidas.</Text>
            <TextInput
              style={s.input}
              placeholder="ej. 1"
              placeholderTextColor="#94a3b8"
              keyboardType="numeric"
              value={labId}
              onChangeText={setLabId}
            />

            <View style={s.grid}>
              <Tile
                label="Detalles"
                emoji="📋"
                disabled={!labId}
                onPress={() => go(`/lab/${labId}/details`)}
              />
              <Tile
                label="Catálogo"
                emoji="📚"
                disabled={!labId}
                onPress={() => go(`/lab/${labId}/catalog`)}
              />
              <Tile
                label="Calendario"
                emoji="🗓️"
                disabled={!labId}
                onPress={() => go(`/lab/${labId}/calendar`)}
              />
            </View>
          </View>
        </View>

        {/* ---- Logout ---- */}
        <Pressable style={[s.btn, s.btnPrimary]} onPress={logout}>
          <Text style={s.btnText}>Cerrar sesión</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Tile({
  label,
  emoji,
  onPress,
  disabled,
}: {
  label: string;
  emoji?: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.tile,
        disabled && { opacity: 0.4 },
        pressed && !disabled && s.tilePressed,
      ]}
    >
      <Text style={s.tileEmoji}>{emoji ?? "•"}</Text>
      <Text style={s.tileText}>{label}</Text>
    </Pressable>
  );
}

const COLORS = {
  bg: "#0b1220",
  card: "#0f172a",
  text: "#e5e7eb",
  subtext: "#94a3b8",
  primary: "#4f46e5",
  border: "#1f2937",
};

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  container: { padding: 20, gap: 16 },
  title: { color: COLORS.text, fontSize: 22, fontWeight: "800", textAlign: "center" },
  subtitle: { color: COLORS.subtext, textAlign: "center" },

  section: { marginTop: 10, gap: 10 },
  sectionTitle: { color: COLORS.text, fontWeight: "800" },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  tile: {
    width: "48%",
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: "center",
    gap: 6,
  },
  tilePressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  tileEmoji: { fontSize: 22 },
  tileText: { color: COLORS.text, fontWeight: "700", textAlign: "center" },

  card: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 12,
    gap: 10,
  },
  cardText: { color: COLORS.subtext },

  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 10,
    color: COLORS.text,
  },

  btn: { borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: 12 },
  btnPrimary: { backgroundColor: COLORS.primary },
  btnText: { color: "#fff", fontWeight: "800" },
});
