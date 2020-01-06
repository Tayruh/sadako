
(function(sadako) {	

	var localStorage;
	var defaultData;
	
	
	/* Utility Functions */
	
	var dom = function(id) { 
		var temp;
		
		if ((temp = isToken(id, "#"))) return document.getElementById(temp);
		else if ((temp = isToken(id, "\\."))) return document.getElementsByClassName(temp);
	}
	
	var copy = function(list, deep) {
		var getDeepCopy = function(what) {
			var x = copy(what, true);
			if (x === null) x = what;
			return x;
		}

		var getCopy = function() {
			var a, new_list;

			if (isArray(list)) {
				new_list = [];
				for (a = 0; a < list.length; ++a) {
					if (deep === true) new_list.push(getDeepCopy(list[a]));
					else new_list.push(list[a]);
				}
			}
			else if (isObj(list)) {
				new_list = {};
				for (a in list) {
					if (deep === true) new_list[a] = getDeepCopy(list[a]);
					else new_list[a] = list[a];
				}
			}
			else new_list = null;

			return new_list;
		}

		return getCopy();
	}

	var find = function(list, func) {
		var result, x;
		if (list instanceof Array) {
			result = [];
			for (var i = 0; i < list.length; ++i) {
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
		return (val !== (void 0));
	};

	var isEmpty = function(val) {
		if (val === undefined || val === null || (!isFunc(val) && val.length === 0)) return true;

		var a;
		for (a in val) {
			return false;
		}
		return true;
	}

	var isStr = function(val) {
		return (typeof val === 'string' || val instanceof String);
	};

	var isNum = function(val) {
		return (typeof val === 'number' && !isNaN(val - 0));
	};

	var isValidNum = function(val) {
		if (isStr(val)) { return /^-?(\d|\.)+(?:e-?\d+)?$/.test(val); }
		return isNum(val);
	};

	var isArray = function(val) {
		// return (typeof val === 'array' || val instanceof Array);
		return (val instanceof Array);
	};

	var isFunc = function(val) {
		return (typeof val === 'function' || val instanceof Function);
	};

    var isObj = function(val) {
        if (isDef(val) && !isStr(val) && !isNum(val) && !isArray(val)
				&& !isFunc(val) && val !== null) {
			return true;
		}
        return false;
    };

	var getNum = function(val) {
		if (!isNum(val)) { return undefined; }
		if (isStr(val)) { return parseFloat(val); }
		return val;
	};

	var printOrDo = function(action, id, arg1, arg2) {
		if (isFunc(action)) { return action(arg1, arg2); }
		else { return action; }
	};

	var list = function() {
		// returns a list of items so you can say: if (val in l("apple", "banana", "orange"))

		var obj = {};
		for (var a = 0; a < arguments.length; ++a) {
			obj[arguments[a]] = null;
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

		var old_text;

		// 10 is the cutoff to prevent accidental infinite looping. ten deep is insane anyway
		for (var a = 0; a < 10; ++a) {
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
		var a;
		for (a = 0; a < list.length; ++a) {
			if (list[a] === id) return true;
		}
		return false;
	}
	
	var add = function(list, id) {
		if (!has(list, id)) list.push(id);
		return list;
	}

	var remove = function(list, id) { 
		var index = list.indexOf(id);
		if (index !== -1) list.splice(index, 1);
		return list;
	};
	
	var hasClass = function(id, classname) {
		return (sadako.has(dom(id).className.split(" "), classname));
	}
	
	var addClass = function(id, classname) {
		var classes = add(dom(id).className.split(" "), classname).join(" ");
		dom(id).className = classes;
		return classes;
	}
	
	var removeClass = function(id, classname) {
		var classes = remove(dom(id).className.split(" "), classname).join(" ");
		dom(id).className = classes;
		return classes;
	}

	var random = function(limit) { return Math.floor(Math.random() * Math.floor(limit)); }

	var percentCheck = function(success) {
		if (success > random(100) + 1) return true;
		return false;
	}
	
	var rollDice = function(die) {
		/*
		Simulates rolling a die.

		die (string): foramted as "2D6" (for two six-sided dice)

		returns (integer): total value of rolled die
		*/

		var dice = die.toUpperCase().split("D");

		var total = 0;
		for (var a = 0; a < dice[0]; ++a) {
			total += Math.round(Math.random()*(dice[1]-1))+1;
		}
		return total;
	}

	var randomItem = function(list) { return list[random(list.length)]; };

	var arrayToString = function(list, quote) {
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

	var saveState = function() {
		/*
		Saves important values to the state object for saving.

		- This function is called every time doScript() is called, which is
		  generally whenever a choice is clicked or a page is force loaded.

		page (string): page value
		start (string): start value

		returns (object): state object which contains the saved data
		*/

		sadako.state = {
			page: sadako.page,
			start: sadako.start,
			part: sadako.part,
			last_page: sadako.last_page,
			choices: copy(sadako.choices, true),
			choice_count: copy(sadako.choice_count, true),
			chosen: sadako.chosen,
			jumps: copy(sadako.jumps, true),
			page_seen: copy(sadako.page_seen, true),
			label_seen: copy(sadako.label_seen, true),
			conditions: copy(sadako.conditions, true),
			var: copy(sadako.var, true)
		}

		return sadako.state;
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

		var saveData = JSON.stringify(sadako.state);

		localStorage.setItem(sadako.savename + "_savedata_" + saveSlot, saveData);

		if (!no_confirm) alert("Save successful!");
	}

	var loadState = function(data, no_vars) {
		/*
		Copies values from 'data' to state object and global variables.

		- Called when manually loading or restarting.

		data (object): data containing values to copy
		*/

		sadako.state = copy(data, true);
		sadako.page = data.page;
		sadako.start = data.start;
		sadako.part = data.part;
		sadako.last_page = data.last_page;
		sadako.choices = copy(data.choices);
		sadako.choice_count = copy(data.choice_count);
		sadako.chosen = data.chosen;
		sadako.jumps = copy(data.jumps);
		sadako.page_seen = copy(data.page_seen);
		sadako.label_seen = copy(data.label_seen);
		sadako.coniditions = copy(data.conditions);
		if (!no_vars) sadako.var = copy(data.var, true);
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

		// history = [];

		loadState(JSON.parse(saveData));

		if (!no_confirm) alert("Load succesful!" );

		doScript(sadako.state.page, sadako.state.start, sadako.state.part);

		return true;
	}
	
	var back = function() {
		if (sadako.history.length > 1) sadako.history.pop(); // current thread

		var saveData = sadako.history.pop(); // previous thread
		loadState(saveData);
		
		doScript(sadako.state.page, sadako.state.start);
	}
	
	var restart = function() {
		if (localStorage.getItem(sadako.savename + "_savedata_auto") !== null) {
			localStorage.removeItem(sadako.savename + "_savedata_auto");
		}
		
		location.reload(true);
	}
	
	sadako.freezeData = function(id) {
		sadako.savestate_enabled = false;
		
		sadako.freeze_data = copy(saveState(), true);
		sadako.freeze_data.output = sadako.output_id;
		sadako.freeze_data.evals = copy(sadako.evals, true);
		
		if (id) sadako.output_id = id;
	}

	sadako.unfreezeData = function() {
		sadako.savestate_enabled = true;
		
		loadState(sadako.freeze_data, true);
		sadako.state.evals = undefined;
		sadako.evals = copy(sadako.freeze_data.evals, true);
		sadako.output_id = sadako.freeze_data.output;
		
		// clears remants when called from inside a script
		// if (sadako.in_script) {
		// 	sadako.lines = [];
		// 	sadako.choices = [];
		// 	sadako.chosen = null;
		// 	sadako.text = "";
		// }
	}
	
	
	/* Dialog */
	
	sadako.setupDialog = function(output_id, title_id, display_ids) {
		sadako.dialog_ids.output = output_id;
		sadako.dialog_ids.title = title_id;
		sadako.dialog_ids.display = display_ids;
	}
	
	sadako.closeDialog = function() {
		sadako.unfreezeData();
		
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
		
		if (sadako.dialog_ids.display && !sadako.hasClass(sadako.dialog_ids.display[0], "open")) {
			sadako.freezeData(sadako.dialog_ids.output);
		}
		
		if (sadako.dialog_ids.title) sadako.dom(sadako.dialog_ids.title).innerHTML = title;
		
		if ((temp = sadako.isToken(text, sadako.token.page_embed))) sadako.doPage(temp);
		else if ((temp = sadako.isToken(text, sadako.token.label_embed))) sadako.doLabel(temp);
		else sadako.dom(sadako.dialog_ids.output).innerHTML = text;
		
		var a;
		for (a = 0; a < sadako.dialog_ids.display.length; ++a) {
			sadako.addClass(sadako.dialog_ids.display[a], "open");
		}
	}
	
	
	/* Text Output */

	sadako.write = function(output) {
		/*
		This is function used to display text output.

		- It can be easily overwritten to display it in another manner.
		- Text is always appended to current text. Use clear() to remove existing text.

		output (string) text to write
		*/

		dom(sadako.output_id).innerHTML += output;
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
		var strip = '.split("\\n")[0]';
		var inputclass = "";
		if ((temp = isToken(script, sadako.token.input_embed)) !== false) {
			script = temp;
			strip = "";
			inputclass = 'class="multiline"';
		}
		
		var id = "input_" + sadako.evals.length;
		sadako.text += format('<label>{0}<textarea id="{1}" {2}onblur="eval(sadako.evals[{3}])"></textarea></label>', name, id, inputclass, sadako.evals.length);
		
		var command = format('{0} = sadako.dom("#{1}").value{2}.trim()', script, id, strip);
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
		
		var displayText = function(text, tags) {
			var paragraphElement = document.createElement('p');
			
			dom(sadako.output_id).appendChild(paragraphElement);

			tags.push("hide");
			
			paragraphElement.className = tags.join(" ");
			paragraphElement.innerHTML = text;

			// Fade in paragraph after a short delay
			setTimeout(function() { 
				paragraphElement.className = remove(paragraphElement.className.split(" "), "hide").join(" ");
			}, delay);
			
			delay += sadako.text_delay;
		}
		
		var writeOutput = function() {
			clear();
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
			
			if (choices.length || sadako.choices.length) {
				var text = "<hr><ul>";
				var name;
				for (a = 0; a < choices.length; ++a) {
					text += "<li class='choice'><span class='" + choices[a].tags.join(" ") + "'>" + choices[a].text + "</span></li>";
				}
				for (a = 0; a < sadako.choices.length; ++a) {
					temp = processTags(sadako.choices[a].text, sadako.doChoiceTag);

					name = sadako.parseLink(temp[0]);
					if (name.trim().length < 1) continue;
					
					text += sadako.format("<li class='choice'><span class='{0}'><a onclick='sadako.doChoice({1})'>{2}</a></span></li>", temp[1].join(" "), a, name);
				}
				text += "</ul>";
				
				displayText(text, []);
			}
		}
		
		writeOutput();
	}

	var clear = function() {
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

	var doEval = function(text) {
		/*
		This function handles the runtime evaluating of script in a line marked with the
		'tag_open' and 'tag_close' tokens.

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
			var command = 'sadako.doJump("' + script + '")';
			
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

			var command = 'sadako.doPage("' + script + '")';
			
			return sadako.writeLink(name, command, (script in sadako.story) ? false : true);
		}
		
		var doInput = function(text) {
			var items = doRename(text);
			var script = items[0];
			var name = items[1] || "";
			
			sadako.writeInput(script, name);
		}

		sadako.text = "";

		var temp = text.split(sadako.token.tag_open);
		if (temp.length < 2) return text;

		var script;
		for (var a = 0; a < temp.length; ++a) {
			var parts = temp[a].split(sadako.token.tag_close);
			// if (parts.length < 2) sadako.text += parts[0];
			// else {
			// 	if (isToken(parts[0], sadako.token.eval_code) !== false) doCode(parts[0]);
			// 	else if (isToken(parts[0], sadako.token.eval_value) !== false) doValue(parts[0]);
			// 	else if (isToken(parts[0], sadako.token.label_embed) !== false) sadako.text += doLabelLink(parts[0]);
			// 	else sadako.text += doPageLink(parts[0]);
			// 	sadako.text += parts[1];
			// }
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

			text = replaceVar(text, t.label_embed + t.value_embed, format('$1{0}{1} sadako.label_seen["$2"]{2}', t.tag_open, t.eval_value, t.tag_close));
			text = replaceVar(text, t.page_embed + t.value_embed, format('$1{0}{1} sadako.page_seen["$2"]{2}', t.tag_open, t.eval_value, t.tag_close));
			text = replaceVar(text, t.var_embed + t.value_embed, format('$1{0}{1} sadako.var.$2{2}', t.tag_open, t.eval_value, t.tag_close));
			
			text = replaceVar(text, t.tmp_embed + t.value_embed, format('$1{0}{1} sadako.tmp.$2{2}', t.tag_open, t.eval_value, t.tag_close));
			
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
			for (var a = 0; a < temp.length; ++a) {
				var temp2 = temp[a].split(sadako.token.inline_close);
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
				var pre = sadako.token.tag_open + type + " ";
				var index = text.indexOf(" ");
				if (index === -1) return pre + "sadako.macros." + text + "()" + sadako.token.tag_close;
				
				var command = text.substring(index + 1);
				text = text.substring(0, index);
				return pre + "sadako.macros." + text + "(" + command + ")" + sadako.token.tag_close;
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

		sadako.chosen = choice;
		var line = sadako.choices[choice].line;
		doScript(line[0], line[1] + "." + line[2], 0);
	}

	var doJump = function(label) {
		if (label.indexOf(".") === -1 || !(label in sadako.labels)) label = sadako.page + "." + label;
		if (!(label in sadako.labels)) throw new Error("Can't find label '" + label + "'");

		var jump = sadako.labels[label];

		var token = sadako.story[jump[0]][jump[1]][jump[2]].token;
		if (token === sadako.token.choice || token === sadako.token.static) {
			jump = [jump[0], jump[1] + "." + jump[2], 0];
			sadako.label_seen[label] += 1;
		}

		sadako.jumps = [];
		sadako.conditions = {};
		doScript(jump[0], jump[1], jump[2]);
	}
	
	var doPage = function(page) {
		sadako.jumps = [];
		sadako.conditions = {};
		doScript(page, 0, 0);
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

	var doScript = function(page, start, part) {
		/*
		Parses, evaluates, and renders a line of the script.

		page (string): page to render
		start (string): section of page to start
		*/

		var JUMP = "JUMP";
		var END = "END";
		var EXIT = "EXIT";
		var CONTINUE = "CONTINUE";

		var parseJump = function(text, page, start, part) {
			var temp;

			if ((temp = isToken(text, sadako.token.jump)) !== false) {
				var label = temp;
				if ((temp = isToken(label, sadako.token.page_embed)) !== false) {
					if (!(temp in sadako.story)) throw new Error("Can't find page '" + temp + "'");
					return [JUMP, temp, 0, 0];
				}

				var jump
				if (label.indexOf(".") === -1 || !(label in sadako.labels)) label = page + "." + label;
				if (!(label in sadako.labels)) throw new Error("Can't find label '" + label + "'");

				sadako.jumps.push([page, start, part + 1]);
				jump = sadako.labels[label];
				var token = sadako.story[jump[0]][jump[1]][jump[2]].token;
				
				if (token === sadako.token.choice || token === sadako.token.static) {
					jump = [jump[0], jump[1] + "." + jump[2], 0];
					sadako.label_seen[label] += 1;
				}
				return [JUMP].concat(jump);
			}

			if ((temp = isToken(text, sadako.token.return)) !== false) {
				if (temp === "END") return [END];
				if (temp === "EXIT") return [EXIT];
				if (temp === "RETURN" || (temp === "BACK" && sadako.history_limit < 1)) {
					sadako.page_seen[page] += 1;
					sadako.jumps = [];
					return [JUMP, page, 0, 0];
				}
				if (temp === "BACK") {
					back();
					return [CONTINUE];
				}
				if (sadako.jumps.length < 1) return [CONTINUE];
				return  [JUMP].concat(sadako.jumps.pop());
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
			}
			else if (!sadako.conditions[label] && (temp = isToken(text, "else if "))) {
				if (sadako.conditions[active] === false) {
					console.error(format("'else if' found without 'if' statement.\nstory: [{0}] [{1}] [{2}]\nscript: {3}", page, start, part, sadako.story[page][start][part].text));
					return false;
				}
				sadako.conditions[active] = true;
				if (!eval(temp)) return false;
				sadako.conditions[label] = true;
				return [JUMP, page, start + "." + part, 0];
			}
			else if (!sadako.conditions[label] && isToken(text, "else") !== false && isToken(text, "else if") === false) {
				if (sadako.conditions[active] === false) {
					console.error(format("'else' found without 'if' statement.\nstory: [{0}] [{1}] [{2}]", page, start, part));
					return false;
				}
				sadako.conditions[active] = false;
				return [JUMP, page, start + "." + part, 0];
			}
			return false;
		}

		var doAttach = function(text) {
			var line = sadako.lines[sadako.lines.length - 1];
			
			if (line === undefined) {
				sadako.lines.push(text);
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
			else sadako.lines.push(text);
		}

		var doLines = function(page, start, part) {
			var a, text, temp, token;

			if (!(start in sadako.story[page])) return [CONTINUE, page, start, null];

			sadako.page = page;

			if (sadako.last_page !== page) {
				sadako.last_page = page;
				sadako.page_seen[page] += 1;
			}

			var this_page = sadako.story[page][start];
			var choice_seen = false;

			if (part === undefined) part = 0;

			for (a = part; a < this_page.length; ++a) {
				token = this_page[a].token;
				
				if (token === sadako.token.choice || token === sadako.token.static || token === sadako.token.depth || token === sadako.token.label) {
					sadako.conditions[page + "." + start] = false;	
				}

				if (token === sadako.token.choice && sadako.choice_count[page + "." + start + "." + a]) continue;
				
				text = processScript(this_page[a].text);

				if (token === sadako.token.choice || token === sadako.token.static) {
					if (!text.length && this_page[a].text.trim().length > 1) continue;
					choice_seen = true;
				}
				else if (choice_seen === true && (token === sadako.token.depth || token === sadako.token.label || token == sadako.token.cond_block || token === null)) {
					if (sadako.choices[0].text.trim().length < 1) {
						var choice = sadako.choices[0].line;
						sadako.choice_count[choice.join(".")] += 1;
						if (sadako.choices[0].label) sadako.label_seen[sadako.choices[0].label] += 1;
						return [JUMP, choice[0], choice[1] + "." + choice[2], 0];
					}
					return [END];
				}

				if (token !== sadako.token.choice && token !== sadako.token.static && "label" in this_page[a]) sadako.label_seen[this_page[a].label] += 1;

				if (token === sadako.token.label) continue;

				if ((temp = parseJump(text, page, start, a))) return temp;
				
				if (token === sadako.token.cond_block) {
					temp = parseConditions(text, page, start, a);
					if (temp === false) continue;
					return temp;
				}

				if (token === sadako.token.choice || token === sadako.token.static) {
					sadako.choices.push({line: [page, start, a], text: text, label: this_page[a].label});
					continue;
				}

				if (text.trim().length < 1) continue;

				// text = "(" + start + "." + a + ") " + text;

				doAttach(text);
			}
			// 
			// console.log(start)
			// if (isStr(start) ** start.indexOf(".") !== -1) {
			// 	a = start.substring(start.lastIndexOf(".") + 1);
			// 	start = start.substring(0, start.lastIndexOf("."));
			// 
			// 	console.log(page, start)
			// 	console.log(sadako.story[page][start][a]);
			// 
			// 	if (sadako.story[page][start][a].token === sadako.token.cond_block) return [JUMP, page, start, parseInt(a) + 1];
			// }

			return [(choice_seen) ? END : CONTINUE, page, start, a];
		}

		var doScript = function(page, start, part) {
			scrollToTop();
			
			sadako.in_script = true;
			
			sadako.page = page;
			sadako.start = start;
			sadako.part = part;
			
			if (sadako.savestate_enabled) {
				saveState();
				if (sadako.autosave_enabled) sadako.saveGame("auto", true);
				
				if (sadako.history_limit > 0) {
					sadako.history.push(sadako.state);
					if (sadako.history.length > sadako.history_limit) {
						sadako.history.splice(0, 1);
					}
				}
			}
			
			sadako.tmp = {};
			sadako.evals = new Array();
			sadako.lines = [];

			if (start === undefined) start = 0;

			if (sadako.chosen !== null) {
				var choice = sadako.choices[sadako.chosen];
				doAttach(parseLink(choice.text, true));
				sadako.choice_count[page + "." + start] += 1;
				if (choice.label) sadako.label_seen[choice.label] += 1;
			}
			
			sadako.choices = [];
			sadako.chosen = null;

			var a, index, result;
			for (a = 0; a < 20; ++a) {
				result = doLines(page, start, part);
				
				if (result[0] === EXIT) {
					sadako.in_script = false;
					return;
				}

				if (result[0] === END) break;

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

			if (a == 20) console.error("Too many loops reached.");
			
			if (sadako.lines.length) {
				var last = sadako.lines.length - 1;
				var last_chars = sadako.lines[last].length - sadako.token.attach.length;
				if (sadako.lines[last].substring(last_chars) === sadako.token.attach) {
					sadako.lines[last] = sadako.lines[last].substring(0, last_chars);
				}
			}
			
			sadako.writeOutput();
			
			sadako.in_script = false;
		}

		doScript(page, start, part);
	}
	
	
	/* Story Preprocessing */
	
	var checkConflicts = function(text, token) {
		var t = sadako.token;
		var conflicts = [t.choice_format_open, t.tag_open, t.comment_open, t.inline_open, t.span_open];
		
		var a;
		for (a = 0; a < conflicts.length; ++a) {
			if (token.length > conflicts[a].length) continue;
			if (token === conflicts[a]) continue;
			if (isToken(text, conflicts[a]) !== false) return false;
		}
		return true;
	}

	var parseData = function(lines) {
		var countStartToken = function(text, token) {
			var match = text.match(RegExp("^((?:\\s*)" + token + ")+", "g"));			
			var count = (match) ? match[0].replace(/\s/g, "").length : 0;

			if (!match) return null;
			return [token, count, (match) ? text.substring(match[0].length) : text];
		}

		var setIndexDepth = function(text, depth) {
			var parts = text.split(".");
			var a;

			text = parts[0];
			for (a = 1; a < depth; ++a) {
				text += "." + parts[a];
			}

			return text;
		}

		var t = sadako.token;
		var tokens = [t.choice, t.static, t.depth, t.label, t.cond_block];
		
		var depth = 1;
		var items = [];

		var a, b, match;
		for (a = 0; a < lines.length; ++a) {

			lines[a] = lines[a].trimStart();

			if (!lines[a].length) continue;

			if (isToken(lines[a], sadako.token.comment) !== false) continue;

			match = null;
			// allow starting tokens to be escaped with a backslash
			if (lines[a].charAt(0) === "\\") 
				lines[a] = lines[a].substring(1);
			else {
				for (b = 0; b < tokens.length; ++b) {
					if (!checkConflicts(lines[a], tokens[b])) continue;
					match = countStartToken(lines[a], tokens[b]);
					
					if (match) break;
				}
			}

			if (match) {
				if (match[0] === sadako.token.label && match[2].trim().length < 1) continue;
				depth = match[1];
			}

			if (!match) items.push([depth, null, lines[a]]);
			else {
				items.push([depth].concat([match[0], match[2], lines[a]]));
				if (match[0] === sadako.token.choice || match[0] === sadako.token.static || match[0] === sadako.token.cond_block) depth += 1;
			}
		}

		var data = {};
		var idxstr = "0";
		var lastdepth = 1;
		var token = null;
		var fail;
		var lasttoken = null;

		for (a = 0; a < items.length; ++a) {
			depth = items[a][0];
			lasttoken = token;
			token = items[a][1];
			
			if (depth < lastdepth) idxstr = setIndexDepth(idxstr, depth);
			else if (depth > lastdepth) {
				fail = true;
				if (lasttoken === sadako.token.choice || lasttoken === sadako.token.static || lasttoken === sadako.token.cond_block) fail = false;
				if (fail || depth - lastdepth > 1) {
					console.error("Line depth difference is greater than 1:\n" + items[a][3]);
					depth = lastdepth;
					continue;
				}
				idxstr += "." + (data[idxstr].length - 1);
			}

			if (!data[idxstr]) data[idxstr] = [];
			data[idxstr].push([idxstr + "." + (data[idxstr].length - 1), depth, items[a][1], items[a][2]]);

			lastdepth = depth;
		}

		return data;
	}

	var parseStory = function(text) {

		var setDepths = function(choices, depth) {
			var a;
			for (a = 0; a < choices.length; ++a) {
				sadako.depths[choices[a]] = depth;
			}
		}

		var parseLines = function(lines, page) {
			var a, b;
			var data = {};
			var parts, line;

			var choices = [];
			var text, label;

			var depth_seen, choice_seen;

			for (a in lines) {
				parts = [];

				choices = [];

				depth_seen = false;
				choice_seen = false;

				for (b = 0; b < lines[a].length; ++b) {
					text = lines[a][b][3].trimStart();

					label = null;

					if (isToken(text, sadako.token.label_open) !== false && checkConflicts(text, sadako.token.label_open)) {
						label = text.substring(sadako.token.label_open.length, text.indexOf(sadako.token.label_close)).trim();
						if (label.length) {
							label = page + "." + label;
							sadako.labels[label] = [page, a, b];
							sadako.label_seen[label] = 0;
						}
						text = text.substring(text.indexOf(sadako.token.label_close) + sadako.token.label_close.length).trimStart();
					}

					line = {
						"token": lines[a][b][2],
						"text": text //parseParts(text)
					}

					if (line.token === sadako.token.label) {
						if (text.length < 1) continue;
						if (!depth_seen) {
							depth_seen = true;
							setDepths(choices, [page, a, b]);
							choices = [];
							choice_seen = false;
						}

						label = page + "." + line.text.trim();
						sadako.labels[label] = [page, a, b];
						sadako.label_seen[label] = 0;
					}
					else if (line.token === sadako.token.choice || line.token === sadako.token.static) {
						if (!choice_seen) {
							setDepths(choices, [page, a, b]);
							choices = [];
						}
						depth_seen = false;
						choices.push(page + "." + a + "." + b);
						sadako.choice_count[page + "." + a + "." + b] = 0;
						choice_seen = true;
					}
					else if (line.token === sadako.token.cond_block) {
						if (isToken(text, "if") !== false) {
							setDepths(choices, [page, a, b]);
							choices = [];
							choice_seen = false;
						}
						depth_seen = false;
						choices.push(page + "." + a + "." + b);
					}
					else if (line.token === sadako.token.depth && !depth_seen) {
						depth_seen = true;
						setDepths(choices, [page, a, b]);
						choices = [];
						choice_seen = true;
					}

					if (label) line.label = label;

					parts.push(line);
				}

				data[a] = parts;
			}

			return data;
		}

		var parsePages = function(text) {
			
			var storyData = {};
			var pages = text.split(sadako.token.page);

			var a, b, c, title, data, temp, temp2, temp3, index, lines;
			for (a = 0; a < pages.length; ++a) {
				text = pages[a];
				if (!text.trim().length) continue;
				
				lines = [];
				
				temp = text.split(sadako.token.tag_open);
				temp2 = temp.shift().split(".,");
				
				for (b = 0; b < temp2.length; ++b) {
					lines = lines.concat(temp2[b].split("\n"));
				}
				
				for (b = 0; b < temp.length; ++b) {
					index = temp[b].indexOf(sadako.token.tag_close);
					temp2 = temp[b].substring(index).split(".,");
					
					temp3 = [];
					for (c = 0; c < temp2.length; ++c) {
						temp3 = temp3.concat(temp2[c].split("\n"));
					}
					
					lines[lines.length - 1] += sadako.token.tag_open + temp[b].substring(0, index) + temp3.shift();
					lines = lines.concat(temp3);
				}

				// title = text.substring(0, text.indexOf(sadako.token.line)).trim();
				title = lines.shift().trim();

				if (title.length < 1) {
					console.error("page: ", pages[a]);
					throw new Error("Invalid page title");
				}

				// text = text.substring(text.indexOf(sadako.token.line) + sadako.token.line.length);
				data = parseData(lines);
				data = parseLines(data, title);
				storyData[title] = data;
				sadako.page_seen[title] = 0;
			}

			return storyData;
		}

		var removeComments = function(text) {
			var before, after;

			while (text.indexOf(sadako.token.comment_open) !== -1) {
				before = text.substring(0, text.indexOf(sadako.token.comment_open));
				after = text.substring(text.indexOf(sadako.token.comment_close) + sadako.token.comment_close.length);
				text = before + after;
			}

			return text;
		}

		var parseStory = function(text) {
			text = text.replace(/&gt;/g, '>');
			text = text.replace(/&lt;/g, '<');
			text = text.replace(/&amp;/g, '&');
			// eslint-disable-next-line no-useless-escape
			// text = text.replace(/\s*([^\s\ ]+\ ?)\s*/gm, '$1');
			// eslint-disable-next-line no-useless-escape
			// text = text.replace(/^\s*([^\s ]\ )*/gm, '');
			text = text.replace("  ", " ");
			text = removeComments(text);
			var data = parsePages(text);
			return data;
		}

		return parseStory(text);
	}

	
	/* Initialization */
	
	var startGame = function(page) {
		if (page !== undefined) sadako.page = page;

		if (defaultData === undefined) {
			defaultData = copy(saveState(), true);
		}
		else loadState(defaultData);

		if (!sadako.autosave_enabled) {
			if (localStorage.getItem(sadako.savename + "_savedata_auto") !== null) {
				localStorage.removeItem(sadako.savename + "_savedata_auto");
			}
		}
		
		if (!sadako.autosave_enabled || !sadako.loadGame("auto", true)) doScript(sadako.page);
	}

	sadako.init = function(story, id) {
		sadako.token = {
			"line": ".,",
			"cond": "::",
			"tag_open": "[:",
			"tag_close": ":]",
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
			"tag": "*:",
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
		}

		// global variables intended to changed
		sadako.savename = "sadako";
		sadako.text_delay = 150.0;
		sadako.output_id = id || "#output";
		sadako.autosave_enabled = false;

		// global variables not saved to state
		sadako.tmp = {};
		sadako.evals = [];
		sadako.story = {};
		sadako.labels = {};
		sadako.depths = [];
		sadako.lines = [];
		sadako.history = [];
		sadako.history_limit = 10;
		sadako.state = {};
		sadako.savestate_enabled = true;
		sadako.freeze_data = {};
		sadako.in_script = false;
		sadako.dialog_ids = {};
		sadako.onDialogClose = null;
		sadako.macros = {};

		// global variables saved to state
		sadako.page = "1";
		sadako.start = 0;
		sadako.part = 0;
		sadako.last_page = "";
		sadako.page_seen = {};
		sadako.choice_count = {};
		sadako.label_seen = {};
		sadako.var = {};
		sadako.jumps = [];
		sadako.choices = [];
		sadako.chosen = null;
		sadako.conditions = {};

		// functions intended to be used as-is
		sadako.doPage = doPage;
		sadako.doJump = doJump;
		sadako.back = back;
		sadako.startGame = startGame;
		sadako.restart = restart;
		sadako.refresh = refresh;
		sadako.isToken = isToken;
		
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
		
		// functions made available for use in overridden functions
		sadako.clear = clear;
		sadako.processTags = processTags;
		sadako.doChoice = doChoice;
		sadako.processScript = processScript;
		sadako.parseStory = parseStory;
		sadako.parseLink = parseLink;

		// convenient utilitity functions
		sadako.rollDice = rollDice;
		sadako.find = find;
		sadako.isEmpty = isEmpty;
		sadako.isValidNum = isValidNum;
		sadako.getNum = getNum;
		sadako.printOrDo = printOrDo;
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
		sadako.randomItem = randomItem;
		sadako.arrayToString = arrayToString;
		sadako.cap = cap;
		sadako.dom = dom;
		sadako.scrollToTop = scrollToTop;

		// Edge browser calls trimStart "trimLeft" and IE doesn't have either
		if (String.prototype.trimStart === undefined) {
			String.prototype.trimStart = String.prototype.trimLeft || function() { return this.replace(/^\s*/, ''); };
		}
		
		checkLocalStorage();

		if (isStr(story)) {
			if (story.charAt(0) === "#") story = dom(story).innerHTML;
		}
		else if (dom("#source")) story = dom("#source").innerHTML;
		
		if (story !== undefined) sadako.story = parseStory(story);
	}

}(window.sadako = window.sadako || {}));
