// version: 0.10.14

(function(sadako) {

	var story_depths = {};
	var compile_success = true;
	var current_page;
	var current_label;

	var doError = function(text) {
		console.error(text);
		compile_success = false;
	};

	var checkConflicts = function(text, token) {
		var t = sadako.token;
		var conflicts = [t.tag, t.choice_format_open, t.script_open, t.comment_open, t.inline_open, t.span_open, t.comment_close, (t.scene_embed + t.value_embed)];

		var a;
		for (a = 0; a < conflicts.length; ++a) {
			if (token.length > conflicts[a].length) continue;
			if (token === conflicts[a]) continue;
			if (sadako.isToken(text, conflicts[a].replace("\\", "")) !== false) return false;
		}
		return true;
	}

	var parseData = function(lines) {
		var t = sadako.token;
		var tokens = [t.choice, t.static, t.depth, t.label, t.cond_block];

		var countStartToken = function(text, token) {
			var match = text.match(RegExp("^((?:\\s*)" + token + ")+", "g"));
			var count = (match) ? match[0].replace(/\s/g, "").length : 0;

			if (!match) return null;
			return [token, count, (match) ? text.substring(match[0].length) : text];
		}

		var assignTokens = function(lines) {
			var a, b, match;
			var depth = 1;

			var items = [];
			for (a = 0; a < lines.length; ++a) {

				lines[a] = lines[a].trimStart();

				if (!lines[a].length) continue;

				match = null;
				// allow starting tokens to be escaped
				if (lines[a].charAt(0) === sadako.token.escape)
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

				if (!match) items.push({"depth": depth, "token": null, "text": lines[a]});
				else {
					items.push({"depth": depth, "token": match[0], "text": match[2], "full": lines[a]});
					if (match[0] === sadako.token.choice || match[0] === sadako.token.static || match[0] === sadako.token.cond_block) depth += 1;
				}
			}

			return items;
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

		var assignDepths = function(items) {
			var data = {};
			var idxstr = "0";
			var lastdepth = 1;
			var token = null;
			var fail;
			var lasttoken = null;

			current_label = "";

			var a, depth;
			for (a = 0; a < items.length; ++a) {
				depth = items[a].depth;
				lasttoken = token;
				token = items[a].token;
				if (token === sadako.token.label) current_label = "." + items[a].text;

				if (depth < lastdepth) idxstr = setIndexDepth(idxstr, depth);
				else if (depth > lastdepth) {
					fail = true;
					if (lasttoken === sadako.token.choice || lasttoken === sadako.token.static || lasttoken === sadako.token.cond_block) fail = false;
					if (fail || depth - lastdepth > 1) {
						return doError(sadako.format("Line depth incremented from {0} to {1} before change in depth:\nlocation: {2}\nline: {3}", lastdepth, depth, (current_page + current_label), items[a].full));
					}
					idxstr += "." + (data[idxstr].length - 1);
				}

				if (!data[idxstr]) data[idxstr] = [];
				data[idxstr].push({"token": items[a].token, "text": items[a].text, "full": items[a].full});

				lastdepth = depth;
			}

			return data;
		}

		return function() {
			var items = assignTokens(lines);
			return assignDepths(items);
		}();
	}

	var parseLines = function(lines, page) {
		var a, b;
		var data = {};
		var parts, line, cond;

		var choices, choice_seen;

		var text, label, full_label, temp, temp2;

		var setDepths = function(depth) {
			choice_seen = false;
			if (choices.length < 1) return;

			var a;
			for (a = 0; a < choices.length; ++a) {
				story_depths[choices[a]] = depth;
			}
			choices = [];
		}

		var addLabel = function(label) {
			label = sadako.prepareLabel(label);
			full_label = page + "." + label;
			if (!data.labels) data.labels = {};
			if (label in data.labels) return doError("Duplicate label for '" + full_label + "' found.");
			return label;
		};

		var getConditions = function(script) {
			var index = script.lastIndexOf(sadako.token.cond);
			var inline_index = script.lastIndexOf(sadako.token.inline_close);
			var span_index = script.lastIndexOf(sadako.token.span_close);
			var macro_index = script.lastIndexOf(sadako.token.macro_close);
			var script_index = script.lastIndexOf(sadako.token.script_close);

			// make sure condition token is after all blocks
			if (index < inline_index || index < span_index || index < macro_index || index < script_index) index = -1;

			if (index !== -1) {
				return {
					"script": script.substring(0, index).trim(), 
					"cond": script.substring(index + sadako.token.cond.length).trim()
				};
			}
			return {"script": script, "cond": ""};
		}

		return function() {
			for (a in lines) {
				parts = [];
				choice_seen = false;
				choices = [];
				current_label = "";

				for (b = 0; b < lines[a].length; ++b) {
					text = lines[a][b].text.trimStart();

					label = null;

					if ((temp = sadako.isToken(text, sadako.token.label_open)) !== false && checkConflicts(text, sadako.token.label_open)) {
						label = temp.substring(0, temp.indexOf(sadako.token.label_close));
						text = temp.substring(label.length + 1);
						label = label.trim();
					}

					line = {"t": text.trim() };

					if (lines[a][b].token !== null) line.k = lines[a][b].token;

					if (line.k === sadako.token.label) {
						if (text.length < 1) continue;
						setDepths([page, a, b]);
						label =  line.t.trim();
						current_label = "." + label;
					}
					else if (line.k === sadako.token.choice || line.k === sadako.token.static) {
						if (!choice_seen) {
							setDepths([page, a, b]);
							choice_seen = true;
						}
						choices.push(page + "." + a + "." + b);

						if (label && line.k === sadako.token.static && (temp = sadako.isToken(text, sadako.token.jump))) {
							if ((temp = sadako.isToken(temp, sadako.token.eval_value))) {
								return doError(sadako.format("Labels cannot be assigned to choice includes:\nlocation: {0}\nline: {1}", current_page + current_label, lines[a][b].full.trim()));
							}
						}
					}
					else if (line.k === sadako.token.cond_block) {
						temp = text.match(RegExp("^(?:\\s*)(\\w+)", "g"))[0].toLowerCase();
						text = text.substring(temp.length).trim();
						temp = temp.trim();

						if (temp === "else" && text.length) {
							temp2 = text.match(RegExp("^(?:\\s*)(\\w+)", "g"))[0].toLowerCase();
							if (temp2.trim() === "if") {
								text = text.substring(temp2.length).trim();
								temp = "elseif";
							}
							else {
								return doError(sadako.format("Condition block must begin with: if, else, else if, for, or while:\nlocation: {0}\nline: {1}", current_page + current_label, lines[a][b].full.trim()));
							}
						}
						else if (!(temp in sadako.list("if", "else", "elseif", "for", "while"))) {
							return doError(sadako.format("Condition block must begin with: if, else, else if, for, or while:\nlocation: {0}\nline: {1}", current_page + current_label, lines[a][b].full.trim()));
						}
						line.t = temp + " " + text;

						if (temp !== "else" && temp !== "elseif") setDepths([page, a, b]);
						choices.push(page + "." + a + "." + b);

						if (label) {
							return doError(sadako.format("Labels cannot be assigned to conditon blocks:\nlocation: {0}\nline: {1}", current_page + current_label, lines[a][b].full.trim()));
						}
						label = null;
					}
					else if (line.k === sadako.token.depth) {
						setDepths([page, a, b]);
					}

					if (label && (label = addLabel(label))) {
						if (!data.labels) data.labels = {};
						data.labels[label] = [page, a, b];
						line.l = full_label;
						if (line.k === sadako.token.label) line.t = label;
					}

					if (line.k === sadako.token.choice && !label && line.t.length > 1) {
						return doError(sadako.format("Choice found without associated label:\nlocation: {0}\nline: {1}", current_page + current_label, lines[a][b].full.trim()));
					}

					if (line.t.length > 1 && line.k !== sadako.token.choice && line.k !== sadako.token.static && (temp = sadako.isToken(line.t, sadako.token.return))) line.t = sadako.token.return + " " + temp.toLowerCase();

					cond = getConditions(line.t);
					line.t = cond.script;
					if (cond.cond) line.c = cond.cond;

					parts.push(line);
				}

				data[a] = parts;
			}

			return data;
		}();
	}

	var parseStory = function(text) {
		var splitLines = function(text) {
			/*
				Splits lines by line breaks and line tokens while maintaining
				line breaks and line tokens inside script blocks
			*/

			var lines = [""];

			var doSplit = function(text) {
				var token = new RegExp(sadako.token.line, 'g');
				text = text.replace(token, "\n");
				return text.split("\n");
			}

			var trimMarkup = function(text) {
				// trimes the markup lines to save space in JSON

				var temp = text.split("\n");
				var trimmed_lines = [];
				for (a = 0; a < temp.length; ++a) {
					if (!temp[a].length) continue;
					trimmed_lines.push(temp[a].trim());
				}

				return trimmed_lines.join("\n");
			}

			var concatLines = function(lines) {
				// adds lines together that end with the escape token

				var a, last_line;
				var temp = [lines.shift().trim()];

				for (a = 0; a < lines.length; ++a) {
					last_line = temp[temp.length - 1];

					if (last_line.charAt(last_line.length - 1) === sadako.token.escape) {
						last_line = last_line.slice(0, -1).trimStart() + lines[a].trim();
						temp[temp.length - 1] = last_line
						continue;
					}

					temp.push(lines[a].trim())
				}

				return temp;
			}

			var temp = sadako.getMarkup(text, sadako.token.script_open, sadako.token.script_close);
			var current;

			var a;
			while (temp.markup.trim().length) {
				current = doSplit(temp.before);

				lines[lines.length - 1] += current.shift();
				lines = lines.concat(current);
				lines[lines.length - 1] += trimMarkup(temp.markup);

				temp = sadako.getMarkup(temp.after, sadako.token.script_open, sadako.token.script_close);
			}

			current = doSplit(temp.after);
			lines[lines.length - 1] += current.shift();
			lines = lines.concat(current);

			lines = concatLines(lines);

			return lines;
		}

		var getPageTags = function(title) {
			var temp, a, index;
			temp = title.split(sadako.token.tag);
			var tags;
			if (temp.length > 1) {
				title = temp.shift().trim();
				for (a = 0; a < temp.length; ++a) {
					index = temp[a].indexOf(":");
					if (!tags) tags = {};
					if (index === -1) tags[temp[a].trim()] = true;
					else tags[temp[a].substring(0, index).trim()] = temp[a].substring(index + 1).trim();
				}
			}
			return [title, tags];
		}

		var parsePages = function(text) {
			var story_data = {};
			var pages = text.split(sadako.token.page);
			var current_line;

			var a, title, data, lines, tags;
			for (a = 0; a < pages.length; ++a) {
				text = pages[a];
				if (!text.trim().length) continue;

				lines = splitLines(text);

				// get title from first line of page
				title = lines.shift().trim();
				current_line = title;
				tags = getPageTags(title);
				title = tags.shift();
				title = sadako.prepareLabel(title);
				current_page = title;

				if (!title.length) return doError("Invalid page title:\npage: " + current_line);

				data = parseData(lines);
				data = parseLines(data, title);
				if (!compile_success) return;
				if (tags.length) data.tags = tags.shift();

				if (title in story_data) return doError("Duplicate page found: " + title + "\nline: " + current_line);
				else story_data[title] = data;
			}

			return story_data;
		}

		var removeComments = function(text) {
			var before, after;

			// remove comment blocks
			text = sadako.parseMarkup(text, sadako.token.comment_open, sadako.token.comment_close, function() { return ""; })

			var a; //, line;
			before = text.split("\n");
			after = [];

			// remove inline comments
			for (a = 0; a < before.length; ++a) {
				if (sadako.isToken(before[a], sadako.token.comment)) continue;
				after.push(before[a]);
			}
			text = after.join("\n");

			return text;
		}

		return function() {
			while (text.indexOf("  ") !== -1) text = text.replace("  ", " ");
			text = removeComments(text);
			var data = parsePages(text);

			if (!compile_success) return false;

			data["story_data"] = {
				"depths": story_depths,
				"version": sadako.kayako_version
			};

			return data;
		}();
	}

	sadako.parseStory = parseStory;

}(window.sadako = window.sadako || {}));