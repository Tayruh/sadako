// version: 0.10.5

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

				if (!match) items.push([depth, null, lines[a]]);
				else {
					items.push([depth].concat([match[0], match[2], lines[a]]));
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

			var a, depth;
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
		
		return function() {
			var items = [];

			items = assignTokens(lines);

			var data = assignDepths(items);

			return data;
		}();
	}
		
	var parseLines = function(lines, page) {
		var a, b;
		var data = {};
		var parts, line;

		var choices = [];
		var text, label, full_label, temp;

		var depth_seen, choice_seen;
		
		var setDepths = function(choices, depth) {
			var a;
			for (a = 0; a < choices.length; ++a) {
				sadako.depths[choices[a]] = depth;
			}
		}

		var addLabel = function() {
			full_label = page + "." + label;
			if (full_label in sadako.labels) {
				console.error("Duplicate label for '" + full_label + "' found!");
			}
			else {
				if (!data.labels) data.labels = {};
				data.labels[label] = [page, a, b]
			}
		};

		for (a in lines) {
			parts = [];

			choices = [];

			depth_seen = false;
			choice_seen = false;

			for (b = 0; b < lines[a].length; ++b) {
				text = lines[a][b][3].trimStart();

				label = null;

				if ((temp = sadako.isToken(text, sadako.token.label_open)) !== false && checkConflicts(text, sadako.token.label_open)) {
					label = temp.substring(0, temp.indexOf(sadako.token.label_close));
					text = temp.substring(label.length + 1);
					label = label.trim();
				}
				
				line = {"t": text.trim() };
				
				if (lines[a][b][2] !== null) line.k = lines[a][b][2];
				
				if (line.k === sadako.token.label) {
					if (text.length < 1) continue;
					if (!depth_seen) {
						depth_seen = true;
						setDepths(choices, [page, a, b]);
						choices = [];
						choice_seen = false;
					}
					
					label =  line.t.trim();
				}
				else if (line.k === sadako.token.choice || line.k === sadako.token.static) {
					if (!choice_seen) {
						setDepths(choices, [page, a, b]);
						choices = [];
					}
					depth_seen = false;
					choices.push(page + "." + a + "." + b);
					choice_seen = true;

					if (label && line.k === sadako.token.static && (temp = sadako.isToken(text, sadako.token.jump))) {
						if ((temp = sadako.isToken(temp, sadako.token.eval_value))) {
							console.error(sadako.format("Labels cannot be assigned to choice includes.\n[{0}] [{1}] [{2}]: {3}", page, a, b, lines[a][b][3].trim()));
							label = null;
						}
					}
				}
				else if (line.k === sadako.token.cond_block) {
					if (sadako.isToken(text, "if") !== false) {
						setDepths(choices, [page, a, b]);
						choices = [];
						choice_seen = false;
					}
					depth_seen = false;
					choices.push(page + "." + a + "." + b);

					if (label) console.error(sadako.format("Labels cannot be assigned to conditon blocks.\n[{0}] [{1}] [{2}]: {3}", page, a, b, lines[a][b][3].trim()));
					label = null;
				}
				else if (line.k === sadako.token.depth && !depth_seen) {
					depth_seen = true;
					setDepths(choices, [page, a, b]);
					choices = [];
					choice_seen = true;
				}

				if (label) {
					addLabel(label);
					line.l = full_label;
				}

				if (line.k === sadako.token.choice && !label && text.length > 1) console.error(sadako.format("Choice found without associated label.\n[{0}] [{1}] [{2}]: {3}", page, a, b, text));

				parts.push(line);
			}

			data[a] = parts;
		}

		return data;
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
						last_line = last_line.slice(0, -1).trim() + lines[a].trim();
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
			var storyData = {};
			var pages = text.split(sadako.token.page);

			var a, title, data, lines, tags;
			for (a = 0; a < pages.length; ++a) {
				text = pages[a];
				if (!text.trim().length) continue;

				lines = splitLines(text);

				// get title from first line of page
				title = lines.shift().trim();

				if (title.length < 1) {
					console.error("page: ", pages[a]);
					throw new Error("Invalid page title");
				}

				tags = getPageTags(title);
				title = tags.shift();

				data = parseData(lines);
				data = parseLines(data, title);
				if (tags.length) data.tags = tags.shift();
				
				if (title in storyData) console.error("Duplicate page '" + title + "' found!'");
				else storyData[title] = data;
				sadako.page_seen[title] = 0;
			}

			return storyData;
		}

		var removeComments = function(text) {
			var before, after;
			
			// remove comment blocks
			text = sadako.parseMarkup(text, sadako.token.comment_open, sadako.token.comment_close, function() { return ""; })
			
			var a, line;
			before = text.split("\n");
			after = [];
			
			// remove inline comments
			for (a = 0; a < before.length; ++a) {
				line = before[a].split(sadako.token.comment, 1)[0];
				if (!line.trim().length) continue;
				after.push(line);
			}
			text = after.join("\n");

			return text;
		}

		return function() {
			text = text.replace("  ", " ");
			text = removeComments(text);
			var data = parsePages(text);
			
			data["story_data"] = {
				// "tags": sadako.tags,
				"depths": sadako.depths,
				"version": sadako.kayako_version
			};
			
			return data;
		}();
	}
	
	sadako.parseStory = parseStory;

}(window.sadako = window.sadako || {}));
