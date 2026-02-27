import "dotenv/config";
import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";

const app = express();
app.use(cors());
app.use(express.json());

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing env vars SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function getBearerToken(req) {
  const auth = req.headers.authorization || "";
  const parts = auth.split(" ");
  if (parts.length === 2 && parts[0].toLowerCase() === "bearer") return parts[1];
  return null;
}

async function requireAuth(req, res, next) {
  try {
    const token = getBearerToken(req);
    if (!token) return res.status(401).json({ ok: false, error: "Missing Bearer token" });

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      return res.status(401).json({ ok: false, error: "Invalid token" });
    }

    req.authUser = data.user;
    req.accessToken = token;
    next();
  } catch (e) {
    return res.status(500).json({ ok: false, error: "Auth middleware failed" });
  }
}

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/db-check", async (req, res) => {
  const { data, error } = await supabase.from("empresa").select("*").limit(1);
  if (error) return res.status(500).json({ ok: false, error: error.message });
  res.json({ ok: true, sample: data });
});

app.get('/ping', (req, res) => {
  res.status(200).json({ ok: true });
});

/*
  Endpoint 1: /auth/me
  Devuelve: auth uid + email + fila de public.usuario (si existe)
*/
app.get("/auth/me", requireAuth, async (req, res) => {
  const authUser = req.authUser;

  const { data: usuario, error: usuarioError } = await supabase
    .from("usuario")
    .select("id_usuario, nombre_real, nombre_user, mail, id_empresa, id_rol_usuario, activo")
    .eq("id_usuario", authUser.id)
    .maybeSingle();

  if (usuarioError) {
    return res.status(500).json({ ok: false, error: usuarioError.message });
  }

  return res.json({
    ok: true,
    auth: {
      id_usuario: authUser.id,
      email: authUser.email ?? null,
    },
    usuario: usuario ?? null,
  });
});

/*
  Endpoint 2: /sync/login
  Devuelve:
  - usuario (public.usuario)
  - proyectos_visibles (por empresa)
*/
app.post("/sync/login", requireAuth, async (req, res) => {
  const authUser = req.authUser;

  const { data: usuario, error: usuarioError } = await supabase
    .from("usuario")
    .select("id_usuario, nombre_real, nombre_user, mail, id_empresa, id_rol_usuario, activo")
    .eq("id_usuario", authUser.id)
    .single();

  if (usuarioError)
    return res.status(500).json({ ok: false, error: usuarioError.message });

  const idEmpresa = usuario.id_empresa;

  // Proyectos visibles por empresa
  const { data: proyectos, error: proyectosError } = await supabase
    .from("proyecto")
    .select("id_proyecto, nombre_proyecto, titular, id_ubicacion, id_empresa")
    .eq("id_empresa", idEmpresa)
    .order("id_proyecto", { ascending: true });

  if (proyectosError)
    return res.status(500).json({ ok: false, error: proyectosError.message });

  // Catálogo tipo_usuario
  const { data: tipoUsuario, error: tiposError } = await supabase
    .from("tipo_usuario")
    .select("id_tipo_usuario, nombre_tipo")
    .order("id_tipo_usuario", { ascending: true });

  if (tiposError)
    return res.status(500).json({ ok: false, error: tiposError.message });

  // Catálogo tipo_archivo
  const { data: tipoArchivo, error: tipoArchivoError } = await supabase
    .from("tipo_archivo")
    .select("id_tipo_archivo, nombre_tipo_archivo")
    .order("id_tipo_archivo", { ascending: true });

  if (tipoArchivoError)
    return res.status(500).json({ ok: false, error: tipoArchivoError.message });

  return res.json({
    ok: true,
    server_time: new Date().toISOString(),
    usuario,
    proyectos_visibles: proyectos ?? [],
    tipo_usuario: tipoUsuario ?? [],
    tipo_archivo: tipoArchivo ?? []
  });
});


// Sync de archivos

app.post("/sync/nota", requireAuth, async (req, res) => {

  const { 
  id_archivo, 
  titulo, 
  cuerpo, 
  fecha_creacion, 
  id_proyecto, 
  id_tipo_archivo,
  id_contacto_proyecto
} = req.body;

  if (!titulo || !cuerpo || !fecha_creacion || !id_proyecto || !id_tipo_archivo) {
    return res.status(400).json({ ok: false, error: "Missing fields" });
  }

  try {

    // 1. Crear registro raíz en archivo
    const { data: archivo, error: archivoError } = await supabase
      .from("archivo")
      .insert({
        id_archivo,
        estado_carga: "sincronizado",
        fecha_creacion,
        fecha_subida: new Date().toISOString(),
        id_usuario: req.authUser.id,
        id_proyecto,
        id_tipo_archivo
      })
      .select()
      .single();

    if (archivoError) {
      return res.status(500).json({ ok: false, error: archivoError.message });
    }

    // 2. Construir JSON
    const notaJson = {
      id_archivo: archivo.id_archivo,
      titulo,
      cuerpo,
      fecha_creacion,
      id_usuario: req.authUser.id,
      id_proyecto
    };

    const path = `${req.authUser.id}/notas/${archivo.id_archivo}.json`;

    // 3. Subir JSON al storage
    const { error: uploadError } = await supabase.storage
      .from("EtnoApp")
      .upload(path, Buffer.from(JSON.stringify(notaJson)), {
        contentType: "application/json"
      });

    if (uploadError) {
      return res.status(500).json({ ok: false, error: uploadError.message });
    }

    // 4. Insertar en subtabla nota con URL
    const { error: notaError } = await supabase
  .from("nota")
  .insert({
    id_archivo: archivo.id_archivo,
    url: path,
    titulo,
    cuerpo,
    id_contacto_proyecto: id_contacto_proyecto ?? null
  });

    if (notaError) {
      return res.status(500).json({ ok: false, error: notaError.message });
    }

    return res.json({
      ok: true,
      id_archivo_cloud: archivo.id_archivo
    });

  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }

});

app.post("/sync/contacto-proyecto", requireAuth, async (req, res) => {

  const {
    id_archivo,
    id_contacto,
    cargo,
    organizacion,
    observaciones,
    fecha_creacion,
    id_proyecto,
    id_tipo_archivo
  } = req.body;

  if (!id_archivo || !id_contacto || !fecha_creacion || !id_proyecto || !id_tipo_archivo) {
    return res.status(400).json({ ok: false, error: "Missing fields" });
  }

  try {

    const { data: archivo, error: archivoError } = await supabase
      .from("archivo")
      .insert({
        id_archivo,
        estado_carga: "sincronizado",
        fecha_creacion,
        fecha_subida: new Date().toISOString(),
        id_usuario: req.authUser.id,
        id_proyecto,
        id_tipo_archivo
      })
      .select()
      .single();

    if (archivoError) {
      return res.status(500).json({ ok: false, error: archivoError.message });
    }

    const { error: cpError } = await supabase
      .from("contacto_proyecto")
      .insert({
        id_archivo: archivo.id_archivo,
        id_contacto,
        cargo: cargo ?? null,
        organizacion: organizacion ?? null,
        observaciones: observaciones ?? null
      });

    if (cpError) {
      return res.status(500).json({ ok: false, error: cpError.message });
    }

    return res.json({
      ok: true,
      id_archivo_cloud: archivo.id_archivo
    });

  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }

});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});