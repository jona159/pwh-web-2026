const STANDARD_KARTENMITTE = [51.976, 7.417];
const STANDARD_ZOOMSTUFE = 12;

// Diese Spaltennamen gehören zur Datenbank und dürfen nicht übersetzt werden.
const MESSUNGS_SPALTEN =
  "phenomenon, value, unit, latitude, longitude, measured_at, notes";

// Formularelemente
const formular = document.querySelector("#measurement-form");
const phaenomenFeld = document.querySelector("#phenomenon");
const messwertFeld = document.querySelector("#value");
const einheitFeld = document.querySelector("#unit");
const breitengradFeld = document.querySelector("#latitude");
const laengengradFeld = document.querySelector("#longitude");
const zeitpunktFeld = document.querySelector("#measured-at");
const notizenFeld = document.querySelector("#notes");
const speichernButton = document.querySelector("#save-button");
const formularMeldung = document.querySelector("#form-message");

// Karten- und Listenelemente
const kartenElement = document.querySelector("#map");
const kartenMeldung = document.querySelector("#map-message");
const listenStatus = document.querySelector("#list-status");
const messungsListe = document.querySelector("#measurement-list");

let karte = null;
let temporaererMarker = null;
let messungsEbene = null;

initialisiereApp();

function initialisiereApp() {
  setzeAktuellenZeitpunkt();
  initialisiereKarte();

  formular.addEventListener("submit", speichereMessung);
  breitengradFeld.addEventListener("change", aktualisiereMarkerAusKoordinaten);
  laengengradFeld.addEventListener("change", aktualisiereMarkerAusKoordinaten);

  if (!supabaseClient) {
    speichernButton.disabled = true;
    zeigeFormularMeldung(supabaseEinrichtungsHinweis, "info");
    setzeListenStatus("Verbinde Supabase, um Messungen zu laden.");
    messungsListe.setAttribute("aria-busy", "false");
    return;
  }

  ladeMessungen();
}

