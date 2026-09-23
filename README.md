# Citizen-Science-Starter

Eine kleine statische Webseite zum Erfassen und Anzeigen von Umweltmessungen. Sie verwendet nur HTML, CSS und JavaScript sowie Leaflet für die Karte und Supabase für die Datenspeicherung. Es gibt kein Framework, keinen eigenen Server und keinen Build-Schritt.

## Was kann die Anwendung?

- Messwert, Einheit, Ort, Zeitpunkt und optionale Notizen erfassen
- einen Ort per Kartenklick oder Koordinateneingabe auswählen
- den lokalen Zeitpunkt vor dem Speichern in einen ISO-Zeitpunkt umwandeln
- Messungen nach Zeitpunkt sortiert auf der Karte und in einer Liste anzeigen

## Projektdateien

```text
citizen-science-starter/
├── .devcontainer/
│   └── devcontainer.json
├── docs/
│   └── measurement-format.md
├── app.js
├── index.html
├── README.md
├── styles.css
└── supabase.js
```

## Schnellstart

### Mit Dev Container

Du benötigst Docker, Visual Studio Code und die Erweiterung **Dev Containers**.

1. Öffne den Ordner `citizen-science-starter` in Visual Studio Code.
2. Wähle **Dev Containers: Reopen in Container** in der Befehlspalette.
3. Starte im Terminal den statischen Webserver:

   ```bash
   python3 -m http.server 8000
   ```

4. Öffne `http://localhost:8000` im Browser.

Beende den Server mit <kbd>Strg</kbd>+<kbd>C</kbd>. Python liefert hier nur die statischen Dateien aus; die Anwendung selbst läuft als JavaScript im Browser.

Wenn Python lokal installiert ist, funktioniert derselbe Befehl auch ohne Dev Container.

## Anwendung ausprobieren

1. Wähle ein Phänomen aus.
2. Trage einen Messwert und eine Einheit wie `°C`, `%`, `µg/m³` oder `dB` ein.
3. Klicke auf die Karte und beobachte die Koordinaten im Formular.
4. Ändere bei Bedarf Zeitpunkt und Notizen.
5. Speichere die Messung.
6. Prüfe, ob sie auf der Karte und in der Liste erscheint.

Leaflet, Supabase und die OpenStreetMap-Kartenkacheln werden über das Internet geladen.

## Supabase einrichten

Wenn die Lehrkraft Supabase bereits eingerichtet hat, müssen Schülerinnen und Schüler hier nichts ändern.

Andernfalls werden **nur die ersten beiden Werte** in `supabase.js` ersetzt:

```javascript
const SUPABASE_URL = "YOUR_SUPABASE_URL";
const SUPABASE_PUBLISHABLE_KEY = "YOUR_SUPABASE_PUBLISHABLE_KEY";
```

Verwende ausschließlich den browsergeeigneten **Publishable Key**. Ein Secret Key, ein `service_role`-Key oder ein Datenbankpasswort darf niemals im Frontend stehen.

### Datenbankrechte für die Lehrkraft

Die vorhandene Tabelle benötigt Rechte und Row Level Security (RLS) für lesende und schreibende Zugriffe ohne Anmeldung. Prüfe zuerst vorhandene Policies. Ein mögliches Setup für dieses öffentliche Unterrichtsprojekt ist:

```sql
alter table public.measurements enable row level security;

grant select, insert on table public.measurements to anon;

create policy "Public can read measurements"
on public.measurements
for select
to anon
using (true);

create policy "Public can add measurements"
on public.measurements
for insert
to anon
with check (
    length(trim(phenomenon)) > 0
    and length(trim(unit)) > 0
    and latitude between -90 and 90
    and longitude between -180 and 180
);
```

Policy-Namen müssen eindeutig sein. Das Beispiel erlaubt weder `UPDATE` noch `DELETE`. Öffentliche anonyme Einträge können trotzdem missbraucht werden. Trage keine Namen, Privatadressen oder andere persönliche Informationen ein.

## Aufbau einer Messung

`app.js` sendet genau diese sieben Eigenschaften an Supabase:

```javascript
{
  phenomenon,
  value,
  unit,
  latitude,
  longitude,
  measured_at,
  notes
}
```

Die englischen Namen gehören zum Datenbankschema und dürfen im JavaScript-Objekt nicht übersetzt werden. Die Datenbank erzeugt `id` selbst. Weitere Einzelheiten stehen in [`docs/measurement-format.md`](./docs/measurement-format.md).

## Als GitHub-Vorlage verteilen

Lege den Inhalt dieses Ordners in die Wurzel eines eigenen GitHub-Repositorys und aktiviere in den Repository-Einstellungen **Template repository**. Lernende können danach über **Use this template** ein eigenes Repository anlegen.

Der eingetragene Publishable Key ist im Browser immer sichtbar. Seine erlaubten Aktionen werden deshalb durch RLS begrenzt.

## Statisch veröffentlichen

Es ist kein Build-Befehl nötig.

- **Cloudflare Pages:** Projektwurzel auf diesen Ordner setzen, Build-Befehl leer lassen und `.` als Ausgabeverzeichnis verwenden.
- **GitHub Pages:** Den Ordnerinhalt als Repository-Wurzel verwenden und unter **Settings → Pages** den Hauptbranch mit `/(root)` veröffentlichen.

Alle Pfade sind relativ und funktionieren daher auch unter einer GitHub-Pages-Projektadresse.

## Häufige Probleme

- **Supabase-Warnung:** Prüfe URL, Publishable Key und die unveränderte Platzhalterprüfung in `supabase.js`.
- **RLS- oder Rechtefehler:** Prüfe `SELECT`-/`INSERT`-Rechte und die beiden Policies.
- **Leere Karte:** Prüfe Internetverbindung und Browser-Konsole.
- **Alte Version sichtbar:** Führe einen Hard Refresh aus und kontrolliere, welchen Ordner Port 8000 ausliefert.

Weiterführende Dokumentation: [Supabase JavaScript](https://supabase.com/docs/reference/javascript/installing), [Supabase API Keys](https://supabase.com/docs/guides/getting-started/api-keys), [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security) und [Leaflet Quick Start](https://leafletjs.com/examples/quick-start/).
