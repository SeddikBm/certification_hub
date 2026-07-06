package com.example.certificationHub.security.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Getter
@Setter
@Configuration
@ConfigurationProperties(prefix = "spring.security.jwt")
public class JwtProperties {

    /**
     * Secret key used for signing the JWT tokens.
     */
    private String secretKey;

}