// Karte
function initialisiereKarte() {
  // Die App funktioniert zunächst auch ohne Karte. Sobald die Lernenden
  // Leaflet und den Kartencontainer ergänzen, wird die Karte initialisiert.
  if (!kartenElement || !window.L) {
    return;
  }

  karte = L.map(kartenElement).setView(
    STANDARD_KARTENMITTE,
    STANDARD_ZOOMSTUFE
  );

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>-Mitwirkende',
  }).addTo(karte);

  messungsEbene = L.layerGroup().addTo(karte);

  karte.on("click", ({ latlng }) => {
    const { lat, lng } = latlng;
    breitengradFeld.value = lat.toFixed(6);
    laengengradFeld.value = lng.toFixed(6);
    setzeTemporaerenMarker(lat, lng);
    kartenMeldung.textContent = `Ausgewählter Ort: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  });
}

function aktualisiereMarkerAusKoordinaten() {
  const breitengrad = Number(breitengradFeld.value);
  const laengengrad = Number(laengengradFeld.value);

  if (
    breitengradFeld.value === "" ||
    laengengradFeld.value === "" ||
    !sindGueltigeKoordinaten(breitengrad, laengengrad)
  ) {
    return;
  }

  setzeTemporaerenMarker(breitengrad, laengengrad);
  kartenMeldung.textContent =
    `Ausgewählter Ort: ${breitengrad.toFixed(6)}, ${laengengrad.toFixed(6)}`;

  if (karte) {
    karte.panTo([breitengrad, laengengrad]);
  }
}

function setzeTemporaerenMarker(breitengrad, laengengrad) {
  if (!karte) {
    return;
  }

  const position = [breitengrad, laengengrad];

  if (temporaererMarker) {
    temporaererMarker.setLatLng(position);
  } else {
    temporaererMarker = L.marker(position, { zIndexOffset: 1000 })
      .addTo(karte)
      .bindTooltip("Ausgewählter Ort");
  }
}

function sindGueltigeKoordinaten(breitengrad, laengengrad) {
  return (
    Number.isFinite(breitengrad) &&
    Number.isFinite(laengengrad) &&
    breitengrad >= -90 &&
    breitengrad <= 90 &&
    laengengrad >= -180 &&
    laengengrad <= 180
  );
}

// Speichern und prüfen
async function speichereMessung(event) {
  event.preventDefault();
  zeigeFormularMeldung("", "info");

  const ergebnis = erstelleMessungAusFormular();

  if (!ergebnis.gueltig) {
    zeigeFormularMeldung(ergebnis.meldung, "fehler");
    ergebnis.feld.focus();
    return;
  }

  if (!supabaseClient) {
    zeigeFormularMeldung(supabaseEinrichtungsHinweis, "fehler");
    return;
  }

  setzeSpeicherStatus(true);

  try {
    const { error } = await supabaseClient
      .from("measurements")
      .insert(ergebnis.messung);

    if (error) {
      throw error;
    }

    leereFormular();
    zeigeFormularMeldung("Die Messung wurde gespeichert.", "erfolg");
    await ladeMessungen();
  } catch (fehler) {
    console.error("Die Messung konnte nicht gespeichert werden:", fehler);
    zeigeFormularMeldung(
      `Die Messung konnte nicht gespeichert werden. ${liesFehlerMeldung(fehler)}`,
      "fehler"
    );
  } finally {
    setzeSpeicherStatus(false);
  }
}

function erstelleMessungAusFormular() {
  const phaenomen = phaenomenFeld.value.trim();
  const messwertText = messwertFeld.value.trim();
  const einheit = einheitFeld.value.trim();
  const breitengradText = breitengradFeld.value.trim();
  const laengengradText = laengengradFeld.value.trim();
  const zeitpunktText = zeitpunktFeld.value.trim();
  const notizen = notizenFeld.value.trim();

  const messwert = Number(messwertText);
  const breitengrad = Number(breitengradText);
  const laengengrad = Number(laengengradText);
  const zeitpunkt = new Date(zeitpunktText);

  if (phaenomen === "") {
    return ungueltig("Wähle ein Phänomen aus.", phaenomenFeld);
  }

  if (messwertText === "" || !Number.isFinite(messwert)) {
    return ungueltig("Gib einen gültigen Messwert ein.", messwertFeld);
  }

  if (einheit === "") {
    return ungueltig("Gib eine Einheit ein.", einheitFeld);
  }

  if (
    breitengradText === "" ||
    !Number.isFinite(breitengrad) ||
    breitengrad < -90 ||
    breitengrad > 90
  ) {
    return ungueltig(
      "Der Breitengrad muss zwischen -90 und 90 liegen.",
      breitengradFeld
    );
  }

  if (
    laengengradText === "" ||
    !Number.isFinite(laengengrad) ||
    laengengrad < -180 ||
    laengengrad > 180
  ) {
    return ungueltig(
      "Der Längengrad muss zwischen -180 und 180 liegen.",
      laengengradFeld
    );
  }

  if (zeitpunktText === "" || Number.isNaN(zeitpunkt.getTime())) {
    return ungueltig("Gib einen gültigen Zeitpunkt ein.", zeitpunktFeld);
  }

  const messung = {
    phenomenon: phaenomen,
    value: messwert,
    unit: einheit,
    latitude: breitengrad,
    longitude: laengengrad,
    measured_at: zeitpunkt.toISOString(),
    notes: notizen || null,
  };

  return { gueltig: true, messung };
}

function ungueltig(meldung, feld) {
  return { gueltig: false, meldung, feld };
}

function setzeSpeicherStatus(wirdGespeichert) {
  formular.setAttribute("aria-busy", String(wirdGespeichert));
  speichernButton.disabled = wirdGespeichert;
  speichernButton.textContent = wirdGespeichert
    ? "Wird gespeichert…"
    : "Messung speichern";
}

function leereFormular() {
  formular.reset();
  setzeAktuellenZeitpunkt();

  if (temporaererMarker && karte) {
    temporaererMarker.removeFrom(karte);
    temporaererMarker = null;
  }

  kartenMeldung.textContent = "Noch kein Ort ausgewählt.";
}

function setzeAktuellenZeitpunkt() {
  const jetzt = new Date();
  const lokaleZeit = new Date(
    jetzt.getTime() - jetzt.getTimezoneOffset() * 60_000
  );
  zeitpunktFeld.value = lokaleZeit.toISOString().slice(0, 16);
}

// Laden und anzeigen
async function ladeMessungen() {
  if (!supabaseClient) {
    return;
  }

  setzeListenStatus("Messungen werden geladen…");
  messungsListe.setAttribute("aria-busy", "true");
  messungsListe.replaceChildren();

  if (messungsEbene) {
    messungsEbene.clearLayers();
  }

  try {
    const { data, error } = await supabaseClient
      .from("measurements")
      .select(MESSUNGS_SPALTEN)
      .order("measured_at", { ascending: false });

    if (error) {
      throw error;
    }

    zeigeMessungen(data || []);
  } catch (fehler) {
    console.error("Die Messungen konnten nicht geladen werden:", fehler);
    setzeListenStatus(
      `Die Messungen konnten nicht geladen werden. ${liesFehlerMeldung(fehler)}`,
      true
    );
  } finally {
    messungsListe.setAttribute("aria-busy", "false");
  }
}

function zeigeMessungen(messungen) {
  if (messungen.length === 0) {
    setzeListenStatus("Es wurden noch keine Messungen gespeichert.");
    return;
  }

  const markerPositionen = [];

  for (const messung of messungen) {
    messungsListe.append(erstelleListenEintrag(messung));

    const breitengrad = Number(messung.latitude);
    const laengengrad = Number(messung.longitude);

    if (
      messungsEbene &&
      sindGueltigeKoordinaten(breitengrad, laengengrad)
    ) {
      L.marker([breitengrad, laengengrad])
        .bindPopup(erstellePopup(messung))
        .addTo(messungsEbene);
      markerPositionen.push([breitengrad, laengengrad]);
    }
  }

  const bezeichnung = messungen.length === 1 ? "Messung" : "Messungen";
  setzeListenStatus(`${messungen.length} ${bezeichnung} geladen.`);
  passeKarteAnMarkerAn(markerPositionen);
}

function erstelleListenEintrag(messung) {
  const eintrag = document.createElement("li");
  eintrag.className = "measurement-item";

  eintrag.append(
    erstelleTextElement(
      "h3",
      "measurement-title",
      `${messung.phenomenon}: ${messung.value} ${messung.unit}`
    ),
    erstelleTextElement(
      "p",
      "measurement-meta",
      formatiereZeitpunkt(messung.measured_at)
    ),
    erstelleTextElement(
      "p",
      "measurement-meta",
      `Ort: ${formatiereKoordinate(messung.latitude)}, ${formatiereKoordinate(messung.longitude)}`
    )
  );

  if (messung.notes) {
    eintrag.append(
      erstelleTextElement("p", "measurement-notes", messung.notes)
    );
  }

  return eintrag;
}

function erstellePopup(messung) {
  const popup = document.createElement("div");
  popup.className = "popup-content";
  popup.append(
    erstelleTextElement(
      "strong",
      "",
      `${messung.phenomenon}: ${messung.value} ${messung.unit}`
    ),
    erstelleTextElement("p", "", formatiereZeitpunkt(messung.measured_at))
  );

  if (messung.notes) {
    popup.append(erstelleTextElement("p", "", messung.notes));
  }

  return popup;
}

function erstelleTextElement(elementName, klassenName, text) {
  const element = document.createElement(elementName);
  element.className = klassenName;
  element.textContent = text;
  return element;
}

function passeKarteAnMarkerAn(markerPositionen) {
  if (!karte || markerPositionen.length === 0) {
    return;
  }

  karte.fitBounds(L.latLngBounds(markerPositionen), {
    padding: [35, 35],
    maxZoom: 14,
  });
}

// Kleine Hilfsfunktionen
function formatiereZeitpunkt(zeitpunkt) {
  const datum = new Date(zeitpunkt);

  if (Number.isNaN(datum.getTime())) {
    return "Unbekannter Zeitpunkt";
  }

  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(datum);
}

function formatiereKoordinate(koordinate) {
  const zahl = Number(koordinate);
  return Number.isFinite(zahl) ? zahl.toFixed(5) : "unbekannt";
}

function zeigeFormularMeldung(meldung, art) {
  formularMeldung.textContent = meldung;
  formularMeldung.className = meldung ? `status status--${art}` : "status";
}

function setzeListenStatus(meldung, istFehler = false) {
  listenStatus.textContent = meldung;
  listenStatus.className = istFehler
    ? "list-status list-status--fehler"
    : "list-status";
}

function liesFehlerMeldung(fehler) {
  return fehler?.message?.trim() || "Bitte versuche es erneut.";
}
