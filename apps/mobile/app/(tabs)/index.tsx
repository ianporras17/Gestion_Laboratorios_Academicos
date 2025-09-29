import { useEffect, useState } from "react";
import { ScrollView, View, Text, Pressable, StyleSheet } from "react-native";
import axios from "axios";
import { Link, type Href, useRouter } from "expo-router";

const BASE = (process.env.EXPO_PUBLIC_API_URL ?? "").replace(/\/$/, "");

export default function Home() {
  const router = useRouter();
  const go = (p: string) => router.push(p as any); // rutas fuera del union tipado

  const [msg, setMsg] = useState<string>("(sin datos)");
  const [status, setStatus] = useState<"idle"|"loading"|"ok"|"err">("idle");

  async function ping() {
    setStatus("loading");
    try {
      const { data } = await axios.get(`${BASE.replace(/\/api$/, "")}/api`);
      setMsg(typeof data === "object" ? JSON.stringify(data) : String(data));
      setStatus("ok");
    } catch (e: any) {
      setMsg(e?.message ?? String(e));
      setStatus("err");
    }
  }
  useEffect(() => { ping(); }, []);

  // rutas tipadas (evitan el error del union)
  const toLabs    = "/labs" as Href;
  const toDepts   = "/admin/departments" as Href;
  const toTypes   = "/admin/resource-types" as Href;
  const toReqNew  = "/requests/new" as Href;
  const toReqs    = "/requests" as Href;
  const toReport1 = "/reports/usage" as Href;

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.container}>
      {/* Cabecera */}
      <Text style={s.title}>Conexión con API</Text>

      <Text style={s.label}>API_URL</Text>
      <Text selectable style={s.code}>{BASE || "(vacía)"}</Text>

      <Text style={s.label}>Respuesta</Text>
      <Text selectable style={[s.code, status==="err" && { color: "#ff8a8a" }]}>
        {msg}
      </Text>

      {/* ---------- Auth & Usuarios ---------- */}
      <Text style={s.section}>Auth & Usuarios</Text>

      <Pressable style={[s.btn, { backgroundColor: "#1f2937" }]} onPress={() => go("/auth/login")}>
        <Text style={s.btnText}>LOGIN</Text>
      </Pressable>

      <Pressable style={[s.btn, { backgroundColor: "#374151" }]} onPress={() => go("/auth/register")}>
        <Text style={s.btnText}>REGISTRARME</Text>
      </Pressable>

      <Pressable style={[s.btn, { backgroundColor: "#111827" }]} onPress={() => go("/users/profile")}>
        <Text style={s.btnText}>MI PERFIL</Text>
      </Pressable>

      <Pressable style={[s.btn, { backgroundColor: "#0f172a" }]} onPress={() => go("/users/trainings")}>
        <Text style={s.btnText}>MIS CAPACITACIONES</Text>
      </Pressable>

      <Pressable style={[s.btn, { backgroundColor: "#1e293b" }]} onPress={() => go("/users/availability")}>
        <Text style={s.btnText}>BUSCAR DISPONIBILIDAD</Text>
      </Pressable>

      {/* NUEVO: Historial y Notificaciones */}
      <Pressable style={[s.btn, { backgroundColor: "#0ea5e9" }]} onPress={() => go("/users/history")}>
        <Text style={s.btnText}>MI HISTORIAL</Text>
      </Pressable>

      <Pressable style={[s.btn, { backgroundColor: "#06b6d4" }]} onPress={() => go("/users/notifications")}>
        <Text style={s.btnText}>NOTIFICACIONES</Text>
      </Pressable>

      {/* ---------- Labs ---------- */}
      <Text style={s.section}>Labs</Text>

      <Link href={toLabs} asChild>
        <Pressable style={[s.btn, { backgroundColor: "#10b981" }]}>
          <Text style={s.btnText}>IR A LABS</Text>
        </Pressable>
      </Link>

      {/* ---------- Solicitudes ---------- */}
      <Text style={s.section}>Solicitudes</Text>

      <Link href={toReqNew} asChild>
        <Pressable style={[s.btn, { backgroundColor: "#f59e0b" }]}>
          <Text style={s.btnText}>CREAR SOLICITUD</Text>
        </Pressable>
      </Link>

      <Link href={toReqs} asChild>
        <Pressable style={[s.btn, { backgroundColor: "#2563eb" }]}>
          <Text style={s.btnText}>VER SOLICITUDES</Text>
        </Pressable>
      </Link>

      {/* ---------- Admin ---------- */}
      <Text style={s.section}>Admin</Text>

      <Link href={toDepts} asChild>
        <Pressable style={[s.btn, { backgroundColor: "#2d6cdf" }]}>
          <Text style={s.btnText}>DEPARTAMENTOS</Text>
        </Pressable>
      </Link>

      <Link href={toTypes} asChild>
        <Pressable style={[s.btn, { backgroundColor: "#8b5cf6" }]}>
          <Text style={s.btnText}>TIPOS DE RECURSO</Text>
        </Pressable>
      </Link>

      {/* Enlaces rápidos para 4.1–4.3 */}
      <Pressable style={[s.btn, { backgroundColor: "#0ea5e9" }]} onPress={() => go("/admin/users")}>
        <Text style={s.btnText}>GESTIÓN DE USUARIOS</Text>
      </Pressable>
      <Pressable style={[s.btn, { backgroundColor: "#0284c7" }]} onPress={() => go("/admin/settings")}>
        <Text style={s.btnText}>PARÁMETROS GLOBALES</Text>
      </Pressable>
      <Pressable style={[s.btn, { backgroundColor: "#0369a1" }]} onPress={() => go("/admin/audit")}>
        <Text style={s.btnText}>AUDITORÍA</Text>
      </Pressable>

      {/* ---------- Reporte 1.4 existente ---------- */}
      <Text style={s.section}>Reportes (Mód 1.4)</Text>

      <Link href={toReport1} asChild>
        <Pressable style={[s.btn, { backgroundColor: "#0ea5e9" }]}>
          <Text style={s.btnText}>REPORTE DE USO (1.4)</Text>
        </Pressable>
      </Link>

      {/* ---------- Técnico (2.x) ---------- */}
      <Text style={s.section}>Técnico (Mód 2)</Text>

      <Pressable style={[s.btn, { backgroundColor: "#0ea5e9" }]} onPress={() => go("/tech")}>
        <Text style={s.btnText}>PANEL TÉCNICO</Text>
      </Pressable>

      <Pressable style={[s.btn, { backgroundColor: "#22c55e" }]} onPress={() => go("/tech/assignments")}>
        <Text style={s.btnText}>ASIGNACIONES</Text>
      </Pressable>

      <Pressable style={[s.btn, { backgroundColor: "#0ea5e9" }]} onPress={() => go("/tech/approved")}>
        <Text style={s.btnText}>SOLICITUDES APROBADAS</Text>
      </Pressable>

      {/* ---------- Inventario (2.2) ---------- */}
      <Text style={s.section}>Inventario</Text>

      <Pressable style={[s.btn, { backgroundColor: "#f59e0b" }]} onPress={() => go("/inventory/consumables")}>
        <Text style={s.btnText}>CONSUMIBLES</Text>
      </Pressable>

      <Pressable style={[s.btn, { backgroundColor: "#6366f1" }]} onPress={() => go("/inventory/movements")}>
        <Text style={s.btnText}>MOVIMIENTOS</Text>
      </Pressable>

      <Pressable style={[s.btn, { backgroundColor: "#8b5cf6" }]} onPress={() => go("/inventory/fixed-status")}>
        <Text style={s.btnText}>ESTADO EQUIPO FIJO</Text>
      </Pressable>

      {/* ---------- Mantenimiento (2.3) ---------- */}
      <Text style={s.section}>Mantenimiento</Text>

      <Pressable style={[s.btn, { backgroundColor: "#14b8a6" }]} onPress={() => go("/maintenance/orders")}>
        <Text style={s.btnText}>ÓRDENES</Text>
      </Pressable>

      <Pressable style={[s.btn, { backgroundColor: "#10b981" }]} onPress={() => go("/maintenance/orders/new")}>
        <Text style={s.btnText}>NUEVA ORDEN</Text>
      </Pressable>

      {/* ---------- Reportes operativos (2.4) ---------- */}
      <Text style={s.section}>Reportes (Mód 2.4)</Text>

      <Pressable style={[s.btn, { backgroundColor: "#0ea5e9" }]} onPress={() => go("/reports")}>
        <Text style={s.btnText}>REPORTES OPERATIVOS</Text>
      </Pressable>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0b1220" },
  container: { padding: 16, gap: 12 },
  title: { color: "#fff", fontSize: 20, fontWeight: "600", textAlign: "center", marginBottom: 8 },
  section: { color: "#9bb3ff", fontWeight: "800", marginTop: 18, marginBottom: 4, fontSize: 12, textTransform: "uppercase" },
  label: { color: "#9bb3ff", fontWeight: "600", marginTop: 8 },
  code: { color: "#fff" },
  btn: { alignSelf: "stretch", borderRadius: 10, paddingVertical: 12, paddingHorizontal: 18, minWidth: 260, alignItems: "center" },
  btnText: { color: "#fff", fontWeight: "700" }
});
