package com.android.mobile

import android.app.Activity
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import android.widget.TextView
import android.widget.Toast
import org.json.JSONObject
import java.net.ConnectException
import java.net.SocketTimeoutException

class LoginPage : Activity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_login_page)

        val signupLink = findViewById<TextView>(R.id.tv_signup_link)
        signupLink.setOnClickListener {
            val intent = Intent(this, SignupPage::class.java)
            startActivity(intent)
        }

        val backLink = findViewById<TextView>(R.id.tv_back)
        backLink.setOnClickListener {
            finish()
        }

        val emailInput = findViewById<EditText>(R.id.et_email)
        val passwordInput = findViewById<EditText>(R.id.et_password)
        val serverUrlInput = findViewById<EditText>(R.id.et_server_url)
        serverUrlInput.setText(SessionManager.getBackendUrl(this))

        val loginButton = findViewById<Button>(R.id.btn_login)
        loginButton.setOnClickListener {
            val email = emailInput.text?.toString()?.trim().orEmpty()
            val password = passwordInput.text?.toString().orEmpty()
            var serverUrl = serverUrlInput.text?.toString()?.trim().orEmpty()

            if (email.isBlank() || password.isBlank()) {
                Toast.makeText(this, "Enter email and password", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            if (serverUrl.isBlank()) {
                serverUrl = SessionManager.getBackendUrl(this)
            }
            if (!serverUrl.startsWith("http://") && !serverUrl.startsWith("https://")) {
                serverUrl = "http://$serverUrl"
            }
            if (!serverUrl.endsWith("/api")) {
                serverUrl = "${serverUrl.trimEnd('/')}/api"
            }
            SessionManager.saveBackendUrl(this, serverUrl)

            loginButton.isEnabled = false
            loginButton.text = "Signing in..."

            Thread {
                try {
                    BackendApi.setBaseUrl(serverUrl)
                    val result = BackendApi.login(email, password)

                    runOnUiThread {
                        loginButton.isEnabled = true
                        loginButton.text = "Log in"
                    }

                    if (result.code !in 200..299) {
                        val message = try {
                            JSONObject(result.body).optString("message", "Login failed")
                        } catch (_: Exception) {
                            "Login failed (${result.code})"
                        }
                        runOnUiThread {
                            Toast.makeText(this, "$message\nURL: $serverUrl", Toast.LENGTH_LONG).show()
                        }
                        return@Thread
                    }

                    val obj = JSONObject(result.body)
                    val token = obj.optString("token", "")
                    val role = obj.optString("role", "")
                    val fullName = obj.optString("fullName", "")
                    val userEmail = obj.optString("email", email)

                    if (token.isBlank()) {
                        runOnUiThread {
                            Toast.makeText(this, "Missing token from server", Toast.LENGTH_LONG).show()
                        }
                        return@Thread
                    }

                    SessionManager.saveSession(this, token, role, userEmail, fullName)
                    runOnUiThread {
                        startActivity(Intent(this, DashboardPage::class.java))
                        finish()
                    }
                } catch (e: Exception) {
                    val onEmulator = Build.FINGERPRINT.contains("generic", ignoreCase = true) ||
                        Build.MODEL.contains("Emulator", ignoreCase = true)
                    val suggestion = if (onEmulator) {
                        "Use emulator URL: http://10.0.2.2:8080/api"
                    } else {
                        "Use PC LAN URL, e.g. http://192.168.1.14:8080/api"
                    }
                    val details = when (e) {
                        is ConnectException -> "Connection refused"
                        is SocketTimeoutException -> "Connection timeout"
                        else -> e.message ?: "Connection failed"
                    }
                    runOnUiThread {
                        loginButton.isEnabled = true
                        loginButton.text = "Log in"
                        Toast.makeText(
                            this,
                            "Network error at $serverUrl\n$details\n$suggestion",
                            Toast.LENGTH_LONG
                        ).show()
                    }
                }
            }.start()
        }
    }
}
