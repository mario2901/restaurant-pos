package com.example.megibackend.Config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(PrinterProperties.class)
public class PrinterConfig {
}
