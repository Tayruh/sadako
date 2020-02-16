
	(function(sadako, game) {
		game.showInventory = function() {
			// Opens the dialog with the inventory settings.
			sadako.showDialog("Inventory", "#inventory");
		};
		
		game.showItem = function(name, page) {
			// Displays the page associated with the item. If an 'inventory'
			// label is inside the page, it'll jump to that instead.
			sadako.dom("#dialog-title").innerHTML = name;
			if ((page + ".inventory") in sadako.labels) sadako.doLink(page + ".inventory");
			else sadako.doLink("#" + page);
		};
		
		game.displayInventory = function() {
			// Writes the inventory out of the page after setting the dialog
			// window title to 'Inventory'.
			sadako.dom("#dialog-title").innerHTML = "Inventory";
			return game.listInventory();
		};
		
		game.listInventory = function() {
			// Makes a bullet list of all items in the 'items' array.
			var a, item;
			var text = "<div id='inventory' class='story-text'><ul>";
			
			for (a = 0; a < sadako.var.items.length; ++a) {
				text += "<li><span class='listed-object'>";
				item = game.items[sadako.var.items[a]];
				text += sadako.processScript(sadako.format('[:& game.showItem("{0}", "{1}") @: {2}:]', item[0], sadako.var.items[a], item[0]));
				text += "</li></span>";
			}
			if (sadako.var.items.length < 1) text = "<span class='inventory-empty'>Empty</span>";
			
			text += "</ul></div>";
			return text;
		};
		
		game.bookmark = function(label) {
			// Saves the page or label to 'bookmark' for future referencing.
			if (label === undefined) label = "#" + sadako.page;
			else if (label.indexOf(".") === -1 && label.charAt(0) !== "#") {
				label = sadako.page + "." + label;
			}
			sadako.var.bookmark = label;
		};
		
		game.useBookmark = function() {
			// Jump to the bookark.
			sadako.doLink(sadako.var.bookmark);
		}
		
		game.openSaveMenu = function() {
			// Opens the save/load menu dialog.
			sadako.showDialog("Save / Load", sadako.dom("#save-menu").innerHTML);
		};
		
		game.title = function(title, subtitle) {
			// Displays the DIV with the room title and a subtitle below it if
			// given. Also sets the bookmark to the current page.
			game.bookmark();
			sadako.var.room = sadako.page;
			var text = "";
			text += '<div id="room-title">' + title + '</div>';
			if (subtitle) text += '<div id="room-subtitle">' + subtitle + '</div>';
			// sadako.text += text;
			sadako.lines.push(text);
		};
		
		game.move = function(list_name, item) {
			// Adds an item to a list. If item is already in a list, it'll
			// remove it from that list.
			if (item in sadako.var.has_item && sadako.var.has_item) sadako.remove(sadako.var[sadako.var.has_item[item]], item);
			if (list_name !== null) sadako.add(sadako.var[list_name], item);
			sadako.var.has_item[item] = list_name;
		};
		
		game.listContents = function(list, nothing, write_links) {
			// Not used in this demo, but it will list all items inside an
			// array, and print them sentence-like list with links that lead to
			// the item's page. The value in 'nothing' will be displayed if the
			// list is empty.
			if (!list.length) return nothing;
			var a, item;
			var items = [];
			for (a = 0; a < list.length; ++a) {
				item = game.items[list[a]];
				if (write_links) items.push(item[1] + (item[1].length ? " " : "") + sadako.writeLink(item[2], 'sadako.doLink("#' + list[a] + '")'));
				else items.push(item[1] + (item[1].length ? " " : "") + item[2]); 
			}
			if (items.length === 1) return items[0];
			if (items.length === 2) return items.join(" and ");
			var last = items.pop();
			return items.join(", ") + ", and " + last;
		};
		
		window.onload = function() {
			// Initializes Sadako.
			sadako.init();
			
			// Add items array to saved variables to be used with inventory.
			sadako.var.items = [];
			
			// If you were to create another place to story items, like a desk
			// drawer, you would create an array like the one above. Then you
			// could call game.move("items", "remote"); 
			// and game.move("drawer", "remote"); to move the item from one to
			// the other.
			
			// Not used in the demo, but 'has_item' tracks which array an item
			// is currently in.
			sadako.var.has_item = {};
			
			// Define items for the game.
			game.items = {};
			game.items.remote = ["Remote", "a", "remote"];
			
			// Declares the macros. This can be used with the (: :) tag.
			sadako.macros.move = game.move;
			sadako.macros.title = game.title;
			sadako.macros.bookmark = game.bookmark;
			sadako.macros.useBookmark = game.useBookmark;
			
			// You can set how many rewinds you want to allow. Set 0 for none.
			// sadako.history_limit = 1;
			
			// You can enable autosave and autoload.
			// sadako.autosave_enabled = true;
			
			// You can adjust the text delay speed.
			// sadako.text_delay = 0;
			
			// Sadako has a 'before' and 'after' objects that contain functions
			// to be called before and after each page is displayed. It looks
			// for a member named the same as the page (for example
			// 'sadako.before.living_room'). 'ALL' is run for all pages.
			sadako.after.ALL = function() {
				
				// sadako.tags is the object contains the tags defined for each
				// page. Percent check is a utility function that returns true a
				// percentage of the time (the following returns true 20% of the
				// time).
				if ("room" in sadako.tags[sadako.page] && sadako.percentCheck(20)) {
					
					// sadako.write() is how you add new lines to the output.
					// You can either pass a single line, or an array of lines
					// and they will all be added.
					// 
					// 'randomItem' returns a single item from an array chosen
					// at random.
					sadako.write(sadako.randomItem([
						"Rain gently taps against the window.",
						"The rustling of the wind can be heard outside.",
						"Erin squees at the TV out of excitement."
					]));
				}
			};
			
			// Creates a scene for the game. A scene is an moment in time that
			// automatically begins when certain conditions are met and ends
			// when other conditions are met. When it begins and ends, a
			// function is executed, if one is defined. The condition checks are
			// performed before every line is processed.
			// 
			// The parameters for addScene are 'id', 'checkStart', 'checkEnd',
			// 'doStart', and 'doEnding'. The 'checkStart' and 'checkEnd'
			// conditions can be either a string to be evaluated (which may
			// contain sadako script) or a function that returns true when
			// conditions are met. 'doStart' and 'doEnding' are functions. 
			// 
			// In this example, we don't do anything on start, but on end we set
			// the complete flag for the game.
			sadako.addScene("waiting_for_remote", "%.erin.talked", "%.remote.gave", null, function() { sadako.var.demo_complete = true; });
			
			// Sets up the dialog window by passing it the HTML element IDs.
			// First param is the text output, second is the title of the window
			// (if it has one), and third is an array of all items to show/hide
			// when showDialog() and closeDialog() are called.
			sadako.setupDialog("#dialog-output", "#dialog-title", ["#dialog", "#overlay"]);
			
			// Setting title in the banner at the top of the page.
			sadako.dom("#banner-status").innerHTML = "A Rainy Day";
			
			// Begin the game starting with the 'init' page.
			sadako.startGame("init");
		};
	}(window.sadako, window.game = window.game || {}));
