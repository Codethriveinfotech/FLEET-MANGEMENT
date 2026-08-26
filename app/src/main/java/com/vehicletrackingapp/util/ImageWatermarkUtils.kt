package com.vehicletrackingapp.util

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Matrix
import android.graphics.Paint
import android.location.Geocoder
import android.location.Location
import android.location.LocationManager
import android.media.ExifInterface
import android.net.Uri
import androidx.core.content.ContextCompat
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import java.io.InputStream
import java.io.OutputStream
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

object ImageWatermarkUtils {

    fun watermarkCapturedImage(context: Context, imageUri: Uri) {
        try {
            val contentResolver = context.contentResolver

            // 1. Resolve to file directly if it's a FileProvider content URI or a file URI
            val file = try {
                if (imageUri.scheme == "content" && imageUri.authority == "com.vehicletrackingapp.fileprovider") {
                    val filename = imageUri.lastPathSegment
                    if (filename != null) {
                        File(File(context.filesDir, "images"), filename)
                    } else null
                } else if (imageUri.scheme == "file") {
                    imageUri.path?.let { File(it) }
                } else null
            } catch (e: Exception) {
                null
            }

            // Helper function to open input stream
            val openInputStream: () -> InputStream? = {
                if (file != null && file.exists()) {
                    FileInputStream(file)
                } else {
                    contentResolver.openInputStream(imageUri)
                }
            }

            // Helper function to open output stream
            val openOutputStream: () -> OutputStream? = {
                if (file != null) {
                    FileOutputStream(file)
                } else {
                    contentResolver.openOutputStream(imageUri)
                }
            }

            // 2. Get orientation from EXIF
            val orientation = try {
                if (file != null && file.exists()) {
                    val exif = ExifInterface(file.absolutePath)
                    exif.getAttributeInt(ExifInterface.TAG_ORIENTATION, ExifInterface.ORIENTATION_NORMAL)
                } else {
                    contentResolver.openFileDescriptor(imageUri, "r")?.use { fd ->
                        val exif = ExifInterface(fd.fileDescriptor)
                        exif.getAttributeInt(ExifInterface.TAG_ORIENTATION, ExifInterface.ORIENTATION_NORMAL)
                    } ?: ExifInterface.ORIENTATION_NORMAL
                }
            } catch (e: Throwable) {
                ExifInterface.ORIENTATION_NORMAL
            }

            val rotationDegrees = when (orientation) {
                ExifInterface.ORIENTATION_ROTATE_90 -> 90
                ExifInterface.ORIENTATION_ROTATE_180 -> 180
                ExifInterface.ORIENTATION_ROTATE_270 -> 270
                else -> 0
            }

            // 3. Read dimensions first to calculate downsampling size
            val inputStreamBounds = openInputStream() ?: return
            val boundsOptions = BitmapFactory.Options().apply { inJustDecodeBounds = true }
            BitmapFactory.decodeStream(inputStreamBounds, null, boundsOptions)
            inputStreamBounds.close()

            val rawWidth = boundsOptions.outWidth
            val rawHeight = boundsOptions.outHeight
            if (rawWidth <= 0 || rawHeight <= 0) return
            
            // Limit image dimensions to max 1200px for speed and memory efficiency
            val maxDimension = 1200
            var sampleSize = 1
            if (rawWidth > maxDimension || rawHeight > maxDimension) {
                val longest = if (rawWidth > rawHeight) rawWidth else rawHeight
                while ((longest / (sampleSize * 2)) >= maxDimension) {
                    sampleSize *= 2
                }
            }

            // Decode the Bitmap using sampleSize
            val inputStream = openInputStream() ?: return
            val decodeOptions = BitmapFactory.Options().apply { inSampleSize = sampleSize }
            val originalBitmap = BitmapFactory.decodeStream(inputStream, null, decodeOptions)
            inputStream.close()

            if (originalBitmap == null) return

            // Make it mutable
            var mutableBitmap = originalBitmap.copy(Bitmap.Config.ARGB_8888, true)
            originalBitmap.recycle()

            // 4. Combined Downscale & Rotate in single Matrix Transform
            val currentWidth = mutableBitmap.width
            val currentHeight = mutableBitmap.height
            
            val scale = if (currentWidth > maxDimension || currentHeight > maxDimension) {
                val scaleW = maxDimension.toFloat() / currentWidth
                val scaleH = maxDimension.toFloat() / currentHeight
                scaleW.coerceAtMost(scaleH)
            } else 1.0f

            if (scale < 1.0f || rotationDegrees != 0) {
                val matrix = Matrix().apply {
                    if (scale < 1.0f) postScale(scale, scale)
                    if (rotationDegrees != 0) postRotate(rotationDegrees.toFloat())
                }
                val processed = Bitmap.createBitmap(mutableBitmap, 0, 0, currentWidth, currentHeight, matrix, true)
                mutableBitmap.recycle()
                mutableBitmap = processed
            }

            // 5. Gather Watermark Info
            val dateTimeText = SimpleDateFormat("dd MMM yyyy, hh:mm a", Locale.getDefault()).format(Date())
            val locationText = getDeviceLocationAndAddress(context)

            // 6. Setup Canvas and paint
            if (!mutableBitmap.isMutable) {
                val temp = mutableBitmap.copy(Bitmap.Config.ARGB_8888, true)
                mutableBitmap.recycle()
                mutableBitmap = temp
            }
            val canvas = Canvas(mutableBitmap)
            val width = mutableBitmap.width.toFloat()
            val height = mutableBitmap.height.toFloat()

            // Text sizing proportional to image width (no aggressive clamp to prevent too tiny text)
            val textSize = (width / 25f).coerceIn(28f, 100f)
            
            val paintText = Paint().apply {
                color = Color.WHITE
                this.textSize = textSize
                isAntiAlias = true
                style = Paint.Style.FILL
                setShadowLayer(4f, 2f, 2f, Color.BLACK)
            }

            val paintLabel = Paint().apply {
                color = Color.parseColor("#FFD700") // Gold/Yellow matching premium theme
                this.textSize = textSize * 0.85f
                isAntiAlias = true
                style = Paint.Style.FILL
                setShadowLayer(4f, 2f, 2f, Color.BLACK)
            }

            val padding = textSize * 0.8f
            val lineSpacing = textSize * 0.3f
            val textHeight = paintText.descent() - paintText.ascent()
            
            // Background overlay box for maximum readability
            val rectHeight = (textHeight * 2) + lineSpacing + (padding * 2)
            val paintBg = Paint().apply {
                color = Color.parseColor("#90000000") // Translucent black overlay
                style = Paint.Style.FILL
            }

            val startY = height - rectHeight
            canvas.drawRect(0f, startY, width, height, paintBg)

            // Draw line 1: Location info
            val xPos = padding
            val yPos1 = startY + padding - paintText.ascent()
            canvas.drawText("📍 $locationText", xPos, yPos1, paintText)

            // Draw line 2: Date & Time info
            val yPos2 = yPos1 + textHeight + lineSpacing
            canvas.drawText("📅 $dateTimeText", xPos, yPos2, paintLabel)

            // 7. Write back to original Uri
            val outputStream = openOutputStream() ?: return
            mutableBitmap.compress(Bitmap.CompressFormat.JPEG, 92, outputStream)
            outputStream.close()
            mutableBitmap.recycle()

            // 8. Write EXIF metadata back to the new file
            if (file != null && file.exists()) {
                try {
                    val exif = ExifInterface(file.absolutePath)
                    
                    // Set Date/Time
                    val exifDateStr = SimpleDateFormat("yyyy:MM:dd HH:mm:ss", Locale.getDefault()).format(Date())
                    exif.setAttribute(ExifInterface.TAG_DATETIME, exifDateStr)
                    exif.setAttribute(ExifInterface.TAG_DATETIME_ORIGINAL, exifDateStr)
                    exif.setAttribute(ExifInterface.TAG_DATETIME_DIGITIZED, exifDateStr)
                    
                    // Set GPS coordinates if available
                    val rawLocation = getDeviceLocation(context)
                    if (rawLocation != null) {
                        val latRef = if (rawLocation.latitude > 0) "N" else "S"
                        val lonRef = if (rawLocation.longitude > 0) "E" else "W"
                        exif.setAttribute(ExifInterface.TAG_GPS_LATITUDE, dec2DMS(rawLocation.latitude))
                        exif.setAttribute(ExifInterface.TAG_GPS_LATITUDE_REF, latRef)
                        exif.setAttribute(ExifInterface.TAG_GPS_LONGITUDE, dec2DMS(rawLocation.longitude))
                        exif.setAttribute(ExifInterface.TAG_GPS_LONGITUDE_REF, lonRef)
                    }
                    
                    exif.saveAttributes()
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }
        } catch (e: Throwable) {
            e.printStackTrace()
        }
    }

    private fun getDeviceLocationAndAddress(context: Context): String {
        if (ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED &&
            ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED
        ) {
            return "Location Permission Denied"
        }

        val locationManager = context.getSystemService(Context.LOCATION_SERVICE) as? LocationManager
            ?: return "Location Service Unavailable"

        try {
            var location: Location? = null
            
            // Check location from different providers
            if (locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)) {
                location = locationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER)
            }
            if (location == null && locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) {
                location = locationManager.getLastKnownLocation(LocationManager.NETWORK_PROVIDER)
            }
            if (location == null && locationManager.isProviderEnabled(LocationManager.PASSIVE_PROVIDER)) {
                location = locationManager.getLastKnownLocation(LocationManager.PASSIVE_PROVIDER)
            }

            // Fallback: If last known location is null, request a single update synchronously with timeout
            if (location == null) {
                val latch = java.util.concurrent.CountDownLatch(1)
                val listener = object : android.location.LocationListener {
                    override fun onLocationChanged(loc: Location) {
                        location = loc
                        latch.countDown()
                    }
                    override fun onStatusChanged(provider: String?, status: Int, extras: android.os.Bundle?) {}
                    override fun onProviderEnabled(provider: String) {}
                    override fun onProviderDisabled(provider: String) {}
                }
                
                val provider = when {
                    locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER) -> LocationManager.NETWORK_PROVIDER
                    locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER) -> LocationManager.GPS_PROVIDER
                    else -> null
                }
                
