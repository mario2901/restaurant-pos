package com.example.megibackend.Service;

import com.example.megibackend.Config.PrinterProperties;
import com.example.megibackend.Dto.Ticket;
import com.example.megibackend.Dto.TicketLine;
import com.example.megibackend.Dto.TicketType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.awt.Color;
import java.awt.Font;
import java.awt.FontMetrics;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.geom.AffineTransform;
import java.awt.image.BufferedImage;
import java.awt.image.WritableRaster;

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
@Slf4j
@Component
@RequiredArgsConstructor
public class EscPosFormatter {

    private static final byte ESC = 0x1B, GS = 0x1D, LF = 0x0A, BEL = 0x07;
    /**
     * Stavke na kuhinji: 2x širina, 2x visina (0x11). Datecs EP-2000 u običnom ispisu
     * zna samo 1x/2x (ESC !, max visina reda 48 točaka) — 3x nije moguće.
     */
    private static final int KITCHEN_ITEM_SIZE = 0x11;
    private static final DateTimeFormatter TIME = DateTimeFormatter.ofPattern("dd.MM.yyyy. HH:mm");

    private final PrinterProperties props;

    /** Kuhinja u zadanoj veličini 2x2. */
    public byte[] format(Ticket t) {
        return format(t, 2, 2);
    }

