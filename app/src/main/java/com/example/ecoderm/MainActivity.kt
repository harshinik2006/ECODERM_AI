package com.example.ecoderm

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import com.example.ecoderm.ui.navigation.EcoDermApp
import com.example.ecoderm.ui.theme.EcoDermTheme
import com.example.ecoderm.ui.viewmodel.EcoDermViewModel

class MainActivity : ComponentActivity() {
    private val viewModel: EcoDermViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            EcoDermTheme {
                EcoDermApp(viewModel = viewModel)
            }
        }
    }
}
