package com.example.megibackend.Repository;

import com.example.megibackend.Entity.Order;
import com.example.megibackend.Entity.OrderStatus;
import com.example.megibackend.Entity.OrderType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {

    // narudžbe u vremenskom rasponu (za izvještaj)
    List<Order> findByCreatedAtBetween(LocalDateTime from, LocalDateTime to);

    // narudžbe jednog konobara (polje na Order-u se zove "user")
    List<Order> findByUserId(Long userId);

    long countByUserId(Long userId);

    // narudžbe po statusu (npr. sve aktivne = NEW)
    List<Order> findByStatusOrderByCreatedAtAsc(OrderStatus status);

    // otvorena narudžba za određeni stol
    Optional<Order> findFirstByTableAndStatusOrderByCreatedAtAsc(String table, OrderStatus status);

    // sve otvorene narudžbe na jednom stolu
    List<Order> findByTableAndStatus(String table, OrderStatus status);

    // za statistiku: zatvorene narudžbe u rasponu
    List<Order> findByStatusAndClosedAtBetween(OrderStatus status, LocalDateTime from, LocalDateTime to);

    /**
     * Isto kao gore, ali sa stavkama u istom upitu (fetch join) —
     * bez ovoga izvještaj radi jedan SELECT po narudžbi (N+1 problem).
     */
    @Query("""
            select distinct o from Order o
            left join fetch o.items
            where o.status = :status
              and o.closedAt between :from and :to
            """)
    List<Order> findClosedWithItems(@Param("status") OrderStatus status,
                                    @Param("from") LocalDateTime from,
                                    @Param("to") LocalDateTime to);

    @Query("""
            select distinct o from Order o
            left join fetch o.items
            where o.id = :orderId
            """)
    Optional<Order> findByIdWithItems(@Param("orderId") Long orderId);

    // ==================== FILTRIRANJE PO VRSTI (dostava / lokal) ====================

    List<Order> findByTypeOrderByCreatedAtDesc(OrderType type);

    List<Order> findByTypeAndStatusOrderByCreatedAtAsc(OrderType type, OrderStatus status);

    List<Order> findByTypeAndCreatedAtBetweenOrderByCreatedAtAsc(OrderType type,
                                                                 LocalDateTime from,
                                                                 LocalDateTime to);

    List<Order> findByCreatedAtBetweenOrderByCreatedAtAsc(LocalDateTime from, LocalDateTime to);

    /** Zatvorene narudžbe jedne vrste u rasponu, sa stavkama (za izvještaj dostave). */
    @Query("""
            select distinct o from Order o
            left join fetch o.items
            where o.status = :status
              and o.type = :type
              and o.closedAt between :from and :to
            """)
    List<Order> findClosedWithItemsByType(@Param("status") OrderStatus status,
                                          @Param("type") OrderType type,
                                          @Param("from") LocalDateTime from,
                                          @Param("to") LocalDateTime to);

    /** Još otvorene narudžbe jedne vrste, kreirane u rasponu, sa stavkama. */
    @Query("""
            select distinct o from Order o
            left join fetch o.items
            where o.status = :status
              and o.type = :type
              and o.createdAt between :from and :to
            """)
    List<Order> findByStatusAndTypeCreatedBetweenWithItems(@Param("status") OrderStatus status,
                                                           @Param("type") OrderType type,
                                                           @Param("from") LocalDateTime from,
                                                           @Param("to") LocalDateTime to);

    /** Narudžbe radnog dana (sve statuse), sa stavkama, najnovije prve. from uključivo, to isključivo. */
    @Query("""
            select distinct o from Order o
            left join fetch o.items
            where o.createdAt >= :from and o.createdAt < :to
            order by o.createdAt desc
            """)
    List<Order> findCreatedInRangeWithItems(@Param("from") LocalDateTime from,
                                            @Param("to") LocalDateTime to);

    @Query("""
            select distinct o from Order o
            left join fetch o.items
            where o.type = :type
              and o.createdAt >= :from and o.createdAt < :to
            order by o.createdAt desc
            """)
    List<Order> findByTypeCreatedInRangeWithItems(@Param("type") OrderType type,
                                                  @Param("from") LocalDateTime from,
                                                  @Param("to") LocalDateTime to);

    /** Zatvorene narudžbe u više statusa (DONE + CANCELED) — za storno u izvještaju. */
    @Query("""
            select distinct o from Order o
            left join fetch o.items
            where o.status in :statuses
              and o.closedAt between :from and :to
            """)
    List<Order> findClosedWithItemsIn(@Param("statuses") java.util.Collection<OrderStatus> statuses,
                                      @Param("from") LocalDateTime from,
                                      @Param("to") LocalDateTime to);

    @Query("""
            select distinct o from Order o
            left join fetch o.items
            where o.status in :statuses
              and o.type = :type
              and o.closedAt between :from and :to
            """)
    List<Order> findClosedWithItemsInByType(@Param("statuses") java.util.Collection<OrderStatus> statuses,
                                            @Param("type") OrderType type,
                                            @Param("from") LocalDateTime from,
                                            @Param("to") LocalDateTime to);

    /** Otvorene narudžbe kreirane prije zadanog trenutka, sa stavkama (za automatsko zatvaranje). */
    @Query("""
            select distinct o from Order o
            left join fetch o.items
            where o.status = :status and o.createdAt < :before
            """)
    List<Order> findByStatusCreatedBeforeWithItems(@Param("status") OrderStatus status,
                                                   @Param("before") LocalDateTime before);
}
