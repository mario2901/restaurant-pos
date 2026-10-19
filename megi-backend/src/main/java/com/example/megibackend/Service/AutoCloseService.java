package com.example.megibackend.Service;
import lombok.RequiredArgsConstructor;

import com.example.megibackend.Entity.OrderType;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * Automatsko zatvaranje narudžbi (status DONE = ulazi u promet).
 *
 * Vremena se postavljaju u Admin -> Postavke (SettingsService), default iz
 * application.properties (app.auto-close.delivery-time / all-time).
 *
 * 1) Dostava: nakon vremena zatvaranja dostave zatvaraju se sve otvorene
 *    DOSTAVE napravljene prije tog vremena. Kasnije dostave zatvara konobar.
 *
 * 2) Sve ostalo: nakon vremena zatvaranja svih — stolovi, za ponijeti i
 *    zaostale dostave napravljene prije tog vremena. Kasnije zatvara konobar.
 *
 * 3) Sigurnosna mreža u 23:59 (app.auto-close.cron) i pri pokretanju backenda:
 *    ništa ne smije ostati otvoreno iz prethodnih dana.
 *
 * 1) i 2) se provjeravaju SVAKE MINUTE prema vremenima iz baze, pa promjena
 * vremena u Adminu vrijedi odmah, bez restarta. Provjera uspoređuje vrijeme
 * KREIRANJA narudžbe s današnjim graničnim vremenom, zato je idempotentna
 * (narudžba nakon granice se nikad ne zatvara automatski) i sama nadoknadi
 * propušteno ako je backend bio ugašen u trenutku zatvaranja.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AutoCloseService {

    private final OrderService orderService;
    private final BusinessDayService businessDay;
    private final SettingsService settingsService;

    @Scheduled(cron = "0 * * * * *")
    public void tick() {
        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();

        LocalTime deliveryTime = settingsService.deliveryCloseTime();
        if (!now.isBefore(deliveryTime)) {
            int closed = orderService.autoCloseOpenBefore(today.atTime(deliveryTime), OrderType.DELIVERY);
            if (closed > 0) log.info("Automatsko zatvaranje dostave ({}): zatvoreno {} narudžbi.", deliveryTime, closed);
        }

        LocalTime allTime = settingsService.allCloseTime();
        if (!now.isBefore(allTime)) {
            int closed = orderService.autoCloseOpenBefore(today.atTime(allTime));
            if (closed > 0) log.info("Automatsko zatvaranje svih narudžbi ({}): zatvoreno {} narudžbi.", allTime, closed);
        }
    }

    @Scheduled(cron = "${app.auto-close.cron:0 59 23 * * *}")
    public void closeAtEndOfDay() {
        int closed = orderService.autoCloseOpenBefore(LocalDateTime.now());
        log.info("Automatsko zatvaranje (kraj dana): zatvoreno {} narudžbi.", closed);
    }

    /** Nadoknada: prethodni dani + današnji rokovi koji su prošli dok je backend bio ugašen. */
    @EventListener(ApplicationReadyEvent.class)
    public void closeLeftoversOnStartup() {
        int closed = orderService.autoCloseOpenBefore(businessDay.currentStart());
        if (closed > 0) log.info("Pri pokretanju zatvoreno {} narudžbi iz prethodnih dana.", closed);
        tick();
    }
}
