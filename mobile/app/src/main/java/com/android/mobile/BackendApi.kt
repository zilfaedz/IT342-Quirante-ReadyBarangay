package com.android.mobile

import org.json.JSONArray
import org.json.JSONObject
import java.io.BufferedReader
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL

object BackendApi {
    // Default Android emulator to local machine mapping.
    private const val DEFAULT_BASE_URL = "http://10.0.2.2:8080/api"
    @Volatile
    private var baseUrl: String = DEFAULT_BASE_URL

    data class ApiResult(val code: Int, val body: String)

    fun login(email: String, password: String): ApiResult {
        val payload = JSONObject()
            .put("email", email)
            .put("password", password)
        return request("POST", "/auth/login", null, payload.toString())
    }

    fun setBaseUrl(url: String) {
        baseUrl = url.trim().trimEnd('/')
    }

    fun getBaseUrl(): String = baseUrl

    fun register(firstName: String, lastName: String, email: String, password: String): ApiResult {
        val payload = JSONObject()
            .put("firstName", firstName)
            .put("lastName", lastName)
            .put("email", email)
            .put("password", password)
            .put("role", "RESIDENT")
        return request("POST", "/auth/register/resident", null, payload.toString())
    }

    fun get(path: String, token: String): ApiResult {
        return request("GET", path, token, null)
    }

    fun asObject(result: ApiResult): JSONObject? {
        return try {
            JSONObject(result.body)
        } catch (_: Exception) {
            null
        }
    }

    fun asArray(result: ApiResult): JSONArray? {
        return try {
            JSONArray(result.body)
        } catch (_: Exception) {
            null
        }
    }

    private fun request(method: String, path: String, token: String?, jsonBody: String?): ApiResult {
        val url = URL(baseUrl + path)
        val conn = (url.openConnection() as HttpURLConnection).apply {
            requestMethod = method
            connectTimeout = 10000
            readTimeout = 10000
            setRequestProperty("Content-Type", "application/json")
            setRequestProperty("Accept", "application/json")
            if (!token.isNullOrBlank()) {
                setRequestProperty("Authorization", "Bearer $token")
            }
            if (jsonBody != null) {
                doOutput = true
            }
        }

        if (jsonBody != null) {
            OutputStreamWriter(conn.outputStream).use { out ->
                out.write(jsonBody)
            }
        }

        val code = conn.responseCode
        val stream = if (code in 200..299) conn.inputStream else conn.errorStream
        val body = if (stream != null) {
            BufferedReader(stream.reader()).use { it.readText() }
        } else {
            ""
        }
        conn.disconnect()
        return ApiResult(code, body)
    }
}
