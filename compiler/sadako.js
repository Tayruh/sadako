(function(sadako) {

	sadako.version = "0.14.2";
	sadako.kayako_version = "0.10.14";

	var localStorage;

	var JUMP = "jump";
	var END = "end";
	var ABORT = "abort";
	var NEXT = "next";
	var RUN = "run";
	var BREAK = "break";
	var CONTINUE = "continue";
	var RETURN = "return";
	var BACK = "back";

	sadako.token = {
		"escape": "\\",
		"line": ";;",
		"cond": "::",
		"script_open": "[:",
		"script_close": ":]",
		"rename": "@:",
		"attach": "<>",
		"choice_format_open": "[",
		"choice_format_close": "]",
		"choice_link_open": "<<",
		"choice_link_close": ">>",
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
		"eval_action": "!",

		// embedding
		"engine_embed": "&",
		"script_embed": "\\^",
		"var_embed": "\\$",
		"tmp_embed": "_",
		"scene_embed": "\\*",
		"value_embed": ":",
		"cond_embed": "\\.",
		"write_embed": "~~=",
		"pluswrite_embed": "~~\\+",
		"process_open": "{{",
		"process_close": "}}"
	};

	var initializeValues = function() {
		// global variables intended to changed
		sadako.savename = "sadako";
		sadako.text_delay = 80.0;
		sadako.output_id = "#output";
		sadako.autosave_enabled = false;

		// global variables not saved to storage
		sadako.tmp = {};
		sadako.evals = [];
		sadako.default_data = {};
		// sadako.story = {};
		sadako.tags = {};
		sadako.labels = {};
		sadako.depths = {};
		sadako.lines = [];
		sadako.display_lines = [];
		sadako.display_choices = [];
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
		sadako.in_reveal = false;
		sadako.scene_checks = {};
		sadako.text = "";
		sadako.evals_unsafe = true;
		sadako.loop_result = null;
		sadako.in_loop = false;
		sadako.include_choices = false;
		sadako.settings = {};
		sadako.reveal_id = 0;

		// global variables saved to state
		sadako.current = null;
		sadako.page = "start";
		sadako.start = 0;
		sadako.part = 0;
		sadako.labels = {};
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
	}


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

	var enableKeyboard = function() {
		document.addEventListener("keydown", function(event) {
			var el = document.activeElement;
			
			if (event.code === "Space" || event.code === "Enter") {
				if (el.tagName !== "A" && el.getAttribute("role") !== "link") return;
				event.preventDefault();
				el.click();
			}
			else if (event.code === "Escape") sadako.closeDialog();
		});
	}

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
		// id can be either a string id or the element itself

		var el = (isStr(id)) ? dom(id) : id;

		var classes = add(el.className.split(" "), classname).join(" ");
		el.className = classes;
		return classes;
	};

	var removeClass = function(id, classname) {
		// Removes a class from an HTML element.
		// id can be either a string id or the element itself

		var el = (isStr(id)) ? dom(id) : id;

		var classes = remove(el.className.split(" "), classname).join(" ");
		el.className = classes;
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

		if (sadako.in_include || sadako.in_reveal) return;

		if (id) dom(id).scrollTop = 0;
		else if (sadako.in_dialog) dom(sadako.dialog_ids.output).scrollTop = 0;
		else {
			document.body.scrollTop = 0; // For Safari
			document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
		}
	}


	/* Markup Parsing */

	var getMarkup = function(text, open, close) {
		/*
			Parses the text by the open and close tags.

			- Performs tag matching, so it will only return the markup of the
			  outer most block.
			- Only looksk for first instance of open tag, so 'after' text may
			  contain more markup.

			text (string): Text to be parsed.
			open (string): Open tag.
			close (string): Close tag.

			returns (object):
				before (string): Text before markup block.
				markup (string): Text containing markup block.
				after (string): Text after markup block.
		*/

		var firstIndex = text.indexOf(open);
		if (firstIndex === -1) return {"before": "", "markup": "", "after": text};

		var markup;
		var lastIndex = 0;
		var closeIndex;

		while (closeIndex !== -1) {
			closeIndex = text.indexOf(close, lastIndex);
			if (closeIndex === -1) break;
			lastIndex = closeIndex + close.length;
			markup = text.substring(firstIndex, lastIndex);
			if (markup.split(open).length === markup.split(close).length) break;
		}

		if (closeIndex === -1) {
			console.error("Script:", text);
			throw new Error("Unmatched " + open + " and " + close + " tokens.");
		}

		var before = text.substring(0, firstIndex);
		var after = text.substring(closeIndex + close.length);

		return {"before": before, "markup": markup, "after": after};
	}

	var parseMarkup = function(text, open, close, action) {
		/*
			Indexes through text, performing 'action' function on parsed markup.

			text (string): Text to parse.
			open (string): Open markup tag.
			close (string): Close markup tag.
			action (function): Function to be applied to markup object.

			returns (text): Modified text.
		*/

		if (text.indexOf(open) === -1) {
			return text;
		}

		var before;
		var temp = getMarkup(text, open, close);

		var result = "";

		while (temp.markup.trim().length) {
			before = temp.before;
			text = temp.after;

			result += before + action(temp);

			temp = getMarkup(text, open, close);
		}

		result += temp.after;

		return result;
	}

	var getToken = function(text) {
		/*
			Finds first token block token.

			text (string): Text containing token to find.

			returns (object):
				token (string): Token found.
				index: (integer): Index in string of token.
		*/

		var checkIndex = function(token_type, value) {
			if (value === -1) return;
			if (value > index) return;

			token = token_type;
			index = value;
		}

		var t = sadako.token;

		var index = text.length;
		var inline_index = text.indexOf(t.inline_open);
		var span_index = text.indexOf(t.span_open);
		var macro_index = text.indexOf(t.macro_open);
		var script_index = text.indexOf(t.script_open);

		var token = false;
		checkIndex("script", script_index);
		checkIndex("inline", inline_index);
		checkIndex("span", span_index);
		checkIndex("macro", macro_index);

		return {"token": token, "index": index};
	}

	var splitMarkup = function(text, split_token) {
		/*
			Splits text by the 'split_token'. Text inside token blocks is ignored.

			text (string): Text to split.
			split_token (string): Token to split string with.

			returns (array): An array of the split text.
		*/

		if (text.indexOf(split_token) === -1) return [text];

		var t = sadako.token;

		var tokens = {
			"script": [t.script_open, t.script_close],
			"inline": [t.inline_open, t.inline_close],
			"span": [t.span_open, t.span_close],
			"macro": [t.macro_open, t.macro_close]
		}

		var items = [];
		var before = "";
		var a, split_index, temp, script;

		// 1000 loops as a safety measure. It should break the loop before that.
		for (a = 0; a < 1000; ++a) {
			temp = getToken(text);

			split_index = text.indexOf(split_token);

			if (split_index !== -1 && split_index < temp.index) {
				items.push(before + text.substring(0, split_index))
				before = "";
				text = text.substring(split_index + split_token.length);
				continue;
			}

			if (!temp.token) {
				before += text;
				text = "";
				items.push(before);
				break;
			}

			script = getMarkup(text, tokens[temp.token][0], tokens[temp.token][1]);
			before += text.substring(0, temp.index + script.markup.length);
			text = text.substring(temp.index + script.markup.length);
		}

		return items;
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
			tmp: copy(sadako.tmp, true),
			args: copy(sadako.args, true)
		}

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
		sadako.args = copy(data.args, true);

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
			var: copy(sadako.var, true),
			args: copy(sadako.args, true)
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
			if (scenes && a in scenes) sadako.scenes[a] = scenes[a];
		}

		sadako.var = copy(sadako.default_data.var, true);
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
		sadako.args = copy(data.args, true);

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

	var saveSettings = function() {
		var settingsData = JSON.stringify(sadako.settings);
		localStorage.setItem(sadako.savename + "_savedata_settings", settingsData);
	};

	var loadSettings = function() {
		var settingsData = localStorage.getItem(sadako.savename + "_savedata_settings");
		if (settingsData !== null) sadako.settings = JSON.parse(settingsData);
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

		if (sadako.in_dialog) sadako.closeDialog();
		else sadako.unfreezeData();

		loadData(JSON.parse(saveData));

		if (!no_confirm) alert("Load succesful!" );

		sadako.run();

		doJump(sadako.current);

		return true;
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


	/* Dialog */

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

	sadako.closeDialog = function(cleanup) {
		/*
			Closes the dialog window.

			cleanup (boolean): if true, clears lines and choices arrays.
		*/

		if (!sadako.in_dialog) return;

		sadako.unfreezeData();
		sadako.in_dialog = false;

		// if script is running, we clear previous lines and choices
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

			return (boolean): true if dialog displays, false if not
		*/

		var updateDialog = function() {
			if (sadako.dialog_ids.title) {
				// clear dialog title if none is assigned on opening of dialog
				if (title !== null && title !== undefined) sadako.dom(sadako.dialog_ids.title).innerHTML = processScript(title);
				else if (!sadako.in_dialog) sadako.dom(sadako.dialog_ids.title).innerHTML = "";
			}

			sadako.in_dialog = true;
			sadako.clear();

			if (text !== null && text !== undefined) {
				var temp;
				if ((temp = sadako.isToken(text, sadako.token.page_embed))) doLink(sadako.token.page_embed + temp);
				else if ((temp = sadako.isToken(text, sadako.token.label_embed))) doLink(sadako.token.label_embed + temp);
				else sadako.overwrite(text);
			}
		}

		if (!sadako.dialog_ids.output) {
			console.error("Dialog is not set up properly.");
			return false;
		}

		if (sadako.in_dialog) {
			updateDialog();
			return true;
		}

		sadako.freezeData();
		updateDialog();

		var a;
		for (a = 0; a < sadako.dialog_ids.display.length; ++a) {
			sadako.addClass(sadako.dialog_ids.display[a], "open");
		}

		return true;
	};


	/* Text Output */

	var write = function(output) {
		/*
			Adds text to the lines array to be queued for output.

			output (string or array): String or array of strings to added
				to output.
		*/

		var text;

		if (isArray(output)) {
			var a;
			for (a = 0; a < output.length; ++a) {
				text = sadako.processScript(output[a]);
				if (isStr(text) && text.trim().length) sadako.lines.push(text);
			}
			return;
		}

		text = sadako.processScript(output);
		if (isStr(text) && text.trim().length) sadako.lines.push(text);
	};

	var overwrite = function(text, choices, id) {
		/*
			Writes the text to the output.

			text (string or array): text or array of text to display

			choices (array): array of choice arrays to pass to the addChoice() function.
				See the addChoice() function for more details.

			id (string): ID of element to write output to.
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
		writeOutput(id);
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

	sadako.writeLink = function(name, command, broken) {
		/*
			Returns an html link that executes the command on click.

			name (string): Link name
			command (string): Command to be evaluated on click
			broken (boolean): If true, displays the link using the 'broken' class

			returns (string): HTML link.
		*/

		var temp;
		var t = sadako.token;
		
		if (command === undefined) {
			if ((temp = isToken(name, t.page_embed))) {
				name = temp;
				command  = t.page_embed + temp;
			}
			else if ((temp = isToken(name, t.label_embed))) {
				name = temp;
				command  = t.label_embed + temp;
			}
		}

		if (isFunc(command)) {
			command = format("eval(sadako.evals[{0}])", sadako.evals.length);
			sadako.evals.push(command);
		}
		else if ((temp = isToken(command, sadako.token.page_embed))) {
			temp = prepareLabel(temp);
			command = 'sadako.doLink("' + sadako.token.page_embed + temp + '")';
			if (!(temp in sadako.story)) broken = true;
		}
		else if ((temp = isToken(command, sadako.token.label_embed))) {
			temp = localizeLabel(temp);
			command = 'sadako.doLink("' + sadako.token.label_embed + temp + '")';
			if (!(temp in sadako.labels)) broken = true;
		}

		if (broken === undefined || broken === false) return "<span onclick='event.stopPropagation()'><a role='link' tabindex='0' class='link' onclick='" + command + "'>" + name + "</a></span>";
		return "<a role='link' tabindex='0' class='link broken' title='" + command + "'>" + name + "</a>";
	};

	sadako.fadeIn = function(id, delay, text) {
		/*
			Fades in a block of text.

			id (string): ID of HTML element to fade in, if one exists
			delay (integer): Length of delay in miliseconds
			text (string): Text to fade in
		*/

		var el;

		if (!id) {
			el = document.createElement("span");
			el.className = "hide";
			el.innerHTML = text;

			setTimeout(function() {
				removeClass(el, "hide");
			}, sadako.text_delay + delay);

			return el.outerHTML;
		}

		el = dom(id);
		addClass(el, "hide");
		el.innerHTML = (text === undefined) ? el.innerHTML : text;
		setTimeout(function() {
			removeClass(el, "hide");
		}, sadako.text_delay + delay);
	}

	var checkInclude = function(script) {
		var t = sadako.token;
		var page_cond = t.page_embed + t.cond_embed;
		var page_value = t.page_embed + t.value_embed;
		var label_cond = t.label_embed + t.cond_embed;
		var label_value = t.label_embed + t.value_embed;

		var is_include = false;

		if (isToken(script, t.page_embed) || isToken(script, t.label_embed)) is_include = true;

		if (isToken(script, page_cond) || isToken(script, page_value)) is_include = false;
		else if (isToken(script, label_cond) || isToken(script, label_value)) is_include = false;

		return is_include;
	};

	sadako.writeReveal = function(name, script) {
		/*
			Creates a link that changed text when clicked.

			name (string): Text of link before being clicked.
			script (string): Text/script to be revealed.

			returns (string): HTML link
		*/

		if (script === undefined) {
			script = name;
			name = null;
		}

		var temp, temp2;
		var t = sadako.token;
		var is_include = checkInclude(script);
		
		var id = "reveal_" + sadako.reveal_id;
		var cid = id;
		sadako.reveal_id += 1;

		if (is_include) {
			temp = getArgs(script);
			var args = temp.args;
			script = temp.label;

			var label = temp.label;

			// page reveal
			if ((temp = isToken(script, t.page_embed))) {
				if ((temp2 = isToken(temp, t.eval_value)) !== false) temp = eval(temp2);
				label = temp;
				script = t.page_embed + prepareLabel(temp);
			}
			// label reveal
			else if ((temp = isToken(script, t.label_embed))) {
				if ((temp2 = isToken(temp, t.eval_value)) !== false) temp = eval(temp2);
				label = temp;
				script = t.label_embed + localizeLabel(temp);
			}

			if (!name || !name.trim().length) name = label;

			if ((temp = isToken(script, t.page_embed)) && !(temp in sadako.story)) {
				return sadako.writeLink(name, 'sadako.doInclude("' + t.page_embed + temp + '")', true);
			}
			
			if ((temp = isToken(script, t.label_embed)) && !(temp in sadako.labels)) {
				return sadako.writeLink(name, 'sadako.doInclude("' + t.label_embed + temp + '")', true);
			}

			sadako.evals.push(function() {
				var choices = copy(sadako.choices, true);
				sadako.lines = [];
				sadako.choices = [];
				sadako.clear(id);
				var reveal = sadako.in_reveal;
				sadako.in_reveal = true;
				sadako.doInclude(script, args);
				writeOutput(id);
				sadako.in_reveal = reveal;
				sadako.choices = copy(choices, true);
			});
		}
		else if ((temp = isToken(script, sadako.token.eval_input))) {
			// cycle text

			cid += "A";
			var items;

			if (!isStr(name)) {
				items = name;
			}
			else items = name.split(sadako.token.cond);

			var index;
			var value = eval(temp);

			var a;
			for (a = 0; a < items.length; ++a) { items[a] = items[a].trim(); }

			if (value !== undefined) {
				value = value.trim();
				for (a = 0; a < items.length; ++a) {
					if (value === items[a]) break;
				}
				if (a === items.length) value = undefined;
				else index = a;
			}

			if (value === undefined) {
				index = 0;
				eval(format("{0} = '{1}'", temp, items[index]));
			}

			name = items[index];

			sadako.evals.push(function() {
				index += 1;
				if (index > items.length - 1) index = 0;
				eval(format("{0} = '{1}'", temp, items[index]));
				text = items[index];
				sadako.fadeIn(cid, 0, text);
			});
		}
		else {
			// text reveal

			var link = isToken(script, sadako.token.eval_code);
			if (link) {
				script = link;
				cid += "A";
			}

			var eval_script = isToken(script, sadako.token.eval_value);
			var text;
			sadako.evals.push(function() {
				text = script;
				if (eval_script) text = eval_script;
				if (link || eval_script) text = eval(text);
				sadako.fadeIn(cid, 0, text);
			});
		}

		if (!is_include && !(isStr(name) && name.trim().length)) {
			console.error("No name given for reveal link:\nscript: " + script);
			return "";
		}

		return format("<span id='{0}' onclick='event.stopPropagation()'><a id='{0}A' role='link' tabindex='0' class='link' onclick='sadako.evals[{1}]()'>{2}</a></span>", id, sadako.evals.length - 1, name);
	};

	sadako.writeDialog = function(title, name, script) {
		var write = function(name, command, is_broken) {
			var id = sadako.evals.length;
			sadako.evals.push(command);
			if (is_broken) return (sadako.writeLink(name, command, true));
			return sadako.writeLink(name, format("sadako.evals[{0}]()", id));
		}

		// if script is undefined, slide each argument over by one to ignore title
		if (script === undefined || script === null) {
			script = name;
			name = title;
			title = null;
		}

		var args, label, temp, temp2;
		var t = sadako.token;
		var name_given = !!(name && name.trim().length);
		var is_include = checkInclude(script);

		// close dialog
		if (isToken(script, t.eval_action) !== false) {
			return write(name, function() { sadako.closeDialog() });
		}

		// page and labels
		if (is_include) {
			args = getArgs(script);
			script = temp = args.label;
			
			// page reveal
			if ((temp = isToken(script, t.page_embed))) {
				if ((temp2 = isToken(temp, t.eval_value)) !== false) temp = eval(temp2);
				label = temp;
				script = t.page_embed + prepareLabel(temp);
			}
			// label reveal
			else if ((temp = isToken(script, t.label_embed))) {
				if ((temp2 = isToken(temp, t.eval_value)) !== false) temp = eval(temp2);
				label = temp;
				script = t.label_embed + localizeLabel(temp);
			}

			if (!name_given) name = label;

			if ((temp = isToken(script, t.page_embed)) && !(temp in sadako.story)) {
				return sadako.writeLink(name, 'sadako.showDialog("' + t.page_embed + temp + '")', true);
			}
			
			if ((temp = isToken(script, t.label_embed)) && !(temp in sadako.labels)) {
				return sadako.writeLink(name, 'sadako.showDialog("' + t.label_embed + temp + '")', true);
			}

			return write(name, function() {
				eval("sadako.args = " + args.args);
				sadako.showDialog(title, script);
			});
		}

		if (!name_given) {
			console.error("No name given for dialog link:\nscript: " + script);
			return "";
		}

		// code eval
		if ((temp = isToken(script, t.eval_code))) {
			script = temp;
			return write(name, function() {
				if (!sadako.showDialog(title)) return;
				sadako.clear();
				eval(script);
			});
		}
		
		// text eval
		if ((temp = isToken(script, t.eval_value))) {
			script = temp;
			return write(name, function() {
				if (!sadako.showDialog(title)) return;
				sadako.overwrite(eval(script));
			});
		}
		
		// normal text
		return write(name, function() {
			if (!sadako.showDialog(title)) return;
			sadako.overwrite(script);
		});
	}

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
		return text;
	};

	//eslint-disable-next-line no-unused-vars
	sadako.doChoiceTag = function(text, tag) {
		// placeholder choice tag processing function to be ovewritten by user
		return text;
	};

	sadako.doBeforeDisplay = function(id) {
		sadako.scrollToTop();
		sadako.clear(id);
	};

	//eslint-disable-next-line no-unused-vars
	sadako.doAfterDisplay = function(id) { };

	sadako.displayOutput = function(id) {
		var delay = 0 - sadako.text_delay;
		var delay_adjust = 0;

		var outputLine = function(line) {
			/*
				Writes a single line out to the display area.
			*/

			var a, temp;
			var is_choice = has(line.tags, "choice");
			for (a = 0; a < line.tags.length; ++a) {
				if ((temp = isToken(line.tags[a], "delay:"))) {
					delay_adjust = parseInt(temp);
					continue;
				}
				if (is_choice) line.text = sadako.doChoiceTag(line.text, line.tags[a]);
				else line.text = sadako.doLineTag(line.text, line.tags[a]);
			}

			line.classes.push("hide");

			if (line.text.length < 1) return;

			sadako.displayLine(id, line, delay + delay_adjust);

			delay += sadako.text_delay;
		}

		return function() {
			if (!id) {
				if (sadako.in_dialog && sadako.dialog_ids.output) id = sadako.dialog_ids.output;
				else id = sadako.output_id;
			}

			sadako.doBeforeDisplay(id);

			sadako.evals_unsafe = false;

			var a;
			for (a = 0; a < sadako.display_lines.length; ++a) {
				outputLine(sadako.display_lines[a]);
			}

			if (sadako.display_choices.length) {
				var choices = sadako.stylizeChoices();

				for (a = 0; a < choices.length; ++a) {
					outputLine(choices[a]);
				}
			}

			sadako.doAfterDisplay(id);
		}();
	};

	sadako.displayLine = function(id, line, delay) {
		var el = document.createElement('div');
		el.className = line.classes.join(" ");
		el.innerHTML = line.text;

		delay = delay || 0;

		sadako.dom(id).appendChild(el);

		// Fade in paragraph after a short delay
		setTimeout(function() {
			removeClass(el, "hide");
		}, delay + sadako.text_delay);
	};

	sadako.stylizeChoices = function() {
		var text = "";

		var a, b, choice;
		for (a = 0; a < sadako.display_choices.length; ++a) {
			choice = sadako.display_choices[a];
			for (b = 0; b < choice.tags.length; ++b) {
				choice.text = sadako.doChoiceTag(choice.text, choice.tags[b]);
			}
			text += format("<li><span class='{0}'>{1}</span></li>", choice.classes.join(" "), choice.text);
		}
		text = "<hr><ul>" + text + "</ul>";
		return [{"text": text, "classes": ["choice"], "tags": ["choice"]}];
	};

	var splitTags = function(text) {
		var tags = [];
		var classes = [];

		var items = text.split(sadako.token.tag);
		text = items.shift().trim();

		var a, temp, tag;
		for (a = 0; a < items.length; ++a) {
			tag = items[a].trim();
			if ((temp = isToken(tag, "class:")) || ((temp = isToken(tag, "c:")))) classes.push(temp);
			else tags.push(tag);
		}

		var line = {"text": text, "classes": classes, "tags": tags};

		return line;
	}

	var writeOutput = function(id) {
		// Writes output to display area

		var choices = [];

		var processLines = function() {
			sadako.display_lines = [];

			var line, a;
			for (a = 0; a < sadako.lines.length; ++a) {
				line = splitTags(sadako.lines[a]);

				// add link to list to display as a choice instead of in main text
				if (has(line.tags, "choice")) {
					choices.push(line);
					continue;
				}

				sadako.display_lines.push(line);
			}
		};

		var processChoices = function() {
			sadako.display_choices = choices;

			var t = sadako.token;
			var a, line, name, link, start, end, before, after;
			for (a = 0; a < sadako.choices.length; ++a) {
				line = splitTags(sadako.choices[a].text);
				add(line.tags, "choice");

				name = sadako.parseLink(line.text);
				if (name.trim().length < 1) continue;

				start = name.indexOf(t.choice_link_open);
				before = (start === -1) ? "" : name.substring(0, start);
				if (start === -1) start = 0 - t.choice_link_open.length;

				end = name.indexOf(t.choice_link_close);
				after = (end === -1) ? "" : name.substring(end + t.choice_link_close.length);
				if (end === -1) end = name.length;

				link = name.slice(start + t.choice_link_open.length, end);

				line.text = before + sadako.writeLink(link, "sadako.doChoice(" + a + ")") + after;
				sadako.display_choices.push(line);
			}
		};

		return function() {
			// Indexes through each line and choice and outputs them to the display
			processLines();
			processChoices();

			// writing the output should always be the last step of any text processing,
			// so we'll ensure the script is set to end
			sadako.end();

			sadako.displayOutput(id);
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

	var prepareScript = function() {
		sadako.run();

		sadako.lines = [];
		sadako.choices = [];
		sadako.chosen = null;
		sadako.include_choices = false;
		sadako.in_include = false;
		sadako.in_loop = false;

		if (!sadako.in_dialog && !sadako.in_include) sadako.reveal_id = 0;
	};

	var doReturn = function() {
		doLink("" + sadako.token.page_embed + sadako.page);
	};

	var isPageTop = function() {
		if ((sadako.start === 0 || sadako.start === undefined) && (sadako.part === 0 || sadako.part === undefined)) return true;
		return false;
	};

	var getArgs = function(label) {
		var index = label.indexOf(sadako.token.jump)
		var args = "[]";
		if (index !== -1) {
			args = label.substring(index + sadako.token.jump.length).trim();
			label = label.substring(0, index).trim();
		}
		return {"label": label, "args": args};
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
			var items = splitMarkup(text, sadako.token.rename);
			if (items.length < 2) return [items[0], null, null];

			var title;
			var script = items[0].trim();
			var name = items[1].trim();
			if (items.length > 2) title = items[2].trim();

			var temp;
			if ((temp = isToken(name, sadako.token.eval_value)) !== false) name = eval(temp);
			if (title && (temp = isToken(title, sadako.token.eval_value)) !== false) title = eval(temp);

			return [script, name, title];
		}

		var doCode = function(text) {
			/* evaluates text marked with 'script' token */

			var items = doRename(text, sadako.token.eval_code);
			var script = items[0];
			var name = items[1];

			if (!name) eval(script);
			else {
				sadako.text += sadako.writeLink(name, 'eval(sadako.evals[' + (sadako.evals.length) + '])');
				sadako.evals[sadako.evals.length] = script;
			}
		}

		var doValue = function(text) {
			/* evaluates text marked with 'value' token */

			sadako.text += eval(processScript(text));
		}

		var doLabelLink = function(text) {
			/* renders a link to a label with the value of the text */

			var items = doRename(text);
			var script = items[0];
			var args = getArgs(script);
			script = args.label;

			var temp = isToken(script, sadako.token.label_embed);
			if (temp !== false) script = temp;

			if ((temp = isToken(script, sadako.token.eval_value))) script = eval(temp);
			var name = items[1] || script;

			script = localizeLabel(script);
			if (!(script in sadako.labels)) return sadako.writeLink(name, sadako.token.label_embed + script, true);

			var command = format("sadako.evals[{0}]()", sadako.evals.length);
			sadako.evals.push(function() {
				if (sadako.in_dialog) sadako.closeDialog();
				eval("sadako.args = " + args.args);
				doLink(sadako.token.label_embed + script);
			});

			return sadako.writeLink(name, command, false);
		}

		var doPageLink = function(text) {
			/* renders a link to a page with the value of the text */

			var items = doRename(text);
			var script = items[0];
			var args = getArgs(script);
			script = args.label;

			var temp = isToken(script, sadako.token.page_embed);
			if (temp !== false) script = temp;
			
			if ((temp = isToken(script, sadako.token.eval_value))) script = eval(temp);
			var name = items[1] || script;

			script = prepareLabel(script);
			if (!(script in sadako.story)) return sadako.writeLink(name, sadako.token.page_embed + script, true);

			var command = format("sadako.evals[{0}]()", sadako.evals.length);
			sadako.evals.push(function() {
				if (sadako.in_dialog) sadako.closeDialog();
				eval("sadako.args = " + args.args);
				doLink(sadako.token.page_embed + script);
			});

			return sadako.writeLink(name, command, false);
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
			var name = items[1];

			return sadako.writeReveal(name, script);
		}

		var doDialog = function(text) {
			var items = doRename(text);
			var script = items[0];
			var name = items[1];
			var title = items[2];

			// if no name is given for the action token, we close the dialog immediately
			if (!name && isToken(script, sadako.token.eval_action) !== false) {
				sadako.closeDialog();
				return "";
			}

			return sadako.writeDialog(title, name, script);
		}

		return function() {
			if (text.indexOf(sadako.token.script_open) === -1) return text;

			return parseMarkup(text, sadako.token.script_open, sadako.token.script_close, function(markup) {
				var script;
				var inside = markup.markup.slice(sadako.token.script_open.length, 0 - sadako.token.script_close.length);

				sadako.text = "";
				if ((script = isToken(inside, sadako.token.eval_code)) !== false) doCode(script);
				else if ((script = isToken(inside, sadako.token.eval_value)) !== false) doValue(script);
				else if ((script = isToken(inside, sadako.token.label_embed)) !== false) sadako.text += doLabelLink(script);
				else if ((script = isToken(inside, sadako.token.eval_input)) !== false) doInput(script);
				else if ((script = isToken(inside, sadako.token.eval_reveal)) !== false) sadako.text += doReveal(script);
				else if ((script = isToken(inside, sadako.token.eval_dialog)) !== false) sadako.text += doDialog(script);
				else sadako.text += doPageLink(inside);

				return sadako.text;
			});
		}();
	};

	sadako.writeSpan = function(class_name, text) {
		return format("<span class='{0}'>{1}</span>", class_name, text);
	};

	var replaceVars = function(text) {
		var doSimpleReplace = function(text, token, replacement) {
			var regexp = new RegExp("(^|\\s*|[^a-zA-Z0-9]+)" + token + "([a-zA-Z0-9]+(?:[\\._]?[a-zA-Z0-9]+)*)", "g");
			return text.replace(regexp, replacement);
		};

		var doComplexReplace = function(text, token, replace) {
			var collected, leading, regexp, match, markup;
			
			var before = "";
			var remaining = text;

			while (remaining) {
				leading = text.match(new RegExp("((?:^|\\s*|[^a-zA-Z0-9_]+))" + token + "([a-zA-Z0-9_]+)"));
				
				if (leading === null) {
					before += text;
					break;
				}

				before += text.substring(0, leading.index + leading[1].length);
				text = text.substring(leading[0].length + leading.index);
				collected = leading[2];

				regexp = new RegExp(/^((\.[a-zA-Z0-9_]+)|\(|\[)/);
				match = text.match(regexp);

				while (match !== null) {
					if (match[0] === "(") markup = getMarkup(text, "(", ")").markup;
					else if (match[0] === "[") markup = getMarkup(text, "[", "]").markup;
					else markup = match[0];

					collected += markup;
					text = text.substring(markup.length);
					match = text.match(regexp);
				}

				before += eval(replace + collected);
				remaining = text;
			}

			return before;
		};

		var replaceEnclosure = function(text, open, close, replacement) {
			text = parseMarkup(text, open, close, function(markup) {
				var inside = markup.markup.slice(open.length, 0 - close.length);
				return replacement(inside);
			});
			return text;
		};

		var t = sadako.token;

		text = doSimpleReplace(text, t.label_embed + t.cond_embed, function(match, p1, p2) { return p1 + 'sadako.label_seen["' + p2 + '"]'; });
		text = doSimpleReplace(text, t.page_embed + t.cond_embed, function(match, p1, p2) { return p1 + 'sadako.page_seen["' + p2 + '"]'; });

		text = doSimpleReplace(text, t.var_embed + t.cond_embed, function(match, p1, p2) { return p1 + "sadako.var." + p2; });
		text = doSimpleReplace(text, t.tmp_embed + t.cond_embed, function(match, p1, p2) { return p1 + "sadako.tmp." + p2; });
		text = doSimpleReplace(text, t.engine_embed + t.cond_embed, function(match, p1, p2) { return p1 + "sadako." + p2; });
		text = doSimpleReplace(text, t.scene_embed + t.cond_embed, function(match, p1, p2) { return p1 + 'sadako.scenes.' + p2; });

		text = doSimpleReplace(text, t.script_embed + t.cond_embed, function(match, p1, p2) {
			if (isFunc(eval("sadako.scripts." + p2))) return p1 + "sadako.scripts." + p2 + "()";
			return p1 + "sadako.scripts." + p2;
		});

		text = doSimpleReplace(text, t.label_embed + t.value_embed, function(match, p1, p2) { return p1 + sadako.label_seen[p2]; });
		text = doSimpleReplace(text, t.page_embed + t.value_embed, function(match, p1, p2) { return p1 + sadako.page_seen[p2]; });

		text = doComplexReplace(text, t.var_embed + t.value_embed, "sadako.var.");
		text = doComplexReplace(text, t.tmp_embed + t.value_embed, "sadako.tmp.");
		text = doComplexReplace(text, t.engine_embed + t.value_embed, "sadako.");
		
		text = doSimpleReplace(text, t.scene_embed + t.value_embed, function(match, p1, p2) { return p1 + eval("sadako.scenes." + p2); });
		text = doSimpleReplace(text, t.script_embed + t.value_embed, function(match, p1, p2) {
			var text;
			if (isFunc(eval("sadako.scripts." + p2))) text = eval("sadako.scripts." + p2 + "()");
			else text = eval("sadako.scripts." + p2);
			return p1 + ((text !== undefined) ? text : "");
		});

		text = replaceEnclosure(text, t.process_open, t.process_close, function(p1) {
			return "sadako.processScript(" + p1 + ")";
		});
		text = text.replace(RegExp(t.write_embed, 'g'), 'sadako.text = ');
		text = text.replace(RegExp(t.pluswrite_embed, 'g'), 'sadako.text += ');
		return text;
	};

	var processScript = function(script) {
		var doInline = function(text) {
			text = text.slice(sadako.token.inline_open.length, 0 - sadako.token.inline_close.length);

			var index = text.indexOf(sadako.token.cond);

			if (index === -1) return text;

			var cond = text.substring(0, index);
			var options = text.substring(index + sadako.token.cond.length);

			options = splitMarkup(options, sadako.token.cond);

			if (eval(cond)) return options[0];
			if (options.length < 2) return "";
			return options[1];
		}

		var doSpan = function(text) {
			text = text.slice(sadako.token.span_open.length, 0 - sadako.token.span_close.length);

			var index = text.indexOf(sadako.token.cond);

			if (index === -1) return text;

			var class_name = text.substring(0, index);
			text = text.substring(index + sadako.token.cond.length);

			return sadako.writeSpan(class_name, text);
		}

		var doMacro = function(text) {
			text = text.slice(sadako.token.macro_open.length, 0 - sadako.token.macro_close.length);

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

		var processBlocks = function(text) {
			var t = sadako.token;

			var parseBlock = function(text, open, close, func) {
				var script = getMarkup(text, open, close);
				text = text.substring(0, index) + func(script.markup) + text.substring(index + script.markup.length);

				return text;
			}

			var temp, index, script;
			var token = true;
			var pre_text = "";

			var a = 0;
			while (token) {
				a += 1;
				if (a > 10) break;

				temp = getToken(text);
				index = temp.index;
				token = temp.token;

				// we skip script blocks so we can execute them later
				// this is because they may not need to be executed depending on inline conditions.
				if (token === "script") {
					script = getMarkup(text, t.script_open, t.script_close);
					pre_text += text.substring(0, temp.index + script.markup.length);
					text = text.substring(temp.index + script.markup.length);
					continue;
				}

				if (token === "inline") text = parseBlock(text, t.inline_open, t.inline_close, doInline);
				else if (token === "span") text = parseBlock(text, t.span_open, t.span_close, doSpan);
				else if (token === "macro") text = parseBlock(text, t.macro_open, t.macro_close, doMacro);
			}
			return pre_text + text;
		}

		return function() {
			script = script.toString();
			script = replaceVars(script);
			script = processBlocks(script);

			try {
				var result = doEval(script);
				if (result === null) return "";
				return result;
			}
			catch (e) {
				console.error("\nscript:", script);
				throw new Error(e);
			}
		}();
	};

	var doChoice = function(choice) {
		/*
			Function called by choice hyperlinks.

			choice (integer): index of choice in 'sadako.choices' array
		*/

		var line = sadako.choices[choice].line;
		var chosen = sadako.choices[choice];
		var text = chosen.text;
		var label = chosen.label;

		prepareScript();

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

		sadako.evals = [];
		sadako.evals_unsafe = true;

		doScript(line[0], line[1] + "." + line[2], 0);
	};

	var localizeLabel = function(label, throw_error) {
		label = prepareLabel(label);
		if (label.indexOf(".") === -1 || !(label in sadako.labels)) label = sadako.page + "." + label;
		if (throw_error && !(label in sadako.labels)) throw new Error("Can't find label '" + label + "'");
		return label;
	}

	var getLineByLabel = function(label) {
		var temp;
		if ((temp = isToken(label, sadako.token.page_embed)) !== false) {
			label = prepareLabel(temp);
			if (!(label in sadako.story)) throw new Error("Can't find page '" + label + "'");
			return [label, 0, 0];
		}
		else {
			if ((temp = isToken(label, sadako.token.label_embed))) label = temp;
			label = localizeLabel(label, true);

			var line = sadako.labels[label];
			var token = sadako.story[line[0]][line[1]][line[2]].k;

			if (token === sadako.token.choice || token === sadako.token.static) return [line[0], line[1] + "." + line[2], 0];

			return line;
		}
	};

	var doInclude = function(label, args) {
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
			state.push(copy(sadako.args)); // don't break references
			
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
			sadako.args = state.shift();
		}

		if (sadako.script_status === END) sadako.run();

		var temp;
		if ((temp = isToken(label, sadako.token.label_embed))) label = temp;

		saveState();
		
		eval("sadako.args = " + args);
		sadako.in_include = true;
		sadako.tmp = {};
		sadako.savestate_enabled = false;
		doJump(label, true);
		restoreState();
	}

	var doLink = function(label) {
		prepareScript();
		
		sadako.jumps = [];
		sadako.tmp = {};
		sadako.conditions = [];

		var temp;
		if ((temp = isToken(label, sadako.token.label_embed))) label = temp;
		
		sadako.current = label;
		sadako.current_line = getLineByLabel(label);

		doSaveState();
		doSaveData();

		sadako.evals = [];
		sadako.evals_unsafe = true;

		doJump(label);
	};

	var prepareLabel = function(label) {
		label = label.trim();
		label = label.replace(RegExp("^([" + sadako.token.page_embed + sadako.token.label_embed + "])[\\t\\ ]*(.*)"), "$1$2");
		label = label.toLowerCase();
		label = label.replace(/'/g, "_");
		label = label.replace(/"/g, "");
		return label;
	}

	var doJump = function(label, include) {
		var line = getLineByLabel(label);
		var temp;

		if ((temp = isToken(label, sadako.token.page_embed))) sadako.page_seen[temp] += 1;
		else {
			var token = sadako.story[line[0]][line[1]][line[2]].k;
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

	var isToken = function(text, token, no_trim) {
		text = text.trimStart();
		if (text.substring(0, token.length) === token) {
			text = text.substring(token.length);
			return (no_trim) ? text : text.trimStart();
		}
		return false;
	};

	var parseLink = function(text, end) {
		if (end) {
			text = text.replace(sadako.token.choice_link_open, "");
			text = text.replace(sadako.token.choice_link_close, "");
		}

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
					if (!eval(sadako.replaceVars(check.checkStart))) continue;
				}
				else if (!check.checkStart()) continue;

				scene.isActive = true;
				scene.hasStarted += 1;
				if (check.doStart !== undefined && check.doStart !== null) {
					if (sadako.isStr(check.doStart)) eval(sadako.replaceVars(check.checkStart));
					else check.doStart();
				}
				checkScenes();
				continue;
			}
			else if (check.checkEnd !== undefined && check.checkEnd !== null) {
				if (sadako.isStr(check.checkEnd)) {
					if (!eval(sadako.replaceVars(check.checkEnd))) continue;
				}
				else if (!check.checkEnd()) continue;

				scene.isActive = false;
				scene.hasEnded += 1;
				if (check.doEnd !== undefined && check.doEnd !== null) {
					if (sadako.isStr(check.doEnd)) scene.ending = eval(processScript(check.doEnd));
					else scene.ending = check.doEnd();
				}
				if (scene.ending === undefined) scene.ending = null;
				checkScenes();
				continue;
			}
		}
	};

	var doLines = function(page, start, part, block_only) {
		/*
		Parses, evaluates, and renders a line of the script.

		page (string): page to render
		start (string): section of page to start
		part (integer): line of section to begin on (0 by default)
		block_only (bolean): if true, will only render the block at this depth and won't continue to a lower depth
		*/

		var parseJump = function(text, page, start, part) {
			var setJump = function(line) {
				sadako.cond_states.push(copy(sadako.conditions, true));
				sadako.conditions = [];

				sadako.jumps.push([copy(sadako.args), line]);
				return line;
			}

			var getJump = function() {
				sadako.conditions = sadako.cond_states.pop();

				var history = sadako.jumps.pop();
				sadako.args = history.shift();
				return history.shift();
			}

			var processReturn = function(temp) {
				if (temp in list(CONTINUE, BREAK, END, ABORT)) {
					if (sadako.in_loop) sadako.loop_result = temp;
					if (temp in list(CONTINUE, BREAK, END)) return [END];
					if (temp === ABORT) return [ABORT];
					return [NEXT];
				}
				if (temp === RETURN || (temp === BACK && sadako.history_limit < 1)) {
					sadako.current = sadako.token.page_embed + page;
					doJump(sadako.current);
					return [END];
				}
				if (temp === BACK) {
					back();
					return [NEXT];
				}
				if (sadako.jumps.length < 1) return [END];

				return [JUMP].concat(getJump());
			};

			var processPageJump = function(label, include_text) {
				var temp = getArgs(label);
				label = prepareLabel(temp.label);

				if (!(label in sadako.story)) throw new Error("Can't find page '" + label + "'");
				label = sadako.token.page_embed + label;

				if (include_text) {
					doInclude(label, temp.args);
					return [NEXT];
				}

				eval("sadako.args = " + temp.args);
				doJump(label);
				return [END];
			};

			var processLabelJump = function(label, include_text) {
				var temp;

				if ((temp = isToken(label, sadako.token.label_embed)) !== false) label = temp;

				temp = getArgs(label);
				label = temp.label;

				label = localizeLabel(label, true);

				var jump = sadako.labels[label];
				var token = sadako.story[jump[0]][jump[1]][jump[2]].k;

				if (include_text) {
					doInclude(label, temp.args);
					return [NEXT];
				}

				if (token === sadako.token.choice || token === sadako.token.static) {
					jump = [jump[0], jump[1] + "." + jump[2], 0];
					sadako.label_seen[label] += 1;
				}

				setJump([page, start, part + 1]);
				eval("sadako.args = " + temp.args);

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
			var processLoop = function(cond) {
				var looping = sadako.in_loop;
				sadako.in_loop = true;
				eval(processScript(format(
					cond + "{ " +
					"doLines('{0}', '{1}', 0, true); " +
					"sadako.script_status = RUN; " +
					"if (sadako.loop_result in sadako.list(ABORT, END, BREAK)) { sadako.loop_result = null; break; } " +
					"sadako.loop_result = null; }",
					page, start + "." + part
				)));
				sadako.in_loop = looping;
				if (sadako.loop_result === END) return [END];
				if (sadako.loop_result === ABORT) return [ABORT];
				return [NEXT];
			};

			var processFor = function(cond) {
				return processLoop("for " + cond);
			};

			var processWhile = function(cond) {
				return processLoop("while " + cond);
			};

			var processIf = function(cond, active, label) {
				sadako.conditions[active] = true;
				if (eval(cond)) {
					sadako.conditions[label] = true;
					return [JUMP, page, start + "." + part, 0];
				}
				sadako.conditions[label] = false;
				return [NEXT];
			};

			var processElseIf = function(cond, active, label) {
				if (sadako.conditions[active] === false) {
					console.error(format("'else if' found without 'if' statement.\nstory: [{0}] [{1}] [{2}]\nscript: {3}", page, start, part, sadako.story[page][start][part].text));
					return [NEXT];
				}
				sadako.conditions[active] = true;
				if (!eval(cond)) return [NEXT];
				sadako.conditions[label] = true;
				return [JUMP, page, start + "." + part, 0];
			};

			var processElse = function(active) {
				if (sadako.conditions[active] === false) {
					console.error(format("'else' found without 'if' statement.\nstory: [{0}] [{1}] [{2}]", page, start, part));
					return [NEXT];
				}
				sadako.conditions[active] = false;
				return [JUMP, page, start + "." + part, 0];
			};

			return function() {
				var temp;
				var active = [page, start].join(".");
				var label = [page, start, part].join(".");

				if (!(active in sadako.conditions)) sadako.conditions[active] = false;
				if (!(label in sadako.conditions)) sadako.conditions[label] = false;

				if ((temp = isToken(text, "for"))) return processFor(temp);
				else if ((temp = isToken(text, "while"))) return processWhile(temp);
				else if ((temp = isToken(text, "if"))) return processIf(temp, active, label);
				else if (!sadako.conditions[label]) {
					if ((temp = isToken(text, "elseif"))) return processElseIf(temp, active, label);
					else if (isToken(text, "else") !== false) return processElse(active);
				}

				return [NEXT];
			}();
		};

		var checkInlineCondition = function(line) {
			var cond_pass = true;

			if ("c" in line) cond_pass = eval(replaceVars(line.c));
			if (cond_pass) return line.t;
			return null;
		}

		var processLines = function(page, start, part) {
			var a, text, temp, temp2, token, label;

			if (!(start in sadako.story[page])) return [NEXT, page, start, null];

			sadako.page = page;

			var this_page = sadako.story[page][start];
			var choice_seen = false;

			if (part === undefined) part = 0;
			else part = parseInt(part);

			var is_choice, is_not_choice;

			for (a = part; a < this_page.length; ++a) {
				label = ("l" in this_page[a]) ? this_page[a].l : null;
				token = ("k" in this_page[a]) ? this_page[a].k : null;
				is_choice = (token === sadako.token.choice || token === sadako.token.static);
				is_not_choice = (token !== sadako.token.choice && token !== sadako.token.static);

				// processing scripts halts at choices in includes or loops
				if (is_choice && ((sadako.in_include && !sadako.include_choices) || sadako.in_loop)) return [END];

				// if choices have been listed and new line is not a choice, stop the script
				if (choice_seen === true && is_not_choice) return [END];

				// check and process scenes
				checkScenes();

				text = checkInlineCondition(this_page[a]);
				if (text === null) continue;

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
				text = processScript(text);
				if (text === null) continue;

				// if link is set to be rendered as a choice inside an include, stop the script
				if ((sadako.in_include && !sadako.include_choices) || sadako.in_loop) {
					temp = text.split(sadako.token.tag);
					temp.shift();
					if (sadako.has(temp, "choice")) return [END];
				}

				// increase label seen count as long as this isn't a choice
				if (is_not_choice && label) sadako.label_seen[label] += 1;

				// if the script block stops the script, we exit
				if (sadako.script_status !== RUN) return [sadako.script_status];

				// if jump token, process jump
				if (is_not_choice && (temp = parseJump(text, page, start, a))) {
					if (temp[0] === NEXT) continue;
					return temp;
				}

				// if condition token, process conditions
				if (token === sadako.token.cond_block) {
					temp = parseConditions(text, page, start, a);
					if (temp[0] === NEXT) continue;
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

					// if static choice token followed by jump include token, perform a choice include
					if (token === sadako.token.static && (temp = isToken(text, sadako.token.jump))) {
						if ((temp = isToken(temp, sadako.token.eval_value))) {
							var include_choices = sadako.include_choices;
							sadako.include_choices = true;

							if (!isToken(temp, sadako.token.page_embed)) {
								if ((temp2 = isToken(temp, sadako.token.label_embed))) temp = temp2;
								temp = localizeLabel(temp);
							}
							temp = getArgs(temp);
							doInclude(temp.label, temp.args);
							sadako.include_choices = include_choices;
							continue;
						}
					}

					sadako.choices.push({line: [page, start, a], text: text, label: label});

					continue;
				}

				// attempt to attach current line to previous line
				if (text.trim().length) doAttach(text);
			}

			return [(choice_seen) ? END : NEXT, page, start, a];
		}

		return function() {
			if (sadako.script_status === ABORT) return ABORT;
			if (sadako.script_status === END) return END;

			start = start || "0";


			var orig_index = [page, start].join(".");
			orig_index = orig_index.substring(0, orig_index.lastIndexOf("."));

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
					if (block_only && index.substring(0, index.lastIndexOf(".")) === orig_index) {
						return sadako.script_status;
					}

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

				writeOutput();
			}
		};

		return function() {
			if (sadako.script_status === ABORT || sadako.script_status === END) return;

			sadako.page = page;
			sadako.start = start;
			sadako.part = part;

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
			if (sad_ver[a] !== src_ver[a]) {
				console.error("Sadako Version: " + sadako.version);
				console.error("Kayako Version: " + sadako.kayako_version);
				console.error("Story Version: " + sadako.story.story_data.version);
				throw new Error("Compiled Sadako story is from an differing version of Kayako. Please recompile.");
			}
		}
	};

	sadako.init = function(story, id) {
		var initializeData = function() {
			sadako.depths = sadako.story.story_data.depths;

			// remove story data from story object to avoid possible conflicts
			delete sadako.story.story_data;

			var a, b, label;

			sadako.tags = {};
			sadako.labels = {};
			sadako.page_seen = {};
			sadako.label_seen = {};

			for (a in sadako.story) {
				// set page seen
				sadako.page_seen[a] = 0;

				if (!("tags" in sadako.story[a])) sadako.story[a].tags = {};
				sadako.tags[a] = sadako.story[a].tags;

				if (!("labels" in sadako.story[a])) sadako.story[a].labels = {};

				for (b in sadako.story[a].labels) {
					label = a + "." + b;

					// set label seen
					sadako.label_seen[label] = 0;

					// set labels array
					if (!sadako.labels[label]) sadako.labels[label] = {};
					sadako.labels[label] = sadako.story[a].labels[b];
				}
			}
		}

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

		initializeValues();

		if (id) sadako.output_id = id;
		else sadako.output_id = sadako.output_id || "#output";

		if (sadako.story !== undefined) checkVersion();
		else {
			if (isStr(story) && story.charAt(0) === "#") story = dom(story).value;
			else if (dom("#source")) story = dom("#source").value;

			if (story !== undefined) sadako.story = sadako.parseStory(story);
		}

		if (sadako.story === undefined) console.error("Sadako script not found");

		initializeData();
	};

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

		var a;
		var ids = [output_id, title_id].concat(display_ids);

		var is_valid = true;
		for (a = 0; a < ids.length; ++a) {
			if (ids[a] === undefined) continue;
			if (!dom(ids[a])) {
				console.error("Dialog ID `" + ids[a] + "` is not defined.");
				is_valid = false;
			}
		}

		if (!is_valid) return;

		sadako.dialog_ids.output = output_id;
		sadako.dialog_ids.title = title_id;
		sadako.dialog_ids.display = display_ids;
	};

	var startGame = function(page) {
		/*
			Begins the game.

			- If "page" is provided, it will start there instead of "start".
			- If autosave is enabled, it will load the autosave.

			page (string): Page to begin game on.
		*/

		if (page !== undefined) sadako.page = page;

		if (sadako.default_data === undefined || isEmpty(sadako.default_data)) sadako.default_data = copy(getCurrentState(), true);
		else loadState(sadako.default_data);

		if (!sadako.autosave_enabled) {
			if (localStorage.getItem(sadako.savename + "_savedata_auto") !== null) {
				localStorage.removeItem(sadako.savename + "_savedata_auto");
			}
		}

		loadSettings();

		sadako.current_line = [sadako.page, 0, 0];

		if (!sadako.autosave_enabled || !sadako.loadGame("auto", true)) {
			doLink("#" + sadako.page);
		}
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
	sadako.writeOutput = writeOutput
	sadako.replaceVars = replaceVars;
	sadako.saveSettings = saveSettings;
	sadako.loadSettings = loadSettings;

	// functions intended to be overridden
	// sadako.write
	// sadako.writeLink
	// sadako.writeSpan
	// sadako.doLineTag
	// sadako.doChoiceTag
	// sadako.saveGame
	// sadako.loadGame
	// sadako.freezeData
	// sadako.unfreezeData
	// sadako.clear
	// sadako.scrollToTop
	// sadako.fadeIn
	// sadako.stylizeChoices
	// sadako.displayText

	// functions made available for use in overridden functions
	sadako.prepareLabel = prepareLabel;
	sadako.splitTags = splitTags
	sadako.doChoice = doChoice;
	sadako.processScript = processScript;
	sadako.parseLink = parseLink;
	sadako.getMarkup = getMarkup;
	sadako.parseMarkup = parseMarkup;
	sadako.loadData = loadData;
	sadako.enableKeyboard = enableKeyboard;

	// convenient utility functions
	sadako.rollDice = rollDice;
	sadako.find = find;
	sadako.isDef = isDef;
	sadako.isEmpty = isEmpty;
	sadako.isFunc = isFunc;
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
