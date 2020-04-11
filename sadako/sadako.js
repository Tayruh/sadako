(function(sadako) {

	sadako.version = "0.10.1";
	sadako.kayako_version = "0.9.6";

	var localStorage;

	var JUMP = "JUMP";
	var END = "END";
	var ABORT = "ABORT";
	var CONTINUE = "CONTINUE";
	var RUN = "RUN";

	sadako.token = {
		"line": ";;",
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
		"eval_input": ">",
		"eval_reveal": "+",
		"eval_dialog": "*",

		// embedding
		"script_embed": "\\^",
		"var_embed": "\\$",
		"tmp_embed": "_",
		"scene_embed": "\\*",
		"value_embed": ":",
		"cond_embed": "\\.",
		"write_embed": "~~=",
		"pluswrite_embed": "~~\\+",
	};

	// global variables intended to changed
	sadako.savename = "sadako";
	sadako.text_delay = 110.0;
	sadako.output_id = "#output";
	sadako.autosave_enabled = false;

	// global variables not saved to storage
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
	sadako.scripts = {};
	sadako.is_frozen = false;
	sadako.save_data = {};
	sadako.current_line = [];
	sadako.script_level = 1;
	sadako.in_dialog = false;
	sadako.in_include = false;
	sadako.scene_checks = {};
	sadako.reveal_id = 0;

	// global variables saved to state
	sadako.current = null;
	sadako.page = "start";
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
	sadako.scenes = {};

	/* Utility Functions */

	var dom = function(id) {
		/*
			Gets an HTML element or array of elements.

			id (string): ID if string begins with # or class if not.

			Returns (element or array): Single element with ID or array of
			elements with class.
		*/

		var temp;
		
		if ((temp = isToken(id, "\\.")) !== false) return document.getElementsByClassName(temp);
		if ((temp = isToken(id, "#")) !== false) return document.getElementById(temp);
		return document.getElementById(id);
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
		if (isArray(list)) {
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
		// Returns number value if argument is a number, or undefined if not.

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

		return (list.indexOf(id) !== -1);

		/*
		var a;
		for (a = 0; a < list.length; ++a) {
			if (list[a] === id) return true;
		}
		return false;
		*/
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

		if (!quote) { quote = '"'; }
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
		/*
			Capitalizes the first letter of a string.

			str (string): String to be capitalized.

			Returns (string): Returns modified string.
		*/

		return str.replace(/(\b\w)/i, function(m) { return m.toUpperCase(); });
	};

	sadako.scrollToTop = function(id) {
		// Scrolls HTML page to the top.
		
		if (sadako.in_include) return;
		
		if (id) dom(id).scrollTop = 0;
		else if (sadako.in_dialog) dom(sadako.dialog_ids.output).scrollTop = 0;
		else {
			document.body.scrollTop = 0; // For Safari
			document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
		}
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
			console.log("window.localStorage not available. Attempting emulation via cookies.");
		}
		catch(exception){
			console.log("window.localStorage not available. Attempting emulation via cookies.");
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
	};

	var getCurrentState = function() {
		// Returns an object which contains the current state.

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
			scenes: copy(sadako.scenes, true),
			var: copy(sadako.var, true),
			tmp: copy(sadako.tmp, true)
		}

		// console.log(sadako.current_line)

		return state;
	};

	var loadState = function(data, keep_values) {
		/*
			Copies values from 'data' to state object and global variables.

			- Called when manually going back in history or unfreezing state.

			data (object): data containing values to copy

			keep_values (boolean): If true then page and labels counts,
				scene values, and the variable object are not altered. This is
				useful when unfreezing data and maintaining current progress.
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
		sadako.tmp = copy(data.tmp, true);

		sadako.state = copy(data, true);

		if (!keep_values) {
			sadako.page_seen = copy(data.page_seen, true);
			sadako.label_seen = copy(data.label_seen, true);
			sadako.scenes = copy(data.scenes, true);
			sadako.var = copy(data.var, true);
		}
	};

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
	};

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
			scenes: copy(sadako.scenes, true),
			var: copy(sadako.var, true)
		}
	};

	var updateData = function(pages, labels, scenes, data) {
		/*
			Updates the data to be current, in case there is an older save
			loaded that doesn't contain newer variables.

			pages (object): page seen object
			labels (object): label seen object
			scenes (object): scenes variable object
			data (object): save variable object
		*/

		var a;

		for (a in sadako.story) {
			sadako.page_seen[a] = (pages && a in pages) ? pages[a] : 0;
		}

		for (a in sadako.labels) {
			sadako.label_seen[a] = (labels && a in labels) ? labels[a] : 0;
		}

		for (a in sadako.scenes) {
			sadako.scenes[a] = (scenes && a in scenes) ? scenes[a] : {
				"isActive": false,
				"hasEnded": false,
				"ending": null,
				"isRecurring": false
			};
		}

		sadako.var = copy(sadako.defaultData.var, true);
		if (data) {
			for (a in data) {
				sadako.var[a] = data[a];
			}
		}
	};

	var loadData = function(data) {
		/*
			Copies values from data object to the current state.

			data (object): Data to be loaded.
		*/

		sadako.current = data.current;
		sadako.lines = copy(data.lines, true);

		updateData(data.page_seen, data.label_seen, data.scenes, data.var);

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
		sadako.cond_states = [];
		sadako.history = [];
		doSaveState();
		doSaveData();
	};

	var doSaveData = function() {
		/*
			Stores current data into the save object to be available for
			saving. If autosaving is enabled, it creates an autosave file.
		*/

		if (!sadako.savestate_enabled) {
			// sadako.enter_text = null;
			return;
		}

		saveData();
		if (sadako.autosave_enabled) sadako.saveGame("auto", true);
	};

	sadako.saveGame = function(saveSlot, no_confirm) {
		/*
			Saves the game to local storage.

			saveSlot (integer): Value to differentiate between different
				saves storedlocally

			no_confirm (boolean):
				true: prevents notifications on success or fail
				false: allows notifications
		*/

		if (saveSlot === undefined) {
			var el = dom("#save-slot");
			saveSlot = el.options[el.selectedIndex].value;
		}

		if (!no_confirm && localStorage.getItem(sadako.savename + "_savedata_" + saveSlot) !== null) {
			if (!confirm("Overwrite save file?")) return;
		}

		var saveData = JSON.stringify(sadako.save_data);

		localStorage.setItem(sadako.savename + "_savedata_" + saveSlot, saveData);
		if (!no_confirm && !localStorage.getItem(sadako.savename + "_savedata_" + saveSlot)) {
			alert("Save failed!");
			return;
		}

		if (!no_confirm) alert("Save successful!");
	};

	sadako.loadGame = function(saveSlot, no_confirm) {
		/*
			Loads the data from local storage.

			loadSlot (integer): Value to differentiate between different saves
				stored locally

			no_confirm (boolean):
				true: prevents notifications on success or fail
				false: allows notifications

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

		return true;
	};

	var startGame = function(page) {
		/*
			Begins the game.

			- If "page" is provided, it will start there instead of "start".
			- If autosave is enabled, it will load the autosave.

			page (string): Page to begin game on.
		*/

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
			doLink("#" + sadako.page);
		}
	};

	var back = function() {
		/*
			Goes back one state in the history.

			- This function is also called when "<< BACK" is used.
		*/

		var saveData;

		if (sadako.history_limit < 1) return;

		if (sadako.history.length < 2) return;
		sadako.history.pop();
		saveData = sadako.history[sadako.history.length - 1];

		loadState(saveData);

		if (sadako.start === undefined) sadako.start = 0;
		if (sadako.part === undefined) sadako.part = 0;

		// increment page seen count
		if (sadako.start === 0 && sadako.part === 0) sadako.page_seen[sadako.page] += 1;
		else if (sadako.start.indexOf(".") !== -1) {
			var temp = sadako.start.split(".");
			var line = sadako.story[sadako.page][temp[0]][temp[1]];
			if ((line.k === sadako.token.choice || line.k === sadako.token.static) && "l" in line) {
				// increment choice label seen count
				sadako.label_seen[line.l] += 1;
			}
		}

		sadako.run();
		doScript(sadako.page, sadako.start, sadako.part);
	};

	var restart = function() {
		// Deletes autosave and refreshes the page.

		if (localStorage.getItem(sadako.savename + "_savedata_auto") !== null) {
			localStorage.removeItem(sadako.savename + "_savedata_auto");
		}

		location.reload(true);
	};

	sadako.freezeData = function(id) {
		/*
			"Freezes" the current state.

			- This stores the current state in an object so that you can
				jump to another part of a script without affecting the current
				story progress. Useful for displaying a dialog, for example.

			id (string): if provided, changes the HTML element id for text output
		*/

		sadako.savestate_enabled = false;
		sadako.is_frozen = true;

		sadako.freeze_data = copy(getCurrentState(), true);
		sadako.freeze_data.history = copy(sadako.history, true);
		sadako.freeze_data.output_id = id || sadako.output_id;

		if (id) sadako.output_id = id;
	};

	sadako.unfreezeData = function() {
		/*
			Returns the script back to its previous state.
			Does not revert page and label seen counts, scene values,
			or the variable object in order to maintain progress.
		*/

		if (!sadako.is_frozen) return;

		sadako.savestate_enabled = true;
		sadako.is_frozen = false;

		loadState(sadako.freeze_data, true);
		sadako.history = copy(sadako.freeze_data.history, true);
		sadako.output_id = sadako.freeze_data.output_id;
	};


	/* Dialog */

	sadako.setupDialog = function(output_id, title_id, display_ids) {
		/*
			Assigns ids to the elements associated with the dialog.

			- ids should begin with a '#' symbol.

			output_id (string): The element in which the output text will be written.
			title_id (string): The element containing the title of the dialog window.
			display_ids (array): An array containing one or more elements
				to show/hide in order to show/hide the dialog window (ie. the DIV containing
				both the title and output area DIVs).
		*/

		sadako.dialog_ids.output = output_id;
		sadako.dialog_ids.title = title_id;
		sadako.dialog_ids.display = display_ids;
	};

	sadako.closeDialog = function(cleanup) {
		/*
			Closes the dialog window.

			cleanup (boolean): if true, clears lines and choices arrays.
		*/

		sadako.unfreezeData();

		sadako.in_dialog = false;

		if (cleanup || sadako.script_status === RUN) {
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
	};

	sadako.showDialog = function(title, text) {
		/*
			Displays the dialog window.

			title (string): Text to display in title bar
			text (string): Text to display in dialog body
		*/

		sadako.run();

		// if (sadako.dialog_ids.display && !sadako.hasClass(sadako.dialog_ids.display[0], "open")) {
		if (!sadako.in_dialog) {
			sadako.freezeData();
		}
		
		sadako.in_dialog = true;

		sadako.lines = [];
		sadako.choices = [];

		if (sadako.dialog_ids.title) sadako.dom(sadako.dialog_ids.title).innerHTML = title || "";

		var temp;
		if (text === undefined) sadako.dom(sadako.dialog_ids.output).innerHTML = "";
		else {
			if ((temp = sadako.isToken(text, sadako.token.page_embed))) doJump("#" + temp);
			else if ((temp = sadako.isToken(text, sadako.token.label_embed))) sadako.doLink(temp);
			else sadako.dom(sadako.dialog_ids.output).innerHTML = text;
		}

		var a;
		for (a = 0; a < sadako.dialog_ids.display.length; ++a) {
			sadako.addClass(sadako.dialog_ids.display[a], "open");
		}
	};


	/* Text Output */

	var write = function(output) {
		/*
			Adds text to the lines array to be queued for output.

			output (string or array): String or array of strings to added
				to output.
		*/

		if (isArray(output)) {
			var a;
			for (a = 0; a < output.length; ++a) {
				sadako.lines.push(sadako.processScript(output[a]));
			}
		}
		else sadako.lines.push(sadako.processScript(output));
	};

	var overwrite = function(text, choices, id) {
		/*
			Writes the text to the output.

			text (string or array): text or array of text to display

			choices (array): array of choice arrays to pass to the addChoice() function.
				See the addChoice() function for more details.
		*/

		sadako.choices = [];
		if (choices) {
			var a;
			for (a = 0; a < choices.length; ++a) {
				sadako.addChoice(choices[a][0], choices[a][1], (choices[a].length > 2) ? choices[a][2] : undefined);
			}
		}

		sadako.lines = [];
		sadako.write(text);
		sadako.writeOutput(id);
		sadako.scrollToTop(id);
	};

	var addChoice = function(name, command, tags) {
		/*
			Adds a choice to the global choice array.

			name (string): Choice text. Be aware that formatting using [] will not work.
			command (string): String to evaluate when choice is selected
			tags (string): A string of classes in script format.
				example: "~:class:completed ~:title:blargh"
		*/

		sadako.choices.push({
			"text": sadako.writeLink(sadako.processScript(name), sadako.processScript(command)) + (tags || "")
		});
	};

	var processTags = function(text, func) {
		/*
			Strips the tags from the end of a line and processes them.

			text (string): input text
			func (function): This function is used to process each tag
		*/

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
	};

	sadako.writeLink = function(name, command, broken) {
		/*
			Returns an html link that executes the command on click.

			name (string): Link name
			command (string): Command to be evaluated on click
			broken (boolean): If true, displays the link using the 'broken' class
		*/

		var temp;
		if (isFunc(command)) {
			command = format("eval(sadako.evals[{0}])", sadako.evals.length);
			sadako.evals.push(command);
		}
		else if ((temp = isToken(command, sadako.token.page_embed))) {
			command = 'sadako.doLink("#' + temp + '")';
			if (!(temp in sadako.story)) broken = true;
		}
		else if ((temp = isToken(command, sadako.token.label_embed))) {
			temp = localizeLabel(temp);
			command = 'sadako.doLink("%' + temp + '")';
			if (!(temp in sadako.labels)) broken = true;
		}

		if (broken === undefined || broken === false) return "<a onClick='" + command + "'>" + name + "</a>";
		return "<a class='broken' title='" + command + "'>" + name + "</a>";
	};
	
	sadako.fadeIn = function(text) {
		var id = sadako.evals.length;
		sadako.evals.push([]);
		var output = format("<span id='{0}' class='hide'>{1}</span>", id, text);
		setTimeout(function() {
			removeClass(id, "hide");
		}, sadako.text_delay);
		return output;
	}
	
	sadako.writeReveal = function(name, script) {
		var temp;
		var t = sadako.token;
		var page_cond = t.page_embed + t.cond_embed;
		var page_value = t.page_embed + t.value_embed;
		var label_cond = t.label_embed + t.cond_embed;
		var label_value = t.label_embed + t.value_embed;
		
		var is_include = false;
		
		if (isToken(script, t.page_embed) || isToken(script, t.label_embed)) is_include = true;
		
		if (isToken(script, page_cond) || isToken(script, page_value)) is_include = false;
		else if (isToken(script, label_cond) || isToken(script, label_value)) is_include = false;
		
		var id = "reveal_" + sadako.reveal_id;
		sadako.reveal_id += 1;

		if (is_include) {
			if ((temp = isToken(script, t.page_embed + t.eval_value))) script = "#" + eval(temp);
			else if ((temp = isToken(script, t.label_embed + t.eval_value))) {
				temp = localizeLabel(eval(temp));
				script = "%" + temp;
			}
			
			if ((temp = isToken(script, t.page_embed)) && !(temp in sadako.story)) {
				return sadako.writeLink(name, 'sadako.doInclude(#"' + script + '")', true);
			}
			
			if ((temp = isToken(script, t.label_embed)) && !(temp in sadako.labels)) {
				return sadako.writeLink(name, 'sadako.doInclude(%"' + script + '")', true);
			}
			
			sadako.evals.push(function() {
				sadako.lines = [];
				sadako.choices = [];
				sadako.doInclude(script);
				sadako.writeOutput(id);
			});
		}
		else {
			var link = isToken(script, sadako.token.eval_code);
			var cid = id;
			if (link) {
				script = link;
				cid = cid + "A";
			}
			
			var eval_script = isToken(script, sadako.token.eval_value);
			var text;
			sadako.evals.push(function() {
				text = script;
				if (eval_script) text = processScript(eval_script);
				if (link || eval_script) text = eval(text);
				
				addClass(cid, "hide");
				dom(cid).innerHTML = text;
				setTimeout(function() {
					removeClass(cid, "hide");
				}, sadako.text_delay);
			});
		}
		
		return format("<span id='{0}'><a id='{0}A' onclick='sadako.evals[{1}]()'>{2}</a></span>", id, sadako.evals.length - 1, name);
	};

	sadako.writeInput = function(script, name) {
		/*
			Creates a textbox or textarea for user input.

			script (string): name of variable to store value of input into
			name (string): text to be displayed with label
		*/

		var temp;
		var multi = false;
		if ((temp = isToken(script, sadako.token.eval_input)) !== false) {
			script = temp;
			multi = true;
		}
		
		var value = eval(script);
		
		if (value === undefined) {
			value = "";
			eval(script + ' = ""');
		}

		var id = "input_" + sadako.evals.length;
		if (multi) {
			if (name) name += " ";
			sadako.text += format('<label>{0}<textarea id="{1}"  class="multiline" onblur="eval(sadako.evals[{2}])">{3}</textarea></label>', name, id, sadako.evals.length, value);
		}
		else {
			var label = (name) ? '<label for="' + id + '">' + name + '</label> ' : "";
			sadako.text += format('{0}<input type="text" id="{1}" onblur="eval(sadako.evals[{2}])" value="{3}">', label, id, sadako.evals.length, value);
		}

		var command = format('{0} = sadako.dom("#{1}").value.trim()', script, id);
		sadako.evals.push(command);
	};

	//eslint-disable-next-line no-unused-vars
	sadako.doLineTag = function(text, tag) {
		// placeholder line tag processing function to be ovewritten by user

		return [text];
	};

	//eslint-disable-next-line no-unused-vars
	sadako.doChoiceTag = function(text, tag) {
		// placeholder choice tag processing function to be ovewritten by user

		return [text];
	};

	sadako.writeOutput = function(id) {
		// Writes output to display area

		var choices = [];
		var delay = 0;
		var delay_adjust = 0;

		var displayText = function(text, tags) {
			/*
				Writes a single line out to the display area.

				text (string): Text to display
				tags (array): Array of tag strings used for processing.
					Currently all tags are ignored here except 'delay' that
					adjust offsets the display time between lines.
			*/

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

			if (id) dom(id).appendChild(el);
			else if (sadako.in_dialog && sadako.dialog_ids.output) dom(sadako.dialog_ids.output).appendChild(el);
			else dom(sadako.output_id).appendChild(el);

			// Fade in paragraph after a short delay
			setTimeout(function() {
				el.className = remove(el.className.split(" "), "hide").join(" ");
			}, delay + delay_adjust);

			delay += sadako.text_delay;
		}
		
		var processLines = function() {
			var temp, a;

			for (a = 0; a < sadako.lines.length; ++a) {
				temp = processTags(sadako.lines[a], sadako.doLineTag);

				// add link to list to display as a choice instead of in main text
				if (has(temp[1], "choice")) {
					choices.push({"text": temp[0], "tags": remove(temp[1], "choice")});
					continue;
				}

				displayText(temp[0], temp[1]);
			}
		};
		
		var processFakeChoices = function() {
			var a;
			var text = "";

			for (a = 0; a < choices.length; ++a) {
				if (choices[a].length < 1) continue;
				text += "<li class='choice'><span class='" + choices[a].tags.join(" ") + "'>" + choices[a].text + "</span></li>";
			}
			return text;
		};
		
		var processChoices = function() {
			var a, temp, name
			var text = "";
			
			for (a = 0; a < sadako.choices.length; ++a) {
				temp = processTags(sadako.choices[a].text, sadako.doChoiceTag);

				name = sadako.parseLink(temp[0]);
				if (name.trim().length < 1) continue;

				// Choice taken from script
				if ("line" in sadako.choices[a]) {
					text += sadako.format("<li class='choice'><span class='{0}'><a onclick='sadako.doChoice({1})'>{2}</a></span></li>", temp[1].join(" "), a, name);
				}
				// Choice added via addChoice()
				else {
					text += sadako.format("<li class='choice'><span class='{0}'>{1}</span></li>", temp[1].join(" "), name);
				}
			}
			return text;
		};

		return function() {
			// Indexes through each line and choice and outputs them to the display

			sadako.clear(id);
			
			processLines();

			if (choices.length || sadako.choices.length) {
				var text = "";
				text += processFakeChoices();
				text += processChoices();
				
				if (text.length) text = "<hr><ul>" + text + "</ul>";

				displayText(text, []);
			}
		}();
	};

	sadako.clear = function(id) {
		/*
			Clears display text.

			- Overwrite this function if a different method of displaying text is needed.
		*/

		if (id) dom(id).innerHTML = "";
		else if (sadako.in_dialog && sadako.dialog_ids.output) dom(sadako.dialog_ids.output).innerHTML = "";
		else dom(sadako.output_id).innerHTML = "";
	};

	var refresh = function() {
		// Reruns the current section of script

		doScript(sadako.page, sadako.start, sadako.part);
	};


	/* Story Rendering */

	var run = function() {
		sadako.script_level = 1;
		sadako.script_status = RUN;
	};

	var end = function() {
		sadako.script_status = END;
	};

	var abort = function() {
		sadako.lines = [];
		sadako.choices = [];
		sadako.script_status = ABORT;
	};

	var doReturn = function() {
		doLink("#" + sadako.page);
	};

	var isPageTop = function() {
		if ((sadako.start === 0 || sadako.start === undefined) && (sadako.part === 0 || sadako.part === undefined)) return true;
		return false;
	};

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
				sadako.text += sadako.writeLink(name, 'eval(sadako.evals[' + (sadako.evals.length) + '])');
				sadako.evals[sadako.evals.length] = script;
			}
		}

		var doValue = function(text) {
			/* evaluates text marked with 'value' token */

			eval("sadako.text += " + text);
		}

		var doLabelLink = function(text) {
			/* renders a link to a label with the value of the text */

			var items = doRename(text);
			var script = items[0];
			var name = items[1] || script;
		
			var command = "";
			if (sadako.in_dialog) command = "sadako.closeDialog(); ";
			
			var temp = isToken(script, sadako.token.eval_value);
			if (temp !== false) {
				command += format("sadako.evals[{0}]()", sadako.evals.length);
				var temp2;
				sadako.evals.push(function() {
					script = eval(temp);
					if ((temp2 = isToken(script, sadako.token.label_embed))) script = temp2;
					sadako.doLink("%" + localizeLabel(script));
				});
				return sadako.writeLink(name, command);
			}
			
			script = localizeLabel(script);
			command += 'sadako.doLink("%' + script + '")';
			return sadako.writeLink(name, command, (script in sadako.labels) ? false : true);
		}

		var doPageLink = function(text) {
			/* renders a link to a page with the value of the text */

			var items = doRename(text);
			var script = items[0];
			var name = items[1] || script;

			var temp = isToken(script, sadako.token.page_embed);
			if (temp !== false) script = temp;
			
			var command = "";
			if (sadako.in_dialog) command = "sadako.closeDialog(); ";
			
			temp = isToken(script, sadako.token.eval_value);
			if (temp) {
				command += format("sadako.evals[{0}]()", sadako.evals.length);
				var temp2;
				sadako.evals.push(function() {
					script = eval(temp);
					if ((temp2 = isToken(script, sadako.token.page_embed))) script = temp2;
					sadako.doLink("#" + script);
				});
				return sadako.writeLink(name, command);
			}
			
			command += 'sadako.doLink("#' + script + '")';
			return sadako.writeLink(name, command, (script in sadako.story) ? false : true);
		}

		var doInput = function(text) {
			var items = doRename(text);
			var script = items[0];
			var name = items[1] || "";

			sadako.writeInput(script, name);
		}
		
		var doReveal = function(text) {
			var items = doRename(text);
			var script = items[0];
			var name = items[1] || script;
			
			return sadako.writeReveal(name, script);
		}
		
		var doDialog = function(text) {
			var temp, eval_script, command;
			
			var items = doRename(text);
			var script = items[0];
			var name = items[1] || script;
			
			var id = sadako.evals.length;
			
			if ((temp = isToken(script, sadako.token.page_embed))) {
				script = temp;
				eval_script = isToken(temp, sadako.token.eval_value);
				
				command = function() { 
					if (eval_script) script = eval(eval_script);
					if ((temp = isToken(script, sadako.token.page_embed))) script = temp;
					sadako.showDialog("", "#" + script); 
				}
			}
			else if ((temp = isToken(script, sadako.token.label_embed))) {
				script = temp;
				eval_script = isToken(temp, sadako.token.eval_value);

				command = function() { 
					if (eval_script) script = eval(eval_script);
					if ((temp = isToken(script, sadako.token.label_embed))) script = temp;
					sadako.showDialog("", "%" + localizeLabel(script));
				}
			}
			else if ((temp = isToken(script, sadako.token.eval_code))) {
				script = temp;
				command = function() { 
					sadako.showDialog();
					sadako.clear();
					eval(script);
				}
			}
			else if ((temp = isToken(script, sadako.token.eval_value))) {
				script = temp;
				command = function() { 
					sadako.showDialog();
					sadako.overwrite(eval(script));
				}
			} 
			else {
				command = function() { 
					sadako.showDialog();
					sadako.overwrite(script);
				}
			}
			
			sadako.evals.push(command);
			
			return sadako.writeLink(name, format("sadako.evals[{0}]()", id));
		}
		
		return function() {
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
					else if ((script = isToken(parts[0], sadako.token.eval_input)) !== false) doInput(script);
					else if ((script = isToken(parts[0], sadako.token.eval_reveal)) !== false) sadako.text += doReveal(script);
					else if ((script = isToken(parts[0], sadako.token.eval_dialog)) !== false) sadako.text += doDialog(script);
					else sadako.text += doPageLink(parts[0]);
					sadako.text += parts[1];
				}
			}

			return sadako.text;
		}();
	};
	
	sadako.writeSpan = function(class_name, text) {
		return format('<span class="{0}">{1}</span>', class_name, text);
	};

	var processScript = function(line) {
		var a, sections, script, cond;

		var doReplace = function(text) {
			var replaceVar = function(text, token, replacement) {
				var regexp = new RegExp("(^|\\s+|[^a-zA-Z0-9]+)" + token + "([a-zA-Z0-9]+(?:[\\._]?[a-zA-Z0-9]+)*)", "g");
				return text.replace(regexp, replacement);
			}

			var t = sadako.token;

			text = replaceVar(text, t.label_embed + t.cond_embed, function(match, p1, p2) { return p1 + 'sadako.label_seen["' + p2 + '"]'; });
			text = replaceVar(text, t.page_embed + t.cond_embed, function(match, p1, p2) { return p1 + 'sadako.page_seen["' + p2 + '"]'; });
			
			text = replaceVar(text, t.var_embed + t.cond_embed, function(match, p1, p2) { return p1 + "sadako.var." + p2; });
			text = replaceVar(text, t.tmp_embed + t.cond_embed, function(match, p1, p2) { return p1 + "sadako.tmp." + p2; });
			text = replaceVar(text, t.scene_embed + t.cond_embed, function(match, p1, p2) { return p1 + 'sadako.scenes.' + p2; });
			
			text = replaceVar(text, t.script_embed + t.cond_embed, function(match, p1, p2) {
				if (isFunc(eval("sadako.scripts." + p2))) return p1 + "sadako.scripts." + p2 + "()";
				return p1 + "sadako.scripts." + p2;
			});

			text = replaceVar(text, t.label_embed + t.value_embed, function(match, p1, p2) { return p1 + sadako.label_seen[p2]; });
			text = replaceVar(text, t.page_embed + t.value_embed, function(match, p1, p2) { return p1 + sadako.page_seen[p2]; });

			text = replaceVar(text, t.var_embed + t.value_embed, function(match, p1, p2) { return p1 + eval("sadako.var." + p2); });
			text = replaceVar(text, t.tmp_embed + t.value_embed, function(match, p1, p2) { return p1 + eval("sadako.tmp." + p2); });
			text = replaceVar(text, t.scene_embed + t.value_embed, function(match, p1, p2) { return p1 + eval("sadako.scenes." + p2); });
			
			text = replaceVar(text, t.script_embed + t.value_embed, function(match, p1, p2) {
				var text;
				if (isFunc(eval("sadako.scripts." + p2))) text = eval("sadako.scripts." + p2 + "()");
				else text = eval("sadako.scripts." + p2);
				return p1 + ((text !== undefined) ? text : "");
			});

			text = text.replace(RegExp(t.write_embed, 'g'), 'sadako.text = ');
			text = text.replace(RegExp(t.pluswrite_embed, 'g'), 'sadako.text += ');

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

				return sadako.writeSpan(sections[0], text);
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

		return function() {
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
					if (result === null || !result.replace(/<br>/gi, '').trim().length) return "";
					return result.trim();
				}
			}
			catch (e) {
				console.error("index: ", a, "\nscript:", script, "\ncondition:", cond);
				throw new Error(e);
			}

			return null;
		}();
	};

	var doChoice = function(choice) {
		/*
		Function called by choice hyperlinks.

		choice (integer): index of choice in 'sadako.choices' array
		*/
		
		if (!sadako.in_dialog && !sadako.in_include) sadako.reveal_id = 0;
		
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
	};
	
	var localizeLabel = function(label, throw_error) {
		if (label.indexOf(".") === -1 || !(label in sadako.labels)) label = sadako.page + "." + label;
		if (throw_error && !(label in sadako.labels)) throw new Error("Can't find label '" + label + "'");
		return label;
	}

	var getLineByLabel = function(label) {
		if (label.charAt(0) === "#") {
			return [label.substring(1), 0, 0];
		}
		else {
			label = localizeLabel(label, true);

			var line = sadako.labels[label];
			var token = sadako.story[line[0]][line[1]][line[2]].k;

			if (token === sadako.token.choice || token === sadako.token.static) return [line[0], line[1] + "." + line[2], 0];

			return line;
		}
	};
	
	var doInclude = function(label) {
		var state = [];
		
		var saveState = function() {
			state.push(copy(sadako.savestate_enabled, true));
			state.push(copy(sadako.tmp, true));
			state.push(copy(sadako.conditions, true));
			state.push(copy(sadako.in_include, true));
			state.push(copy(sadako.script_status, true));
			state.push(copy(sadako.page, true));
			state.push(copy(sadako.part, true));
			state.push(copy(sadako.start, true));
		}
		
		var restoreState = function() {
			sadako.savestate_enabled = copy(state.shift(), true);
			sadako.tmp = copy(state.shift(), true);
			sadako.conditions = copy(state.shift(), true);
			sadako.in_include = copy(state.shift(), true);
			sadako.script_status = copy(state.shift(), true);
			sadako.page = copy(state.shift(), true);
			sadako.part = copy(state.shift(), true);
			sadako.start = copy(state.shift(), true);
		}
		
		if (sadako.script_status === END) sadako.run();
		
		var temp;
		if ((temp = isToken(label, sadako.token.label_embed))) label = temp;
		
		saveState();
		sadako.in_include = true;
		sadako.tmp = {};
		sadako.savestate_enabled = false;
		doJump(label, true);
		restoreState();
	}

	var doLink = function(label) {
		if (!sadako.in_dialog && !sadako.in_include) sadako.reveal_id = 0;
		
		sadako.run();

		sadako.lines = [];
		sadako.choices = [];
		sadako.chosen = null;
		sadako.tmp = {};

		var temp;
		if ((temp = isToken(label, sadako.token.label_embed))) label = temp;

		sadako.current = label;
		sadako.current_line = getLineByLabel(label);
		
		doSaveState();
		doSaveData();

		doJump(label);
	};

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
		sadako.cond_states = [];
		doScript(line[0], line[1], line[2]);
	}

	var isToken = function(text, token) {
		text = text.trimStart();
		if (text.substring(0, token.length) === token) return text.substring(token.length).trimStart();
		return false;
	};

	var parseLink = function(text, end) {
		var open = text.indexOf(sadako.token.choice_format_open);
		var close = text.indexOf(sadako.token.choice_format_close);

		if (open === -1) return text;

		var before = text.substring(0, open);
		var middle = text.substring(open + sadako.token.choice_format_open.length, close);
		var after = text.substring(close + sadako.token.choice_format_close.length);

		if (end) return before + after;
		return before + middle;
	};

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
	};

	var addScene = function(id, checkStart, checkEnd, doStart, doEnd, doBefore, doAfter, isRecurring) {
		sadako.scenes[id] = {
			"isActive": false,
			"hasStarted": 0,
			"hasEnded": 0,
			"ending": null,
			"isRecurring": isRecurring || false
		}

		sadako.scene_checks[id] = {
			"checkStart": checkStart,
			"checkEnd": checkEnd,
			"doStart": doStart,
			"doEnd": doEnd,
			"doBefore": doBefore,
			"doAfter": doAfter
		}
	};

	var checkScenes = function() {
		var a, scene, check;

		for (a in sadako.scenes) {
			scene = sadako.scenes[a];
			check = sadako.scene_checks[a];
			if (scene.hasEnded && !scene.isRecurring) continue;
			if (!scene.isActive) {
				if (sadako.isStr(check.checkStart)) {
					if (!eval(sadako.processScript(check.checkStart))) continue;
				}
				else if (!check.checkStart()) continue;

				scene.isActive = true;
				scene.hasStarted += 1;
				if (check.doStart !== undefined && check.doStart !== null) {
					if (sadako.isStr(check.doStart)) eval(sadako.processScript(check.checkStart));
					else check.doStart();
				}
				checkScenes();
				continue;
			}
			else if (check.checkEnd !== undefined && check.checkEnd !== null) {
				if (sadako.isStr(check.checkEnd)) {
					if (!eval(sadako.processScript(check.checkEnd))) continue;
				}
				else if (!check.checkEnd()) continue;

				scene.isActive = false;
				scene.hasEnded += 1;
				if (check.doEnd !== undefined && check.doEnd !== null) {
					if (sadako.isStr(check.doEnd)) scene.ending = eval(sadako.processScript(check.doEnd));
					else scene.ending = check.doEnd();
				}
				if (scene.ending === undefined) scene.ending = null;
				checkScenes();
				continue;
			}
		}
	};

	var doLines = function(page, start, part) {
		/*
		Parses, evaluates, and renders a line of the script.

		page (string): page to render
		start (string): section of page to start
		*/

		var parseJump = function(text, page, start, part) {
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
			
			var processReturn = function(temp) {
				if (temp === "END") return [END];
				if (temp === "ABORT") return [ABORT];
				if (temp === "RETURN" || (temp === "BACK" && sadako.history_limit < 1)) {
					sadako.current = "#" + page;
					doJump(sadako.current);
					return [END];
				}
				if (temp === "BACK") {
					back();
					return [CONTINUE];
				}
				if (sadako.jumps.length < 1) return [END];

				return [JUMP].concat(getJump());
			};
			
			var processPageJump = function(label, include_text) {
				if (!(label in sadako.story)) throw new Error("Can't find page '" + label + "'");
				label = "#" + label;
				if (include_text) {
					doInclude(label);
					return [CONTINUE];
				}

				doJump(label);
				return [END];
			};
			
			var processLabelJump = function(label, include_text) {
				var temp;
				if ((temp = isToken(label, sadako.token.label_embed)) !== false) label = temp;
				
				if (label.indexOf(".") === -1 || !(label in sadako.labels)) label = page + "." + label;
				if (!(label in sadako.labels)) throw new Error("Can't find label '" + label + "'");

				var jump = sadako.labels[label];
				var token = sadako.story[jump[0]][jump[1]][jump[2]].k;

				if (include_text) {
					doInclude(label);
					return [CONTINUE];
				}

				if (token === sadako.token.choice || token === sadako.token.static) {
					jump = [jump[0], jump[1] + "." + jump[2], 0];
					sadako.label_seen[label] += 1;
				}

				setJump([page, start, part + 1]);

				return [JUMP].concat(jump);
			};
			
			return function() {
				var temp, temp2;
				var include_text = false;

				if ((temp = isToken(text, sadako.token.return)) !== false) return processReturn(temp);
				
				if ((temp = isToken(text, sadako.token.jump)) === false) return false;
				
				if ((temp2 = isToken(temp, sadako.token.eval_value)) !== false) {
					temp = temp2;
					include_text = true;
				}
				text = temp;

				if ((temp = isToken(text, sadako.token.page_embed)) !== false) return processPageJump(temp, include_text);
								
				return processLabelJump(text, include_text);
			}();
		};

		var parseConditions = function(text, page, start, part) {
			var processIf = function(cond, active, label) {
				sadako.conditions[active] = true;
				if (eval(cond)) {
					sadako.conditions[label] = true;
					return [JUMP, page, start + "." + part, 0];
				}
				sadako.conditions[label] = false;
				return [CONTINUE];
			}
			
			var processElseIf = function(cond, active, label) {
				if (sadako.conditions[active] === false) {
					console.error(format("'else if' found without 'if' statement.\nstory: [{0}] [{1}] [{2}]\nscript: {3}", page, start, part, sadako.story[page][start][part].text));
					return [CONTINUE];
				}
				sadako.conditions[active] = true;
				if (!eval(cond)) return [CONTINUE];
				sadako.conditions[label] = true;
				return [JUMP, page, start + "." + part, 0];
			}
			
			var processElse = function(active) {
				if (sadako.conditions[active] === false) {
					console.error(format("'else' found without 'if' statement.\nstory: [{0}] [{1}] [{2}]", page, start, part));
					return [CONTINUE];
				}
				sadako.conditions[active] = false;
				return [JUMP, page, start + "." + part, 0];
			}
			
			return function() {
				var temp;
				var active = [page, start].join(".");
				var label = [page, start, part].join(".");

				if (!(active in sadako.conditions)) sadako.conditions[active] = false;
				if (!(label in sadako.conditions)) sadako.conditions[label] = false;

				if ((temp = isToken(text, "if "))) return processIf(temp, active, label);
				else if (!sadako.conditions[label]) {
					if ((temp = isToken(text, "else if "))) return processElseIf(temp, active, label);
					else if (isToken(text, "else") !== false) return processElse(active);
				}
				
				return [CONTINUE];	
			}();
		};

		var processLines = function(page, start, part) {
			var a, text, temp, token, label;

			if (!(start in sadako.story[page])) return [CONTINUE, page, start, null];

			sadako.page = page;

			var this_page = sadako.story[page][start];
			var choice_seen = false;

			if (part === undefined) part = 0;

			var is_choice, is_not_choice;

			for (a = part; a < this_page.length; ++a) {
				label = ("l" in this_page[a]) ? this_page[a].l : null;
				token = ("k" in this_page[a]) ? this_page[a].k : null;
				is_choice = (token === sadako.token.choice || token === sadako.token.static);
				is_not_choice = (token !== sadako.token.choice && token !== sadako.token.static);
				
				// processing scripts halts at choices in includes
				if (is_choice && sadako.in_include) return [END];

				// if choices have been listed and new line is not a choice, stop the script
				if (choice_seen === true && is_not_choice) return [END];

				// check and process scenes
				checkScenes();

				// reset condition state if we are not in a condition at the momment
				if (token !== sadako.token.cond_block && token !== null) {
					sadako.conditions[page + "." + start] = false;
				}

				// if this line is only a label, there's nothing to be done
				if (token === sadako.token.label) {
					sadako.label_seen[label] += 1;
					continue;
				}

				// if limited choice and choice has already been seen, jump to next line
				if (token === sadako.token.choice && label && (label in sadako.label_seen) && (sadako.label_seen[label])) continue;

				// returns null if inline condition is false
				text = processScript(this_page[a].t);
				if (text === null) continue;

				// increase label seen count as long as this isn't a choice
				if (is_not_choice && label) sadako.label_seen[label] += 1;

				// if the script block stops the script, we exit
				if (sadako.script_status !== RUN) return [sadako.script_status];

				// if jump token, process jump
				if ((temp = parseJump(text, page, start, a))) {
					if (temp[0] === CONTINUE) continue;
					return temp;
				}

				// if condition token, process conditions
				if (token === sadako.token.cond_block) {
					temp = parseConditions(text, page, start, a);
					if (temp[0] === CONTINUE) continue;
					return temp;
				}

				if (is_choice) {
					// if no previous choices and this doesn't have text, that makes it a fallback choice
					if (!choice_seen && text.trim().length < 1) {
						if (label) sadako.label_seen[label] += 1;
						sadako.choices = [];
						return [JUMP, page, start + "." + a, 0];
					}
					// otherwise add choice to list
					choice_seen = true;
					sadako.choices.push({line: [page, start, a], text: text, label: label});
					continue;
				}

				// attempt to attach current line to previous line
				if (text.trim().length) doAttach(text);
			}

			return [(choice_seen) ? END : CONTINUE, page, start, a];
		}

		return function() {
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
		}();
	};

	var doScript = function(page, start, part) {
		var doSceneAction = function(when) {
			var a, sceneAction;
			for (a in sadako.scenes) {
				sceneAction = sadako.scene_checks[a][when];
				if (sadako.scenes[a].isActive) {
					if (sceneAction !== undefined && sceneAction !== null) {
						if (isStr(sceneAction)) eval(processScript(sceneAction));
						else sceneAction();
					}
				}
			}
		};
		
		var attachToEnd = function() {
			if (sadako.lines.length) {
				var last = sadako.lines.length - 1;
				var last_chars = sadako.lines[last].length - sadako.token.attach.length;
				if (sadako.lines[last].substring(last_chars) === sadako.token.attach) {
					sadako.lines[last] = sadako.lines[last].substring(0, last_chars);
				}
			}
		};
		
		var doBefore = function() {
			if (start === undefined) start = 0;

			if (sadako.script_level === 1) doSceneAction("doBefore");

			if ("ALL" in sadako.before) { sadako.before.ALL(); }
			if (page in sadako.before) sadako.before[page]();

			sadako.script_level += 1;
		};
		
		var doAfter = function() {
			sadako.script_level -= 1;

			if (sadako.script_level === 1) {
				if (sadako.page in sadako.after) sadako.after[sadako.page]();
				if (sadako.script_status === ABORT) return;

				doSceneAction("doAfter");

				if ("ALL" in sadako.after) sadako.after.ALL();
				if (sadako.script_status === ABORT) return;

				sadako.writeOutput();
				sadako.scrollToTop();
			}
		};
		
		return function() {
			if (sadako.script_status === ABORT || sadako.script_status === END) return;

			sadako.page = page;
			sadako.start = start;
			sadako.part = part;
			sadako.evals = [];

			doBefore();

			var temp = doLines(page, start, part);

			// check and process scenes once more now that story block has completed
			checkScenes();

			if (temp === ABORT) return;

			attachToEnd();

			doAfter();
		}();
	};


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
	};

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
	};

	// functions intended to be used as-is
	sadako.doJump = doJump;
	sadako.doLink = doLink;
	sadako.doInclude = doInclude;
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
	sadako.overwrite = overwrite;
	sadako.addChoice = addChoice;
	sadako.addScene = addScene;

	// functions intended to be overridden
	// sadako.write
	// sadako.writeLink
	// sadako.writeSpan
	// sadako.writeOutput
	// sadako.doLineTag
	// sadako.doChoiceTag
	// sadako.saveGame
	// sadako.loadGame
	// sadako.freezeData
	// sadako.unfreezeData
	// sadako.clear
	// sadako.scrollToTop

	// functions made available for use in overridden functions
	sadako.processTags = processTags;
	sadako.doChoice = doChoice;
	sadako.processScript = processScript;
	sadako.parseLink = parseLink;

	// convenient utility functions
	sadako.rollDice = rollDice;
	sadako.find = find;
	sadako.isDef = isDef;
	sadako.isEmpty = isEmpty;
	sadako.isStr = isStr;
	sadako.isNum = isNum;
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
	

}(window.sadako = window.sadako || {}));