    /**
     * Veličina stavki na kuhinji (Admin): 2x2 = tekst printera (default),
     * 3x2 i 4x3 = stavke se crtaju kao slika (Datecs tekst zna najviše 2x).
     *
     * @param kitchenHeight visina: 2, 3 ili 4
     * @param kitchenWidth  širina: 2 ili 3
     */
    public byte[] format(Ticket t, int kitchenHeight, int kitchenWidth) {
        boolean bigKitchen = kitchenHeight > 2 || kitchenWidth > 2;
        int kw = bigKitchen ? Math.max(1, kitchenWidth) : 2;
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
                // izvještaj: naslov grupe ("HRANA", "PIĆE")
                if (l.isSection()) {
                    b.feed(1).bold(true).size(0x01).line(l.name() == null ? "" : l.name()).size(0).bold(false);
                    b.line("-".repeat(w));
                    continue;
                }
                // izvještaj: međuzbroj grupe ("HRANA UKUPNO")
                if (l.isSubtotal()) {
                    b.line("-".repeat(w));
                    b.bold(true).line(twoCols(l.name() == null ? "" : l.name(),
                            money(l.lineTotal()) + " " + props.currency(), w)).bold(false);
                    continue;
                }
                // storno: "-2 x", dodatak: "+2 x" — da se ne zamijeni s novom narudžbom
                String sign = storno ? "-" : t.addition() ? "+" : "";
                String qty = sign + l.quantity() + " x ";
                String name = qty + l.name();
                if (kitchen) {
                    // Kuhinja (nova narudžba, dodatak, storno): 2x širina, 3x visina, bold.
                    // Dupla širina -> pola znakova u redu; predugi naziv se prelama,
                    // nastavak poravnat ispod naziva (iza "2 x ")
                    // dupla/trostruka širina -> w/2 ili w/3 znakova u redu
                    List<String> rows = wrapItem(name, w / kw, qty.length());
                    if (bigKitchen) {
                        for (String s : rows) b.bigLine(s, kitchenHeight, kw);
                    } else {
                        b.bold(true).size(KITCHEN_ITEM_SIZE);
                        for (String s : rows) b.line(s);
                        b.size(0).bold(false);
                    }
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
        return testPage(printerName, address, 0, 2, 0);
    }

    /**
     * @param kitchenHeight 0 = bez primjera stavki (šank); 2/3/4 = primjer stavki
     *                      u veličini kuhinje iz Admina, da se vidi na papiru
     * @param kitchenWidth  2 ili 3
     * @param wordLength    skraćivanje riječi na kuhinji (0 = puni nazivi)
     */
    public byte[] testPage(String printerName, String address, int kitchenHeight, int kitchenWidth, int wordLength) {
        Buf b = new Buf();
        b.init();
        b.align(1).bold(true).size(0x11).line("TEST").size(0).line(printerName).bold(false);
        b.line(address);
        b.line(LocalDateTime.now().format(TIME));
        b.align(0).line("-".repeat(props.width()));
        b.line("Hrvatska slova: č ć ž š đ  Č Ć Ž Š Đ");
        b.line(twoCols("2 x Ćevapi", "15,00", props.width()));
        b.line("1234567890".repeat(5).substring(0, props.width()));
        if (kitchenHeight >= 2) {
            b.line("-".repeat(props.width()));
            boolean big = kitchenHeight > 2 || kitchenWidth > 2;
            int kw = big ? Math.max(1, kitchenWidth) : 2;
            b.line("Kuhinja - velicina stavki " + kitchenHeight + "x" + kw + ":");
            for (String dish : List.of("Ćevapi", "Pizza Capricciosa - Velika", "Gurmanska pljeskavica u pizza tijestu")) {
                String item = "2 x " + TicketService.shortWords(dish, wordLength);
                List<String> rows = wrapItem(item, props.width() / kw, 4);
                if (big) {
                    for (String s : rows) b.bigLine(s, kitchenHeight, kw);
                } else {
                    b.bold(true).size(KITCHEN_ITEM_SIZE);
                    for (String s : rows) b.line(s);
                    b.size(0).bold(false);
                }
            }
        }
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

    // ==================== VELIKI ISPIS (SLIKA) ====================

    /** Font A printera: 12 x 24 točke po znaku; grafika ide u trakama po 24 točke. */
    private static final int CELL_W = 12, CELL_H = 24, BAND = 24;

    /**
     * Red teksta -> ESC/POS grafika (ESC * 21h: 24 točke visoko, dvostruka gustoća).
     * Svaki znak se crta u svoju ćeliju (widthMul x širina, heightMul x visina),
     * pa u red stane width/widthMul znakova — isto kao kod prelamanja.
     */
    private byte[] rasterLine(String text, int heightMul, int widthMul) {
        int dots = props.width() * CELL_W;          // 48 znakova -> 576 točaka (puna širina 80 mm)
        int cw = CELL_W * Math.max(1, widthMul);
        int ch = CELL_H * heightMul;                // višekratnik od 24 -> točno N traka

        BufferedImage img = new BufferedImage(dots, ch, BufferedImage.TYPE_BYTE_BINARY);
        Graphics2D g = img.createGraphics();
        try {
            g.setColor(Color.WHITE);
            g.fillRect(0, 0, dots, ch);
            g.setColor(Color.BLACK);
            g.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_OFF);
            g.setRenderingHint(RenderingHints.KEY_FRACTIONALMETRICS, RenderingHints.VALUE_FRACTIONALMETRICS_ON);

            Font base = pickFont();
            FontMetrics m = g.getFontMetrics(base);
            // visina slova ~90 % ćelije, ostatak je razmak između redova
            float pt = base.getSize2D() * (ch * 0.9f) / (m.getAscent() + m.getDescent());
            Font sized = base.deriveFont(pt);
            m = g.getFontMetrics(sized);
            double sx = (double) cw / Math.max(1, m.charWidth('M'));
            Font font = sized.deriveFont(AffineTransform.getScaleInstance(sx, 1.0));
            g.setFont(font);
            FontMetrics fm = g.getFontMetrics(font);
            int baseline = (ch - (m.getAscent() + m.getDescent())) / 2 + m.getAscent();
            int thick = Math.max(1, heightMul / 2);  // dodatno podebljanje kao "bold" printera

            int max = Math.min(text.length(), dots / cw);
            for (int i = 0; i < max; i++) {
                char c = text.charAt(i);
                if (c == ' ') continue;
                String one = String.valueOf(c);
                int x = i * cw + (cw - fm.stringWidth(one)) / 2;
                for (int d = 0; d <= thick; d++) g.drawString(one, x + d, baseline);
            }
        } finally {
            g.dispose();
        }

        WritableRaster px = img.getRaster();         // 0 = crno, 1 = bijelo
        ByteArrayOutputStream o = new ByteArrayOutputStream();
        o.write(ESC); o.write('3'); o.write(BAND);   // razmak redova = točno jedna traka, bez rupa
        for (int y0 = 0; y0 < ch; y0 += BAND) {
            o.write(ESC); o.write('*'); o.write(0x21);
            o.write(dots & 0xFF); o.write(dots >> 8);
            for (int x = 0; x < dots; x++) {
                for (int k = 0; k < 3; k++) {
                    int bits = 0;
                    for (int bit = 0; bit < 8; bit++) {
                        int y = y0 + k * 8 + bit;
                        if (y < ch && px.getSample(x, y, 0) == 0) bits |= 0x80 >> bit;
                    }
                    o.write(bits);
                }
            }
            o.write(LF);
        }
        o.write(ESC); o.write('2');                  // vrati zadani razmak redova
        return o.toByteArray();
    }

    /** Podebljani font s jasnim slovima; Consolas na Windowsima, inače Javin monospaced. */
    private static Font pickFont() {
        for (String name : List.of("Consolas", "Lucida Console", "DejaVu Sans Mono")) {
            Font f = new Font(name, Font.BOLD, 100);
            if (name.equalsIgnoreCase(f.getFamily())) return f;
        }
        return new Font(Font.MONOSPACED, Font.BOLD, 100);
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
        private boolean bold;

        Buf bold(boolean on) { bold = on; return raw(ESC, 'E', on ? 1 : 0); }

        /**
         * Veličina u GS ! zapisu (0x00 normal, 0x01 dupla visina, 0x10 dupla širina, 0x11 oboje),
         * ali se šalje kao ESC ! — jedina naredba za veličinu u Datecs priručniku za EP-2000.
         * ESC ! postavlja i bold (bit 3), pa se trenutni bold čuva.
         */
        Buf size(int n) {
            int mode = 0;
            if ((n & 0x0F) > 0) mode |= 0x10;   // dupla visina
            if ((n & 0xF0) > 0) mode |= 0x20;   // dupla širina
            if (bold) mode |= 0x08;
            return raw(ESC, '!', mode);
        }
        Buf feed(int n) { for (int i = 0; i < n; i++) raw(LF); return this; }

        /**
         * Jedan red stavke kao slika: widthMul x širina, heightMul x visina, podebljano.
         * Ako crtanje ne uspije (npr. nema fonta), red ide kao obični 2x2 tekst —
         * tiket se uvijek ispiše.
         */
        Buf bigLine(String text, int heightMul, int widthMul) {
            byte[] image;
            try {
                image = rasterLine(text, heightMul, widthMul);
            } catch (Exception | LinkageError | java.awt.AWTError e) {
                log.warn("Veliki ispis kuhinje nije uspio, ide 2x2 tekst: {}", e.toString());
                boolean wasBold = bold;
                bold(true).size(KITCHEN_ITEM_SIZE).line(text).size(0);
                return bold(wasBold);
            }
            out.writeBytes(image);
            return this;
        }
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
