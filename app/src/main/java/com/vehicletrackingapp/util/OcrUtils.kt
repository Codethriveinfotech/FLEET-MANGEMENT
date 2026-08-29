package com.vehicletrackingapp.util

import android.content.Context
import android.net.Uri
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions

object OcrUtils {
    fun extractOdometerValue(context: Context, uri: Uri, onResult: (String) -> Unit) {
        try {
            val image = InputImage.fromFilePath(context, uri)
            val recognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)
            
            recognizer.process(image)
                .addOnSuccessListener { visionText ->
                    val text = visionText.text
                    
                    val lines = text.split("\n")
                    var candidate = ""
                    
                    // Look for numbers in lines containing context keywords
                    for (line in lines) {
                        val lowerLine = line.lowercase()
                        if (lowerLine.contains("km") || lowerLine.contains("odo") || lowerLine.contains("read") || lowerLine.contains("speed")) {
                            val numberInLine = Regex("\\d+").findAll(line).map { it.value }.firstOrNull { it.length in 3..7 }
                            if (numberInLine != null) {
                                candidate = numberInLine
                                break
                            }
                        }
                    }
                    
                    if (candidate.isEmpty()) {
                        val regex = Regex("\\d+")
                        val matches = regex.findAll(text).map { it.value }.toList()
                        
                        // Filter out years (2020-2030) and find typical odometer lengths
                        val cleanCandidates = matches.filter {
                            val num = it.toIntOrNull() ?: 0
                            it.length in 3..7 && num !in 2020..2030
                        }
                        
                        candidate = cleanCandidates.firstOrNull()
                            ?: matches.firstOrNull { it.length in 3..7 }
                            ?: matches.firstOrNull()
                            ?: ""
                    }
                        
                    onResult(candidate)
                }
                .addOnFailureListener {
                    onResult("")
                }
        } catch (e: Exception) {
            onResult("")
        }
    }
}
