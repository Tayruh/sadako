# Javascript Reference

### Saving

**Sadako** provides two methods for saving and they can be used interchangeably.

The first method is autosaving which can be toggled on and off by means of the boolean `sadako.autosave_enabled`. When set to `true`, the game will automatically save every time a choice is selected, a link redirecting to a page or passage is clicked, `sadako.doLink()` is called, or a choice is selected when it has an associated label. Refreshing the page or calling `sadako.startGame()` is will automatically load the save. `sadako.restart()` deletes the autosave before restarting.

### History

**Sadako** allows you to rewind choices and story navigation. This is independent of the save system. The biggest difference is you can rewind to previous choices that don't have a label. A label is necessary for saving to work on choices.

You can limit the amount of history states with `sadako.history_limit`. The default is `10`. You can disable rewinding the history altogether by setting the value to `0`.

### Variables

#### sadako.savename

String containing filename of saves. Default is `sadako`, which saves the file as `sadako_savedata_1`, `sadako_savedata_auto`, etc.

#### sadako.text_delay

Float value containing milliseconds to delay the displaying of each paragraph.

#### sadako.output_id

String containing the HTML element ID to output the story text to. Value must begin with a `#`. Default value is `#output`.

#### sadako.tags

Object list containing tags associated with pages.

For example, `## page1 ~:title:Page 1 ~:outside` would become:

```
sadako.tags["page1"] = {
    "title": "Page 1", 
    "outside": true
};
```

#### sadako.page_seen

Object list containing count of how many times a page has been seen.

Example:
```
// javascript
sadako.page_seen["page1"]

// sadadko script
#.page1
```

#### sadako.label_seen

Object list containing count of how many times a label has been seen.

Example:
```
// javascript
sadako.label_seen["kitchen.drawer"]

// sadako script
%.kitchen.drawer
```

#### sadako.macros

Object list containing functions associated with sadako script `(:` `:)` macro tags.

```
// javascript
sadako.macros.add = function(x, y) { sadako.write(x + y); }

// sadako script
(:add 1, 2:)
```

The above macro would write `"3"` to the output text.


#### sadako.in_include

Returns `true` if the script is currently being run inside included script, and `false` if not. Script is included if it is displayed with `[:+# :]` or `[:+% :]` reveal tokens, the `>>=` include token, or the `sadako.doInclude()` function.


#### sadako.in_dialog

Returns `true` if the script is currently being run inside a dialog window, and `false` if not.

#### sadako.onDialogClose

If defined, this function will be called when the dialog is closed. The function is cleared automatically by default. If you wish to retain this function, return `true`.

```
sadako.onDialogClose = function() {
    sadako.doLink("#page2");
    return true; // prevents dialog close function from being cleared
}
```

#### sadako.page

The page that the script is currently on.

#### sadako.var

The variable object that holds the user variables and is saved to the save file.

`sadako.var.bleh` is the same as `$.bleh` in sadako script. Use `$:bleh` to write its value into the output.

#### sadako.tmp

The variable object that holds the temporary user variables. This is not saved and the object will be cleared once a link is clicked or a choice is selected.

`sadako.tmp.bleh` is the same as `_.bleh` in sadako script. Use `_:bleh` to write its value into the output.

#### sadako.before

An object list of functions. Before rendering any story script in a choice, page, or label section, the function named after that page will run. A function called `ALL` will run for every page. A useful function to work alongside this one is `sadako.isPageTop()`, which checks to see if you're on a fresh page (ie. not having jumped to a label section or inside a choice section).

```
sadako.before.kitchen = function() {
    if (sadako.isPageTop()) sadako.write("The dishwaher is humming away.");
};

sadako.before.ALL = function() {
     if ("snowing" in sadako.tags[sadako.page]) sadako.write("The snow falls gently around you.");
}
```

#### sadako.after

Same concept as `sadako.before`, except it is only called after the final story script section has rendered. In other words, it's only called once and only for the page where the scripts ends on.


#### sadako.autosave_enabled

Saves state to an autosave save slot if set to `true`. Default is `false`.

Autosave is saved whenever possible (see `Saving` details above) and reloaded automatically when the game starts if the value is set to `true`.

### Functions

