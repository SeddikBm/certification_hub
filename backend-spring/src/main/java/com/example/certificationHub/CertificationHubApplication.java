package com.example.certificationHub;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@SpringBootApplication
public class CertificationHubApplication {

	public static void main(String[] args) {
		SpringApplication.run(CertificationHubApplication.class, args);
	}

	@org.springframework.context.annotation.Bean
	public org.springframework.boot.CommandLineRunner updateTestPasswords(
			com.example.certificationHub.repository.UserRepository userRepository,
			org.springframework.security.crypto.password.PasswordEncoder passwordEncoder) {
		return args -> {
			String newHash = passwordEncoder.encode("Password123!");
			userRepository.findAll().forEach(user -> {
				user.setPasswordHash(newHash);
				userRepository.save(user);
			});
			System.out.println("Mise à jour des mots de passe pour tous les utilisateurs...");
		};
	}

}
