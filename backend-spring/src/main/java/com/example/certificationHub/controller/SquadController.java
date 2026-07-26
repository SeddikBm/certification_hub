package com.example.certificationHub.controller;

import com.example.certificationHub.entity.Squad;
import com.example.certificationHub.repository.SquadRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/squads")
@RequiredArgsConstructor
public class SquadController {

    private final SquadRepository squadRepository;

    @GetMapping
    public List<Squad> getAllSquads() {
        return squadRepository.findAll();
    }
}
