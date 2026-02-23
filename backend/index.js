import "dotenv/config";
import express from "express";
import { createClient } from "@supabase/supabase-js";

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing env vars SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/db-check", async (req, res) => {
  const { data, error } = await supabase
    .from("empresa")
    .select("id_empresa,nombre_empresa")
    .limit(1);

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ ok: true, sample: data });
});

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});