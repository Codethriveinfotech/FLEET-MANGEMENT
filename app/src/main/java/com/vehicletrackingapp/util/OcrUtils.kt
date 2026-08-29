package com.vehicletrackingapp.util

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.os.Handler
import android.os.Looper
import android.util.Base64
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions

object OcrUtils {

    /** Loads a Bitmap from either a content:// / file:// URI OR a base64 data URI. */
    private fun loadBitmap(context: Context, uri: Uri): Bitmap? {
        return try {
            val uriStr = uri.toString()
            if (uriStr.startsWith("data:")) {
                // Base64 data URI  e.g. "data:image/jpeg;base64,/9j/..."
                val commaIdx = uriStr.indexOf(',')
                if (commaIdx == -1) return null
                val base64Data = uriStr.substring(commaIdx + 1)
                val bytes = Base64.decode(base64Data, Base64.DEFAULT)
                BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
            } else {
                // Regular content:// or file:// URI
                context.contentResolver.openInputStream(uri)?.use { stream ->
                    BitmapFactory.decodeStream(stream)
                }
            }
        } catch (e: Exception) {
            null
        }
    }

    fun extractOdometerValue(context: Context, uri: Uri, onResult: (String) -> Unit) {
        val mainHandler = Handler(Looper.getMainLooper())

        try {
            val bitmap = loadBitmap(context, uri)
            if (bitmap == null) {
                mainHandler.post { onResult("") }
                return
            }

            val image = InputImage.fromBitmap(bitmap, 0)
            val recognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)

            recognizer.process(image)
                .addOnSuccessListener { visionText ->
                    val rawText = visionText.text

                    // Normalize: remove commas and spaces between digits (e.g., "12,345" → "12345")
                    var normalizedText = rawText
                        .replace(Regex("(\\d)[,\\s](\\d)"), "$1$2")
                        .replace(Regex("(\\d)[,\\s](\\d)"), "$1$2") // second pass

                    val lines = normalizedText.split("\n")
                    var candidate = ""

                    // 1st pass: find number on a line containing odometer keywords
                    for (line in lines) {
                        val lowerLine = line.lowercase()
                        if (lowerLine.contains("km") || lowerLine.contains("odo") ||
                            lowerLine.contains("read") || lowerLine.contains("speed") ||
                            lowerLine.contains("mileage") || lowerLine.contains("total") ||
                            lowerLine.contains("trip")) {
                            val numberInLine = Regex("\\d{4,7}").find(line)?.value
                            if (numberInLine != null) {
                                candidate = numberInLine
                                break
                            }
                        }
                    }

                    // 2nd pass: pick largest plausible odometer number (5-6 digits preferred)
                    if (candidate.isEmpty()) {
                        val allNumbers = Regex("\\d{4,7}").findAll(normalizedText)
                            .map { it.value }
                            .filter { num ->
                                val n = num.toIntOrNull() ?: 0
                                n !in 2000..2030 && n >= 100
                            }
                            .toList()

                        candidate = allNumbers.firstOrNull { it.length in 5..6 }
                            ?: allNumbers.firstOrNull { it.length == 7 }
                            ?: allNumbers.firstOrNull { it.length == 4 }
                            ?: allNumbers.firstOrNull()
                            ?: ""
                    }

                    // 3rd pass: fallback to any 3-7 digit number excluding years
                    if (candidate.isEmpty()) {
                        candidate = Regex("\\d{3,7}").findAll(normalizedText)
                            .map { it.value }
                            .firstOrNull { num ->
                                val n = num.toIntOrNull() ?: 0
                                n !in 2000..2030
                            } ?: ""
                    }

                    mainHandler.post { onResult(candidate) }
                }
                .addOnFailureListener {
                    mainHandler.post { onResult("") }
                }
        } catch (e: Exception) {
            mainHandler.post { onResult("") }
        }
    }
}
