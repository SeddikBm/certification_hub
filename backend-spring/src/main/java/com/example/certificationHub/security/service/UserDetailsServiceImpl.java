package com.example.certificationHub.security.service;

import com.example.certificationHub.entity.User;
import com.example.certificationHub.enumeration.UserStatus;
import com.example.certificationHub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Utilisateur non trouvé avec l'email : " + email));

        // Vérification du statut : un utilisateur INACTIVE ou SUSPENDED ne peut pas se connecter
        boolean isEnabled = user.getStatus() == UserStatus.ACTIVE;

        return new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                user.getPasswordHash(),
                isEnabled,       // enabled - bloque le login si INACTIVE/SUSPENDED
                true,            // accountNonExpired
                true,            // credentialsNonExpired
                true,            // accountNonLocked
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()))
        );
    }
}
