package com.underconstruction.api;

import com.underconstruction.api.config.JwtProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties(JwtProperties.class)
public class UnderconstructionApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(UnderconstructionApiApplication.class, args);
    }
}