                if (provider != null) {
                    val mainHandler = android.os.Handler(android.os.Looper.getMainLooper())
                    mainHandler.post {
                        try {
                            locationManager.requestLocationUpdates(provider, 0L, 0f, listener, android.os.Looper.getMainLooper())
                        } catch (e: SecurityException) {
                            latch.countDown()
                        }
                    }
                    
                    // Wait up to 2.5 seconds for location update
                    latch.await(2500, java.util.concurrent.TimeUnit.MILLISECONDS)
                    
                    mainHandler.post {
                        try {
                            locationManager.removeUpdates(listener)
                        } catch (e: Exception) {
                            e.printStackTrace()
                        }
                    }
                }
            }

            val finalLocation = location
            if (finalLocation != null) {
                val coords = String.format(Locale.US, "%.5f, %.5f", finalLocation.latitude, finalLocation.longitude)
                
                // Try resolving via Geocoder
                if (Geocoder.isPresent()) {
                    try {
                        val geocoder = Geocoder(context, Locale.getDefault())
                        val addresses = geocoder.getFromLocation(finalLocation.latitude, finalLocation.longitude, 1)
                        if (!addresses.isNullOrEmpty()) {
                            val address = addresses[0]
                            val parts = mutableListOf<String>()
                            address.subLocality?.let { parts.add(it) } // Neighborhood / Place
                            address.locality?.let { parts.add(it) } // City / Town
                            address.adminArea?.let { parts.add(it) } // State
                            
                            if (parts.isNotEmpty()) {
                                return parts.joinToString(", ")
                            }
                            
                            val fullAddress = address.getAddressLine(0)
                            if (!fullAddress.isNullOrBlank()) {
                                return fullAddress
                            }
                        }
                    } catch (e: Exception) {
                        e.printStackTrace() // Keep coords even if Geocoder fails
                    }
                }
                return coords
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        return "Location Unavailable"
    }

    private fun getDeviceLocation(context: Context): Location? {
        if (ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED &&
            ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED
        ) {
            return null
        }
        val locationManager = context.getSystemService(Context.LOCATION_SERVICE) as? LocationManager ?: return null
        return try {
            var loc: Location? = null
            if (locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)) {
                loc = locationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER)
            }
            if (loc == null && locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) {
                loc = locationManager.getLastKnownLocation(LocationManager.NETWORK_PROVIDER)
            }
            loc
        } catch (e: Exception) {
            null
        }
    }

    private fun dec2DMS(coord: Double): String {
        var valDeg = Math.abs(coord)
        val degrees = valDeg.toInt()
        valDeg = (valDeg - degrees) * 60.0
        val minutes = valDeg.toInt()
        valDeg = (valDeg - minutes) * 60.0
        val seconds = (valDeg * 1000.0).toInt()
        return "$degrees/1,$minutes/1,$seconds/1000"
    }

    fun getPhotoMetadata(context: Context, imageUri: Uri?): Pair<String, String>? {
        if (imageUri == null) return null
        try {
            val file = if (imageUri.scheme == "content" && imageUri.authority == "com.vehicletrackingapp.fileprovider") {
                val filename = imageUri.lastPathSegment
                if (filename != null) File(File(context.filesDir, "images"), filename) else null
            } else if (imageUri.scheme == "file") {
                imageUri.path?.let { File(it) }
            } else null

            if (file != null && file.exists()) {
                val exif = ExifInterface(file.absolutePath)
                val dateTime = exif.getAttribute(ExifInterface.TAG_DATETIME) 
                    ?: exif.getAttribute(ExifInterface.TAG_DATETIME_ORIGINAL)
                val latLong = FloatArray(2)
                val hasLocation = exif.getLatLong(latLong)
                
                val timeStr = if (dateTime != null) {
                    try {
                        val parser = SimpleDateFormat("yyyy:MM:dd HH:mm:ss", Locale.getDefault())
                        val formatter = SimpleDateFormat("dd MMM yyyy, hh:mm a", Locale.getDefault())
                        parser.parse(dateTime)?.let { formatter.format(it) } ?: dateTime
                    } catch (e: Exception) {
                        dateTime
                    }
                } else {
                    SimpleDateFormat("dd MMM yyyy, hh:mm a", Locale.getDefault()).format(Date(file.lastModified()))
                }
                
                val locStr = if (hasLocation) {
                    val geocoder = Geocoder(context, Locale.getDefault())
                    val addresses = try {
                        geocoder.getFromLocation(latLong[0].toDouble(), latLong[1].toDouble(), 1)
                    } catch (e: Exception) {
                        null
                    }
                    if (!addresses.isNullOrEmpty()) {
                        val address = addresses[0]
                        val parts = mutableListOf<String>()
                        address.subLocality?.let { parts.add(it) }
                        address.locality?.let { parts.add(it) }
                        address.adminArea?.let { parts.add(it) }
                        if (parts.isNotEmpty()) parts.joinToString(", ") else address.getAddressLine(0) ?: String.format(Locale.US, "%.5f, %.5f", latLong[0], latLong[1])
                    } else {
                        String.format(Locale.US, "%.5f, %.5f", latLong[0], latLong[1])
                    }
                } else {
                    "Location Unavailable"
                }
                
                return Pair(timeStr, locStr)
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        return null
    }

    fun uriToBase64(context: Context, imageUri: Uri): String? {
        if (imageUri.scheme == "data" || imageUri.toString().startsWith("data:image/")) {
            return imageUri.toString()
        }
        return try {
            val inputStream = try {
                if (imageUri.scheme == "content" && imageUri.authority == "com.vehicletrackingapp.fileprovider") {
                    val filename = imageUri.lastPathSegment
                    if (filename != null) {
                        val file = File(File(context.filesDir, "images"), filename)
                        if (file.exists()) FileInputStream(file) else context.contentResolver.openInputStream(imageUri)
                    } else {
                        context.contentResolver.openInputStream(imageUri)
                    }
                } else if (imageUri.scheme == "file") {
                    imageUri.path?.let { FileInputStream(File(it)) } ?: context.contentResolver.openInputStream(imageUri)
                } else {
                    context.contentResolver.openInputStream(imageUri)
                }
            } catch (e: Exception) {
                context.contentResolver.openInputStream(imageUri)
            } ?: return null

            val bytes = inputStream.use { it.readBytes() }
            if (bytes.isEmpty()) return null
            "data:image/jpeg;base64," + android.util.Base64.encodeToString(bytes, android.util.Base64.NO_WRAP)
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    fun watermarkAndConvertToBase64(context: Context, imageUri: Uri): String? {
        try {
            watermarkCapturedImage(context, imageUri)
        } catch (e: Exception) {
            e.printStackTrace()
        }
        return uriToBase64(context, imageUri)
    }

    fun parseImageModel(input: Any?): Any? {
        if (input == null) return null
        val str = input.toString()
        if (str.isBlank()) return null
        return if (str.startsWith("data:image/")) {
            try {
                val base64Data = str.substringAfter(",")
                android.util.Base64.decode(base64Data, android.util.Base64.NO_WRAP)
            } catch (e: Exception) {
                input
            }
        } else if (str.length > 500 && !str.startsWith("content:") && !str.startsWith("file:") && !str.startsWith("http")) {
            try {
                android.util.Base64.decode(str, android.util.Base64.NO_WRAP)
            } catch (e: Exception) {
                input
            }
        } else {
            input
        }
    }
}


