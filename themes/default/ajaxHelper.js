/*!
 * Piwik - Web Analytics
 *
 * @link http://piwik.org
 * @license http://www.gnu.org/licenses/gpl-3.0.html GPL v3 or later
 */

/**
 * global ajax queue
 *
 * @type {Array} array holding XhrRequests with automatic cleanup
 */
var globalAjaxQueue = new Array();

/**
 * Extend Array.push with automatic cleanup for finished requests
 *
 * @return {Object}
 */
globalAjaxQueue.push = function () {
    // cleanup ajax queue
    for (var i = this.length; i--;) {
        if (!this[i] || this[i].readyState == 4) {
            this.splice(i, 1);
        }
    }
    // call original array push
    return Array.prototype.push.apply(this, arguments);
};

/**
 * Extend with abort function to abort all queued requests
 *
 * @return {void}
 */
globalAjaxQueue.abort = function () {
    // abort all queued requests
    for (var i = this.length; i--;) {
        this[i] && this[i].abort && this[i].abort(); // abort if possible
    }
    // remove all elements from array
    this.splice(0, this.length);
};

/**
 * Global ajax helper to handle requests within piwik
 *
 * @type {Object}
 */
function ajaxHelper() {

    /**
     * Format of response
     * @type {String}
     */
    this.format =         'json';

    /**
     * Should ajax request be synchronous
     * @type {Boolean}
     */
    this.async =          true;

    /**
     * Callback function to be executed on success
     */
    this.callback =       function () {};

    /**
     * Callback function to be executed on error
     */
    this.errorCallback =  piwikHelper.ajaxHandleError;

    /**
     * Params to be passed as GET params
     * @type {Object}
     * @see ajaxHelper._mixinDefaultGetParams
     */
    this.getParams =      {};

    /**
     * Params to be passed as GET params
     * @type {Object}
     * @see ajaxHelper._mixinDefaultPostParams
     */
    this.postParams =     {};

    /**
     * Element to be displayed while loading
     * @type {String}
     */
    this.loadingElement = null;

    /**
     * Handle for current request
     * @type {XMLHttpRequest}
     */
    this.requestHandle =  null;

    /**
     * Adds params to the request.
     * If params are given more then once, the latest given value is used for the request
     *
     * @param {object}  params
     * @param {string}  type  type of given parameters (POST or GET)
     * @return {void}
     */
    this.addParams = function (params, type) {
        switch (type.toLowerCase()) {

            case 'get':
                for (var key in params) {
                    this.getParams[key] = params[key];
                }
                break;
            case 'post':
                for (var key in params) {
                    this.postParams[key] = params[key];
                }
                break;
        }
    };

    /**
     * Sets the callback called after the request finishes
     *
     * @param {function} callback  Callback function
     * @return {void}
     */

    this.setCallback = function (callback) {
        this.callback = callback;
    };

    /**
     * Sets the callback called in case of an error within the request
     *
     * @param {function} callback  Callback function
     * @return {void}
     */
    this.setErrorCallback = function (callback) {
        this.errorCallback = callback;
    };

    /**
     * Sets the response format for the request
     *
     * @param {string} format  response format (e.g. json, html, ...)
     * @return {void}
     */
    this.setFormat = function (format) {
        this.format = format;
    };

    /**
     * Set the div element to show while request is loading
     *
     * @param {String} element  selector for the loading element
     */
    this.setLoadingElement = function (element) {
        if (!element) {
            element = '#ajaxLoading';
        }
        this.loadingElement = element;
    };

    /**
     * Send the request
     * @param {Boolean} sync  indicates if the request should be synchronous (defaults to false)
     * @return {void}
     */
    this.send = function (sync) {
        if (sync === true) {
            this.async = false;
        }

        if (this.loadingElement) {
            $(this.loadingElement).fadeIn();
        }
        this.requestHandle = this._buildAjaxCall();
        globalAjaxQueue.push(this.requestHandle);
    };

    /**
     * Aborts the current request if it is (still) running
     * @return {void}
     */
    this.abort = function () {
        if (this.requestHandle && typeof this.requestHandle.abort == 'function') {
            this.requestHandle.abort();
            this.requestHandle = null;
        }
    };

    /**
     * Builds and sends the ajax requests
     * @return {XMLHttpRequest}
     * @private
     */
    this._buildAjaxCall = function () {
        var that = this;

        var ajaxCall = {
            type:     'POST',
            async:    this.async !== false,
            url:      'index.php?' + $.param(this._mixinDefaultGetParams(this.getParams)),
            dataType: this.format || 'json',
            error:    this.errorCallback,
            success:  function (response) {
                if (that.loadingElement) {
                    $(that.loadingElement).hide();
                }
                that.callback(response);
            },
            data:     this._mixinDefaultPostParams(this.postParams)
        };

        return $.ajax(ajaxCall);
    };

    /**
     * Mixin the default parameters to send as POST
     *
     * @param {object}   params   parameter object
     * @return {object}
     * @private
     */
    this._mixinDefaultPostParams = function (params) {

        var defaultParams = {
            token_auth: piwik.token_auth
        };

        for (var index in defaultParams) {

            if (!params[index]) {

                params[index] = defaultParams[index];
            }
        }

        return params;
    };

    /**
     * Mixin the default parameters to send as GET
     *
     * @param {object}   params   parameter object
     * @return {object}
     * @private
     */
    this._mixinDefaultGetParams = function (params) {

        var defaultParams = {
            idSite:  piwik.idSite || broadcast.getValueFromUrl('idSite'),
            period:  piwik.period || broadcast.getValueFromUrl('period'),
            segment: broadcast.getValueFromHash('segment', window.location.href)
        };

        // never append token_auth to url
        if (params.token_auth) {
            params.token_auth = null;
            delete params.token_auth;
        }

        for (var key in defaultParams) {
            if (!params[key] && defaultParams[key]) {
                params[key] = defaultParams[key];
            }
        }

        // handle default date & period if not already set
        if (!params.date) {
            params.date = piwik.currentDateString || broadcast.getValueFromUrl('date');
            if (params.period == 'range' && piwik.currentDateString) {
                params.date = piwik.startDateString + ',' + params.date;
            }
        }

        return params;
    };

    return this;
}
