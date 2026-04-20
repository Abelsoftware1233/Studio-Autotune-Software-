package com.ai.studio; // Zorg dat dit overeenkomt met jouw project!

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

public class MainActivity extends AppCompatActivity {

    private WebView myWebView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        // 1. Koppel de WebView aan de layout
        myWebView = findViewById(R.id.webview); 

        // 2. Configureer de instellingen voor audio en JavaScript
        WebSettings webSettings = myWebView.getSettings();
        webSettings.setJavaScriptEnabled(true); // Cruciaal voor Tone.js
        webSettings.setDomStorageEnabled(true);
        webSettings.setMediaPlaybackRequiresUserGesture(false); // Helpt bij autoplay audio

        myWebView.setWebViewClient(new WebViewClient());

        // 3. De cruciale 'Handdruk' voor de microfoon-rechten
        myWebView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                MainActivity.this.runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        // Verleen toegang aan de gevraagde resources (zoals de microfoon)
                        request.grant(request.getResources());
                    }
                });
            }
        });

        // 4. Controleer en vraag systeemrechten bij het opstarten
        checkAndRequestPermissions();

        // 5. Laad je website (Github Pages)
        myWebView.loadUrl("https://abelsoftware1233.github.io/");
    }

    private void checkAndRequestPermissions() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) 
                != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this, new String[]{Manifest.permission.RECORD_AUDIO}, 1);
        }
    }
}
