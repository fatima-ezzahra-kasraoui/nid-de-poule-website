package com.roadwatch.admin.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.Mockito;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@DisplayName("Tests unitaires - WeatherService")
class WeatherServiceTest {

    private WeatherService weatherService;
    private RestTemplate mockRestTemplate;

    @BeforeEach
    void setUp() {
        weatherService = new WeatherService();
        mockRestTemplate = Mockito.mock(RestTemplate.class);
        // ✅ Injection via setter — plus fiable que la réflexion
        weatherService.setRestTemplate(mockRestTemplate);
    }

    private Map<String, Object> buildWeatherResponse(int code) {
        return Map.of("current_weather", Map.of("weathercode", code));
    }

    @ParameterizedTest(name = "Code météo {0} → Pluie, score 5")
    @ValueSource(ints = {51, 53, 55, 61, 63, 65, 80, 81, 82})
    void rain_shouldReturnScore5(int code) {
        when(mockRestTemplate.getForObject(anyString(), eq(Map.class)))
                .thenReturn(buildWeatherResponse(code));

        WeatherService.WeatherInfo info = weatherService.getWeatherRisk(33.59, -7.60);

        assertEquals(5, info.getScore(), "Code " + code + " doit donner score 5");
        assertEquals("Pluie", info.getCondition());
    }

    @ParameterizedTest(name = "Code météo {0} → Neige, score 5")
    @ValueSource(ints = {71, 73, 75, 77})
    void snow_shouldReturnScore5(int code) {
        when(mockRestTemplate.getForObject(anyString(), eq(Map.class)))
                .thenReturn(buildWeatherResponse(code));

        WeatherService.WeatherInfo info = weatherService.getWeatherRisk(33.59, -7.60);

        assertEquals(5, info.getScore());
        assertEquals("Neige", info.getCondition());
    }

    @ParameterizedTest(name = "Code météo {0} → Orage, score 4")
    @ValueSource(ints = {95, 96, 99})
    void storm_shouldReturnScore4(int code) {
        when(mockRestTemplate.getForObject(anyString(), eq(Map.class)))
                .thenReturn(buildWeatherResponse(code));

        WeatherService.WeatherInfo info = weatherService.getWeatherRisk(33.59, -7.60);

        assertEquals(4, info.getScore());
        assertEquals("Orage", info.getCondition());
    }

    @ParameterizedTest(name = "Code météo {0} → Brouillard, score 2")
    @ValueSource(ints = {45, 48})
    void fog_shouldReturnScore2(int code) {
        when(mockRestTemplate.getForObject(anyString(), eq(Map.class)))
                .thenReturn(buildWeatherResponse(code));

        WeatherService.WeatherInfo info = weatherService.getWeatherRisk(33.59, -7.60);

        assertEquals(2, info.getScore());
        assertEquals("Brouillard", info.getCondition());
    }

    @ParameterizedTest(name = "Code météo {0} → Nuageux, score 1")
    @ValueSource(ints = {2, 3})
    void cloudy_shouldReturnScore1(int code) {
        when(mockRestTemplate.getForObject(anyString(), eq(Map.class)))
                .thenReturn(buildWeatherResponse(code));

        WeatherService.WeatherInfo info = weatherService.getWeatherRisk(33.59, -7.60);

        assertEquals(1, info.getScore());
        assertEquals("Nuageux", info.getCondition());
    }

    @Test
    @DisplayName("Code 0 → Sec, score 0")
    void clearWeather_shouldReturnScore0() {
        when(mockRestTemplate.getForObject(anyString(), eq(Map.class)))
                .thenReturn(buildWeatherResponse(0));

        WeatherService.WeatherInfo info = weatherService.getWeatherRisk(33.59, -7.60);

        assertEquals(0, info.getScore());
        assertEquals("Sec", info.getCondition());
    }

    @Test
    @DisplayName("API indisponible → fallback retourne une WeatherInfo non null")
    void apiUnavailable_shouldReturnFallback() {
        when(mockRestTemplate.getForObject(anyString(), eq(Map.class)))
                .thenThrow(new RuntimeException("API indisponible"));

        WeatherService.WeatherInfo info = weatherService.getWeatherRisk(33.59, -7.60);

        assertNotNull(info, "Le fallback ne doit jamais retourner null");
        assertNotNull(info.getCondition());
        assertNotNull(info.getDescription());
    }

    @Test
    @DisplayName("WeatherInfo : getters doivent retourner les valeurs passées au constructeur")
    void weatherInfo_getters() {
        WeatherService.WeatherInfo info = new WeatherService.WeatherInfo(3, "Pluie", "Risque élevé");
        assertEquals(3, info.getScore());
        assertEquals("Pluie", info.getCondition());
        assertEquals("Risque élevé", info.getDescription());
    }
}