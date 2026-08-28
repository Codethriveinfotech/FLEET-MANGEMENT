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
                    
                    // Find all numeric values in the recognized text
                    val regex = Regex("\\d+")
                    val matches = regex.findAll(text).map { it.value }.toList()
                    
                    // Filter numbers of typical odometer length (3 to 7 digits)
                    val candidate = matches.firstOrNull { it.length in 3..7 }
                        ?: matches.firstOrNull()
                        ?: ""
                        
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
