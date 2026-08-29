package com.vehicletrackingapp.util

import android.content.Context
import android.net.Uri
import android.os.Handler
import android.os.Looper
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions

object OcrUtils {
    fun extractOdometerValue(context: Context, uri: Uri, onResult: (String) -> Unit) {
        try {
            val image = InputImage.fromFilePath(context, uri)
            val recognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)
            val mainHandler = Handler(Looper.getMainLooper())

            recognizer.process(image)
                .addOnSuccessListener { visionText ->
                    val rawText = visionText.text

                    // Normalize: remove commas and spaces between digits (e.g., "12,345" or "12 345" → "12345")
                    val normalizedText = rawText
                        .replace(Regex("(\\d)[,\\s](\\d)"), "$1$2")  // "12,345" → "12345"
                        .replace(Regex("(\\d)[,\\s](\\d)"), "$1$2")  // second pass for "1 23 456"

                    val lines = normalizedText.split("\n")
                    var candidate = ""

                    // 1st pass: find number on a line containing odometer context keywords
                    for (line in lines) {
                        val lowerLine = line.lowercase()
                        if (lowerLine.contains("km") || lowerLine.contains("odo") ||
                            lowerLine.contains("read") || lowerLine.contains("speed") ||
                            lowerLine.contains("mileage") || lowerLine.contains("total")) {
                            val numberInLine = Regex("\\d{4,7}").find(line)?.value
                            if (numberInLine != null) {
                                candidate = numberInLine
                                break
                            }
                        }
                    }

                    // 2nd pass: look for largest plausible odometer number (5-7 digits are most common)
                    if (candidate.isEmpty()) {
                        val allNumbers = Regex("\\d{4,7}").findAll(normalizedText)
                            .map { it.value }
                            .filter { num ->
                                val n = num.toIntOrNull() ?: 0
                                // Exclude year-like numbers (2000-2030) and very small readings
                                n !in 2000..2030 && n >= 100
                            }
                            .toList()

                        // Prefer 5-6 digit numbers (typical odometer range 10000–999999)
                        candidate = allNumbers.firstOrNull { it.length in 5..6 }
                            ?: allNumbers.firstOrNull { it.length == 7 }
                            ?: allNumbers.firstOrNull { it.length == 4 }
                            ?: allNumbers.firstOrNull()
                            ?: ""
                    }

                    // 3rd pass: fallback to any 3-7 digit number (excluding years)
                    if (candidate.isEmpty()) {
                        val fallback = Regex("\\d{3,7}").findAll(normalizedText)
                            .map { it.value }
                            .firstOrNull { num ->
                                val n = num.toIntOrNull() ?: 0
                                n !in 2000..2030
                            } ?: ""
                        candidate = fallback
                    }

                    // Dispatch result back to main thread to safely update Compose state
                    mainHandler.post { onResult(candidate) }
                }
                .addOnFailureListener {
                    mainHandler.post { onResult("") }
                }
        } catch (e: Exception) {
            Handler(Looper.getMainLooper()).post { onResult("") }
        }
    }
}
