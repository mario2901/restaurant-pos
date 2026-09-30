package com.example.megibackend.Service;

import com.example.megibackend.Entity.OrderType;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
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
 * 1) Dostava u app.auto-close.delivery-time (default 15:30):
 *    zatvaraju se sve otvorene DOSTAVE napravljene prije tog vremena.
 *    Dostave napravljene kasnije ostaju otvorene i zatvara ih konobar.
 *
 * 2) Sve ostalo u app.auto-close.all-time (default 22:40):
 *    stolovi, za ponijeti i eventualne zaostale dostave napravljene prije tog vremena.
 *    Narudžbe napravljene kasnije zatvara konobar.
 *
 * 3) Sigurnosna mreža u 23:59 (app.auto-close.cron) i pri pokretanju backenda:
 *    ništa ne smije ostati otvoreno iz prethodnih dana.
 *
 * Provjera za 1) i 2) se vrti svake minute i uspoređuje vrijeme KREIRANJA narudžbe
 * s današnjim graničnim vremenom. Zato je idempotentna (narudžba nakon 15:30
 * se nikad ne zatvara automatski) i sama nadoknadi propušteno ako je backend
 * bio ugašen u 15:30 ili 22:40.
 */
@Slf4j
@Service
public class AutoCloseService {

    private final OrderService orderService;
    private final BusinessDayService businessDay;
    private final LocalTime deliveryCloseTime;
    private final LocalTime allCloseTime;

    public AutoCloseService(OrderService orderService,
                            BusinessDayService businessDay,
                            @Value("${app.auto-close.delivery-time:15:30}") LocalTime deliveryCloseTime,
                            @Value("${app.auto-close.all-time:22:40}") LocalTime allCloseTime) {
        this.orderService = orderService;
        this.businessDay = businessDay;
        this.deliveryCloseTime = deliveryCloseTime;
        this.allCloseTime = allCloseTime;
    }

    @Scheduled(cron = "${app.auto-close.delivery-cron:0 30 15 * * *}")
    public void closeDelivery() {
        LocalDateTime cutoff = LocalDateTime.now().toLocalDate().atTime(deliveryCloseTime);
        int closed = orderService.autoCloseOpenBefore(cutoff, OrderType.DELIVERY);
        log.info("Automatsko zatvaranje dostave: zatvoreno {} narudžbi.", closed);
    }

    @Scheduled(cron = "${app.auto-close.all-cron:0 40 22 * * *}")
    public void closeAll() {
        LocalDateTime cutoff = LocalDateTime.now().toLocalDate().atTime(allCloseTime);
        int closed = orderService.autoCloseOpenBefore(cutoff);
        log.info("Automatsko zatvaranje svih narudžbi: zatvoreno {} narudžbi.", closed);
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

        LocalTime now = LocalTime.now();
        if (!now.isBefore(deliveryCloseTime)) closeDelivery();
        if (!now.isBefore(allCloseTime)) closeAll();
    }
}