There are not many functions that you need to run **Sadako**. In fact, the only two you absolutely *need* are `sadako.init()` and `sadako.startGame()` as mentioned above. However, there are a few you may use often to enhance the capability of your script, and also a handful of helper functions for convenience.


#### sadako.init()

This function must be called before anything. It initializes **Sadako**. 

Arguments:

* `story` (string): If given, this string can either be the ID of the HTML element (preferably a `textarea`) to take the script from, or a string containing the script itself. By default, the value is `#source`, so **Sadako** grabs the story from that HTML element. If `sadako.story` is already defined, this value is ignored.
* `id` (string): If given, it is the ID of the HTML element to use for output. Otherwise it uses the value in `sadako.output_id`.


#### sadako.startGame()

Begins the game. If "page" is provided, it will start there instead of `"start"`. If autosave is enabled, it will load the autosave.

Arguments:

* page (string): Page to begin game on.

#### sadako.saveGame()

Saves the game to local storage.

Arguments:

* `saveSlot` (integer): Value to differentiate between different saves storedlocally
* `no_confirm` (boolean): `true`: prevents notifications on success or fail, `false`: allows notifications

#### sadako.loadGame()

Loads the data from local storage. Returns `true` if loaded successfully, false if not.

Arguments:

* `loadSlot` (integer): Value to differentiate between different saves stored locally
* `no_confirm` (boolean): `true`: prevents notifications on success or fail, `false`: allows notifications

#### sadako.write()

Adds text to the lines array to be queued for output. This is the simplest way to write to the output outside of sadako script. If inside a sadako script `[: :]` script block, you can use the `~~=` and `~~+` tokens to write to the output instead.

Arguments:

* `output` (string or array): String or array of strings to added to output.

#### sadako.addChoice()

Adds a choice to the global choice array.

Arguments:

* `name` (string): Choice text. Be aware that formatting using `[ ]` will not work.
* `command` (string): String to evaluate when choice is selected
* `tags` (string): A string of classes in script format. example: `"~:class:completed ~:title:blargh"`

#### sadako.writeOutput()

Writes everything in the global lines array and choices array to the output. If `sadako.write()` and `sadako.addChoice()` are being used outside of sadako script (ie. in a javascript file), this function must be called for the output to display.

`sadako.end()` is called at the end of this function to guarantee that the script is placed into a "waiting" state. In other words, always call this function as the last step of your processing.

#### sadako.overwrite()

Rewrites the output, along with adding choices if given. Global lines and choices arrays are written to the output.

Arguments:

* `text` (string or array): text or array of text to display
* `choices` (array): array of choice arrays to pass to the `addChoice()` function. A single choice is an array containing the arguments passed to `sadako.addChoice()`. See the `addChoice()` function for more details.

Example:
```
sadako.overwrite("Test string", [["choice 1", "alert('hello world')"], ["choice 2", "sadako.doLink('#page2')", "~:class:info"]]);
```

#### sadako.writeLink()

Returns an html link that executes the command on click.

Arguments:

* `name` (string): Link name
* `command` (string): Javascript command to be evaluated on click. 
If the command begins with `#` (ie. `#page2`) or `%` (ie. `%page2.test`), it will jump to that page or label using `sadako.doLink()`. If the page or label does not exist, `broken` will be set to `true`.
* `broken` (boolean): If `true`, displays the link using the `broken` class. Not required.

#### sadako.writeReveal()

Returns an html link that will display the rendered in command when clicked.

