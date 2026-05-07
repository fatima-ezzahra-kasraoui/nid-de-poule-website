package com.roadwatch.admin.service;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.util.Locale;
import java.util.Map;

@Service
public class WeatherService {

    private final RestTemplate restTemplate = new RestTemplate();

    public WeatherInfo getWeatherRisk(double lat, double lng) {
        try {
            // Formater avec point et 6 décimales
            String latStr = String.format(Locale.US, "%.6f", lat).replace(",", ".");
            String lngStr = String.format(Locale.US, "%.6f", lng).replace(",", ".");

            String url = String.format(
                    "https://api.open-meteo.com/v1/forecast?latitude=%s&longitude=%s&current_weather=true",
                    latStr, lngStr
            );

            System.out.println("🌤️ URL: " + url);

            Map<String, Object> response = restTemplate.getForObject(url, Map.class);

            if (response != null && response.containsKey("current_weather")) {
                Map<String, Object> current = (Map<String, Object>) response.get("current_weather");
                int weatherCode = (int) current.get("weathercode");

                int score = 0;
                String condition = "Sec";
                String description = "Conditions normales";

                // Pluie
                if (weatherCode == 51 || weatherCode == 53 || weatherCode == 55 ||
                        weatherCode == 61 || weatherCode == 63 || weatherCode == 65 ||
                        weatherCode == 80 || weatherCode == 81 || weatherCode == 82) {
                    score = 5;
                    condition = "Pluie";
                    description = "Précipitations - Risque élevé";
                }
                // Neige
                else if (weatherCode == 71 || weatherCode == 73 || weatherCode == 75 || weatherCode == 77) {
                    score = 5;
                    condition = "Neige";
                    description = "Neige - Dégradation accélérée";
                }
                // Orage
                else if (weatherCode == 95 || weatherCode == 96 || weatherCode == 99) {
                    score = 4;
                    condition = "Orage";
                    description = "Orage - Intervention prioritaire";
                }
                // Brouillard
                else if (weatherCode == 45 || weatherCode == 48) {
                    score = 2;
                    condition = "Brouillard";
                    description = "Visibilité réduite";
                }
                // Nuageux
                else if (weatherCode >= 2 && weatherCode <= 3) {
                    score = 1;
                    condition = "Nuageux";
                    description = "Risque modéré";
                }

                return new WeatherInfo(score, condition, description);
            }
        } catch (Exception e) {
            System.err.println("Erreur Open-Meteo: " + e.getMessage());
        }

        // Fallback
        java.util.Calendar cal = java.util.Calendar.getInstance();
        int month = cal.get(java.util.Calendar.MONTH);
        if (month >= 10 || month <= 2) {
            return new WeatherInfo(2, "Saison des pluies", "Risque modéré (automne/hiver)");
        }
        return new WeatherInfo(0, "Sec", "Conditions normales");
    }

    public static class WeatherInfo {
        private int score;
        private String condition;
        private String description;

        public WeatherInfo(int score, String condition, String description) {
            this.score = score;
            this.condition = condition;
            this.description = description;
        }

        public int getScore() { return score; }
        public String getCondition() { return condition; }
        public String getDescription() { return description; }
    }
}