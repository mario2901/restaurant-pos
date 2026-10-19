package com.example.megibackend.Config;

import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.resource.PathResourceResolver;

import java.io.IOException;

/**
 * Servira React build (src/main/resources/static) iz Spring Boota.
 *
 * - postojeća datoteka (index.html, /assets/*.js, slike...) -> vrati je
 * - /api/** se nikad ne preusmjerava (nepostojeći API = 404 JSON, ne index.html)
 * - putanja s ekstenzijom koja ne postoji (npr. /assets/stari.js) -> 404
 * - sve ostalo (/login, /profil, /pice, /admin, F5 na bilo kojoj ruti)
 *   -> index.html, a React Router odluči što prikazati
 *
 * REST kontroleri (/api/**) imaju prednost pred ovim handlerom jer je
 * resource handler zadnji u lancu.
 */
@Configuration
public class SpaConfig implements WebMvcConfigurer {

    private static final Resource INDEX = new ClassPathResource("static/index.html");

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/**")
                .addResourceLocations("classpath:/static/")
                .resourceChain(true)
                .addResolver(new PathResourceResolver() {
                    @Override
                    protected Resource getResource(String path, Resource location) throws IOException {
                        Resource requested = location.createRelative(path);
                        if (requested.exists() && requested.isReadable()) {
                            return requested;
                        }
                        if (path.startsWith("api/") || path.equals("api") || path.startsWith("h2")) {
                            return null;
                        }
                        // zadnji segment s točkom = traži se datoteka koja ne postoji
                        String last = path.substring(path.lastIndexOf('/') + 1);
                        if (last.contains(".")) {
                            return null;
                        }
                        return INDEX.exists() ? INDEX : null;
                    }
                });
    }
}
