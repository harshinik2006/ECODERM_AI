package com.example.ecoderm.data.remote

import com.example.ecoderm.data.model.EnvironmentalFactors
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONObject
import java.util.concurrent.TimeUnit

class EnvironmentService {
    private val client = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(15, TimeUnit.SECONDS)
        .build()

    suspend fun fetchEnvironmentalData(lat: Double, lon: Double, locationName: String? = null): EnvironmentalFactors = withContext(Dispatchers.IO) {
        var temp = 23.5
        var humidity = 58.0
        var windSpeed = 12.0
        var uv = 5.2
        var aqi = 48.0
        var resolvedLocation = locationName ?: "Current Location"

        try {
            // 1. Fetch weather & UV from Open-Meteo
            val weatherUrl = "https://api.open-meteo.com/v1/forecast?latitude=$lat&longitude=$lon&current=temperature_2m,relative_humidity_2m,wind_speed_10m,uv_index"
            val weatherReq = Request.Builder().url(weatherUrl).build()
            client.newCall(weatherReq).execute().use { resp ->
                if (resp.isSuccessful) {
                    val body = resp.body?.string()
                    if (body != null) {
                        val json = JSONObject(body)
                        val current = json.optJSONObject("current")
                        if (current != null) {
                            temp = current.optDouble("temperature_2m", temp)
                            humidity = current.optDouble("relative_humidity_2m", humidity)
                            windSpeed = current.optDouble("wind_speed_10m", windSpeed)
                            uv = current.optDouble("uv_index", uv)
                        }
                    }
                }
            }

            // 2. Fetch Air Quality from Open-Meteo
            val aqiUrl = "https://air-quality-api.open-meteo.com/v1/air-quality?latitude=$lat&longitude=$lon&current=us_aqi,pm2_5"
            val aqiReq = Request.Builder().url(aqiUrl).build()
            client.newCall(aqiReq).execute().use { resp ->
                if (resp.isSuccessful) {
                    val body = resp.body?.string()
                    if (body != null) {
                        val json = JSONObject(body)
                        val current = json.optJSONObject("current")
                        if (current != null) {
                            aqi = current.optDouble("us_aqi", aqi)
                        }
                    }
                }
            }

            // 3. Reverse geocode if locationName is not specified
            if (locationName.isNullOrBlank() || locationName == "Current Location") {
                val geoUrl = "https://nominatim.openstreetmap.org/reverse?format=json&lat=$lat&lon=$lon"
                val geoReq = Request.Builder()
                    .url(geoUrl)
                    .header("User-Agent", "EcoDermAI-Android-App")
                    .build()
                client.newCall(geoReq).execute().use { resp ->
                    if (resp.isSuccessful) {
                        val body = resp.body?.string()
                        if (body != null) {
                            val json = JSONObject(body)
                            val address = json.optJSONObject("address")
                            val city = address?.optString("city")
                                ?: address?.optString("town")
                                ?: address?.optString("village")
                                ?: address?.optString("state")
                                ?: "Detected Location"
                            resolvedLocation = city
                        }
                    }
                }
            }
        } catch (_: Exception) {
            // Graceful fallback to reasonable defaults
        }

        EnvironmentalFactors(
            uvIndex = Math.round(uv * 10.0) / 10.0,
            airQualityIndex = Math.round(aqi * 10.0) / 10.0,
            temperatureC = Math.round(temp * 10.0) / 10.0,
            humidity = Math.round(humidity * 10.0) / 10.0,
            windSpeedKmh = Math.round(windSpeed * 10.0) / 10.0,
            locationName = resolvedLocation
        )
    }

    suspend fun geocodePlace(query: String): Pair<Double, Double>? = withContext(Dispatchers.IO) {
        try {
            val url = "https://geocoding-api.open-meteo.com/v1/search?name=${java.net.URLEncoder.encode(query, "UTF-8")}&count=1"
            val req = Request.Builder().url(url).build()
            client.newCall(req).execute().use { resp ->
                if (resp.isSuccessful) {
                    val body = resp.body?.string() ?: return@withContext null
                    val json = JSONObject(body)
                    val results = json.optJSONArray("results")
                    if (results != null && results.length() > 0) {
                        val first = results.getJSONObject(0)
                        val lat = first.optDouble("latitude")
                        val lon = first.optDouble("longitude")
                        return@withContext Pair(lat, lon)
                    }
                }
            }
        } catch (_: Exception) {}
        null
    }
}
