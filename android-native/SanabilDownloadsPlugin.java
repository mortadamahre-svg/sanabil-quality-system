package com.sanabil.flourdistribution;

import android.app.DownloadManager;
import android.net.Uri;
import android.os.Environment;
import android.webkit.MimeTypeMap;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileOutputStream;
import java.util.Locale;
import android.util.Base64;

@CapacitorPlugin(name = "SanabilDownloads")
public class SanabilDownloadsPlugin extends Plugin {
    @PluginMethod
    public void save(PluginCall call) {
        String fileName = call.getString("fileName");
        String encoded = call.getString("data");
        String mimeType = call.getString("mimeType", "application/octet-stream");
        if (fileName == null || encoded == null || encoded.isEmpty()) {
            call.reject("Missing file name or file data");
            return;
        }
        fileName = new File(fileName).getName().replaceAll("[^A-Za-z0-9._\\-\\u0600-\\u06FF]", "_");
        if (fileName.isEmpty() || fileName.equals(".") || fileName.equals("..")) {
            call.reject("Invalid file name");
            return;
        }
        File temp = null;
        try {
            byte[] bytes = Base64.decode(encoded, Base64.DEFAULT);
            if (bytes.length == 0) throw new IllegalArgumentException("Empty file");
            temp = new File(getContext().getCacheDir(), "sanabil-" + System.currentTimeMillis() + "-" + fileName);
            try (FileOutputStream out = new FileOutputStream(temp)) {
                out.write(bytes);
                out.flush();
                out.getFD().sync();
            }
            DownloadManager manager = (DownloadManager) getContext().getSystemService(android.content.Context.DOWNLOAD_SERVICE);
            if (manager == null) throw new IllegalStateException("Android DownloadManager unavailable");
            DownloadManager.Request request = new DownloadManager.Request(Uri.fromFile(temp));
            request.setTitle(fileName);
            request.setDescription("تنزيل ملف من تطبيق سنابل");
            request.setMimeType(mimeType);
            request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
            request.setAllowedOverMetered(true);
            request.setAllowedOverRoaming(false);
            request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, fileName);
            long id = manager.enqueue(request);
            JSObject result = new JSObject();
            result.put("id", id);
            result.put("fileName", fileName);
            result.put("location", "Download");
            call.resolve(result);
        } catch (Exception e) {
            if (temp != null && temp.exists()) temp.delete();
            call.reject("تعذر بدء حفظ الملف في مجلد Download", e);
        }
    }
}