package com.android.mobile

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import android.widget.Button
import android.widget.TextView

class LandingPage : Activity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_landing_page)

        findViewById<Button>(R.id.btn_get_started).setOnClickListener {
            startActivity(Intent(this, SignupPage::class.java))
        }

        findViewById<TextView>(R.id.tv_login_link).setOnClickListener {
            startActivity(Intent(this, LoginPage::class.java))
        }
    }
}
