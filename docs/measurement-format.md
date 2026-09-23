# Format einer Messung

Für jede Beobachtung sendet die Anwendung ein einfaches JavaScript-Objekt. Die Eigenschaftsnamen entsprechen genau der vorhandenen Tabelle `public.measurements`.

## Felder

| Eigenschaft | JavaScript-Wert | Pflichtfeld | Bedeutung |
| --- | --- | --- | --- |
| `phenomenon` | String | Ja | Gemessenes Phänomen, zum Beispiel `temperatur` oder `laerm` |
| `value` | Number | Ja | Numerisches Messergebnis |
| `unit` | String | Ja | Einheit, zum Beispiel `°C` oder `dB` |
| `latitude` | Number | Ja | Breitengrad zwischen `-90` und `90` |
| `longitude` | Number | Ja | Längengrad zwischen `-180` und `180` |
| `measured_at` | ISO-Zeitstempel | Ja | Zeitpunkt der Messung |
| `notes` | String oder `null` | Nein | Kurze Beschreibung ohne persönliche Angaben |

Beispiel:

```javascript
{
  phenomenon: "temperatur",
  value: 24.7,
  unit: "°C",
  latitude: 51.51,
  longitude: 7.46,
  measured_at: "2026-09-22T12:35:00.000Z",
  notes: "Messung im Schatten"
}
```

Die Datenbank erzeugt `id` automatisch. Deshalb wird `id` nicht mitgesendet. Die Anwendung verwendet auch keine Felder wie `source`, `device_id` oder `user_id`.

## Umwandlung des Zeitpunkts

Das Formular verwendet `datetime-local`. Die Eingabe beschreibt also die Ortszeit des Browsers. JavaScript wandelt sie vor dem Speichern um:

```javascript
const lokalerZeitpunkt = "2026-09-22T14:35";
const isoZeitpunkt = new Date(lokalerZeitpunkt).toISOString();
```

In einer Zeitzone mit UTC+02:00 entsteht daraus:

```text
2026-09-22T12:35:00.000Z
```

Das `Z` steht für UTC. Supabase speichert diesen Wert in der Spalte `measured_at`. Bei der Anzeige wandelt die Anwendung ihn wieder in die Ortszeit um.

## Prüfung vor dem Speichern

Die Anwendung prüft:

- `phenomenon` ist nicht leer;
- `value` ist eine endliche Zahl;
- `unit` ist nicht leer;
- `latitude` liegt zwischen `-90` und `90`;
- `longitude` liegt zwischen `-180` und `180`;
- `measured_at` enthält einen gültigen Zeitpunkt.

Ein leeres Notizfeld wird als `null` gespeichert.

## Einheitliche Daten sammeln

Einigt euch vor einer Messreihe auf gemeinsame Einheiten, zum Beispiel immer `°C` für Temperatur oder `dB` für Lautstärke. Die Datenbank rechnet nicht zwischen Einheiten um.

Tragt keine Namen, Adressen oder andere persönliche Informationen ein. Kartenkoordinaten können einen Ort sehr genau zeigen.
