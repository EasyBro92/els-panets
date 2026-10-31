package com.easybro92.elspanets;

// Els Panets como app de Android (31/10/2026, copiada de la de Taco Dash). El juego
// va dentro del APK y se abre a pantalla completa en un WebView. Se sirve
// como si fuera una web (https://els.panets/...) para que funcionen los
// modulos de JavaScript y la carga de modelos.
//
// Se actualiza sola (26/10): cada archivo se pide a GitHub Pages preguntando
// solo si ha cambiado (ETag); lo nuevo se guarda en el movil. Sin internet
// usa lo ultimo guardado y, si no hay nada, lo que trae el APK de fabrica.
// El origen sigue siendo https://els.panets/, asi que la partida se conserva.

import android.app.Activity;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.HashMap;
import java.util.Map;

public class MainActivity extends Activity {
  private static final String ORIGEN = "https://els.panets/";
  private static final String REMOTO = "https://easybro92.github.io/els-panets";
  // Si internet falla, se deja de intentar un rato (para no esperar en cada archivo).
  private static volatile long sinRedHasta = 0;
  private WebView web;

  @Override
  protected void onCreate(Bundle guardado) {
    super.onCreate(guardado);
    requestWindowFeature(Window.FEATURE_NO_TITLE);
    getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    web = new WebView(this);
    WebSettings s = web.getSettings();
    s.setJavaScriptEnabled(true);
    s.setDomStorageEnabled(true);
    s.setDatabaseEnabled(true);
    s.setMediaPlaybackRequiresUserGesture(false);
    s.setAllowFileAccess(false);
    web.setWebViewClient(new WebViewClient() {
      @Override
      public WebResourceResponse shouldInterceptRequest(WebView v, WebResourceRequest req) {
        String url = req.getUrl().toString();
        if (!url.startsWith(ORIGEN)) return null;      // lo de fuera (fuentes) va por internet
        String ruta = req.getUrl().getPath();
        if (ruta == null || ruta.equals("/") || ruta.isEmpty()) ruta = "/index.html";
        // El service worker de la web no sirve aqui (y romperia la carga).
        if (ruta.equals("/sw.js")) return noExiste();
        try {
          InputStream in = abrir(ruta);
          Map<String, String> cab = new HashMap<>();
          cab.put("Access-Control-Allow-Origin", "*");
          WebResourceResponse r = new WebResourceResponse(tipo(ruta), tipo(ruta).startsWith("text") || ruta.endsWith(".js") || ruta.endsWith(".json") ? "utf-8" : null, in);
          r.setResponseHeaders(cab);
          return r;
        } catch (Exception e) {
          return noExiste();
        }
      }
      @Override
      public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest req) {
        return !req.getUrl().toString().startsWith(ORIGEN);
      }
    });
    setContentView(web);
    pantallaCompleta();
    web.loadUrl(ORIGEN + "index.html");
  }

  private static WebResourceResponse noExiste() {
    WebResourceResponse r = new WebResourceResponse("text/plain", "utf-8", null);
    r.setStatusCodeAndReasonPhrase(404, "No existe");
    return r;
  }

  // Lo mas nuevo que haya: GitHub (si ha cambiado), lo guardado, o el APK.
  private InputStream abrir(String ruta) throws Exception {
    File guardado = new File(getFilesDir(), "web" + ruta);
    File etiqueta = new File(guardado.getPath() + ".etag");
    if (System.currentTimeMillis() > sinRedHasta) {
      HttpURLConnection c = null;
      try {
        c = (HttpURLConnection) new URL(REMOTO + ruta).openConnection();
        c.setConnectTimeout(4000);
        c.setReadTimeout(20000);
        c.setUseCaches(false);
        if (guardado.exists() && etiqueta.exists()) {
          c.setRequestProperty("If-None-Match", new String(Files.readAllBytes(etiqueta.toPath()), StandardCharsets.UTF_8).trim());
        }
        int codigo = c.getResponseCode();
        if (codigo == 200) {
          guardado.getParentFile().mkdirs();
          File temporal = new File(guardado.getPath() + ".tmp");
          try (InputStream in = c.getInputStream(); OutputStream out = new FileOutputStream(temporal)) {
            byte[] b = new byte[65536];
            int n;
            while ((n = in.read(b)) > 0) out.write(b, 0, n);
          }
          if (guardado.exists()) guardado.delete();
          if (!temporal.renameTo(guardado)) throw new Exception("no se pudo guardar");
          String et = c.getHeaderField("ETag");
          if (et != null) Files.write(etiqueta.toPath(), et.getBytes(StandardCharsets.UTF_8));
          else etiqueta.delete();
        }
        // 304: no ha cambiado; 404 u otros: se usa lo que haya en el movil.
      } catch (java.io.IOException e) {
        sinRedHasta = System.currentTimeMillis() + 30000;
      } finally {
        if (c != null) c.disconnect();
      }
    }
    if (guardado.exists()) return new FileInputStream(guardado);
    return getAssets().open("www" + ruta);
  }

  private static String tipo(String ruta) {
    String r = ruta.toLowerCase();
    if (r.endsWith(".html")) return "text/html";
    if (r.endsWith(".js") || r.endsWith(".mjs")) return "text/javascript";
    if (r.endsWith(".css")) return "text/css";
    if (r.endsWith(".json")) return "application/json";
    if (r.endsWith(".glb")) return "model/gltf-binary";
    if (r.endsWith(".png")) return "image/png";
    if (r.endsWith(".jpg") || r.endsWith(".jpeg")) return "image/jpeg";
    if (r.endsWith(".webp")) return "image/webp";
    if (r.endsWith(".svg")) return "image/svg+xml";
    if (r.endsWith(".mp3")) return "audio/mpeg";
    if (r.endsWith(".ogg")) return "audio/ogg";
    if (r.endsWith(".wav")) return "audio/wav";
    if (r.endsWith(".wasm")) return "application/wasm";
    return "application/octet-stream";
  }

  private void pantallaCompleta() {
    web.setSystemUiVisibility(View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
        | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
        | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN);
  }

  @Override
  public void onWindowFocusChanged(boolean foco) {
    super.onWindowFocusChanged(foco);
    if (foco) pantallaCompleta();
  }

  @Override
  protected void onPause() { super.onPause(); web.onPause(); }

  @Override
  protected void onResume() { super.onResume(); web.onResume(); }

  @Override
  public void onBackPressed() {
    if (web.canGoBack()) web.goBack(); else super.onBackPressed();
  }
}
