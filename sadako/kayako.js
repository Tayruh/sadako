/* global */

(function(sadako) {
	
	var checkConflicts = function(text, token) {
		var t = sadako.token;
		var conflicts = [t.choice_format_open, t.script_open, t.comment_open, t.inline_open, t.span_open];

		var a;
		for (a = 0; a < conflicts.length; ++a) {
			if (token.length > conflicts[a].length) continue;
			if (token === conflicts[a]) continue;
			if (sadako.isToken(text, conflicts[a]) !== false) return false;
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

			if (sadako.isToken(lines[a], sadako.token.comment) !== false) continue;

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

					if (sadako.isToken(text, sadako.token.label_open) !== false && checkConflicts(text, sadako.token.label_open)) {
						label = text.substring(sadako.token.label_open.length, text.indexOf(sadako.token.label_close)).trim();
						if (label.length) {
							label = page + "." + label;
							if (label in sadako.labels) {
								console.error("Duplicate label for '" + label + "' found!");
							}
							else {
								
								sadako.labels[label] = [page, a, b];
								sadako.label_seen[label] = 0;
							}
						}
						text = text.substring(text.indexOf(sadako.token.label_close) + sadako.token.label_close.length).trimStart();
					}

					/*
					line = {
						"token": lines[a][b][2],
						"text": text //parseParts(text)
					}
					*/
					line = {"t": text };
					if (lines[a][b][2] !== null) line.k = lines[a][b][2];

					if (line.k === sadako.token.label) {
						if (text.length < 1) continue;
						if (!depth_seen) {
							depth_seen = true;
							setDepths(choices, [page, a, b]);
							choices = [];
							choice_seen = false;
						}
						
						label = page + "." + line.t.trim();
						if (label in sadako.labels) {
							console.error("Duplicate label for '" + label + "' found!");
						}
						else {
							sadako.labels[label] = [page, a, b];
							sadako.label_seen[label] = 0;
						}
					}
					else if (line.k === sadako.token.choice || line.k === sadako.token.static) {
						if (!choice_seen) {
							setDepths(choices, [page, a, b]);
							choices = [];
						}
						depth_seen = false;
						choices.push(page + "." + a + "." + b);
						choice_seen = true;
					}
					else if (line.k === sadako.token.cond_block) {
						if (sadako.isToken(text, "if") !== false) {
							setDepths(choices, [page, a, b]);
							choices = [];
							choice_seen = false;
						}
						depth_seen = false;
						choices.push(page + "." + a + "." + b);
					}
					else if (line.k === sadako.token.depth && !depth_seen) {
						depth_seen = true;
						setDepths(choices, [page, a, b]);
						choices = [];
						choice_seen = true;
					}

					if (label) line.l = label;
					if (line.k === sadako.token.choice && !label && text.length > 1) console.error(sadako.format("Choice found without associated label.\n[{0}] [{1}] [{2}]: {3}", page, a, b, text));

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
				if (sadako.isToken(text, sadako.token.comment) !== false) continue;

				lines = [];

				temp = text.split(sadako.token.script_open);
				temp2 = temp.shift().split(".,");

				for (b = 0; b < temp2.length; ++b) {
					lines = lines.concat(temp2[b].split("\n"));
				}

				for (b = 0; b < temp.length; ++b) {
					index = temp[b].indexOf(sadako.token.script_close);
					temp2 = temp[b].substring(index).split(".,");

					temp3 = [];
					for (c = 0; c < temp2.length; ++c) {
						temp3 = temp3.concat(temp2[c].split("\n"));
					}

					lines[lines.length - 1] += sadako.token.script_open + temp[b].substring(0, index) + temp3.shift();
					lines = lines.concat(temp3);
				}

				// title = text.substring(0, text.indexOf(sadako.token.line)).trim();
				title = lines.shift().trim();

				if (title.length < 1) {
					console.error("page: ", pages[a]);
					throw new Error("Invalid page title");
				}

				temp = title.split(sadako.token.tag);
				if (temp.length > 1) {
					title = temp.shift().trim();
					sadako.tags[title] = {};
					for (b = 0; b < temp.length; ++b) {
						index = temp[b].indexOf(":");
						if (index === -1) sadako.tags[title][temp[b].trim()] = true;
						else sadako.tags[title][temp[b].substring(0, index).trim()] = temp[b].substring(index + 1).trim();
					}
				}
				else sadako.tags[title] = {};

				// text = text.substring(text.indexOf(sadako.token.line) + sadako.token.line.length);
				data = parseData(lines);
				data = parseLines(data, title);
				
				if (title in storyData) console.error("Duplicate page '" + title + "' found!'");
				else storyData[title] = data;
				sadako.page_seen[title] = 0;
			}

			return storyData;
		}

		var removeComments = function(text) {
			// return text.replace(/(\/\*.*\*\/)/g, "");
			
			var before, after;

			while (text.indexOf(sadako.token.comment_open) !== -1) {
				before = text.substring(0, text.indexOf(sadako.token.comment_open));
				after = text.substring(text.indexOf(sadako.token.comment_close) + sadako.token.comment_close.length);
				text = before + after;
			}

			return text;
		}

		var parseStory = function(text) {
			// text = text.replace(/&gt;/g, '>');
			// text = text.replace(/&lt;/g, '<');
			// text = text.replace(/&amp;/g, '&');
			text = text.replace("  ", " ");
			text = removeComments(text);
			var data = parsePages(text);
			
			data["story_data"] = {
				"tags": sadako.tags,
				"labels": sadako.labels,
				"depths": sadako.depths,
				"version": sadako.kayako_version
			};
			
			return data;
		}

		return parseStory(text);
	}
	
	sadako.parseStory = parseStory;

}(window.sadako = window.sadako || {}));
