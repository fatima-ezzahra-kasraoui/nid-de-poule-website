package com.roadwatch.admin.controller;

import com.roadwatch.admin.service.WeatherService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Tests unitaires - WeatherController")
class WeatherControllerTest {

    @Mock
    private WeatherService weatherService;

    @InjectMocks
    private WeatherController weatherController;

    @Test
    @DisplayName("getWeather : coordonnées valides → 200 avec score, condition, description")
    void getWeather_validCoords_shouldReturn200() throws Exception {
        WeatherService.WeatherInfo info = mock(WeatherService.WeatherInfo.class);
        when(info.getScore()).thenReturn(2);
        when(info.getCondition()).thenReturn("Pluie");
        when(info.getDescription()).thenReturn("Pluie modérée");
        when(weatherService.getWeatherRisk(33.59, -7.60)).thenReturn(info);

        ResponseEntity<?> response = weatherController.getWeather("33.59", "-7.60");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        Map<?, ?> body = (Map<?, ?>) response.getBody();
        assertEquals(2, body.get("score"));
        assertEquals("Pluie", body.get("condition"));
        assertEquals("Pluie modérée", body.get("description"));
    }

    @Test
    @DisplayName("getWeather : coordonnées avec virgule → converties en point")
    void getWeather_commaCoords_shouldConvertAndReturn200() throws Exception {
        WeatherService.WeatherInfo info = mock(WeatherService.WeatherInfo.class);
        when(info.getScore()).thenReturn(0);
        when(info.getCondition()).thenReturn("Sec");
        when(info.getDescription()).thenReturn("Temps sec");
        when(weatherService.getWeatherRisk(33.59, -7.60)).thenReturn(info);

        ResponseEntity<?> response = weatherController.getWeather("33,59", "-7,60");

        assertEquals(HttpStatus.OK, response.getStatusCode());
    }

    @Test
    @DisplayName("getWeather : erreur service → 500")
    void getWeather_whenServiceThrows_shouldReturn500() throws Exception {
        when(weatherService.getWeatherRisk(anyDouble(), anyDouble()))
                .thenThrow(new RuntimeException("API météo indisponible"));

        ResponseEntity<?> response = weatherController.getWeather("33.59", "-7.60");

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        Map<?, ?> body = (Map<?, ?>) response.getBody();
        assertTrue(body.containsKey("error"));
    }

    @Test
    @DisplayName("getWeather : coordonnées invalides (texte) → 500")
    void getWeather_invalidCoords_shouldReturn500() throws Exception {
        ResponseEntity<?> response = weatherController.getWeather("abc", "xyz");

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
    }
}