#!/usr/bin/env bash
# Construye el APK de Els Panets con el juego dentro (31/10/2026).
# Sin Gradle: aapt2 + javac + d8 + zipalign + apksigner del kit de Android.
# Uso: bash apk/construir.sh   ->  apk/salida/ElsPanets.apk
set -euo pipefail
cd "$(dirname "$0")"
SDK="${ANDROID_HOME:-$LOCALAPPDATA/Android/Sdk}"
BT="$SDK/build-tools/34.0.0"
JAR="$SDK/platforms/android-34/android.jar"
JDK="$(ls -d "/c/Program Files/Microsoft/jdk-17"* | head -1)/bin"
export JAVA_HOME="$(cygpath -w "$(dirname "$JDK")")"
export PATH="$JDK:$PATH"
B=build
rm -rf "$B" && mkdir -p "$B/assets" "$B/gen" "$B/clases" "$B/dex" salida

# La version sube sola con cada construccion (fecha y hora), para que el
# movil acepte instalar la nueva encima de la vieja.
VERSION=$(date +%y%m%d%H)
sed "s/android:versionCode=\"[0-9]*\"/android:versionCode=\"$VERSION\"/; s/android:versionName=\"[^\"]*\"/android:versionName=\"$(date +%d.%m.%Y)\"/" AndroidManifest.xml > "$B/AndroidManifest.xml"

mkdir -p "$B/assets/www" && (cd .. && cp -r $(cat apk/archivos-juego.txt) "apk/$B/assets/www/")
rm -f "$B/assets/www/sw.js"          # dentro de la app no hace falta

"$BT/aapt2.exe" compile --dir res -o "$B/res.zip"
"$BT/aapt2.exe" link -I "$JAR" --manifest "$B/AndroidManifest.xml" -o "$B/base.apk" "$B/res.zip" \
  --java "$B/gen" --min-sdk-version 26 --target-sdk-version 34
"$JDK/javac.exe" -source 8 -target 8 -nowarn -encoding UTF-8 -cp "$JAR" -d "$B/clases" \
  $(find src "$B/gen" -name "*.java") 2>&1 | grep -v "warning" || true
cmd //c "$(cygpath -w "$BT/d8.bat")" --release --lib "$(cygpath -w "$JAR")" --output "$(cygpath -w "$B/dex")" \
  $(find "$B/clases" -name "*.class" -exec cygpath -w {} \;)
# El juego y el codigo se meten con jar (con aapt2 en Windows las rutas
# salian con «» y Android no las encuentra).
"$JDK/jar.exe" uf "$B/base.apk" -C "$B" assets -C "$B/dex" classes.dex
"$BT/zipalign.exe" -p -f 4 "$B/base.apk" "$B/alineado.apk"

# Firma: la llave se crea una vez y se guarda en apk/llave/ (fuera de git).
# Sin ella no se puede actualizar la app instalada (habria que desinstalar).
mkdir -p llave
if [ ! -f llave/elspanets.jks ]; then
  CLAVE=$(head -c 24 /dev/urandom | base64 | tr -dc 'A-Za-z0-9' | head -c 20)
  echo "$CLAVE" > llave/clave.txt
  "$JDK/keytool.exe" -genkeypair -keystore llave/elspanets.jks -alias elspanets -keyalg RSA -keysize 2048 \
    -validity 20000 -storepass "$CLAVE" -keypass "$CLAVE" -dname "CN=Els Panets, O=EasyBro92, C=ES" >/dev/null
fi
CLAVE=$(cat llave/clave.txt)
cmd //c "$(cygpath -w "$BT/apksigner.bat")" sign --ks "$(cygpath -w llave/elspanets.jks)" --ks-pass "pass:$CLAVE" \
  --out "$(cygpath -w salida/ElsPanets.apk)" "$(cygpath -w "$B/alineado.apk")"
ls -la salida/ElsPanets.apk
