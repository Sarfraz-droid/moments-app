.PHONY: prebuild-android build-release build-debug clean

# Override any of these on the command line if your machine differs, e.g.:
#   make build-release JAVA_HOME=/path/to/jdk17
NODE_BIN     ?= /Users/FA073405/.nvm/versions/node/v22.18.0/bin
JAVA_HOME    ?= /Library/Java/JavaVirtualMachines/zulu-17.jdk/Contents/Home
ANDROID_HOME ?= /Users/FA073405/Library/Android/sdk

GRADLE_ENV = PATH="$(NODE_BIN):$$PATH" JAVA_HOME="$(JAVA_HOME)" ANDROID_HOME="$(ANDROID_HOME)"

# Regenerates android/ from app.json. Needed whenever app.json, a native
# module, or google-services.json changes — not needed for JS-only edits.
prebuild-android:
	rm -rf android
	PATH="$(NODE_BIN):$$PATH" npx expo prebuild --platform android

# Standalone, JS-bundled release APK — no Metro/dev-client needed.
# Output: android/app/build/outputs/apk/release/app-release.apk
build-release:
	cd android && $(GRADLE_ENV) ./gradlew assembleRelease -x lint -x test

# Debug APK, signed with the debug keystore, still needs Metro running for JS.
# Output: android/app/build/outputs/apk/debug/app-debug.apk
build-debug:
	cd android && $(GRADLE_ENV) ./gradlew assembleDebug -x lint -x test

clean:
	cd android && $(GRADLE_ENV) ./gradlew clean
