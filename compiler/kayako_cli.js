#!/usr/bin/env node

/* global global require process */

global.window = {};

(function(sadako) {
	const fs = require('fs');
	require('./sadako.js');
	require('./kayako.js');

	global.compile = function() {
		if (process.argv.length < 3) throw new Error("No input files specified");

		var a;

		var source = "";
		var file;
		var output = "story.js";

		var id = process.argv.indexOf("-o");
		if (id === -1) id = process.argv.indexOf("--output");
		if (id !== -1) {
			if (id === process.argv.length - 1) throw new Error("Output flag found without value");
			output = process.argv[id + 1];
			process.argv.splice(id, 2)
		}
		if (process.argv.indexOf("-o") !== -1 || process.argv.indexOf("--output") !== -1) {
			throw new Error("Output should only be declared once");
		}

		try {
			for (a = 2; a < process.argv.length; ++a) {
				file = fs.readFileSync(process.argv[a]);
				source += file.toString() + "\n";
			}
		}
		catch (e) {
			throw new Error(e);
		}

		var story = sadako.parseStory(source);
		if (story === false) {
			console.log("\nCompile failed.")
			return;
		}

		story = JSON.stringify(story);
		story = "sadako.story = " + story + ";"

		try {
			fs.writeFileSync(output, story);
		}
		catch (e) {
			throw new Error(e);
		}
		console.log("Compile succeeded.");
	};
}(window.sadako = window.sadako || {}));

global.compile();
