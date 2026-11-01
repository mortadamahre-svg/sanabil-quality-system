package com.sanabil.flourdistribution;

import android.content.ContentValues;
import android.content.Intent;
import android.content.ActivityNotFoundException;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.util.Locale;
import android.util.Base64;

@CapacitorPlugin(name = "SanabilDownloads")
public class SanabilDownloadsPlugin extends Plugin {
    @PluginMethod
    public void save(PluginCall call) {
        String requestedName = call.getString("fileName");
        String encoded = call.getString("data");
        String mimeType = call.getString("mimeType", "application/octet-stream");
        if (requestedName == null || encoded == null || encoded.isEmpty()) {
            call.reject("Missing file name or file data");
            return;
        }
        String fileName = new File(requestedName).getName().replaceAll("[^A-Za-z0-9._\\-\\u0600-\\u06FF]", "_");
        if (fileName.isEmpty() || fileName.equals(".") || fileName.equals("..")) {
            call.reject("Invalid file name");
            return;
        }
        Uri savedUri = null;
        try {
            byte[] bytes = Base64.decode(encoded, Base64.DEFAULT);
            if (bytes.length == 0) throw new IllegalArgumentException("Empty file");
            OutputStream output;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                ContentValues values = new ContentValues();
                values.put(MediaStore.Downloads.DISPLAY_NAME, fileName);
                values.put(MediaStore.Downloads.MIME_TYPE, mimeType);
                values.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS);
                values.put(MediaStore.Downloads.IS_PENDING, 1);
                savedUri = getContext().getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
                if (savedUri == null) throw new IllegalStateException("Android could not create a Downloads entry");
                output = getContext().getContentResolver().openOutputStream(savedUri, "w");
                if (output == null) throw new IllegalStateException("Could not open Downloads file");
                try (OutputStream stream = output) {
                    stream.write(bytes);
                    stream.flush();
                }
                ContentValues complete = new ContentValues();
                complete.put(MediaStore.Downloads.IS_PENDING, 0);
                getContext().getContentResolver().update(savedUri, complete, null, null);
            } else {
                File directory = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
                if (!directory.exists() && !directory.mkdirs()) throw new IllegalStateException("Cannot create Downloads directory");
                File target = new File(directory, fileName);
                try (FileOutputStream stream = new FileOutputStream(target)) {
                    stream.write(bytes);
                    stream.flush();
                    stream.getFD().sync();
                }
                savedUri = Uri.fromFile(target);
            }
            // Open the saved document immediately so Android shows the
            // installed apps that can view this file (PDF, DOCX, XLSX, TXT, etc.).
            // Keep the download even when no compatible viewer is installed.
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                try {
                    Intent view = new Intent(Intent.ACTION_VIEW);
                    view.setDataAndType(savedUri, mimeType);
                    view.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                    getActivity().startActivity(Intent.createChooser(view, "فتح الملف باستخدام"));
                } catch (ActivityNotFoundException ignored) {
                    // The file is safely saved in Downloads; the user can open it later.
                }
            }
            JSObject result = new JSObject();
            result.put("uri", savedUri.toString());
            result.put("fileName", fileName);
            result.put("location", "Download");
            result.put("bytesWritten", bytes.length);
            call.resolve(result);
        } catch (Exception e) {
            if (savedUri != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                try { getContext().getContentResolver().delete(savedUri, null, null); } catch (Exception ignored) {}
            }
            call.reject("تعذر حفظ الملف فعلياً داخل مجلد Download", e);
        }
    }
}