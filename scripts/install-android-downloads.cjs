'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const javaRoot = path.join(root, 'android', 'app', 'src', 'main', 'java', 'com', 'sanabil', 'flourdistribution');
const pluginDir = path.join(javaRoot, 'plugins');
fs.mkdirSync(pluginDir, { recursive: true });
const mainActivity = `package com.sanabil.flourdistribution;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.sanabil.flourdistribution.plugins.SanabilDownloadsPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(SanabilDownloadsPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
`;
const plugin = `package com.sanabil.flourdistribution.plugins;

import android.content.ContentValues;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.OutputStream;

@CapacitorPlugin(name = "SanabilDownloads")
public class SanabilDownloadsPlugin extends Plugin {
    @PluginMethod
    public void saveFile(PluginCall call) {
        String name = call.getString("fileName");
        String mime = call.getString("mimeType", "application/octet-stream");
        String encoded = call.getString("data");
        if (name == null || name.trim().isEmpty() || encoded == null || encoded.isEmpty()) {
            call.reject("اسم الملف أو محتواه فارغ");
            return;
        }
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
            call.reject("حفظ الملفات مباشرة في التنزيلات يتطلب Android 10 أو أحدث");
            return;
        }
        Uri uri = null;
        try {
            byte[] bytes = Base64.decode(encoded, Base64.DEFAULT);
            ContentValues values = new ContentValues();
            values.put(MediaStore.MediaColumns.DISPLAY_NAME, name);
            values.put(MediaStore.MediaColumns.MIME_TYPE, mime);
            values.put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/Sanabil");
            values.put(MediaStore.MediaColumns.IS_PENDING, 1);
            uri = getContext().getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
            if (uri == null) throw new IllegalStateException("تعذر إنشاء ملف في التنزيلات");
            try (OutputStream output = getContext().getContentResolver().openOutputStream(uri)) {
                if (output == null) throw new IllegalStateException("تعذر فتح الملف للكتابة");
                output.write(bytes);
                output.flush();
            }
            ContentValues ready = new ContentValues();
            ready.put(MediaStore.MediaColumns.IS_PENDING, 0);
            getContext().getContentResolver().update(uri, ready, null, null);
            JSObject result = new JSObject();
            result.put("uri", uri.toString());
            result.put("fileName", name);
            result.put("relativePath", "Download/Sanabil");
            call.resolve(result);
        } catch (Exception error) {
            if (uri != null) getContext().getContentResolver().delete(uri, null, null);
            call.reject("تعذر حفظ الملف في مجلد التنزيلات: " + error.getMessage(), error);
        }
    }
}
`;
fs.writeFileSync(path.join(javaRoot, 'MainActivity.java'), mainActivity);
fs.writeFileSync(path.join(pluginDir, 'SanabilDownloadsPlugin.java'), plugin);
console.log('Installed native MediaStore download plugin and registered it with Capacitor.');
