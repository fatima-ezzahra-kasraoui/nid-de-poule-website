package com.roadwatch.admin.controller;

import com.roadwatch.admin.service.WeatherService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/weather")
@CrossOrigin(origins = {"http://localhost:5173", "http://192.168.11.106:30080", "http://localhost:30080", "https://fool-accent-uncrushed.ngrok-free.app"})
public class WeatherController {

    @Autowired
    private WeatherService weatherService;

    @GetMapping
    public ResponseEntity<?> getWeather(@RequestParam String lat, @RequestParam String lng) {
        try {
            // Nettoyer les coordonnées : remplacer virgule par point
            String cleanLat = lat.replace(",", ".");
            String cleanLng = lng.replace(",", ".");

            double latitude = Double.parseDouble(cleanLat);
            double longitude = Double.parseDouble(cleanLng);

            WeatherService.WeatherInfo weather = weatherService.getWeatherRisk(latitude, longitude);
            return ResponseEntity.ok(Map.of(
                    "score", weather.getScore(),
                    "condition", weather.getCondition(),
                    "description", weather.getDescription()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}