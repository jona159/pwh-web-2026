const formular = document.querySelector("#messformular");
const meldung = document.querySelector("#meldung");
const speichernButton = formular.querySelector('button[type="submit"]');

const wasserTemperaturFeld =
  document.querySelector("#wassertemperatur");

const wasserEinheitFeld =
  document.querySelector("#einh");

const luftTemperaturFeld =
  document.querySelector("#lufttemperatur");

const luftEinheitFeld =
  document.querySelector("#einhei");

const breitengradFeld =
  document.querySelector("#breitengrad");

const laengengradFeld =
  document.querySelector("#laengengrad");

const datumFeld =
  document.querySelector("#datum");

const uhrzeitFeld =
  document.querySelector("#uhrzeit");


setzeAktuellenZeitpunkt();

formular.addEventListener("submit", speichereMessungen);


async function speichereMessungen(ereignis) {
  ereignis.preventDefault();
  zeigeMeldung("");

  const wasserTemperatur = liesZahl(wasserTemperaturFeld);
  const luftTemperatur = liesZahl(luftTemperaturFeld);
  const breitengrad = liesZahl(breitengradFeld);
  const laengengrad = liesZahl(laengengradFeld);

  const wasserEinheit = wasserEinheitFeld.value.trim();
  const luftEinheit = luftEinheitFeld.value.trim();

  if (!Number.isFinite(wasserTemperatur)) {
    zeigeMeldung("Gib eine gültige Wassertemperatur ein.", true);
    return;
  }

  if (!Number.isFinite(luftTemperatur)) {
    zeigeMeldung("Gib eine gültige Lufttemperatur ein.", true);
    return;
  }

  if (wasserEinheit === "" || luftEinheit === "") {
    zeigeMeldung("Gib für beide Messungen eine Einheit ein.", true);
    return;
  }

  if (
    !Number.isFinite(breitengrad) ||
    breitengrad < -90 ||
    breitengrad > 90
  ) {
    zeigeMeldung(
      "Der Breitengrad muss zwischen -90 und 90 liegen.",
      true
    );
    return;
  }

  if (
    !Number.isFinite(laengengrad) ||
    laengengrad < -180 ||
    laengengrad > 180
  ) {
    zeigeMeldung(
      "Der Längengrad muss zwischen -180 und 180 liegen.",
      true
    );
    return;
  }

  const zeitpunkt = new Date(
    `${datumFeld.value}T${uhrzeitFeld.value}`
  );

  if (
    datumFeld.value === "" ||
    uhrzeitFeld.value === "" ||
    Number.isNaN(zeitpunkt.getTime())
  ) {
    zeigeMeldung("Gib ein gültiges Datum und eine Uhrzeit ein.", true);
    return;
  }

  const gemeinsameDaten = {
    latitude: breitengrad,
    longitude: laengengrad,
    measured_at: zeitpunkt.toISOString(),
    notes: null,
  };

  const messungen = [
    {
      phenomenon: "wassertemperatur",
      value: wasserTemperatur,
      unit: wasserEinheit,
      ...gemeinsameDaten,
    },
    {
      phenomenon: "lufttemperatur",
      value: luftTemperatur,
      unit: luftEinheit,
      ...gemeinsameDaten,
    },
  ];

  if (typeof supabaseClient === "undefined" || !supabaseClient) {
    zeigeMeldung(
      "Es konnte keine Verbindung zu Supabase hergestellt werden.",
      true
    );
    return;
  }

  speichernButton.disabled = true;
  speichernButton.textContent = "Wird gespeichert…";

  try {
    const { error } = await supabaseClient
      .from("measurements")
      .insert(messungen);

    if (error) {
      throw error;
    }

    wasserTemperaturFeld.value = "";
    luftTemperaturFeld.value = "";

    zeigeMeldung(
      "Wasser- und Lufttemperatur wurden gespeichert."
    );
  } catch (fehler) {
    console.error("Fehler beim Speichern:", fehler);

    zeigeMeldung(
      `Die Messungen konnten nicht gespeichert werden: ${fehler.message}`,
      true
    );
  } finally {
    speichernButton.disabled = false;
    speichernButton.textContent = "Hinzufügen";
  }
}


function liesZahl(feld) {
  const text = feld.value.trim().replace(",", ".");

  if (text === "") {
    return NaN;
  }

  return Number(text);
}


function setzeAktuellenZeitpunkt() {
  const jetzt = new Date();

  const lokalerZeitpunkt = new Date(
    jetzt.getTime() - jetzt.getTimezoneOffset() * 60_000
  );

  const [datum, uhrzeit] = lokalerZeitpunkt
    .toISOString()
    .slice(0, 16)
    .split("T");

  datumFeld.value = datum;
  uhrzeitFeld.value = uhrzeit;
}


function zeigeMeldung(text, istFehler = false) {
  meldung.textContent = text;
  meldung.className = istFehler ? "fehler" : "erfolg";
}