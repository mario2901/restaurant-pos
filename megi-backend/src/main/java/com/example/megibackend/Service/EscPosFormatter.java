package com.example.megibackend.Service;

import com.example.megibackend.Config.PrinterProperties;
import com.example.megibackend.Dto.Ticket;
import com.example.megibackend.Dto.TicketLine;
import com.example.megibackend.Dto.TicketType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.Charset;
import java.text.Normalizer;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

/**
 * Ticket -> ESC/POS bajtovi za termalni printer 80 mm (Datecs EP-2000).
 * Font A = 48 znakova u redu; dupla širina = 24.
 */
@Component
@RequiredArgsConstructor
public class EscPosFormatter {

    private static final byte ESC = 0x1B, GS = 0x1D, LF = 0x0A, BEL = 0x07;
    private static final DateTimeFormatter TIME = DateTimeFormatter.ofPattern("dd.MM.yyyy. HH:mm");

    private final PrinterProperties props;

    public byte[] format(Ticket t) {
        boolean kitchen = t.type() == TicketType.KITCHEN || t.type() == TicketType.STORNO_KITCHEN;
        boolean storno = t.type() == TicketType.STORNO_KITCHEN || t.type() == TicketType.STORNO_BAR;
        // storno i "Dodaj još" moraju odmah pokazati KOJA narudžba i KOJI stol
        boolean highlight = storno || t.addition();
        int w = props.width();
        Buf b = new Buf();

        b.init();

        // Šank (račun, storno šank, izvještaj): podaci o restoranu na vrhu
        if (!kitchen && props.header() != null && !props.header().isEmpty()) {
            b.align(1);
            for (String h : props.header()) {
                if (notEmpty(h)) for (String s : wrap(h, w, "")) b.line(s);
            }
            b.line("-".repeat(w));
        }

        // Naslov: KUHINJA / ŠANK / RAČUN / STORNO ...
        b.align(1).bold(true).size(0x11).line(t.addition() ? "DODATAK KUHINJA" : title(t.type())).size(0);

        // Napomena (ZA PONIJETI, DOSTAVA, STORNO...) — velikim slovima, dupla visina
        if (highlight) b.line((storno ? "X" : "+").repeat(w));
        if (notEmpty(t.notice())) {
            b.size(0x01);
            for (String l : wrap(t.notice(), w, "")) b.line(l);
            b.size(0);
        }

        // Stol — kuhinji najvažnija informacija
        if (notEmpty(t.table())) b.size(0x11).line(tableLabel(t.table())).size(0);
        // Storno / dodatak: broj narudžbe velikim slovima ispod stola
        if (highlight && t.orderId() != null) {
            b.size(0x11).line("NARUDŽBA #" + t.orderId()).size(0);
            b.line((storno ? "X" : "+").repeat(w));
        }
        b.bold(false).align(0);

        // konobar samo na kuhinjskim tiketima — na šanku (račun gostu) se ne ispisuje
        b.line(twoCols(t.orderId() != null ? "Narudzba #" + t.orderId() : "",
                kitchen && notEmpty(t.waiter()) ? "Konobar: " + t.waiter() : "", w));
        b.line(LocalDateTime.now().format(TIME));
        b.line("-".repeat(w));

        // Stavke
        if (t.lines() != null) {
            for (TicketLine l : t.lines()) {
                // storno: "-2 x", dodatak: "+2 x" — da se ne zamijeni s novom narudžbom
                String sign = storno ? "-" : t.addition() ? "+" : "";
                String qty = sign + l.quantity() + " x ";
                String name = qty + l.name();
                if (kitchen) {
                    // "2 x Pizza Bio - Velika" u jednom redu; predugi naziv se prelama,
                    // nastavak poravnat ispod naziva (iza "2 x ")
                    b.bold(true).size(0x01);
                    for (String s : wrapItem(name, w, qty.length())) b.line(s);
                    b.size(0).bold(false);
                } else {
                    for (String s : twoColsWrapped(name, money(l.lineTotal()), w)) b.line(s);
                }
                if (notEmpty(l.detail())) {
                    if (kitchen) b.bold(true);
                    for (String s : wrap(l.detail(), w, "    ")) b.line(s);
                    b.bold(false);
                }
            }
        }

        // Ukupno
        if (t.total() != null && !kitchen) {
            b.line("-".repeat(w));
            b.bold(true).size(0x01).line(twoCols("UKUPNO", money(t.total()) + " " + props.currency(), w))
                    .size(0).bold(false);
        }

        // Adresa / telefon za dostavu i za ponijeti
        if (notEmpty(t.orderNote())) {
            b.line("-".repeat(w));
            b.bold(true).size(0x01);
            for (String s : wrap("Napomena: " + t.orderNote(), w, "")) b.line(s);
            b.size(0).bold(false);
        }

        if (t.type() == TicketType.BILL) {
            b.feed(1).align(1).line("Ovo nije fiskalni racun").align(0);
        }

        // Zvuk PRIJE rezanja: BEL poslan odmah nakon GS V Datecs zna "pojesti" rezanje.
        if (kitchen && props.kitchenBeep()) b.raw(BEL);
        b.feed(4).cut();
        return b.bytes();
    }

