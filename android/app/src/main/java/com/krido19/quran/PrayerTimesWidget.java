package com.krido19.quran;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.view.View;
import android.widget.RemoteViews;

import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public class PrayerTimesWidget extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        // There may be multiple widgets active, so update all of them
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    static void updateAppWidget(Context context, AppWidgetManager appWidgetManager,
                                int appWidgetId) {

        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_prayer_times);

        try {
            // Read data from Capacitor SharedPreferences
            // Capacitor stores data in "CapacitorStorage" prefs
            SharedPreferences prefs = context.getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE);
            String widgetDataJson = prefs.getString("widgetData", null);

            if (widgetDataJson != null) {
                JSONObject data = new JSONObject(widgetDataJson);

                // Update Location and Date
                views.setTextViewText(R.id.widget_location, data.optString("location", "Lokasi Belum Tersedia"));
                views.setTextViewText(R.id.widget_date, data.optString("date", ""));

                // Update Next Prayer
                String nextPrayerName = data.optString("nextPrayerName", "");
                String nextPrayerTime = data.optString("nextPrayerTime", "");
                views.setTextViewText(R.id.widget_next_prayer, nextPrayerName + " " + nextPrayerTime);

                // Update Prayer Times List
                updatePrayerTime(views, R.id.time_subuh, R.id.layout_subuh, data, "Subuh", nextPrayerName);
                updatePrayerTime(views, R.id.time_dzuhur, R.id.layout_dzuhur, data, "Dzuhur", nextPrayerName);
                updatePrayerTime(views, R.id.time_ashar, R.id.layout_ashar, data, "Ashar", nextPrayerName);
                updatePrayerTime(views, R.id.time_maghrib, R.id.layout_maghrib, data, "Maghrib", nextPrayerName);
                updatePrayerTime(views, R.id.time_isya, R.id.layout_isya, data, "Isya", nextPrayerName);
            } else {
                views.setTextViewText(R.id.widget_location, "Buka Aplikasi");
                views.setTextViewText(R.id.widget_next_prayer, "Untuk Sinkronisasi");
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        // Click handler to open app
        Intent intent = new Intent(context, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(context, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.widget_location, pendingIntent);
        views.setOnClickPendingIntent(R.id.widget_next_prayer, pendingIntent);

        // Instruct the widget manager to update the widget
        appWidgetManager.updateAppWidget(appWidgetId, views);
    }

    private static void updatePrayerTime(RemoteViews views, int timeViewId, int layoutId, JSONObject data, String prayerName, String nextPrayerName) {
        String time = data.optString(prayerName, "--:--");
        views.setTextViewText(timeViewId, time);

        if (prayerName.equalsIgnoreCase(nextPrayerName)) {
            // Highlight current/next prayer
            views.setInt(layoutId, "setBackgroundResource", R.drawable.prayer_highlight);
            // You might want to change text color programmatically here if needed, 
            // but for simplicity we rely on the layout XML defaults or simple toggles if possible.
            // RemoteViews has limited styling capabilities compared to normal Views.
        } else {
            views.setInt(layoutId, "setBackgroundResource", 0); // Remove background
        }
    }
}
