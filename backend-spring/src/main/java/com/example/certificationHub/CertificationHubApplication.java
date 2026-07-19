package com.example.certificationHub;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class CertificationHubApplication {

	public static void main(String[] args) {
		SpringApplication.run(CertificationHubApplication.class, args);
	}

	// @Bean
	// public CommandLineRunner updateTestPasswords(UserRepository userRepository,
	// PasswordEncoder passwordEncoder) {
	// return args -> {
	// // Mettre à jour l'admin test
	// userRepository.findByEmail("admin@devoteam.com").ifPresent(user -> {
	// System.out.println("Mise à jour du mot de passe Admin...");
	// // Le nouveau mot de passe sera "Password123!"
	// user.setPasswordHash(passwordEncoder.encode("Password123456!"));
	// userRepository.save(user);
	// });

	// // Mettre à jour le collaborateur test
	// userRepository.findByEmail("collab@devoteam.com").ifPresent(user -> {
	// System.out.println("Mise à jour du mot de passe Collaborateur...");
	// user.setPasswordHash(passwordEncoder.encode("Password123456!"));
	// userRepository.save(user);
	// });
	// };
	// }

}