    /** Probna stranica za GET/POST /api/print/test/{printer}. */
    public byte[] testPage(String printerName, String address) {
        Buf b = new Buf();
        b.init();
        b.align(1).bold(true).size(0x11).line("TEST").size(0).line(printerName).bold(false);
        b.line(address);
        b.line(LocalDateTime.now().format(TIME));
        b.align(0).line("-".repeat(props.width()));
        b.line("Hrvatska slova: č ć ž š đ  Č Ć Ž Š Đ");
        b.line(twoCols("2 x Ćevapi", "15,00", props.width()));
        b.line("1234567890".repeat(5).substring(0, props.width()));
        b.feed(4).cut();
        return b.bytes();
    }

    // ==================== TEKST ====================

    private String title(TicketType type) {
        return switch (type) {
            case KITCHEN -> "KUHINJA";
            case BAR -> "ŠANK";
            case BILL -> "RAČUN";
            case STORNO_KITCHEN -> "STORNO KUHINJA";
            case STORNO_BAR -> "STORNO ŠANK";
            case REPORT -> "IZVJEŠTAJ";
        };
    }

    private String tableLabel(String table) {
        String up = table.toUpperCase();
        if (up.equals("DOSTAVA") || up.equals("PONIJETI")) return up;
        return "STOL " + table;
    }

    private String money(BigDecimal v) {
        if (v == null) return "";
        return v.setScale(2, RoundingMode.HALF_UP).toPlainString().replace('.', ',');
    }

    private static boolean notEmpty(String s) {
        return s != null && !s.isBlank();
    }

    private static String twoCols(String left, String right, int w) {
        int gap = w - left.length() - right.length();
        if (gap < 1) return (left + " " + right);
        return left + " ".repeat(gap) + right;
    }

    /** Naziv lijevo (s prelamanjem), iznos desno u zadnjem redu. */
    private static List<String> twoColsWrapped(String left, String right, int w) {
        if (right.isEmpty()) return wrap(left, w, "");
        List<String> lines = wrap(left, w - right.length() - 1, "");
        int last = lines.size() - 1;
        lines.set(last, twoCols(lines.get(last), right, w));
        return lines;
    }

