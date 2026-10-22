package com.example.megibackend;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

/**
 * Provjera da se aplikacija diže. Test NE SMIJE dirati pravu bazu (C:/megi/data),
 * pravi backup ni printere — zato in-memory baza, isključen print i backup u build/.
 */
@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:megi-test;DB_CLOSE_DELAY=-1",
        "app.printer.enabled=false",
        "app.backup.dir=build/test-backup"
})
class MegiBackendApplicationTests {

    @Test
    void contextLoads() {
    }

}
