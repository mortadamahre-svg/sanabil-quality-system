(function () {
  'use strict';
  var dsn = window.SANABIL_SENTRY_DSN;
  if (!dsn || !/^https:\/\//i.test(dsn) || !window.Sentry) return;

  function safeEvent(event) {
    // Only report technical stack locations. Never transmit app state, user data,
    // URLs, request bodies, breadcrumbs, console output, or arbitrary error text.
    event.message = 'Sanabil client-side error';
    delete event.user;
    delete event.request;
    delete event.extra;
    delete event.contexts;
    delete event.tags;
    delete event.breadcrumbs;
    delete event.transaction;
    if (event.exception && Array.isArray(event.exception.values)) {
      event.exception.values = event.exception.values.map(function (item) {
        var frames = item.stacktrace && Array.isArray(item.stacktrace.frames)
          ? item.stacktrace.frames.map(function (frame) {
              return {
                filename: frame.filename,
                lineno: frame.lineno,
                colno: frame.colno
              };
            })
          : [];
        return {
          type: 'JavaScriptError',
          value: 'Client-side exception (message redacted)',
          stacktrace: { frames: frames }
        };
      });
    }
    return event;
  }

  try {
    window.Sentry.init({
      dsn: dsn,
      environment: location.hostname === 'localhost' ? 'development' : 'production',
      sendDefaultPii: false,
      maxBreadcrumbs: 0,
      tracesSampleRate: 0,
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: 0,
      beforeSend: safeEvent
    });
  } catch (_) {
    // Monitoring must never prevent the distribution app from starting.
  }
}());
