

### Setting up the HTML

**Sadako** doesn't require much to run. Just a few lines of HTML and two javascript function calls.

```
<html>
    <head>
        <style type="text/css">
            .choice { 
                cursor: pointer;
                color: orange;
            }
        </style>
    </head>
    <body>
        <div id="output"></div>
        <textarea id="source" style="display:none">
            ## demo
                Hello world
                + The End
        </textarea>
    </body>
    <script src="sadako.js" type="text/javascript"></script>
	<script type="text/javascript">
        sadako.init();
        sadako.startGame("demo");
    </script>
</html>
```

The `output` div is the default target for displaying the story output. 

The `source` textarea tag is where you write the story. It's recommended to use a textarea tag so you can safely write characters normally reserved for HTML tags like `<` and `>` signs.

The CSS, while not necessary, styles the choices. The `choice` class is predefined in **Sadako**'s default text display functions. The hypertext links do not use `href`, so adding `cursor: pointer` makes the mouse cursor treat it like a link again.

`sadako.init()` initializes the **Sadako** library. The first argument if provided is a string. If the string has `#` as its first character (like `"#source"`), it uses the innerHTML of that element as the source code for the story. If it doesn't start with `#`, it treats the string as a JSON string containing the story.

`sadako.startGame()` starts the game, as you would imagine. The only argument is a string containing the page on which to begin the game. If not provided, it attempts to load page `“1"`.

That's basically it. You now have a running game.
