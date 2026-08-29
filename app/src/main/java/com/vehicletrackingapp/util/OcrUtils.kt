package com.vehicletrackingapp.util

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.os.Handler
import android.os.Looper
import android.util.Base64
import android.util.Log
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

    /** 
     * Cleans common ML Kit digit misrecognitions (e.g. 'O' -> '0', 'l' -> '1') 
     * but only on alphanumeric tokens that contain at least one digit and look-alike characters.
     */
    private fun cleanOdometerText(rawText: String): String {
        val lines = rawText.split("\n")
        val cleanedLines = lines.map { line ->
            val words = line.split(Regex("\\s+"))
            val cleanedWords = words.map { word ->
                // Strip punctuation for character matching check
                val cleanWord = word.replace(Regex("[,.]"), "")
                val isCandidate = cleanWord.length in 3..8 &&
                        cleanWord.any { it.isDigit() } &&
                        cleanWord.all { it.isDigit() || it in "OoiIlLsSbBzZgG" }
                
                if (isCandidate) {
                    word.map { char ->
                        when (char) {
                            'O', 'o' -> '0'
                            'I', 'i', 'l', 'L' -> '1'
                            'S', 's' -> '5'
                            'B', 'b' -> '8'
                            'Z', 'z' -> '2'
                            'G', 'g' -> '9'
                            else -> char
                        }
                    }.joinToString("")
                } else {
                    word
                }
            }
            cleanedWords.joinToString(" ")
        }
        return cleanedLines.joinToString("\n")
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
                    Log.d("OcrUtils", "OCR Raw Text: $rawText")

                    // 1. Clean look-alike characters in numeric candidates
                    val cleanedText = cleanOdometerText(rawText)
                    Log.d("OcrUtils", "OCR Cleaned Text: $cleanedText")

                    // 2. Truncate decimal tenths (e.g. "12345.6" -> "12345")
                    var normalizedText = cleanedText.replace(Regex("(\\d{3,7})\\.\\d\\b"), "$1")

                    // 3. Normalize digits by removing spacing/commas (e.g. "12,345" -> "12345")
                    normalizedText = normalizedText
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

                    // Strip leading zeros for clean display (e.g. "012345" -> "12345")
                    if (candidate.startsWith("0") && candidate.length > 1) {
                        candidate = candidate.replaceFirst(Regex("^0+"), "")
                    }

                    Log.d("OcrUtils", "OCR Extracted Candidate: $candidate")
                    mainHandler.post { onResult(candidate) }
                }
                .addOnFailureListener {
                    Log.e("OcrUtils", "OCR Failure", it)
                    mainHandler.post { onResult("") }
                }
        } catch (e: Exception) {
            Log.e("OcrUtils", "OCR Exception", e)
            mainHandler.post { onResult("") }
        }
    }
}
