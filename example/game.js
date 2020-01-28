
	(function(sadako, game) {
		game.showInventory = function() {
			sadako.showDialog("Inventory", "#inventory");
		}

		game.showItem = function(name, page) {
			sadako.dom("#dialog-title").innerHTML = name;
			if ((page + ".inventory") in sadako.labels) sadako.doLink(page + ".inventory");
			else sadako.doLink("#" + page);
		}

		game.listInventory = function() {
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
		}

		game.openSaveMenu = function() {
			sadako.showDialog("Save / Load", sadako.dom("#save-menu").innerHTML);
		}

		game.title = function(title, subtitle) {
			sadako.var.room = sadako.page;
			sadako.text += '<div id="room-title">' + title + '</div>';
			if (subtitle) sadako.text += '<div id="room-subtitle">' + subtitle + '</div>';
		}

		window.onload = function() {
			sadako.init();

			sadako.var.items = [];

			game.items = {};
			game.items.cloak = ["Cloak", "cloak"];

			sadako.macros.title = game.title;

			// sadako.history_limit = 5;
			// sadako.autosave_enabled = true;
			// sadako.text_delay = 0;

			sadako.setupDialog("#dialog-output", "#dialog-title", ["#dialog", "#overlay"]);

			sadako.dom("#banner-status").innerHTML = "Cloak of Darkness";

			sadako.startGame("init");
		};
	}(window.sadako, window.game = window.game || {}));
