package com.android.mobile

import android.content.Context

object SessionManager {
    private const val PREF_NAME = "ready_barangay_prefs"
    private const val KEY_TOKEN = "token"
    private const val KEY_ROLE = "role"
    private const val KEY_EMAIL = "email"
    private const val KEY_FULL_NAME = "full_name"
    private const val KEY_BACKEND_URL = "backend_url"

    fun saveSession(context: Context, token: String, role: String, email: String, fullName: String) {
        val prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
        prefs.edit()
            .putString(KEY_TOKEN, token)
            .putString(KEY_ROLE, role)
            .putString(KEY_EMAIL, email)
            .putString(KEY_FULL_NAME, fullName)
            .apply()
    }

    fun saveBackendUrl(context: Context, backendUrl: String) {
        val prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
        prefs.edit().putString(KEY_BACKEND_URL, backendUrl).apply()
    }

    fun getBackendUrl(context: Context): String {
        val prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
        return prefs.getString(KEY_BACKEND_URL, "http://10.0.2.2:8080/api") ?: "http://10.0.2.2:8080/api"
    }

    fun getToken(context: Context): String? {
        val prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
        return prefs.getString(KEY_TOKEN, null)
    }

    fun getRole(context: Context): String {
        val prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
        return prefs.getString(KEY_ROLE, "") ?: ""
    }

    fun getFullName(context: Context): String {
        val prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
        return prefs.getString(KEY_FULL_NAME, "Admin") ?: "Admin"
    }

    fun clear(context: Context) {
        val prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
        prefs.edit().clear().apply()
    }
}