The command is structured the same as the `[:+ :]` reveal token. That is, it includes pages and labels if the command is preprended with a `#` page or `%` label token, will evaluate script before displaying its output with a `=` eval token, and a `&` code token will repeatedly call the script and replace the link name with each click. See the [reference](reference.md#reveal-links) for more details.

Arguments:

* `name` (string): Link name to be displayed. This will be the text that will be replaced.
* `command` (script): The script command.

Returns:

* (string): Text containing HTML link.

#### sadako.writeDialog()

Returns an html link that will display the dialog window when clicked.

The command is structured the same as the `[:* :]` dialog token. That is, it includes pages and labels if the command is preprended with a `#` page or `%` label token, will evaluate script before displaying its output with a `=` eval token, a `&` code token will display an empty window before processing the script, and a `!` action token will close the dialog window. See the [reference](reference.md#dialog-links) for more details.

Arguments:

* `name` (string): Link name to be displayed.
* `command` (script): The script command.

Returns:

* (string): Text containing HTML link.

#### sadako.doLink()

This is the function called when clicking on a link created by a script block that leads to a page or label. Calling the function for javascript acts the same way: it clears the output, creates a save state, create a history state, redirects to the page or label, and increases its `page_seen` or `label_seen`count.

Arguments:

* `label` (string): Page or label to jump to. Page must begin with `#`. A label can begin with `%` but is not required.

#### sadako.doInclude()

The javascript equivalent of the `>>=` include token. Includes a page or label into the script and continues processing the rest of the current script without redirecting to that page or label.

Arguments:

* `label` (string) The page or label to include. Pages should be prefixed with `#` and labels with `%`. Will default to a label if no token is specified.

#### sadako.processScript(text)

This function renders the script tags inside a string as its equivalent HTML and javascript. This does not work correctly with depth tokens like `-`, `=`, `~`, `*`, and `+`, since they are rendered at compile time.

Arguments:

* `text` (string): Text to be processed.

Returns:

* (string): HTML string resulting from sadako script tag replacements.

#### sadako.isPageTop()

Detects whether we are at the top of a page or inside a label. This only detects the entry point, not whether we have passed at `=` or `{ }` label tokens.

Returns:

* (boolean): Returns `true` if the script started on the first line of a page, `false` if not.

#### sadako.end()

The equivalent of calling `>> END` in sadako script.

#### sadako.abort()

The equivalent of calling `>> ABORT` in sadako script.

#### sadako.run()

The script won't resume if its status is `END` or `ABORT`. Call this to set it to `RUN` again and resume processing.

#### sadako.doReturn()

The equivalent of calling `>> RETURN`.

#### sadako.back()

Sends the story back one history state.

#### sadako.isToken()

Check the beginning of a string for token text. If it matches, it returns the text following the token. If it doesn't match, it returns `false`.

Arguments:
    
* `text` (string): Text to compare.
* `token` (string): Token to look for.

Returns:

* (string or boolean): Returns the remainder of the string after removing the token and leading spaces. Returns `false` if not a match.

#### sadako.addScene()

Described in detail in the reference manual. This function defines a scene to be used in sadako script. Every "check" and "do" argument in this function can be either a string of sadako script or a javascript function.

Arguments:

* `id` (string): The name of the scene to be defined.
* `checkStart` (string or function): The condition(s) to check for the start of the scene.
* `checkEnd` (string or function): The condition(s) to check for the end of the scene.
* `doStart` (string or function): The script to be run when `checkStart` evaluates to `true`.
* `doEnd` (string or function): The script to be run when `checkEnd` evaluates to `true`.
* `doAfter` (string or function): The script to run after every page renders while the scene is active.
* `doBefore` (string or function): The script to run before every page renders while the scene is active.
* `isRecurring` (boolean): Whether the scene should be run again if the start conditions are met after the scene has ended.

#### sadako.setupDialog

This sets up the dialog for display. You only need to call thing function once. The elements in the `elements` array will be shown or hidden every time you call `sadako.showDialog()` and `sadako.hideDialog()`.

Arguments:

* `dialog_id` (string): ID of HTML element for text output of dialog box.
* `title_id` (string): Not required. ID of HTML element to display title of dialog box.
* `elements` (array of strings): IDs of elements to be shown and hidden.

#### sadako.showDialog()

Displays the dialog window.

If the dialog has not been set up properly by not having called `sadako.setupDialog()` or by passing bad IDs to that function, the `showDialog()` function will throw an error and not run.

Arguments:

* `title` (string): Text to display in title bar
* `text` (string): Text to display in dialog body If `text` is preceded by a `#` page or `%` label token, it will display the contents of that page or label.

Returns:

* (boolean): Returns `true` is dialog is set up properly. Returns `false` if it's not.

#### sadako.closeDialog()

Closes the dialog window.

Arguments:

* `cleanup` (boolean): if true, clears lines and choices arrays.
