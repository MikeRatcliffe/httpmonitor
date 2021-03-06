/* See license.txt for terms of usage */

define([
    "httpmonitor/lib/xpcom",
    "httpmonitor/lib/trace",
    "httpmonitor/lib/string",
    "httpmonitor/lib/http",
],
function(Xpcom, FBTrace, Str, Http) {

// ********************************************************************************************* //
// Constants

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cr = Components.results;

var observerService = Cc["@mozilla.org/observer-service;1"].getService(Ci.nsIObserverService);
var categoryManager = Cc["@mozilla.org/categorymanager;1"].getService(Ci.nsICategoryManager);

// ********************************************************************************************* //
// HTTP Request Observer implementation

/**
 * @service This service is intended as the only HTTP observer registered.
 * All FB observers (can come from extensions) should register a listener within this
 * service in order to listen for http-on-modify-request, http-on-examine-response and
 * http-on-examine-cached-response events.
 *
 * See also: <a href="http://developer.mozilla.org/en/Setting_HTTP_request_headers">
 * Setting_HTTP_request_headers</a>
 */
var HttpRequestObserver =
/** lends HttpRequestObserver */
{
    observers: [],
    observing: false,

    registerObservers: function()
    {
        if (FBTrace.DBG_HTTPOBSERVER)
            FBTrace.sysout("httpObserver.registerObservers; (" + this.observers.length + "), " +
                "active: " + this.observing, getObserverList());

        if (!this.observing)
        {
            observerService.addObserver(this, "http-on-modify-request", false);
            observerService.addObserver(this, "http-on-examine-response", false);
            observerService.addObserver(this, "http-on-examine-cached-response", false);
        }

        this.observing = true;
    },

    unregisterObservers: function()
    {
        if (FBTrace.DBG_HTTPOBSERVER)
            FBTrace.sysout("httpObserver.unregisterObservers; (" + this.observers.length + "), " +
                "active: " + this.observing, getObserverList());

        if (this.observing)
        {
            observerService.removeObserver(this, "http-on-modify-request");
            observerService.removeObserver(this, "http-on-examine-response");
            observerService.removeObserver(this, "http-on-examine-cached-response");
        }

        this.observing = false;
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // nsIObserver

    observe: function(subject, topic, data)
    {
        try
        {
            if (!(subject instanceof Ci.nsIHttpChannel))
                return;

            // Notify all registered observers.
            if (topic == "http-on-modify-request" ||
                topic == "http-on-examine-response" ||
                topic == "http-on-examine-cached-response")
            {
                this.notifyObservers(subject, topic, data);
            }
        }
        catch (err)
        {
            if (FBTrace.DBG_ERRORS)
                FBTrace.sysout("httpObserver.observe EXCEPTION", err);
        }
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // nsIObserverService

    addObserver: function(observer, topic, weak)
    {
        if (!topic)
            topic = "http-event";

        if (topic != "http-event")
            throw Cr.NS_ERROR_INVALID_ARG;

        // Do not add an observer twice.
        for (var i=0; i<this.observers.length; i++)
        {
            if (this.observers[i] == observer)
            {
                if (FBTrace.DBG_HTTPOBSERVER)
                    FBTrace.sysout("httpObserver.addObserver; ERROR? Observer already registered: " +
                        observer.dispatchName, getObserverList());
                return;
            }
        }

        this.observers.push(observer);

        if (FBTrace.DBG_HTTPOBSERVER)
            FBTrace.sysout("httpObserver.addObserver; (" + this.observers.length +
                "), added: " + observer.dispatchName);

        if (this.observers.length > 0)
            this.registerObservers();
    },

    removeObserver: function(observer, topic)
    {
        if (!topic)
            topic = "http-event";

        if (topic != "http-event")
            throw Cr.NS_ERROR_INVALID_ARG;

        for (var i=0; i<this.observers.length; i++)
        {
            if (this.observers[i] == observer)
            {
                this.observers.splice(i, 1);

                if (this.observers.length == 0)
                    this.unregisterObservers();

                if (FBTrace.DBG_HTTPOBSERVER)
                    FBTrace.sysout("httpObserver.removeObserver; (" + this.observers.length +
                        "), removed: " + observer.dispatchName, getObserverList());
                return;
            }
        }

        if (FBTrace.DBG_HTTPOBSERVER)
            FBTrace.sysout("httpObserver.removeObserver ERROR? (no such observer): " +
                observer.dispatchName);
    },

    notifyObservers: function(subject, topic, data)
    {
        if (FBTrace.DBG_HTTPOBSERVER)
        {
            FBTrace.sysout("httpObserver.notifyObservers (" + this.observers.length + ") " +
                (topic ? topic.toUpperCase() : topic) + ", " + Http.safeGetRequestName(subject),
                getObserverList());
        }

        for (var i=0; i<this.observers.length; i++)
        {
            var observer = this.observers[i];
            try
            {
                if (observer.observe)
                    observer.observe(subject, topic, data);
            }
            catch (err)
            {
                if (FBTrace.DBG_HTTPOBSERVER)
                    FBTrace.sysout("httpObserver.notifyObservers; EXCEPTION " + err, err);
            }
        }
    }
}

// ********************************************************************************************* //
// Tracing Support

function getObserverList()
{
    var observerNames = [];
    for (var i=0; i<HttpRequestObserver.observers.length; i++)
        observerNames.push(HttpRequestObserver.observers[i].dispatchName);

    return observerNames;
}

// ********************************************************************************************* //
// Registration

// xxxHonza: Do we need to remove the listener?
//TraceModule.addListener(new TraceListener("httpObserver.", "DBG_HTTPOBSERVER", true));

return HttpRequestObserver;

// ********************************************************************************************* //
});
