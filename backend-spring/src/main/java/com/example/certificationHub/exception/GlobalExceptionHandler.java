package com.example.certificationHub.exception;

import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // Erreur de login : Mauvais mot de passe ou email
    @ExceptionHandler(BadCredentialsException.class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED) //401
    public Map<String, String> handleBadCredentials(BadCredentialsException ex) {
        return Map.of("error", "Non autorisé", "message", "Email ou mot de passe incorrect");
    }

    // Erreur de login : Compte suspendu ou inactif
    @ExceptionHandler(DisabledException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)   //403
    public Map<String, String> handleDisabledAccount(DisabledException ex) {
        return Map.of("error", "Compte inactif", "message", "Votre compte a été désactivé par un administrateur");
    }

    // Validation des DTOs (ex: email invalide, champs vides)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST) //400
    public Map<String, Object> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors()
                .forEach(error -> errors.put(error.getField(), error.getDefaultMessage()));
        return Map.of("error", "Erreur de validation", "details", errors);
    }

    // Ressource non trouvée (404)
    @ExceptionHandler(ResourceNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public Map<String, String> handleResourceNotFound(ResourceNotFoundException ex) {
        return Map.of("error", "Introuvable", "message", ex.getMessage() != null ? ex.getMessage() : "Ressource introuvable");
    }

    // Erreurs d'arguments ou d'état (400)
    @ExceptionHandler({IllegalArgumentException.class, IllegalStateException.class})
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, String> handleBadRequestExceptions(RuntimeException ex) {
        return Map.of("error", "Requête invalide", "message", ex.getMessage() != null ? ex.getMessage() : "Données fournies invalides");
    }

    // Gestion des erreurs levées manuellement via ResponseStatusException
    @ExceptionHandler(ResponseStatusException.class)
    public Map<String, String> handleResponseStatusException(ResponseStatusException ex,
            jakarta.servlet.http.HttpServletResponse response) {
        response.setStatus(ex.getStatusCode().value());
        return Map.of("error", "Erreur", "message", ex.getReason() != null ? ex.getReason() : "Erreur requise");
    }

    // Handler global de secours pour éviter les erreurs 500 brutes
    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public Map<String, String> handleGenericException(Exception ex) {
        return Map.of("error", "Erreur interne", "message", ex.getMessage() != null ? ex.getMessage() : "Une erreur inattendue est survenue");
    }
}