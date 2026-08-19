package com.vehicletrackingapp.util

import android.content.Context
import android.content.res.Configuration
import androidx.compose.runtime.mutableStateOf
import com.vehicletrackingapp.data.model.AppLanguage
import java.util.Locale

/**
 * Runtime locale switcher.
 */
object LocaleHelper {

    private const val PREFS_NAME = "app_prefs"
    private const val KEY_LANG = "selected_lang"

    // Keep a Compose state for UI updates
    val currentLanguage = mutableStateOf(AppLanguage.ENGLISH)
    
    // Normal variable for non-compose context wrapping
    private var internalLangCode = AppLanguage.ENGLISH.code

    fun init(context: Context) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val langCode = prefs.getString(KEY_LANG, AppLanguage.ENGLISH.code) ?: AppLanguage.ENGLISH.code
        internalLangCode = langCode
        val lang = AppLanguage.entries.find { it.code == langCode } ?: AppLanguage.ENGLISH
        currentLanguage.value = lang
    }

    fun setLocale(context: Context, language: AppLanguage): Context {
        currentLanguage.value = language
        internalLangCode = language.code
        
        // Persist
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .edit()
            .putString(KEY_LANG, language.code)
            .apply()

        return updateResources(context, language.code)
    }

    fun applySelectedLocale(context: Context): Context {
        return updateResources(context, internalLangCode)
    }

    private fun updateResources(context: Context, lang: String): Context {
        val locale = Locale(lang)
        Locale.setDefault(locale)

        val config = Configuration(context.resources.configuration)
        config.setLocale(locale)
        config.setLayoutDirection(locale)
        
        return context.createConfigurationContext(config)
    }
}
