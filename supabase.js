
const SUPABASE_URL = "https://aoglabyxlzojfjghazdv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_4ykgBRKPu6oaH756ZXrNTg_9k1Y1frf";

let supabaseClient = null;
let supabaseEinrichtungsHinweis = "";

const hatSupabasePlatzhalter =
  SUPABASE_URL === "YOUR_SUPABASE_URL" ||
  SUPABASE_PUBLISHABLE_KEY === "YOUR_SUPABASE_PUBLISHABLE_KEY";

if (hatSupabasePlatzhalter) {
  supabaseEinrichtungsHinweis =
    "Trage in supabase.js die Supabase-URL und den Publishable Key ein.";
} else if (!window.supabase) {
  supabaseEinrichtungsHinweis =
    "Supabase konnte nicht geladen werden. Prüfe deine Internetverbindung.";
} else {
  try {
    supabaseClient = window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_PUBLISHABLE_KEY
    );
  } catch (fehler) {
    supabaseEinrichtungsHinweis =
      "Die Supabase-Einstellungen sind ungültig. Prüfe URL und Publishable Key.";
    console.error("Der Supabase-Client konnte nicht erstellt werden:", fehler);
  }
}
