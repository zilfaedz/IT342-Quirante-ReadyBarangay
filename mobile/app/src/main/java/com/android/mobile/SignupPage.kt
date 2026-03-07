package com.android.mobile

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import android.widget.TextView
import android.widget.Toast
import org.json.JSONObject
import java.net.ConnectException
import java.net.SocketTimeoutException

class SignupPage : Activity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_signup_page)

        val loginLink = findViewById<TextView>(R.id.tv_login_link)
        loginLink.setOnClickListener {
            finish()
        }

        val backLink = findViewById<TextView>(R.id.tv_back)
        backLink.setOnClickListener {
            finish()
        }

        val firstNameInput = findViewById<EditText>(R.id.et_first_name)
        val lastNameInput = findViewById<EditText>(R.id.et_last_name)
        val emailInput = findViewById<EditText>(R.id.et_email)
        val passwordInput = findViewById<EditText>(R.id.et_password)
        val serverUrlInput = findViewById<EditText>(R.id.et_server_url)
        val signupButton = findViewById<Button>(R.id.btn_signup)
        serverUrlInput.setText(SessionManager.getBackendUrl(this))

        signupButton.setOnClickListener {
            val firstName = firstNameInput.text.toString().trim()
            val lastName = lastNameInput.text.toString().trim()
            val email = emailInput.text.toString().trim()
            val password = passwordInput.text.toString()
            var serverUrl = serverUrlInput.text.toString().trim()

            if (firstName.isEmpty() || lastName.isEmpty() || email.isEmpty() || password.isEmpty()) {
                Toast.makeText(this, "Please fill in all fields", Toast.LENGTH_SHORT).show()
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

            signupButton.isEnabled = false
            signupButton.text = "Creating account..."

            Thread {
                try {
                    BackendApi.setBaseUrl(serverUrl)
                    val result = BackendApi.register(firstName, lastName, email, password)
                    
                    runOnUiThread {
                        signupButton.isEnabled = true
                        signupButton.text = "Create Account"
                    }

                    if (result.code in 200..299) {
                        runOnUiThread {
                            Toast.makeText(this, "Account created successfully. Please log in.", Toast.LENGTH_LONG).show()
                            startActivity(Intent(this, LoginPage::class.java))
                            finish()
                        }
                    } else {
                        val message = try {
                            JSONObject(result.body).optString("message", "Registration failed")
                        } catch (_: Exception) {
                            "Registration failed (${result.code})"
                        }
                        runOnUiThread {
                            Toast.makeText(this, "$message\nURL: $serverUrl", Toast.LENGTH_LONG).show()
                        }
                    }
                } catch (e: Exception) {
                    val details = when (e) {
                        is ConnectException -> "Connection refused"
                        is SocketTimeoutException -> "Connection timeout"
                        else -> e.message ?: "Connection failed"
                    }
                    runOnUiThread {
                        signupButton.isEnabled = true
                        signupButton.text = "Create Account"
                        Toast.makeText(this, "Network error at $serverUrl\n$details", Toast.LENGTH_LONG).show()
                    }
                }
            }.start()
        }
    }
}
