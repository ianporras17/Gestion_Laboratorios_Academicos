import { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import axios from "axios";
import { Link, type Href } from "expo-router";

const BASE = (process.env.EXPO_PUBLIC_API_URL ?? "").replace(/\/$/, "");

export default function Home() {
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

  // rutas tipadas
  const toLabs    = "/labs" as Href;
  const toDepts   = "/admin/departments" as Href;
  const toTypes   = "/admin/resource-types" as Href;
  const toReqNew  = "/requests/new" as Href;
  const toReqs    = "/requests" as Href;
  const toReport  = "/reports/usage" as Href; // 👈 nuevo

  return (
    <View style={s.container}>
      <Text style={s.title}>Conexión con API</Text>

      <Text style={s.label}>API_URL</Text>
      <Text selectable style={s.code}>{BASE || "(vacía)"}</Text>

      <Text style={s.label}>Respuesta</Text>
      <Text selectable style={[s.code, status==="err" && { color: "#ff8a8a" }]}>
        {msg}
      </Text>

      <Link href={toLabs} asChild>
        <Pressable style={[s.btn, { backgroundColor: "#10b981" }]}>
          <Text style={s.btnText}>IR A LABS</Text>
        </Pressable>
      </Link>

      {/* Solicitudes */}
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

      {/* Admin */}
      <Link href={toDepts} asChild>
        <Pressable style={[s.btn, { backgroundColor: "#2d6cdf" }]}>
          <Text style={s.btnText}>ADMIN: DEPARTAMENTOS</Text>
        </Pressable>
      </Link>

      <Link href={toTypes} asChild>
        <Pressable style={[s.btn, { backgroundColor: "#8b5cf6" }]}>
          <Text style={s.btnText}>ADMIN: TIPOS DE RECURSO</Text>
        </Pressable>
      </Link>

      {/* Reporte de uso (1.4) */}
      <Link href={toReport} asChild>
        <Pressable style={[s.btn, { backgroundColor: "#0ea5e9" }]}>
          <Text style={s.btnText}>REPORTE DE USO</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b1220", padding: 16, gap: 12, justifyContent: "center" },
  title: { color: "#fff", fontSize: 20, fontWeight: "600", textAlign: "center", marginBottom: 8 },
  label: { color: "#9bb3ff", fontWeight: "600", marginTop: 8 },
  code: { color: "#fff" },
  btn: { alignSelf: "center", marginTop: 16, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 18 },
  btnText: { color: "#fff", fontWeight: "700" }
});
