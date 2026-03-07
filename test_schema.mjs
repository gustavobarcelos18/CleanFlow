import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// read the .env file instead of relying on process.env
const envPath = path.resolve(process.cwd(), ".env");
const envFile = fs.readFileSync(envPath, "utf8");

let url = "";
let key = "";

envFile.split("\n").forEach((line) => {
  if (line.startsWith("VITE_SUPABASE_URL=")) url = line.split("=")[1].trim();
  if (line.startsWith("VITE_SUPABASE_ANON_KEY="))
    key = line.split("=")[1].trim();
});

const supabase = createClient(url, key);

async function testThemeSync() {
  const { data, error } = await supabase.from("profiles").select("*").limit(1);
  console.log(
    "Profile columns:",
    data && data.length > 0 ? Object.keys(data[0]) : "None",
  );
  console.log("Error:", error);
}

testThemeSync();
