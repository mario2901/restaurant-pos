import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import styles from "../style/AdminEditor.module.css";
import s from "../style/AdminSettings.module.css";
import { useSettings, useUpdateSettings } from "../hooks/useSettings";
import { useBackupStatus, useCreateBackup } from "../hooks/useBackup";
import { checkPrinter, getWindowsPrinters, testPrinter } from "../data/api";

const formatSize = (bytes) =>
  bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1).replace(".", ",")} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;

const formatDateTime = (iso) =>
  iso
    ? new Date(iso).toLocaleString("hr-HR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "–";

function Card({ title, children }) {
  return (
    <section className={s.card}>
      <h3 className={s.cardTitle}>{title}</h3>
      {children}
    </section>
  );
}

function Hint({ children }) {
  return <p className={s.hint}>{children}</p>;
}

// ==================== OBRAČUN PIĆA ====================

function DrinksCard({ settings }) {
  const update = useUpdateSettings();
  const on = settings.drinksTracked;
  return (
    <Card title="Obračun pića">
      <button
        type="button"
        role="switch"
        aria-checked={on}
        className={`${styles.toggle} ${on ? styles.toggleOn : ""}`}
        onClick={() => update.mutate({ drinksTracked: !on })}
        disabled={update.isPending}
      >
        <span className={styles.toggleTrack}>
          <span className={styles.toggleThumb} />
        </span>
        {on ? "Uključen" : "Isključen"}
      </button>
      <Hint>
        Piće se uvijek kuca na stol i ispisuje na računu.{" "}
        {on
          ? "Piće ulazi u sve izvještaje i skida se sa zalihe."
          : "Piće NE ulazi u izvještaje i zaliha pića se NE dira."}{" "}
        Izvještaji (i za prošle dane) računaju se po trenutnoj postavci.
      </Hint>
      {update.error && <p className={styles.error}>{update.error.message}</p>}
    </Card>
  );
}

// ==================== AUTOMATSKO ZATVARANJE ====================

function AutoCloseCard({ settings }) {
  const update = useUpdateSettings();
  const [delivery, setDelivery] = useState(settings.deliveryCloseTime);
  const [all, setAll] = useState(settings.allCloseTime);

  const dirty =
    delivery !== settings.deliveryCloseTime || all !== settings.allCloseTime;
  const valid = delivery && all && delivery < all;

  return (
    <Card title="Automatsko zatvaranje narudžbi">
      <div className={s.row}>
        <label className={styles.field}>
          <span className={styles.label}>Dostava</span>
          <input
            type="time"
            className={styles.input}
            value={delivery}
            onChange={(e) => setDelivery(e.target.value)}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Sve ostalo (stolovi, za ponijeti)</span>
          <input
            type="time"
            className={styles.input}
            value={all}
            onChange={(e) => setAll(e.target.value)}
          />
        </label>
      </div>
      <Hint>
        Zatvaraju se otvorene narudžbe napravljene prije tog vremena (ulaze u
        promet). Narudžbe napravljene kasnije zatvara konobar. Promjena vrijedi
        odmah, bez restarta.
      </Hint>
      {!valid && (
        <p className={styles.error}>
          Zatvaranje dostave mora biti prije zatvaranja svih narudžbi.
        </p>
      )}
      {dirty && (
        <button
          type="button"
          className={`${styles.primary} ${s.alignStart}`}
          disabled={!valid || update.isPending}
          onClick={() =>
            update.mutate({ deliveryCloseTime: delivery, allCloseTime: all })
          }
        >
          {update.isPending ? "Spremam…" : "Spremi vremena"}
        </button>
      )}
      {update.isSuccess && !dirty && <p className={s.ok}>Spremljeno.</p>}
      {update.error && <p className={styles.error}>{update.error.message}</p>}
    </Card>
  );
}

// ==================== PRINTERI ====================

function PrinterActions({ printer }) {
  const check = useMutation({ mutationFn: () => checkPrinter(printer) });
  const test = useMutation({ mutationFn: () => testPrinter(printer) });

  return (
    <div className={s.printerActions}>
      <div className={s.row}>
        <button
          type="button"
          className={`${styles.secondary} ${styles.small}`}
          onClick={() => {
            test.reset();
            check.mutate();
          }}
          disabled={check.isPending}
        >
          {check.isPending ? "Provjeravam…" : "Provjeri stanje"}
        </button>
        <button
          type="button"
          className={`${styles.ghost} ${styles.small}`}
          onClick={() => {
            check.reset();
            test.mutate();
          }}
          disabled={test.isPending}
        >
          {test.isPending ? "Šaljem…" : "Probni ispis"}
        </button>
      </div>
      {check.data && (
        <p className={check.data.ok ? s.ok : styles.error}>
          {check.data.ok ? "✓ " : "✗ "}
          {check.data.message}
        </p>
      )}
      {check.error && <p className={styles.error}>{check.error.message}</p>}
      {test.isSuccess && <p className={s.ok}>✓ Probna stranica poslana.</p>}
      {test.error && <p className={styles.error}>{test.error.message}</p>}
    </div>
  );
}

// Veličina stavki na kuhinjskom tiketu (visina x širina). 2x2 = tekst printera,
// 3x2 i 4x3 = backend crta stavke kao sliku (Datecs tekst zna najviše 2x).
const KITCHEN_FONTS = [
  { id: "2x2", label: "2× × 2×", hint: "standard" },
  { id: "3x2", label: "3× × 2×", hint: "veće" },
  { id: "4x3", label: "4× × 3×", hint: "najveće" },
];

function KitchenFontPicker({ settings }) {
  const update = useUpdateSettings();
  const current = settings.kitchenFontSize ?? "2x2";

  return (
    <div className={styles.field}>
      <span className={styles.label}>Veličina stavki na kuhinji (visina × širina)</span>
      <div className={s.segment}>
        {KITCHEN_FONTS.map((f) => (
          <button
            key={f.id}
            type="button"
            className={current === f.id ? s.segmentActive : ""}
            disabled={update.isPending}
            onClick={() => current !== f.id && update.mutate({ kitchenFontSize: f.id })}
          >
            {f.label} <small>({f.hint})</small>
          </button>
        ))}
      </div>
      <Hint>
        Vrijedi odmah za novu narudžbu, dodatak i storno u kuhinji. 3×2 i 4×3 ispisuju
        stavke kao sliku, pa je tiket duži. Klikni „Probni ispis" da vidiš veličinu
        na papiru.
      </Hint>
      {update.error && <p className={styles.error}>{update.error.message}</p>}
    </div>
  );
}

// Skraćivanje riječi na kuhinji — ista logika kao TicketService.shortWords
const WORD_LENGTHS = [0, 4, 5, 6, 7, 8, 10, 12];
const shortWords = (text, max) =>
  max > 0
    ? text
        .trim()
        .split(/\s+/)
        .map((w) => Array.from(w).slice(0, max).join(""))
        .join(" ")
    : text;

function KitchenWordLengthPicker({ settings }) {
  const update = useUpdateSettings();
  const current = settings.kitchenWordLength ?? 6;
  const options = WORD_LENGTHS.includes(current)
    ? WORD_LENGTHS
    : [...WORD_LENGTHS, current].sort((a, b) => a - b);
  const example = "Gurmanska pljeskavica - Velika";

  return (
    <div className={styles.field}>
      <span className={styles.label}>Skraćivanje riječi na kuhinji</span>
      <select
        className={styles.input}
        value={current}
        disabled={update.isPending}
        onChange={(e) => update.mutate({ kitchenWordLength: Number(e.target.value) })}
      >
        {options.map((n) => (
          <option key={n} value={n}>
            {n === 0 ? "Bez skraćivanja (puni nazivi)" : `Prvih ${n} slova svake riječi`}
          </option>
        ))}
      </select>
      <Hint>
        Primjer: „{example}" → <strong>{shortWords(example, current)}</strong>. Skraćuju se
        samo naziv jela i porcija na kuhinji; napomene, šank i račun ostaju puni.
      </Hint>
      {update.error && <p className={styles.error}>{update.error.message}</p>}
    </div>
  );
}

function PrintersCard({ settings }) {
  const update = useUpdateSettings();
  const [kitchenHost, setKitchenHost] = useState(settings.kitchenHost);
  const [kitchenPort, setKitchenPort] = useState(String(settings.kitchenPort));
  const [barMode, setBarMode] = useState(settings.barWindowsName ? "usb" : "lan");
  const [barWindowsName, setBarWindowsName] = useState(settings.barWindowsName);
  const [barHost, setBarHost] = useState(settings.barHost);
  const [barPort, setBarPort] = useState(String(settings.barPort));
  const { data: windowsPrinters = [], isPending: loadingPrinters } = useQuery({
    queryKey: ["print", "windows-printers"],
    queryFn: getWindowsPrinters,
    staleTime: 60_000,
  });

  const portOk = (p) => /^\d+$/.test(p) && Number(p) >= 1 && Number(p) <= 65535;
  const valid =
    kitchenHost.trim() &&
    portOk(kitchenPort) &&
    (barMode === "usb" ? barWindowsName.trim() : barHost.trim() && portOk(barPort));

  const dirty =
    kitchenHost.trim() !== settings.kitchenHost ||
    Number(kitchenPort) !== settings.kitchenPort ||
    (barMode === "usb"
      ? barWindowsName.trim() !== settings.barWindowsName
      : !!settings.barWindowsName ||
        barHost.trim() !== settings.barHost ||
        Number(barPort) !== settings.barPort);

  function save() {
    update.mutate({
      kitchenHost: kitchenHost.trim(),
      kitchenPort: Number(kitchenPort),
      // USB ima prednost na backendu -> za LAN se Windows ime briše (prazan string)
      barWindowsName: barMode === "usb" ? barWindowsName.trim() : "",
      barHost: barMode === "lan" ? barHost.trim() : "",
      barPort: Number(barPort) || 9100,
    });
  }

  return (
    <Card title="Printeri">
      <div className={s.printer}>
        <h4 className={styles.sectionTitle}>Kuhinja (LAN)</h4>
        <div className={s.row}>
          <label className={styles.field}>
            <span className={styles.label}>IP adresa</span>
            <input
              className={styles.input}
              value={kitchenHost}
              onChange={(e) => setKitchenHost(e.target.value)}
              placeholder="192.168.1.201"
              inputMode="decimal"
            />
          </label>
          <label className={`${styles.field} ${s.portField}`}>
            <span className={styles.label}>Port</span>
            <input
              className={styles.input}
              value={kitchenPort}
              onChange={(e) => setKitchenPort(e.target.value.replace(/\D/g, ""))}
              inputMode="numeric"
            />
          </label>
        </div>
        <KitchenFontPicker settings={settings} />
        <KitchenWordLengthPicker settings={settings} />
        <PrinterActions printer="kitchen" />
      </div>

      <div className={s.printer}>
        <h4 className={styles.sectionTitle}>Šank</h4>
        <div className={s.segment}>
          <button
            type="button"
            className={barMode === "usb" ? s.segmentActive : ""}
            onClick={() => setBarMode("usb")}
          >
            USB (Windows printer)
          </button>
          <button
            type="button"
            className={barMode === "lan" ? s.segmentActive : ""}
            onClick={() => setBarMode("lan")}
          >
            LAN (IP adresa)
          </button>
        </div>

        {barMode === "usb" ? (
          <label className={styles.field}>
            <span className={styles.label}>Printer u Windowsima</span>
            <select
              className={styles.input}
              value={barWindowsName}
              onChange={(e) => setBarWindowsName(e.target.value)}
            >
              <option value="">
                {loadingPrinters ? "Učitavanje…" : "— odaberi printer —"}
              </option>
              {barWindowsName && !windowsPrinters.includes(barWindowsName) && (
                <option value={barWindowsName}>{barWindowsName} (nije pronađen)</option>
              )}
              {windowsPrinters.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <div className={s.row}>
            <label className={styles.field}>
              <span className={styles.label}>IP adresa</span>
              <input
                className={styles.input}
                value={barHost}
                onChange={(e) => setBarHost(e.target.value)}
                placeholder="192.168.1.202"
                inputMode="decimal"
              />
            </label>
            <label className={`${styles.field} ${s.portField}`}>
              <span className={styles.label}>Port</span>
              <input
                className={styles.input}
                value={barPort}
                onChange={(e) => setBarPort(e.target.value.replace(/\D/g, ""))}
                inputMode="numeric"
              />
            </label>
          </div>
        )}
        <PrinterActions printer="bar" />
      </div>

      <Hint>
        Spremi promjene prije provjere ili probnog ispisa — provjera koristi
        spremljene adrese.
      </Hint>
      {dirty && (
        <button
          type="button"
          className={`${styles.primary} ${s.alignStart}`}
          disabled={!valid || update.isPending}
          onClick={save}
        >
          {update.isPending ? "Spremam…" : "Spremi printere"}
        </button>
      )}
      {update.isSuccess && !dirty && <p className={s.ok}>Spremljeno.</p>}
      {update.error && <p className={styles.error}>{update.error.message}</p>}
    </Card>
  );
}

// ==================== BACKUP ====================

function BackupCard({ settings }) {
  const { data: status, isPending, error } = useBackupStatus();
  const create = useCreateBackup();
  const update = useUpdateSettings();
  const [secondary, setSecondary] = useState(settings.backupSecondaryDir);
  const [showAll, setShowAll] = useState(false);

  if (isPending) return <Card title="Backup baze"><p className={styles.muted}>Učitavanje…</p></Card>;
  if (error) return <Card title="Backup baze"><p className={styles.error}>{error.message}</p></Card>;

  const last = status.last;
  const list = showAll ? status.backups : status.backups.slice(0, 5);

  return (
    <Card title="Backup baze">
      <div className={`${s.backupStatus} ${status.stale ? s.backupBad : s.backupOk}`}>
        {last ? (
          <>
            <strong>
              {status.stale ? "⚠ Zadnji backup je stariji od 2 dana" : "✓ Zadnji backup"}
            </strong>
            <span>
              {formatDateTime(last.createdAt)} · {formatSize(last.sizeBytes)}
            </span>
          </>
        ) : (
          <strong>⚠ Još nema nijednog backupa</strong>
        )}
      </div>

      {status.lastError && (
        <p className={styles.error}>
          Greška ({formatDateTime(status.lastErrorAt)}): {status.lastError}
        </p>
      )}

      <button
        type="button"
        className={`${styles.primary} ${s.alignStart}`}
        onClick={() => create.mutate()}
        disabled={create.isPending}
      >
        {create.isPending ? "Radim backup…" : "Napravi backup sada"}
      </button>
      {create.isSuccess && (
        <p className={s.ok}>✓ Backup napravljen: {create.data.name}</p>
      )}
      {create.error && <p className={styles.error}>{create.error.message}</p>}

      <Hint>
        Automatski svaki dan u 22:45 i pri pokretanju programa ako je zadnji
        backup stariji od 24 h. Čuva se zadnjih {status.keep} kopija u{" "}
        <code>{status.dir}</code>.
      </Hint>

      <label className={styles.field}>
        <span className={styles.label}>
          Druga lokacija (USB ili Google Drive / OneDrive folder) — preporučeno
        </span>
        <div className={s.row}>
          <input
            className={styles.input}
            value={secondary}
            onChange={(e) => setSecondary(e.target.value)}
            placeholder="npr. E:\megi-backup ili C:\Users\...\Google Drive\megi"
          />
          {secondary.trim() !== settings.backupSecondaryDir && (
            <button
              type="button"
              className={`${styles.primary} ${styles.small}`}
              onClick={() => update.mutate({ backupSecondaryDir: secondary.trim() })}
              disabled={update.isPending}
            >
              Spremi
            </button>
          )}
        </div>
      </label>
      {update.error && <p className={styles.error}>{update.error.message}</p>}

      {status.backups.length > 0 && (
        <div className={s.backupList}>
          <span className={styles.label}>Kopije</span>
          <ul>
            {list.map((b) => (
              <li key={b.name}>
                <span>{formatDateTime(b.createdAt)}</span>
                <span className={s.backupName}>{b.name}</span>
                <span>{formatSize(b.sizeBytes)}</span>
              </li>
            ))}
          </ul>
          {status.backups.length > 5 && (
            <button
              type="button"
              className={`${styles.ghost} ${styles.small} ${s.alignStart}`}
              onClick={() => setShowAll((v) => !v)}
            >
              {showAll ? "Prikaži manje" : `Prikaži sve (${status.backups.length})`}
            </button>
          )}
        </div>
      )}

      <Hint>
        Vraćanje backupa: ugasi program i pokreni <code>vrati-backup.bat</code>.
        Trenutna baza se ne briše, nego se sačuva kao megi-prije-vracanja-….
      </Hint>
    </Card>
  );
}

// ==================== STRANICA ====================

const TABS = [
  { id: "drinks", label: "Postavke pića" },
  { id: "printers", label: "Postavke printera" },
  { id: "backup", label: "Backup podataka" },
  { id: "autoclose", label: "Zatvaranje narudžbi" },
];

/** Admin -> Postavke aplikacije, podijeljeno po tabovima. */
export default function AdminSettings() {
  const { data: settings, isPending, error } = useSettings();
  const [tab, setTab] = useState(TABS[0].id);

  if (isPending) return <p className={styles.muted}>Učitavanje…</p>;
  if (error) return <p className={styles.error}>{error.message}</p>;

  return (
    <div className={s.page}>
      <h2 className={styles.pageTitle}>Postavke</h2>

      <div className={s.tabs} role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={`${s.tab} ${tab === t.id ? s.tabActive : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className={s.tabPanel}>
        {tab === "drinks" && <DrinksCard settings={settings} />}
        {tab === "printers" && <PrintersCard settings={settings} />}
        {tab === "backup" && <BackupCard settings={settings} />}
        {tab === "autoclose" && <AutoCloseCard settings={settings} />}
      </div>
    </div>
  );
}
