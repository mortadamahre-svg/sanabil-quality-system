(function () {
  'use strict';

  function safeEvent(event) {
    // Do not send beneficiary records, app state, URLs, request bodies or user data.
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
              return { filename: frame.filename, lineno: frame.lineno, colno: frame.colno };
            }) : [];
        return {
          type: 'JavaScriptError',
          value: 'Client-side exception (message redacted)',
          stacktrace: { frames: frames }
        };
      });
    }
    return event;
  }

  // Sentry Loader calls this after its SDK is ready. The project key/DSN
  // is already embedded in the official Loader URL in index.html.
  window.sentryOnLoad = function () {
    try {
      window.Sentry.init({
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
  };
}());
