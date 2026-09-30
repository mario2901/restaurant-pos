package com.example.megibackend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class    MegiBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(MegiBackendApplication.class, args);
    }

}
