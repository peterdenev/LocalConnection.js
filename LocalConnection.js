/**
 * LocalConnection
 * 
 * Using cookies, LocalConnection allows callbacks to be triggered across browser
 * tabs and windows
 */
function LocalConnection(options) {

/**
 * Cookie name
 *
 * @var string
 */
	this.name = 'localconnection';

/**
 * Unique id for this transmitter
 *
 * @var integer
 */
	this.id = new Date().getTime();

/**
 * List of actions set by addCallback
 *
 * @var array
 */
	this._actions= [];

/**
 * Initializes the transmitter
 *
 * @param opts Object
 */
	this.init = function(options) {
		for (var o in options) {
			this[o] = options[o];
		}
		this.clearCookie();
	}

/**
 * Starts listening for events
 */
	this.listen = function() {
		setTimeout(this.bind(this, this._check), 100);
	}

/**
 * Sends an event with arguments
 * 
 * {{{
 * // on receiver
 * LocalConnection.addCallback('startVid', myfunction);
 * // on sender
 * LocalConnection.send('startVid', '#video');
 * }}}
 *
 * @param event string The event name as defined by the receiver
 * @param ...rest Other arguments as to be passed to the function
 */
	this.send = function(event) {
		var args = Array.prototype.slice.call(arguments, 1); 
		return this._write(event, args);
	}

/**
 * Adds a callback to a receive event
 *
 * {{{
 * // on receiver
 * function myfunction(vidid) {
 *     $(vidid).play();
 * }
 * LocalConnection.addCallback('startVid', myfunction);
 * // on sender
 * LocalConnection.send('startVid', '#video');
 * }}}
 *
 * @param event string The name of the event
 * @param func function The callback
 */
	this.addCallback = function(event, func, scope) {
		if (scope == undefined) {
			scope = this;
		}
		if (this._actions[event] == undefined) {
			this._actions[event] = [];
		}
		this._actions[event].push({f: func, s: scope});
	}

/**
 * Removes a callback
 *
 * @param event string The event to stop polling for
 */
	this.removeCallback = function(event) {
		for (var e in this._actions) {
			if (e == event) {
				delete this._actions[e];
				break;
			}
		}
	}

/**
 * Checks for new data
 */
	this._check = function() {
		var data = this._read();
		if (data.length > 0) {
			for (var e in data) {
				this._receive(data[e].event, data[e].args);
			}
		}
		setTimeout(this.bind(this, this._check), 100);
	}

/**
 * Called when data is received
 *
 * @param event string The event name
 * @param args array Arguments to pass to the event
 */
	this._receive = function(event, args) {
		if (this._actions[event] != undefined) {
			for (var func in this._actions[event]) {
				var callback = this._actions[event][func];
				callback.f.apply(callback.s, args);
			}
		}
	};
	
/**
 * Writes the cookie. Will append if there is already information
 * 
 * @param event string Event name
 * @param args array Array of arguments
 */	
	this._write = function(event, args) {
		var data = this._getCookie();
		var eventdata = this.id+':'+event+':'+args.join(',');
		if (data == '') {
			data = eventdata;
		} else {
			data += '&'+eventdata;
		}
		document.cookie = this.name + '=' + data + "; path=/";
		return true;
	}

/**
 * Reads the cookie
 * 
 * Returns false if the cookie is empty (i.e., no new data). If new data is found,
 * it will return an array of events sent
 */
	this._read = function() {
		var data = this._getCookie();
		if (data == '') {
			return false;
		}
		var events = data.split('&');
		var ret = [];
		// extract events that weren't sent by this transmitter and erase
		// them from data
		for (var e in events) {
			var eventdata = events[e].split(':');
			if (eventdata[0] != this.id) {
				ret.push({
					event: eventdata[1],
					args: eventdata[2].split(',')
				});
				events.splice(e, 1);
			}
		}
		// reassemble cookie and save it
		data = events.join('&');
		document.cookie = this.name + '=' + data + "; path=/";
		return ret;
	}

/**
 * Gets raw cookie data
 *
 * @return string
 */
	this._getCookie = function() {
		var ca = document.cookie.split(';');
		var data = '';
		for (var i=0; i < ca.length; i++) {
			var c = ca[i];
			while (c.charAt(0) == ' ') {
				c = c.substring(1, c.length);
			}
			if (c.indexOf(this.name+'=') == 0) {
				data = c.substring(this.name.length+1, c.length);
				return data;
			}
		}
		return data;
	}

/**
 * Clears the cookie
 */
	this.clearCookie = function() {
		document.cookie = this.name + "=; path=/";
	}

/**
 * Binds a function to a scope
 *
 * @param scope Object The scope
 * @param fn Function The function
 * @return Function
 */
	this.bind = function(scope, fn) {
		return function () {
			fn.apply(scope, arguments);
		};
	}

	this.init(options);
	
}
