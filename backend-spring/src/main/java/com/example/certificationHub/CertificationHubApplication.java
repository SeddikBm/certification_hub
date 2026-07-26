package com.example.certificationHub;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.example.certificationHub.repository.UserRepository;

@EnableScheduling
@SpringBootApplication
public class CertificationHubApplication {

	public static void main(String[] args) {
		SpringApplication.run(CertificationHubApplication.class, args);
	}

}
