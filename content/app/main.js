/* See license.txt for terms of usage */

(function() {

// ********************************************************************************************* //

var config = {};
config.baseUrl = "resource://httpmonitor/content";

/**
 * Load entire application. Modules specified here represent roots (except of tracing).
 */
require(config, [
    "lib/trace",
    "app/httpMonitor",
    "chrome/infotip",
    "app/firebug",
    "net/netPanel",
    "cache/tabCacheModel",
    "net/xmlViewer",
    "net/svgViewer",
    "net/jsonViewer",
    "net/fontViewer",
],
function(FBTrace, HttpMonitor) {

// ********************************************************************************************* //

// This is the only application global (within monitor.xul window)
top.HttpMonitor = HttpMonitor;

/**
 * Maintain application life-cycle. {@HttpMonitor} object represents the application.
 */
function initialize()
{
    window.removeEventListener("load", initialize, false);

    try
    {
        HttpMonitor.initialize(this);
    }
    catch (e)
    {
        FBTrace.sysout("main.initialize; EXCEPTION " + e, e);
    }
}

function shutdown()
{
    window.removeEventListener("unload", shutdown, false);

    try
    {
        HttpMonitor.destroy();
    }
    catch (e)
    {
        FBTrace.sysout("main.shutdown; EXCEPTION " + e, e);
    }
}

// Register window listeners so, we can manage application life-time.
window.addEventListener("load", initialize, false);
window.addEventListener("unload", shutdown, false);

FBTrace.sysout("httpMonitor; Initialized");

// ********************************************************************************************* //
})})();
