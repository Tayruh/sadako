# Javascript Reference

### Saving

**Sadako** provides two methods for saving and they can be used interchangeably.

The first method is autosaving which can be toggled on and off by means of the boolean `sadako.autosave_enabled`. When set to `true`, the game will automatically save every time a choice is selected, a link redirecting to a page or passage is clicked, `sadako.doLink()` is called, or a choice is selected when it has an associated label. Refreshing the page or calling `sadako.startGame()` is will automatically load the save. `sadako.restart()` deletes the autosave before restarting.

### History

**Sadako** allows you to rewind choices and story navigation. This is independent of the save system. The biggest difference is you can rewind to previous choices that don't have a label. A label is necessary for saving to work on choices.

You can limit the amount of history states with `sadako.history_limit`. The default is `10`. You can disable rewinding the history altogether by setting the value to `0`.

### Functions

There are not many functions that you need to run **Sadako**. In fact, the only two you absolutely *need* are `sadako.init()` and `sadako.startGame()` as mentioned above. However, there are a few you may use often to enhance the capability of your script, and also a handful of helper functions for convenience.

#### sadako.doLink(label)

`label` (string): Page or label to jump to. Page must begin with `#`.

This is the function called when clicking on a link created by a script block that leads to a page or label. Calling the function for javascript acts the same way: it clears the output, creates a save state, create a history state, redirects to the page or label, and increases its `page_seen` or `label_seen`count.

#### sadako.processScript(text)

`text` (string): Text to be processed.

`returns` (string): HTML string resulting from sadako script tag replacements.

This function renders the script tags inside a string as its equivalent HTML and javascript. This does not work correctly with depth tokens like `-`, `=`, `~`, `*`, and `+`, since they are rendered at compile time.

#### sadako.setUpDialog(dialog_id, title_id, elements) 

`dialog_id` (string): ID of HTML element for text output of dialog box.

`title_id` (string): Not required. ID of HTML element to display title of dialog box.

`elements` (array of strings): IDs of elements to be shown and hidden.

This sets up the dialog for display. You only need to call thing function once. The elements in the `elements` array will be shown or hidden every time you call `sadako.showDialog()` and `sadako.hideDialog()`.


### Helper Functions

#### sadako.dom(id)

`id` (string): ID or class of page element. An ID must begin with `#` and a class name with `.`. 

`returns` (object or array): HTML element or array of HTML elements with the assigned ID or class.

This is the equivalent of writing `document.getElementById(id)` and `document.getElementByClassName(name)`. I just find it easier to work with.