    /**
     * Prelamanje stavke s visećim uvlačenjem: prvi red puna širina, nastavak uvučen
     * ispod naziva. Crtica porcije ("- Velika") se ne odvaja od porcije.
     */
    private static List<String> wrapItem(String text, int w, int hang) {
        String indent = " ".repeat(Math.min(hang, w / 3));
        List<String> words = new ArrayList<>();
        for (String word : text.trim().split("\\s+")) {
            int last = words.size() - 1;
            if (last >= 0 && words.get(last).equals("-")) words.set(last, "- " + word);
            else words.add(word);
        }
        List<String> out = new ArrayList<>();
        StringBuilder cur = new StringBuilder();
        for (String word : words) {
            String pad = out.isEmpty() ? "" : indent;
            int room = w - pad.length();
            if (cur.length() == 0) {
                // predugačka "riječ" — reži na širinu
                while (word.length() > room) {
                    out.add(pad + word.substring(0, room));
                    word = word.substring(room);
                    pad = indent;
                    room = w - pad.length();
                }
                cur.append(word);
            } else if (cur.length() + 1 + word.length() <= room) {
                cur.append(' ').append(word);
            } else {
                out.add(pad + cur);
                cur = new StringBuilder();
                pad = indent;
                room = w - pad.length();
                while (word.length() > room) {
                    out.add(pad + word.substring(0, room));
                    word = word.substring(room);
                }
                cur.append(word);
            }
        }
        if (cur.length() > 0 || out.isEmpty()) out.add((out.isEmpty() ? "" : indent) + cur);
        return out;
    }

    /** Jednostavno prelamanje po riječima; nastavak reda dobiva indent. */
    private static List<String> wrap(String text, int w, String indent) {
        List<String> out = new ArrayList<>();
        StringBuilder cur = new StringBuilder(indent);
        for (String word : text.trim().split("\\s+")) {
            while (word.length() > w - indent.length()) { // predugačka riječ
                if (cur.length() > indent.length()) { out.add(cur.toString()); cur = new StringBuilder(indent); }
                int cut = w - indent.length();
                out.add(indent + word.substring(0, cut));
                word = word.substring(cut);
            }
            if (cur.length() > indent.length() && cur.length() + 1 + word.length() > w) {
                out.add(cur.toString());
                cur = new StringBuilder(indent);
            }
            if (cur.length() > indent.length()) cur.append(' ');
            cur.append(word);
        }
        if (cur.length() > indent.length() || out.isEmpty()) out.add(cur.toString());
        return out;
    }

    // ==================== ESC/POS ====================

    private class Buf {
        private final ByteArrayOutputStream out = new ByteArrayOutputStream();
        private final Charset charset = Charset.forName(props.charset());

        Buf init() {
            raw(ESC, '@');                                   // reset
            if (!props.transliterate()) raw(ESC, 'u', props.codePage()); // Datecs: ESC u n
            return this;
        }
        Buf align(int a) { return raw(ESC, 'a', a); }          // 0 lijevo, 1 sredina, 2 desno
        Buf bold(boolean on) { return raw(ESC, 'E', on ? 1 : 0); }
        Buf size(int n) { return raw(GS, '!', n); }            // 0x00 normal, 0x01 dupla visina, 0x11 duplo oboje
        Buf feed(int n) { for (int i = 0; i < n; i++) raw(LF); return this; }
        Buf cut() { return raw(GS, 'V', 66, 0); }             // dohrani do noža i reži

        Buf line(String s) {
            out.writeBytes(encode(s));
            out.write(LF);
            return this;
        }

        Buf raw(int... bytes) {
            for (int x : bytes) out.write(x);
            return this;
        }

        byte[] bytes() { return out.toByteArray(); }

        private byte[] encode(String s) {
            String clean = s.replace('—', '-').replace('–', '-').replace('·', '|')
                    .replace('„', '"').replace('“', '"').replace('”', '"').replace('’', '\'')
                    .replace("€", "EUR");
            if (props.transliterate()) {
                clean = clean.replace("đ", "dj").replace("Đ", "Dj");
                clean = Normalizer.normalize(clean, Normalizer.Form.NFD).replaceAll("\\p{M}", "");
                return clean.getBytes(java.nio.charset.StandardCharsets.US_ASCII);
            }
            return clean.getBytes(charset); // neprepoznati znakovi -> '?'
        }
    }
}
