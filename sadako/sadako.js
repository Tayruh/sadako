
(function(sadako) {

	var localStorage;

	var JUMP = "JUMP";
	var END = "END";
	var ABORT = "ABORT";
	var CONTINUE = "CONTINUE";
	var RUN = "RUN";

	sadako.token = {
		"line": ".,",
		"cond": "::",
		"script_open": "[:",
		"script_close": ":]",
		"rename": "@:",
		"attach": "<>",
		"choice_format_open": "[",
		"choice_format_close": "]",
		"comment_open": "/*",
		"comment_close": "*/",
		"label_prop": ".",
		"inline_open": "{:",
		"inline_close": ":}",
		"span_open": "<:",
		"span_close": ":>",
		"macro_open": "(:",
		"macro_close": ":)",

		// begins line
		"comment": "//",
		"label": "=",
		"jump": ">>",
		"return": "<<",
		"tag": "~:",
		"cond_block": "~",
		"page": "##",
		"static": "\\+",
		"choice": "\\*",
		"depth": "\\-",
		"label_open": "{",
		"label_close": "}",

		//begins script block
		"eval_code": "&",
		"eval_value": "=",
		"page_embed": "#",
		"label_embed": "%",
		"input_embed": ">",

		// embedding
		"break": "\\^\\^",
		"var_embed": "\\$",
		"tmp_embed": "_",
		"value_embed": ":",
		"cond_embed": "\\.",
		"write_embed": "~",
		"write2_embed": "~'",
		"write3_embed": '~"',
		"pluswrite_embed": "~\\+",
		"pluswrite2_embed": "~\\+'",
		"pluswrite3_embed": '~\\+"'
	};

	// global variables intended to changed
	sadako.savename = "sadako";
	sadako.text_delay = 150.0;
	sadako.output_id = "#output";
	sadako.autosave_enabled = false;

	// global variables not saved to storage
	sadako.version = "0.9.3";
	sadako.kayako_version = "0.9.2";
	sadako.tmp = {};
	sadako.evals = [];
	sadako.defaultData = {};
	// sadako.story = {};
	sadako.tags = {};
	sadako.labels = {};
	sadako.depths = {};
	sadako.lines = [];
	sadako.history = [];
	sadako.history_limit = 10;
	sadako.state = {};
	sadako.before = {};
	sadako.after = {};
	sadako.savestate_enabled = true;
	sadako.freeze_data = {};
	sadako.script_status = null;
	sadako.dialog_ids = {};
	sadako.onDialogClose = null;
	sadako.macros = {};
	sadako.is_frozen = false;
	sadako.save_data = {};
	sadako.current_line = [];
	sadako.script_level = 1;
	sadako.in_dialog = false;

	// global variables saved to state
	sadako.current = null;
	sadako.page = "1";
	sadako.start = 0;
	sadako.part = 0;
	sadako.page_seen = {};
	sadako.label_seen = {};
	sadako.var = {};
	sadako.jumps = [];
	sadako.choices = [];
	sadako.chosen = null;
	sadako.conditions = {};
	sadako.cond_states = [];
	sadako.enter_text = [];

	/* Utility Functions */

	var dom = function(id) {
		/*
			Gets an HTML element or array of elements.

			id (string): ID if string begins with # or class if not.

			Returns (element or array): Single element with ID or array of
			elements with class.
		*/

		var temp;

		if ((temp = isToken(id, "#"))) return document.getElementById(temp);
		else if ((temp = isToken(id, "\\."))) return document.getElementsByClassName(temp);
	};

	var copy = function(item, deep) {
		/*
			Creates a copy of an item to break referencing.

			item (any): The variable to copy. It can be any type.

			deep (boolean): If true, it will index through array or object and
				also create copies of every member instead passing references.

			Returns (any): The copy of the variable.
		*/

		var getArray = function(list, deep) {
			var a;
			var new_list = [];
			for (a = 0; a < list.length; ++a) {
				if (deep) new_list.push(getValue(list[a], true));
				else new_list.push(list[a]);
			}
			return new_list;
		}

		var getObj = function(list, deep) {
			var a;
			var new_list = {};
			for (a in list) {
				if (deep === true) new_list[a] = getValue(list[a], true);
				else new_list[a] = list[a];
			}
			return new_list;
		}

		var getValue = function(item, deep) {
			if (isArray(item)) {
				if (deep) return getArray(item, deep);
				return item;
			}
			if (isObj(item)) {
				if (deep) return getObj(item, deep);
				return item;
			}
			return item;
		}

		return getValue(item, deep);
	};

	var find = function(list, func) {
		/*
			Finds items in the array or object that match the criteria specified.

			list (array or object): The list to compare.

			func (function): The function with the conditional comparison. The
				only argument for the function is the  variable being compared.
				If function returns a truthy value, it adds it to the list of
				items to be returned.

			Returns (array or object): Returns an array or object (determined by
				'list' type) with the variables that match the criteria in
				function.

			Example:
			// bleh will be assigned the values 2, 4, 6.
			var bleh = find([1, 2, 3, 4, 5, 6], function(x) {
				// Any even number is accepted.
				return (x % 2 === 0);
			});
		*/

		var result, x;
		if (list instanceof Array) {
			result = [];
			var i;
			for (i = 0; i < list.length; ++i) {
				x = func(list[i]);
				if (x) { result.push(list[i]); }
			}
		}
		else {
			result = {};
			var k;
			for (k in list) {
				x = func(list[k]);
				if (x) { result[k] = list[k]; }
			}
		}
		return result;
	};

	var isDef = function(val) {
		// Returns true if argument equals undefined.

		return (val !== (void 0));
	};

	var isEmpty = function(val) {
		/*
			Returns true if argument is an empty array or empty object.
			Undefined arrays or objects return false.
		*/

		if (val === undefined || val === null || (!isFunc(val) && val.length === 0)) return true;

		var a;
		for (a in val) {
			return false;
		}
		return true;
	};

	var isStr = function(val) {
		// Returns true if argument is a string.

		return (typeof val === 'string' || val instanceof String);
	};

	var isNum = function(val) {
		// Returns true if argument is a number.

		return (typeof val === 'number' && !isNaN(val - 0));
	};

	var isValidNum = function(val) {
		/*
		 	Returns true if argument is a number or a string containing a valid
		 	number.
		*/

		if (isStr(val)) { return /^-?(\d|\.)+(?:e-?\d+)?$/.test(val); }
		return isNum(val);
	};

	var isArray = function(val) {
		// Returns true if argument is an array.

		return (val instanceof Array || Array.isArray(val));
	};

	var isFunc = function(val) {
		// Returns true if argument is a function.

		return (typeof val === 'function' || val instanceof Function);
	};

	var isObj = function(val) {
		// Returns true if argument is an object.

		if (val === true || val === false || val === undefined || val === null) return false;
		if (isDef(val) && !isStr(val) && !isNum(val) && !isArray(val)
				&& !isFunc(val) && val !== null) {
			return true;
		}
		return false;
	};

	var getNum = function(val) {
		// Returns number value is argument is a number, or undefined if not.

		if (!isNum(val)) { return undefined; }
		if (isStr(val)) { return parseFloat(val); }
		return val;
	};

	var getOrDo = function(action, arg1, arg2) {
		/*
			Returns value from string or function.

			action (string or function): Will return vaue of 'action' if string
			 	or result of 'action' if it's a function.

			arg1 (any), arg2 (any): parameters to pass to 'action' if it's a
				function.

			Returns (string or any): Returns string if 'action' is string, or
				returns result of 'action' if it's a function.
		*/

		if (isFunc(action)) { return action(arg1, arg2); }
		else { return action; }
	};

	var list = function() {
		/*
		 	Returns a list of items for comparison with the 'in' operator.
			
			arguments (strings): List of strings.
			
			Returns (object): The object containing list of items.
			
			Example: 
			// resolves to true
			"banana" in list("apple", "banana", "orange")
		*/

		var obj = {};
		var a;
		for (a = 0; a < arguments.length; ++a) {
			obj[arguments[a]] = true;
		}
		return obj;
	};

	var format = function() {
		//credit: andynormancx @ https://stackoverflow.com/a/5077091
		//'{0} {{0}} {{{0}}} {1} {2}, 3.14, 'a{2}bc', 'foo';
		//3.14 {0} {3.14} a{2}bc foo

		// if you pass true as the first argument, it will replace the strings in the arguments as well
		var args = Array.prototype.slice.call(arguments)
		var str = args.shift();
		var loop = false;

		if (str === true) {
			str = args.shift();
			loop = true;
		}

		var old_text, a;

		// 10 is the cutoff to prevent accidental infinite looping. ten deep is insane anyway
		for (a = 0; a < 10; ++a) {
			old_text = str;
			str = str.replace(/\{\{|\}\}|\{(\d+)\}/g, function (m, n)
			{
				if (m === "{{") { return "{"; }
				if (m === "}}") { return "}"; }
				if (n >= args.length) throw new Error("{" + n + "} is out of range\n" + str);
				return args[n];
			});
			if (!loop || old_text === str) { break; }

			// console.log(a, old_text, str);
		}

		return str;
	};

	var has = function(list, id) {
		/*
			Determines whether a value is in an array.
			
			list (array): The array for comparison.
			id (any): The value for comparison.
			
			Returns (boolean): true if value in array, and false if not.
		*/
		
		var a;
		for (a = 0; a < list.length; ++a) {
			if (list[a] === id) return true;
		}
		return false;
	};

	var add = function(list, id) {
		// Pushes unique value to an array.
		
		if (!has(list, id)) list.push(id);
		return list;
	};

	var remove = function(list, id) {
		// Removes a value from an array. (Only looks for first instance.)
		
		var index = list.indexOf(id);
		if (index !== -1) list.splice(index, 1);
		return list;
	};

	var hasClass = function(id, classname) {
		// Determines whether HTML has a specific class.
		
		return (sadako.has(dom(id).className.split(" "), classname));
	};

	var addClass = function(id, classname) {
		// Adds a class to an HTML element.
		
		var classes = add(dom(id).className.split(" "), classname).join(" ");
		dom(id).className = classes;
		return classes;
	};

	var removeClass = function(id, classname) {
		// Removes a class from an HTML element.
		
		var classes = remove(dom(id).className.split(" "), classname).join(" ");
		dom(id).className = classes;
		return classes;
	};

	var random = function(min, max) {
		// Returns a random number with min as the low and max as the high.
		
		min = Math.ceil(min);
		max = Math.floor(max);
		return Math.floor(Math.random() * (max - min + 1)) + min;
	};

	var percentCheck = function(success_rate) {
		// Checks against a perctange and returns true if it passes.

		var chance = random(1, 100);
		if (success_rate >= chance) return true;
		return false;
	};

	var rollDice = function(die) {
		/*
			Simulates rolling a die.

			die (string): foramted as "2D6+1" (for two six-sided dice, with 1
				added to total)

			returns (integer): total value of rolled die
		*/

		var dice = die.toUpperCase().split("D");
		var plus = dice[1].split("+");
		if (plus.length > 1) {
			dice[1] = plus[0];
			plus = parseInt(plus[1]);
		}
		else plus = 0;
		dice[0] = parseInt(dice[0]);
		dice[1] = parseInt(dice[1]);

		var total = 0;
		var a;
		for (a = 0; a < dice[0]; ++a) {
			total += random(1, dice[1]);
		}
		total += plus;
		return total;
	};

	var randomItem = function(list) {
		// Returns a random item from an array.
		
		return list[random(0, list.length - 1)]; 
	};

	var arrayToString = function(list, quote) {
		/*
			Converts an array to a string representation for inclusion in
			evalution strings.
		
			list (array): Array to convert.
			
			quote (string): Specify single quote or double quotes. Default is
				double.
				
			Returns (string): String representation of the array.
		*/
		
		if (!isStr(quote)) { quote = '"'; }
		var result = "";
		var a;
		for (a = 0; a < list.length; ++a) {
			if (isNum(list[a])) result += list[a];
			else result += quote + list[a] + quote;
			if (a < list.length - 1) result += ", ";
		}

		return "[" + result + "]";
	};

	var cap = function(str) {
		return str.replace(/(\b\w)/i, function(m) { return m.toUpperCase(); });
	};

	var scrollToTop = function() {
		// Scrolls HTML page to the top.
		
		document.body.scrollTop = 0; // For Safari
		document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
	}


	/* Saving & Loading */

	var checkLocalStorage = function() {
		/*
		Algorithm to emulate local storage with cookies from MDN.

		- Assigns local variable 'localStorage' to either the real localStorage
		  or an object that emulates its functions.
		*/

		try {
			if (window.localStorage !== undefined && window.localStorage !== null) {
				localStorage = window.localStorage;
				return;
			}
		}
		catch(exception){
			console.log("window.localStorage not available. Attempting emulation via cookies.")
		}

		// Credit: https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Local_storage
		localStorage = {
			getItem: function (sKey) {
				// eslint-disable-next-line no-prototype-builtins
				if (!sKey || !this.hasOwnProperty(sKey)) { return null; }
				// eslint-disable-next-line no-useless-escape
				return unescape(document.cookie.replace(new RegExp("(?:^|.*;\\s*)" + escape(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=\\s*((?:[^;](?!;))*[^;]?).*"), "$1"));
			},
			key: function (nKeyId) {
				// eslint-disable-next-line no-useless-escape
				return unescape(document.cookie.replace(/\s*\=(?:.(?!;))*$/, "").split(/\s*\=(?:[^;](?!;))*[^;]?;\s*/)[nKeyId]);
			},
			setItem: function (sKey, sValue) {
				if(!sKey) { return; }
				document.cookie = escape(sKey) + "=" + escape(sValue) + "; expires=Tue, 19 Jan 2038 03:14:07 GMT; path=/";

				if (document.cookie.length < 1) return console.error("Cookie did not save correctly. Try clearing cookies for this domain.");

				// eslint-disable-next-line no-useless-escape
				this.length = document.cookie.match(/\=/g).length;

				// the cookie name/value pair is typically first
				// var cookie = document.cookie.split(";")[0].split("=")[1];
				// console.log(cookie.length);
				// console.log(cookie.split(/%(?:u[0-9A-F]{2})?[0-9A-F]{2}|./).length);
			},
			length: 0,
			removeItem: function (sKey) {
				// eslint-disable-next-line no-prototype-builtins
				if (!sKey || !this.hasOwnProperty(sKey)) { return; }
				document.cookie = escape(sKey) + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
				this.length--;
			},
			hasOwnProperty: function (sKey) {
				// eslint-disable-next-line no-useless-escape
				return (new RegExp("(?:^|;\\s*)" + escape(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=")).test(document.cookie);
			}
		};
		// eslint-disable-next-line no-useless-escape
		localStorage.length = (document.cookie.match(/\=/g) || localStorage).length;
	}

	var getCurrentState = function() {
		/*
			Saves important values to the state object for use with history.

			- This function is called every time doLink() or doChoice() is
			  called, which is generally whenever a link or choice is clicked,
			  or a page is force loaded.

			page (string): page value
			start (string): start value

			returns (object): state object which contains the saved data
		*/

		var state = {
			current: sadako.current,
			current_line: copy(sadako.current_line, true),
			page: sadako.current_line[0],
			start: sadako.current_line[1],
			part: sadako.current_line[2],
			lines: copy(sadako.enter_text, true),
			jumps: copy(sadako.jumps, true),
			page_seen: copy(sadako.page_seen, true),
			label_seen: copy(sadako.label_seen, true),
			conditions: copy(sadako.conditions, true),
			cond_states: copy(sadako.cond_states, true),
			choices: copy(sadako.choices, true),
			evals: copy(sadako.evals, true),
			var: copy(sadako.var, true)
		}

		// console.log(sadako.current_line)

		return state;
	}

	var loadState = function(data, keep_values) {
		/*
			Copies values from 'data' to state object and global variables.

			- Called when manually going back in history or unfreezing state.

			data (object): data containing values to copy
			
			keep_values (boolean): If true then page and labels counts and
				the variable object are not altered. This is useful when
				unfreezing data and maintaining current progress.
		*/

		sadako.current = data.current;
		sadako.page = data.page;
		sadako.start = data.start;
		sadako.part = data.part;
		sadako.lines = copy(data.lines, true);
		sadako.jumps = copy(data.jumps, true);
		sadako.current_line = copy(data.current_line, true);
		sadako.conditions = copy(data.conditions, true);
		sadako.cond_states = copy(data.cond_states, true);
		sadako.choices = copy(data.choices, true);
		sadako.evals = copy(data.evals, true);
		sadako.enter_text = copy(data.lines, true);

		sadako.state = copy(data, true);
		
		if (!keep_values) {
			sadako.page_seen = copy(data.page_seen, true);
			sadako.label_seen = copy(data.label_seen, true);
			sadako.var = copy(data.var, true);
		}
	}

	var doSaveState = function() {
		/*
			Saves the state if saving is currently enabled (ie. state is not
			frozen).
		*/
		
		if (!sadako.savestate_enabled) return;

		sadako.state = getCurrentState();
		sadako.enter_text = copy(sadako.lines, true);

		if (sadako.history_limit > 0) {
			if (sadako.history.length > sadako.history_limit) {
				sadako.history.splice(0, 1);
			}
			sadako.history.push(sadako.state);
		}
	}

	var saveData = function() {
		/*
			Assigns the current data to the save object. This differs from
			savestate because this will be saved to localstorage and savestate
			is not.
		*/
		
		sadako.save_data = {
			current: sadako.current,
			lines: copy(sadako.enter_text, true),
			page_seen: copy(sadako.page_seen, true),
			label_seen: copy(sadako.label_seen, true),
			var: copy(sadako.var, true)
		}
	}

	var updateData = function(pages, labels, data) {
		/*
			Updates the data to be current, in case there is an older save
			loaded that doesn't contain newer variables.

			pages (object): page seen object
			labels (object): label seen object
			data (object): save variable object
		*/
		
		var a;

		for (a in sadako.story) {
			sadako.page_seen[a] = (pages && a in pages) ? pages[a] : 0;
		}

		for (a in sadako.labels) {
			sadako.label_seen[a] = (labels && a in labels) ? labels[a] : 0;
		}

		sadako.var = copy(sadako.defaultData.var, true);
		if (data) {
			for (a in data) {
				sadako.var[a] = data[a];
			}
		}
	}

	var loadData = function(data) {
		sadako.current = data.current;
		sadako.lines = copy(data.lines, true);

		// sadako.page_seen = copy(data.page_seen, true);
		// sadako.label_seen = copy(data.label_seen, true);
		// sadako.var = copy(data.var, true);

		updateData(data.page_seen, data.label_seen, data.var);

		sadako.enter_text = copy(data.lines, true);

		sadako.current_line = getLineByLabel(sadako.current);

		sadako.page = sadako.current_line[0];
		sadako.start = sadako.current_line[1];
		sadako.part = sadako.current_line[2];

		sadako.state = {};
		sadako.choices = [];
		sadako.chosen = null;
		sadako.jumps = [];
		sadako.conditions = {};
		//sadako.history = [getCurrentState()];
		sadako.history = [];
		doSaveState();
		saveData();
		// sadako.save_data = copy(data, true);
	}

	var doSaveData = function() {
		if (!sadako.savestate_enabled) {
			// sadako.enter_text = null;
			return;
		}

		saveData();
		if (sadako.autosave_enabled) sadako.saveGame("auto", true);
	}

	sadako.saveGame = function(saveSlot, no_confirm) {
		/*
		Saves the game to local storage.

		saveSlot (integer): Value to differentiate between different saves stored locally
		no_confirm (boolean): true: prevents notifications on success or fail, false: allows notifications
		*/

		if (saveSlot === undefined) {
			var el = dom("#save-slot");
			saveSlot = el.options[el.selectedIndex].value;
		}

		if (!no_confirm && localStorage.getItem(sadako.savename + "_savedata_" + saveSlot) !== null) {
			if (!confirm("Overwrite save file?")) return;
		}

		var saveData = JSON.stringify(sadako.save_data);

		// var saveData = JSON.stringify(sadako.state);

		localStorage.setItem(sadako.savename + "_savedata_" + saveSlot, saveData);

		if (!no_confirm) alert("Save successful!");
	}

	sadako.loadGame = function(saveSlot, no_confirm) {
		/*
		Loads the data from local storage.

		loadSlot (integer): Value to differentiate between different saves stored locally
		no_confirm (boolean): true: prevents notifications on success or fail, false: allows notifications

		returns (boolean): true: loaded successfully, false: failed to load
		*/

		if (saveSlot === undefined) {
			var el = dom("#save-slot");
			saveSlot = el.options[el.selectedIndex].value;
		}

		var saveData = localStorage.getItem(sadako.savename + "_savedata_" + saveSlot);

		if (saveData === null) {
			if (!no_confirm) alert("Save data not found!");
			return false;
		}

		if (!no_confirm && !confirm("Load save file? Current progress will be lost.")) return;

		sadako.unfreezeData();
		loadData(JSON.parse(saveData));

		if (!no_confirm) alert("Load succesful!" );

		sadako.run();

		doJump(sadako.current);
		// doScript(sadako.page, sadako.start, sadako.part);
		return true;
	}

	var startGame = function(page) {
		if (page !== undefined) sadako.page = page;

		if (sadako.defaultData === undefined || isEmpty(sadako.defaultData)) {
			sadako.defaultData = copy(getCurrentState(), true);
		}
		else loadState(sadako.defaultData);

		if (!sadako.autosave_enabled) {
			if (localStorage.getItem(sadako.savename + "_savedata_auto") !== null) {
				localStorage.removeItem(sadako.savename + "_savedata_auto");
			}
		}

		sadako.current_line = [sadako.page, 0, 0];

		if (!sadako.autosave_enabled || !sadako.loadGame("auto", true)) {
			// sadako.history = [getCurrentState()];
			doLink("#" + sadako.page);
		}
	}

	var back = function() {
		var saveData;

		if (sadako.history_limit < 1) return;

		if (sadako.history.length < 2) return;
		sadako.history.pop();
		saveData = sadako.history[sadako.history.length - 1];

		loadState(saveData);
		
		if (sadako.start === undefined) sadako.start = 0;
		if (sadako.part === undefined) sadako.part = 0;
		
		if (sadako.start === 0 && sadako.part === 0) sadako.page_seen[sadako.page] += 1;
		else if (sadako.start.indexOf(".") !== -1) {
			var temp = sadako.start.split(".");
			var line = sadako.story[sadako.page][temp[0]][temp[1]];
			if ((line.k === sadako.token.choice || line.k === sadako.token.static) && "l" in line) {
				sadako.label_seen[line.l] += 1;
			}
		}

		sadako.run();
		doScript(sadako.page, sadako.start, sadako.part);
	}

	var restart = function() {
		if (localStorage.getItem(sadako.savename + "_savedata_auto") !== null) {
			localStorage.removeItem(sadako.savename + "_savedata_auto");
		}

		location.reload(true);
	}

	sadako.freezeData = function(id) {
		sadako.savestate_enabled = false;
		sadako.is_frozen = true;

		sadako.freeze_data = copy(getCurrentState(), true);
		sadako.freeze_data.history = copy(sadako.history, true);
		sadako.freeze_data.output_id = sadako.output_id;

		if (id) sadako.output_id = id;
	}

	sadako.unfreezeData = function() {
		if (!sadako.is_frozen) return;

		sadako.savestate_enabled = true;
		sadako.is_frozen = false;

		loadState(sadako.freeze_data, true);
		sadako.history = copy(sadako.freeze_data.history, true);
		sadako.output_id = sadako.freeze_data.output_id;
	}


	/* Dialog */

	sadako.setupDialog = function(output_id, title_id, display_ids) {
		sadako.dialog_ids.output = output_id;
		sadako.dialog_ids.title = title_id;
		sadako.dialog_ids.display = display_ids;
	}

	sadako.closeDialog = function(cleanup) {
		sadako.unfreezeData();

		sadako.in_dialog = false;

		if (cleanup) {
			sadako.lines = [];
			sadako.choices = [];
		}

		var a;
		for (a = 0; a < sadako.dialog_ids.display.length; ++a) {
			sadako.removeClass(sadako.dialog_ids.display[a], "open");
		}

		if (sadako.onDialogClose) {
			// return true from function to keep callback
			if (!sadako.onDialogClose()) sadako.onDialogClose = null;
		}
	}

	sadako.showDialog = function(title, text) {
		var temp;

		sadako.in_dialog = true;

		sadako.run();

		if (sadako.dialog_ids.display && !sadako.hasClass(sadako.dialog_ids.display[0], "open")) {
			sadako.freezeData(sadako.dialog_ids.output);
		}

		sadako.lines = [];
		sadako.choices = [];

		if (sadako.dialog_ids.title) sadako.dom(sadako.dialog_ids.title).innerHTML = title;

		if ((temp = sadako.isToken(text, sadako.token.page_embed))) doJump("#" + temp);
		else if ((temp = sadako.isToken(text, sadako.token.label_embed))) sadako.doLabel(temp);
		else sadako.dom(sadako.dialog_ids.output).innerHTML = text;

		var a;
		for (a = 0; a < sadako.dialog_ids.display.length; ++a) {
			sadako.addClass(sadako.dialog_ids.display[a], "open");
		}
	}


	/* Text Output */

	var write = function(output) {
		if (isArray(output)) sadako.lines.concat(output);
		else sadako.lines.push(output);
	}

	var processTags = function(text, func) {
		var temp, classes;
		var tags = text.split(sadako.token.tag);
		text = tags.shift();

		var a;
		for (a = 0; a < tags.length; ++a) { tags[a] = tags[a].trim().toLowerCase(); }

		classes = [];

		var b, c;
		for (b = 0; b < tags.length; ++b) {
			if ((temp = sadako.isToken(tags[b], "class:"))) add(classes, temp);
			else if ((temp = sadako.isToken(tags[b], "c:"))) add(classes, temp);
			else if ((temp = isToken(tags[b], "delay:"))) add(classes, tags[b]);
			else {
				temp = func(text.trim(), tags[b]);
				if (temp === undefined) temp = [""];
				text = temp.shift();
				if (temp.length) {
					for (c = 0; c < temp.length; ++c) {
						add(classes, temp[c]);
					}
				}
			}
		}
		if (sadako.has(tags, "choice")) classes.push("choice");

		return [text, classes];
	}

	sadako.writeLink = function(name, command, broken) {
		if (broken === undefined || broken === false) return "<a onClick='" + command + "'>" + name + "</a>";
		return "<a class='broken' title='" + command + "'>" + name + "</a>";
	}

	sadako.writeInput = function(script, name) {
		var temp;
		var multi = false;
		if ((temp = isToken(script, sadako.token.input_embed)) !== false) {
			script = temp;
			multi = true;
		}

		var id = "input_" + sadako.evals.length;
		if (multi) {
			if (name) name += " ";
			sadako.text += format('<label>{0}<textarea id="{1}"  class="multiline" onblur="eval(sadako.evals[{2}])"></textarea></label>', name, id, sadako.evals.length);
		}
		else {
			var label = (name) ? '<label for="' + id + '">' + name + '</label> ' : "";
			sadako.text += format('{0}<input type="text" id="{1}" onblur="eval(sadako.evals[{2}])">', label, id, sadako.evals.length);
		}

		var command = format('{0} = sadako.dom("#{1}").value.trim()', script, id);
		sadako.evals.push(command);
	}

	//eslint-disable-next-line no-unused-vars
	sadako.doLineTag = function(text, tag) {
		return [text];
	}

	//eslint-disable-next-line no-unused-vars
	sadako.doChoiceTag = function(text, tag) {
		return [text];
	}

	sadako.writeOutput = function() {
		var choices = [];

		var delay = 0;

		var delay_adjust = 0;

		var displayText = function(text, tags) {
			var classes = [];

			var a, temp;
			for (a = 0; a < tags.length; ++a) {
				if ((temp = isToken(tags[a], "delay:"))) {
					delay_adjust = parseInt(temp);
					continue;
				}
				classes.push(tags[a]);
			}

			classes.push("hide");

			if (text.length < 1) return;

			var el = document.createElement('div');

			el.className = classes.join(" ");
			el.innerHTML = text;

			dom(sadako.output_id).appendChild(el);

			// Fade in paragraph after a short delay
			setTimeout(function() {
				el.className = remove(el.className.split(" "), "hide").join(" ");
			}, delay + delay_adjust);

			delay += sadako.text_delay;
		}

		var writeOutput = function() {
			sadako.clear();
			var temp, a;

			for (a = 0; a < sadako.lines.length; ++a) {
				temp = processTags(sadako.lines[a], sadako.doLineTag);
				// if (temp[0].trim().length < 1) continue;

				// add link to list to display as a choice instead of in main text
				if (has(temp[1], "choice")) {
					choices.push({"text": temp[0], "tags": remove(temp[1], "choice")});
					continue;
				}

				displayText(temp[0], temp[1]);
			}

			if (choices.length || sadako.choices.length) {
				var text = "";
				var name;
				for (a = 0; a < choices.length; ++a) {
					if (choices[a].length < 1) continue;
					text += "<li class='choice'><span class='" + choices[a].tags.join(" ") + "'>" + choices[a].text + "</span></li>";
				}
				for (a = 0; a < sadako.choices.length; ++a) {
					temp = processTags(sadako.choices[a].text, sadako.doChoiceTag);

					name = sadako.parseLink(temp[0]);
					if (name.trim().length < 1) continue;
					text += sadako.format("<li class='choice'><span class='{0}'><a onclick='sadako.doChoice({1})'>{2}</a></span></li>", temp[1].join(" "), a, name);
				}
				if (text.length) text = "<hr><ul>" + text + "</ul>";

				displayText(text, []);
			}
		}

		writeOutput();
	}

	sadako.clear = function() {
		/*
		Clears display text.

		- Overwrite this function if a different method of displaying text is needed.
		*/

		scrollToTop();
		dom(sadako.output_id).innerHTML = "";
	}

	var refresh = function() {
		doScript(sadako.page, sadako.start, sadako.part);
	}


	/* Story Rendering */

	var run = function() {
		sadako.script_level = 1;
		sadako.script_status = RUN;
	}

	var end = function() {
		sadako.script_status = END;
	}

	var abort = function() {
		sadako.lines = [];
		sadako.choices = [];
		sadako.script_status = ABORT;
	}

	var doReturn = function() {
		doLink("#" + sadako.page);
	}

	var isPageTop = function() {
		if ((sadako.start === 0 || sadako.start === undefined) && (sadako.part === 0 || sadako.part === undefined)) return true;
		return false;
	}

	var doEval = function(text) {
		/*
		This function handles the runtime evaluating of script in a line marked with the
		'script_open' and 'script_close' tokens.

		- If it's marked with the 'script' token, it evaluates the string but doesn't return anything.
		- If it's marked with the 'value' token, it evalutes the string and adds the result to the output.
		- If neither, it renders the text as a link to a page.
		- If it contians the 'rename' token, the 'rename' value will be added to the output as a hyperlink and
		  the string will be evaluated when the link is clicked. This is not applicable to 'value' token.
		- Text is added to global 'text' variable as its rendered.

		parts (array): 0: script to be evaluated, 1: text following script

		returns (string): evaluated text
		*/

		var doRename = function(text) {
			var items = text.split(sadako.token.rename);

			if (items.length < 2) return [items[0], null];

			var script = items[0].trim();
			var name = items[1].trim();

			var temp = isToken(name, sadako.token.eval_value);
			if (temp) name = eval(temp);

			return [script, name];
		}

		var doCode = function(text) {
			/* evaluates text marked with 'script' token */

			var items = doRename(text, sadako.token.eval_code);
			var script = items[0];
			var name = items[1];

			if (name === null) eval(script);
			else {
				sadako.evals[sadako.evals.length] = script;
				sadako.text += sadako.writeLink(name, 'eval(sadako.evals["' + (sadako.evals.length-1) + '"])');
			}
		}

		var doValue = function(text) {
			/* evaluates text marked with 'value' token */

			eval("sadako.text += " + text);
		}

		var doLabelLink = function(text) {
			/* renders a link to a label with the value of the text */

			var items = doRename(text, sadako.token.eval_code);
			var script = items[0];
			var name = items[1] || script;

			var temp = isToken(script, sadako.token.eval_value);
			if (temp) script = eval(temp);

			if (script.indexOf(".") === -1 || !(script in sadako.labels)) script = sadako.page + "." + script;
			var command = 'sadako.doLink("' + script + '")';

			return sadako.writeLink(name, command, (script in sadako.labels) ? false : true);
		}

		var doPageLink = function(text) {
			/* renders a link to a page with the value of the text */

			var items = doRename(text);
			var script = items[0];
			var name = items[1] || script;

			var temp = isToken(script, sadako.token.page_embed);
			if (temp !== false) script = temp;

			temp = isToken(script, sadako.token.eval_value);
			if (temp) script = eval(temp);

			var command = 'sadako.doLink("#' + script + '")';

			return sadako.writeLink(name, command, (script in sadako.story) ? false : true);
		}

		var doInput = function(text) {
			var items = doRename(text);
			var script = items[0];
			var name = items[1] || "";

			sadako.writeInput(script, name);
		}

		sadako.text = "";

		var temp = text.split(sadako.token.script_open);
		if (temp.length < 2) return text;

		var script, a;
		for (a = 0; a < temp.length; ++a) {
			var parts = temp[a].split(sadako.token.script_close);
			if (parts.length < 2) sadako.text += parts[0];
			else {
				if ((script = isToken(parts[0], sadako.token.eval_code)) !== false) doCode(script);
				else if ((script = isToken(parts[0], sadako.token.eval_value)) !== false) doValue(script);
				else if ((script = isToken(parts[0], sadako.token.label_embed)) !== false) sadako.text += doLabelLink(script);
				else if ((script = isToken(parts[0], sadako.token.input_embed)) !== false) doInput(script);
				else sadako.text += doPageLink(parts[0]);
				sadako.text += parts[1];
			}
		}

		return sadako.text;
	}

	var processScript = function(line) {
		var a, sections, script, cond;

		var doReplace = function(text) {
			var replaceVar = function(text, token, replacement) {
				var regexp = new RegExp("(^|\\s+|[^a-zA-Z0-9]+)" + token + "([a-zA-Z0-9]+(?:[\\._]?[a-zA-Z0-9]+)*)", "g");
				return text.replace(regexp, replacement);
			}

			text = text.replace(RegExp(sadako.token.break, 'g'), '<br>');

			var t = sadako.token;

			text = replaceVar(text, t.label_embed + t.cond_embed, function (match, p1, p2) { return p1 + 'sadako.label_seen["' + p2 + '"]'; });
			text = replaceVar(text, t.page_embed + t.cond_embed, function (match, p1, p2) { return p1 + 'sadako.page_seen["' + p2 + '"]'; });
			text = replaceVar(text, t.var_embed + t.cond_embed, function (match, p1, p2) { return p1 + 'sadako.var.' + p2; });
			text = replaceVar(text, t.tmp_embed + t.cond_embed, function (match, p1, p2) { return p1 + 'sadako.tmp.' + p2; });

			text = replaceVar(text, t.label_embed + t.value_embed, format('$1{0}{1} sadako.label_seen["$2"]{2}', t.script_open, t.eval_value, t.script_close));
			text = replaceVar(text, t.page_embed + t.value_embed, format('$1{0}{1} sadako.page_seen["$2"]{2}', t.script_open, t.eval_value, t.script_close));
			text = replaceVar(text, t.var_embed + t.value_embed, format('$1{0}{1} sadako.var.$2{2}', t.script_open, t.eval_value, t.script_close));

			text = replaceVar(text, t.tmp_embed + t.value_embed, format('$1{0}{1} sadako.tmp.$2{2}', t.script_open, t.eval_value, t.script_close));

			text = replaceVar(text, t.write_embed, "$1sadako.text = $2");
			text = replaceVar(text, t.write_embed + t.cond_embed, "$1sadako.text = sadako.var.$2");
			text = text.replace(RegExp(t.write2_embed, 'g'), "sadako.text = '");
			text = text.replace(RegExp(t.write3_embed, 'g'), 'sadako.text = "');
			text = replaceVar(text, t.pluswrite_embed, "$1sadako.text += $2");
			text = replaceVar(text, t.pluswrite_embed + t.cond_embed, "$1sadako.text += sadako.var.$2");
			text = text.replace(RegExp(t.pluswrite2_embed, 'g'), "sadako.text += '");
			text = text.replace(RegExp(t.pluswrite3_embed, 'g'), 'sadako.text += "');


			return text;
		}

		var doInline = function(text) {
			var parseInline = function(text) {
				var sections = text.split(sadako.token.cond, 3);

				if (sections.length < 2) return text;
				if (sections.length < 3) sections.push("");

				if (eval(sections[0])) return sections[1];
				return sections[2];
			}

			var temp = text.split(sadako.token.inline_open);
			if (temp.length < 2) return text;

			text = "";
			var a, temp2;
			for (a = 0; a < temp.length; ++a) {
				temp2 = temp[a].split(sadako.token.inline_close);
				if (temp2.length < 2) text += temp2[0];
				else text += parseInline(temp2[0]) + temp2[1];
			}
			return text;
		}

		var doSpan = function(text) {
			var parseSpan = function(text) {
				var sections = text.split(sadako.token.cond);

				if (sections.length < 2) return text;
				text = text.substring(sections[0].length + sadako.token.cond.length);

				return format('<span class="{0}">{1}</span>', sections[0], text);
			}

			var temp = text.split(sadako.token.span_open);
			if (temp.length < 2) return text;

			text = "";
			var a, temp2;
			for (a = 0; a < temp.length; ++a) {
				temp2 = temp[a].split(sadako.token.span_close);
				if (temp2.length < 2) text += temp2[0];
				else text += parseSpan(temp2[0]) + temp2[1];
			}
			return text;
		}

		var doMacro = function(text) {
			var parseMacro = function(text) {
				var type = sadako.token.eval_code;
				var temp;
				if ((temp = isToken(text, sadako.token.eval_value)) !== false) {
					text = temp;
					type = sadako.token.eval_value;
				}
				var pre = sadako.token.script_open + type + " ";
				var index = text.indexOf(" ");
				if (index === -1) return pre + "sadako.macros." + text + "()" + sadako.token.script_close;

				var command = text.substring(index + 1);
				text = text.substring(0, index);
				return pre + "sadako.macros." + text + "(" + command + ")" + sadako.token.script_close;
			}

			var temp = text.split(sadako.token.macro_open);
			if (temp.length < 2) return text;

			text = "";
			var a, temp2;
			for (a = 0; a < temp.length; ++a) {
				temp2 = temp[a].split(sadako.token.macro_close);
				if (temp2.length < 2) text += temp2[0];
				else text += parseMacro(temp2[0]) + temp2[1];
			}
			return text;
		}

		var processScript = function(line) {
			line = doReplace(line);
			line = doInline(line);
			line = doSpan(line);
			line = doMacro(line);

			var index = line.lastIndexOf(sadako.token.cond);
			if (index === -1) sections = [line];
			else sections = [line.substring(0, index), line.substring(index + sadako.token.cond.length)];

			script = sections[0];
			cond = (sections.length > 1) ? cond = sections[1] : null;

			try {
				if (eval(cond) || cond == null) {
					var result = doInline(script);
					result = doEval(result);
					if (result !== null && result.replace(/<br>/gi, '').trim().length) return result.trim();
				}
			}
			catch (e) {
				console.error("index: ", a, "\nscript:", script, "\ncondition:", cond);
				throw new Error(e);
			}

			return "";
		}

		return processScript(line);
	}

	var doChoice = function(choice) {
		/*
		Function called by choice hyperlinks.

		choice (integer): index of choice in 'sadako.choices' array
		*/
		sadako.run();

		sadako.chosen = choice;
		var line = sadako.choices[choice].line;

		var chosen = sadako.choices[choice];
		var text = chosen.text;
		var label = chosen.label;

		sadako.lines = [];
		sadako.choices = [];
		sadako.tmp = {};
		sadako.chosen = null;

		sadako.current_line = [line[0], line[1] + "." + line[2], 0];
		sadako.current = null;

		if (text) doAttach(parseLink(text, true));

		sadako.enter_text = copy(sadako.lines, true);

		if (label) {
			sadako.current = label;
			doSaveState();
			doSaveData();
			sadako.label_seen[label] += 1;
		}
		else doSaveState();

		doScript(line[0], line[1] + "." + line[2], 0);
	}

	var getLineByLabel = function(label) {
		if (label.charAt(0) === "#") {
			return [label.substring(1), 0, 0];
		}
		else {
			if (label.indexOf(".") === -1 || !(label in sadako.labels)) label = sadako.page + "." + label;
			if (!(label in sadako.labels)) throw new Error("Can't find label '" + label + "'");

			var line = sadako.labels[label];
			var token = sadako.story[line[0]][line[1]][line[2]].k;

			if (token === sadako.token.choice || token === sadako.token.static) return [line[0], line[1] + "." + line[2], 0];

			return line;
			// console.log("jump:", sadako.current_line)
		}
	}

	var doLink = function(label) {
		sadako.run();

		sadako.lines = [];
		sadako.choices = [];
		sadako.tmp = {};
		sadako.chosen = null;

		sadako.current = label;

		sadako.current_line = getLineByLabel(label);

		doSaveState();
		doSaveData();

		doJump(label);
	}

	var doJump = function(label, include) {
		var line = getLineByLabel(label);

		if (label.charAt(0) === "#") sadako.page_seen[label.substring(1)] += 1;
		else {
			var c_line = sadako.labels[label];
			var token = sadako.story[c_line[0]][c_line[1]][c_line[2]].k;
			if (token === sadako.token.choice || token === sadako.token.static) {
				sadako.label_seen[label] += 1;
			}
		}

		if (include) {
			doLines(line[0], line[1], line[2]);
			return;
		}

		sadako.current = label;
		sadako.jumps = [];
		sadako.conditions = {};
		doScript(line[0], line[1], line[2]);
	}

	var isToken = function(text, token) {
		text = text.trimStart();
		if (text.substring(0, token.length) === token) return text.substring(token.length).trimStart();
		return false;
	}

	var parseLink = function(text, end) {
		var open = text.indexOf(sadako.token.choice_format_open);
		var close = text.indexOf(sadako.token.choice_format_close);

		if (open === -1) return text;

		var before = text.substring(0, open);
		var middle = text.substring(open + sadako.token.choice_format_open.length, close);
		var after = text.substring(close + sadako.token.choice_format_close.length);

		if (end) return before + after;
		return before + middle;
	}

	var doAttach = function(text) {
		var line = sadako.lines[sadako.lines.length - 1];

		if (line === undefined) {
			write(text);
			return;
		}

		var end = line.length - sadako.token.attach.length;
		var start = sadako.token.attach.length;

		if (line.substring(end) === sadako.token.attach) {
			if (text.substring(0, start) === sadako.token.attach) text = text.substring(start);
			line = line.substring(0, end) + text;
			sadako.lines[sadako.lines.length - 1] = line;
		}
		else if (text.substring(0, start) === sadako.token.attach) {
			line += text.substring(start);
			sadako.lines[sadako.lines.length - 1] = line;
		}
		else write(text);
	}

	var doLines = function(page, start, part) {
		/*
		Parses, evaluates, and renders a line of the script.

		page (string): page to render
		start (string): section of page to start
		*/

		var setJump = function(line) {
			sadako.jumps.push(line);
			sadako.cond_states.push(sadako.copy(sadako.conditions, true));
			sadako.conditions = [];

			return line;
		}

		var getJump = function() {
			sadako.conditions = sadako.copy(sadako.cond_states.pop(), true);
			return sadako.jumps.pop();
		}

		var parseJump = function(text, page, start, part) {
			var temp;

			if ((temp = isToken(text, sadako.token.jump)) !== false) {
				var temp2;
				var include_text = false;

				if ((temp2 = isToken(temp, sadako.token.eval_value)) !== false) {
					temp = temp2;
					include_text = true;
				}

				var label = temp;

				if ((temp = isToken(label, sadako.token.page_embed)) !== false) {
					if (!(temp in sadako.story)) throw new Error("Can't find page '" + temp + "'");
					// return [JUMP, temp, 0, 0];
					temp = "#" + temp;
					if (include_text) {
						doJump(temp, true);
						return [CONTINUE];
					}

					doJump(temp);
					return [END];
				}

				if (label.indexOf(".") === -1 || !(label in sadako.labels)) label = page + "." + label;
				if (!(label in sadako.labels)) throw new Error("Can't find label '" + label + "'");

				var jump = sadako.labels[label];
				var token = sadako.story[jump[0]][jump[1]][jump[2]].k;

				if (include_text) {
					doJump(label, true);
					return [CONTINUE];
				}

				if (token === sadako.token.choice || token === sadako.token.static) {
					jump = [jump[0], jump[1] + "." + jump[2], 0];
					sadako.label_seen[label] += 1;
				}

				// sadako.jumps.push([page, start, part + 1]);
				setJump([page, start, part + 1]);

				return [JUMP].concat(jump);
			}

			if ((temp = isToken(text, sadako.token.return)) !== false) {
				if (temp === "END") return [END];
				if (temp === "ABORT") return [ABORT];
				if (temp === "RETURN" || (temp === "BACK" && sadako.history_limit < 1)) {
					// sadako.page_seen[page] += 1;
					// sadako.jumps = [];
					sadako.current = "#" + page;
					doJump(sadako.current);
					return [END];
					// return [JUMP, page, 0, 0];
				}
				if (temp === "BACK") {
					back();
					return [CONTINUE];
				}
				if (sadako.jumps.length < 1) return [END];

				return [JUMP].concat(getJump());
			}

			return false;
		}

		var parseConditions = function(text, page, start, part) {
			var temp;
			var active = [page, start].join(".");
			var label = [page, start, part].join(".");

			if (!(active in sadako.conditions)) sadako.conditions[active] = false;
			if (!(label in sadako.conditions)) sadako.conditions[label] = false;

			if ((temp = isToken(text, "if "))) {
				sadako.conditions[active] = true;
				if (eval(temp)) {
					sadako.conditions[label] = true;
					return [JUMP, page, start + "." + part, 0];
				}
				sadako.conditions[label] = false;
				return [CONTINUE];
			}
			else if (!sadako.conditions[label] && (temp = isToken(text, "else if "))) {
				if (sadako.conditions[active] === false) {
					console.error(format("'else if' found without 'if' statement.\nstory: [{0}] [{1}] [{2}]\nscript: {3}", page, start, part, sadako.story[page][start][part].text));
					return [CONTINUE];
				}
				sadako.conditions[active] = true;
				if (!eval(temp)) return [CONTINUE];
				sadako.conditions[label] = true;
				return [JUMP, page, start + "." + part, 0];
			}
			else if (!sadako.conditions[label] && isToken(text, "else") !== false && isToken(text, "else if") === false) {
				if (sadako.conditions[active] === false) {
					console.error(format("'else' found without 'if' statement.\nstory: [{0}] [{1}] [{2}]", page, start, part));
					return [CONTINUE];
				}
				sadako.conditions[active] = false;
				return [JUMP, page, start + "." + part, 0];
			}
			return [CONTINUE];
		}

		var processLines = function(page, start, part) {
			var a, text, temp, token;

			if (!(start in sadako.story[page])) return [CONTINUE, page, start, null];

			sadako.page = page;

			var this_page = sadako.story[page][start];
			var choice_seen = false;

			if (part === undefined) part = 0;

			var is_choice, is_not_choice;

			for (a = part; a < this_page.length; ++a) {
				token = ("k" in this_page[a]) ? this_page[a].k : null;
				is_choice = (token === sadako.token.choice || token === sadako.token.static);
				is_not_choice = (token !== sadako.token.choice && token !== sadako.token.static);

				// if (token === sadako.token.choice || token === sadako.token.static || token === sadako.token.depth || token === sadako.token.label) {
				if (token !== sadako.token.cond_block && token !== null) {
					sadako.conditions[page + "." + start] = false;
				}

				if (token === sadako.token.choice && this_page[a].l in sadako.label_seen && sadako.label_seen[this_page[a].l]) continue;

				text = processScript(this_page[a].t);

				if (sadako.script_status !== RUN) return [sadako.script_status];

				if (is_choice) {
					if (!text.length && this_page[a].t.trim().length > 1) continue;
					choice_seen = true;
				}
				// else if (choice_seen === true && (token === sadako.token.depth || token === sadako.token.label || token == sadako.token.cond_block || token === null)) {
				else if (choice_seen === true && is_not_choice) {
					if (sadako.choices[0].text.trim().length < 1) {
						var choice = sadako.choices[0].line;
						if (sadako.choices[0].label) sadako.label_seen[sadako.choices[0].label] += 1;
						sadako.choices = [];
						return [JUMP, choice[0], choice[1] + "." + choice[2], 0];
					}
					return [END];
				}

				if (is_not_choice && "l" in this_page[a]) sadako.label_seen[this_page[a].l] += 1;

				if (token === sadako.token.label) continue;

				if ((temp = parseJump(text, page, start, a))) {
					if (temp[0] === CONTINUE) continue;
					return temp;
				}

				if (token === sadako.token.cond_block) {
					temp = parseConditions(text, page, start, a);
					if (temp[0] === CONTINUE) continue;
					return temp;
				}

				if (is_choice) {
					sadako.choices.push({line: [page, start, a], text: text, label: this_page[a].l});
					continue;
				}

				if (text.trim().length < 1) continue;

				// text = "(" + start + "." + a + ") " + text;

				doAttach(text);
			}

			return [(choice_seen) ? END : CONTINUE, page, start, a];
		}

		var doLines = function(page, start, part) {
			if (sadako.script_status === ABORT) return ABORT;
			if (sadako.script_status === END) return END;

			var a, index, result;
			for (a = 0; a < 200; ++a) {
				result = processLines(page, start, part);

				if (result[0] === END || sadako.script_status === END) {
					sadako.script_status = END;
					break;
				}

				if (result[0] === ABORT || sadako.script_status === ABORT) {
					sadako.script_status = ABORT;
					break;
				}

				if (result[0] === JUMP) {
					page = result[1];
					start = result[2];
					part = result[3];
					continue;
				}

				index = result[1] + "." + result[2] + ((result[3] === null) ? "" : "." + result[3]);
				while (index.indexOf(".") !== -1) {
					if (index in sadako.depths) {
						result = sadako.depths[index];
						page = result[0];
						start = result[1];
						part = result[2];
						break;
					}
					index = index.substring(0, index.lastIndexOf("."));
				}
				if (index.indexOf(".") === -1) break;
			}

			if (a === 200) console.error("Too many loops reached.");

			return sadako.script_status;
		}

		return doLines(page, start, part);
	}

	var doScript = function(page, start, part) {
		if (sadako.script_status === ABORT || sadako.script_status === END) return;

		sadako.page = page;
		sadako.start = start;
		sadako.part = part;

		// console.log(page, start, part)

		// sadako.tmp = {};
		sadako.evals = [];

		if (start === undefined) start = 0;

		sadako.script_level += 1;

		if ("ALL" in sadako.before) { sadako.before.ALL(); }
		if (page in sadako.before) sadako.before[page]();

		if (doLines(page, start, part) === ABORT) return;

		if (sadako.lines.length) {
			var last = sadako.lines.length - 1;
			var last_chars = sadako.lines[last].length - sadako.token.attach.length;
			if (sadako.lines[last].substring(last_chars) === sadako.token.attach) {
				sadako.lines[last] = sadako.lines[last].substring(0, last_chars);
			}
		}

		sadako.script_level -= 1;

		if (sadako.script_level === 1) {
			if (sadako.page in sadako.after) sadako.after[sadako.page]();
			if (sadako.script_status === ABORT) return;

			if ("ALL" in sadako.after) sadako.after.ALL();
			if (sadako.script_status === ABORT) return;

			sadako.writeOutput();
		}
	}

	/* Initialization */

	var checkVersion = function() {
		var src_ver = sadako.story.story_data.version.split(".");
		var sad_ver = sadako.kayako_version.split(".");

		if (src_ver.length !== sad_ver.length) throw new Error("Invalid version number");

		var a;
		for (a = 0; a < sad_ver.length; ++a) {
			if (sad_ver[a] > src_ver[a]) {
				console.error("Sadako Version: " + sadako.version);
				console.error("Kayako Version: " + sadako.kayako_version);
				console.error("Source Version: " + sadako.story.story_data.version);
				throw new Error("Compiled Sadako source is from an older version of Kayako. Please recompile.");
			}
		}
	}

	sadako.init = function(story, id) {
		if (id) sadako.output_id = id;
		else sadako.output_id = sadako.output_id || "#output";

		// Edge browser calls trimStart "trimLeft" and IE doesn't have either
		if (String.prototype.trimStart === undefined) {
			String.prototype.trimStart = String.prototype.trimLeft || function() { return this.replace(/^\s*/, ''); };
		}

		// Adds isArray() functionality if not already present
		// Credit: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/isArray
		if (Array.isArray === undefined) {
			Array.isArray = function(arg) {
				return Object.prototype.toString.call(arg) === '[object Array]';
			};
		}

		checkLocalStorage();

		if (sadako.story !== undefined) {
			sadako.tags = sadako.story.story_data.tags;
			sadako.labels = sadako.story.story_data.labels;
			sadako.depths = sadako.story.story_data.depths;

			var a;
			for (a in sadako.story) {
				sadako.page_seen[a] = 0;
			}
			for (a in sadako.labels) {
				sadako.label_seen[a] = 0;
			}

			checkVersion();
		}
		else {
			if (isStr(story) && story.charAt(0) === "#") story = dom(story).value;
			else if (dom("#source")) story = dom("#source").value;

			if (story !== undefined) sadako.story = sadako.parseStory(story);
		}

		if (sadako.story === undefined) console.error("Sadako script not found");
	}

	// functions intended to be used as-is
	// sadako.doPage = doPage;
	sadako.doJump = doJump;
	sadako.doLink = doLink;
	sadako.doReturn = doReturn;
	sadako.back = back;
	sadako.startGame = startGame;
	sadako.restart = restart;
	sadako.refresh = refresh;
	sadako.isToken = isToken;
	sadako.isPageTop = isPageTop;
	sadako.run = run;
	sadako.end = end;
	sadako.abort = abort;
	sadako.write = write;

	// functions intended to be overridden
	// sadako.write = write;
	// sadako.writeLink = writeLink;
	// sadako.writeOutput = writeOutput;
	// sadako.doLineTag = doLineTag;
	// sadako.doChoiceTag = doChoiceTag;
	// sadako.saveGame = saveGame;
	// sadako.loadGame = loadGame;
	// sadako.freezeData = freezeData;
	// sadako.unfreezeData = unfreezeData;
	// sadako.clear = clear;

	// functions made available for use in overridden functions
	sadako.processTags = processTags;
	sadako.doChoice = doChoice;
	sadako.processScript = processScript;
	// sadako.parseStory = parseStory;
	sadako.parseLink = parseLink;

	// convenient utility functions
	sadako.rollDice = rollDice;
	sadako.find = find;
	sadako.isEmpty = isEmpty;
	sadako.isValidNum = isValidNum;
	sadako.getNum = getNum;
	sadako.getOrDo = getOrDo;
	sadako.list = list;
	sadako.format = format;
	sadako.has = has;
	sadako.add = add;
	sadako.copy = copy;
	sadako.remove = remove;
	sadako.hasClass = hasClass;
	sadako.addClass = addClass;
	sadako.removeClass = removeClass;
	sadako.percentCheck = percentCheck;
	sadako.random = random;
	sadako.randomItem = randomItem;
	sadako.arrayToString = arrayToString;
	sadako.cap = cap;
	sadako.dom = dom;
	sadako.scrollToTop = scrollToTop;

}(window.sadako = window.sadako || {}));
