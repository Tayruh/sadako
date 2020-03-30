# Sadako Script Reference

## Comments

### Comment block

`/*` `*/`

Anything within the these tokens is removed from the story script before it's even parsed. Because of this, you can use it also ignore line breaks.

```
/*
None of this will matter.
So write whatever you want.
*/
```


### Line comment

`//`

All text and scripting between this token and the end of the line will be ignored by **Sadako**.

```
This text will display. // This text will not display.
This text will also display.
```


### Escape

`\`

An escape token is used to prevent **Sadako** from recognizing a token that begins a line. This does not work for tokens that do not begin a line.

```
*** You win! ***

// outputs (a choice, which is not what we want)
<You win! ***>
```
```
\*** You win! ***

// outputs (desired output)
*** You win! ***
```


## Story sections 

### Pages 

`##`

**Sadako**'s story script is divided by pages. The name for each page is defined like so. 

```
## Page1
    This is the first page. 
    
## Page2
    This is the second page.
```
    
When you redirect to a page, **Sadako** will proceed line by line through the script within that page. When it reaches the end, it will stop. A page can be written simply and only display a full screen of text, or it can be complex and full of links, choices, and jumps. The only way out of a page is through a jump of some sort, which will be explained shortly.

Every time you're redirected to a page that differs from the current page, the *seen* counter increases by 1. This is stored in `sadako.page_seen["Page1"]` (using "Page1" as an example). This value can be used to check whether a page has been visited and how many times.

#### Tags

Pages may also have tags using the `~:` tag token after the page name.

```
## Page1 ~:test
```

In this example, the page is assigned a tag called `test`. Unless a value is assigned, a tag is always assigned the value of `true`. If you wish to assign a value, place a `:` between the tag name and its value.

```
## Page1 ~:blah:some text ~:test:20 
```

In the example above, `Page1` is given a `blah` tag with the value of `some text` and a `test` tag with the value of `20`. Spaces are allowed, as you can see.

On their own, tags don't do anything. However, you can check for them and their value in `sadako.tags[<page_name>]`. For example:

```
//
## Page1 ~:blah:some text

// in javascript
if ("blah" in sadako.tags.Page1) console.log(sadako.tags.Page1.blah);

// outputs
some text
```


### Inline Labels

`{` `}`

A label marks a line of the script so that you can redirect the script to it whenever you wish. If you are familiar with programming `gosub` and `return` concepts, this is the label for use with that. 

The actual use of the `{ }` label will be described in the `>>` jump token and `<<` return token descriptions.

Whenever the script processes a line with the `{ }` label tokens, the *seen* counter for that label is increased by 1. This is stored in `sadako.label_seen["foo"]` (using "foo" as an example), which is abbreviated to `%.foo` in sadako script. This value can be used to check whether a label has been seen and how many times. 

An important thing to note is that the label seen count is increased *after* the script line is processed. Also, a choice with a label only increases the seen count if it is selected or jumped to, not when it is displayed. Likewise, a condition block with a label only increases its label seen if the condition is true.

Inline labels are not allowed on condition blocks and will be stripped during compiling.

Because of the way that page names, label names, and variable names are handled by **Sadako**, it is recommended that you do not include spaces or periods in them. Use underscores, dashes, or camel-casing instead.


### Jumps

`>>`

The jump token is used to redirect the story script to a defined label or page. Jumping to a page or label increases its *seen* count stored in `sadako.page_seen["page_name"]` and `sadako.label_seen["label_name"]` respectively.

**Sadako** assumes that a label that does not include the page is local. In order to jump outside that page, include the page in the jump command. The following is an example of label jumping.

```
## Page1
    This is page 1.

    // jumps to local "foo" label
    >> foo
    
    This line won't print because the script jumps over it.

    {foo}
    This is still page 1.
    
    // jumps to "bleh" in "Page3"
    >> Page3.bleh
    
## Page2
    {asdf}
    This is page 2.
    
## Page3
    {bleh}
    This is page 3.
    
    // jumps to "Page2"
    >> Page2.asdf


// outputs
This is page 1.
This is still page 1.
This is page 3.
This is page 2.
```

Page jumps must include the `#` page token before its name.

```
## Page1
    You won't see this text.
    >> #Page2
## Page2
    Hello!
    
// outputs
Hello!
```

Jumping to a page is not the same as jumping a label. Jumping to a label continues adding to the current output, like in the label jump example. However, jumping to a page (even if it's the same page) clears the output and the jump stack, meaning the `<<` token described below will not work. The reason only `Hello!` was seen in the example output is because the output was cleared upon jumping to `Page2`.

If you want to include a page in the current flow of text, I suggest adding a label to the top of the page and jumping to that instead, like in the example above.

#### Includes

There is an exception to the previous statement. If you include the `=` value token before the page or label to jump to, **Sadako** will jump to that page or label, but instead of ending output when it reaches the end of the script, it will jump back to where it was.

```
This ends early.
>> test
You won't see this.
<< END

= test
Something to print.
<< END


// outputs
This ends early.
Something to print.
```

The above stops processing the script once it sees `<< END` in `test`.

```
This won't exit early.
>>= test
You'll be able to see this now.
<< END

= test
Something to print.
<< END


// outputs
This ends early.
Something to print.
You'll be able to see this now.
```

By using the `=` value token, it won't stop processing the script when it sees `<< END`. Similarly, using it in conjunction with page jumps, it won't display a fresh page, but will instead include that page's contents in with the current page.

```
## Page1
    This won't be seen.
    >> #Page2
    This won't be displayed either.
    
## Page2
    Hello!
    
// outputs
Hello!
```
```
## Page1
    You will see this.
    >>= #Page2
    You will see this also.
    
## Page2
    Hello!
    
// outputs
You will see this.
Hello!
You will see this also.
```

### Returns

`<<`

The return token is designed to leave the current story block. On its own, the `<<` return token returns the script back to the last activated `>>` jump token. This has the effect of creating functions in the story script.

```
Print it once:
>> multiuse_text
Print it again:
>> multiuse_text
<< END

// the script does not fall through to this line because of << END.
{multiuse_text}
This is text that you can print in many places if you like.
<<


// outputs
Print it once:
This is text that you can print in many places if you like.    
Print it again:
This is text that you can print in many places if you like.
```

Jumps are pushed onto a stack, so you can do multiple levels of jumps.

```
Line 1.
>> jump1
The End.
<< END
    
{jump1}
Line 2.
>> jump2
<<

{jump2}
Line 3.
<<


// outputs
Line 1.
Line 2.
Line 3.
The End.
```

It has a few different functions when followed by keywords. They are case sensitive.

* `<< RETURN` 

    Returns the script to the top line of this page.
    
* `<< END` 
    
    Stops the current block of story script from proceeding past this line. Useful for including labels below main script and using them like functions as in the example above.
    
* `<< ABORT`

    Same as `<< END` but more aggressive. It quits the current script and does not display any text. All script blocks and jumps before this command will still be executed but no output will be displayed. The `ABORT` call is useful helping avoid some pitfalls that arise when calling `sadako.doJump()`, `sadako.doLabel()`, and `sadako.closeDialog()` from within a `[: :]` script block.


## Text Formatting

### Line ending

`;;` 

Separates lines of the script. **Sadako** uses carriage returns to separate lines, so this token is only necessary if you would like to include multiple statements on the same line for convenience.

```
Hello world!;; This is the second line
```

This is the same as

```
Hello world!
This is the second line
```


### Line break

`^^`

This inserts a line break (`<br>` tag) into the script.

**Sadako** separates script lines with either a carriage return or a line ending `;;` token. By default, the resulting text is wrapped in a `<p>` tag. The `^^` token inserts a `<br>` into the output so that the line break stays within paragraph tags.

```
Hello world!^^This is still within the paragraph.
This is a separate paragraph.


// outputs
<p>Hello world!<br>This is still within the paragraph.</p>
<p>This is a separate paragraph.</p>
```


### Text attachment

`<>`

Attaches two lines of text together. `<>` can begin or end a line. If it begins the line, it'll be attached to the previous line. If it ends the line, the next one will be attached to this one.

```
This line <>
will become whole.

So will
<> this one.

You can 
<> do both <>
at once.


// outputs:
This line will become whole.
So will this one.
You can do both at once.
```


### Span markup

`<:` `:>`

Span token. This is used to easily attach a CSS class to a block of text. You separate the CSS class from the text using `::`. It doesn't save a ton of typing, but it makes the story script a bit more readable.

    <:test::This will use the "test" class.:>
    
    // outputs
    <span class="test">This will use the "test" class.</span>


### Tags

`~:`

Tags are used to alter the output or display of a line. Any number of tags can be added to a line. 

There are also three hardcoded tags in **Sadako**:

* `class:<classname>` (alias `c:<classname>`): Adds a CSS class to the line.
* `choice`: Displays the current line as though it were a choice. Useful for links that run javascript.
* `delay:<XXXX.X>`: Amount of time in milliseconds (5000.0 = 5 seconds) to delay the display of this line and all lines following it.

```
This will be displayed using the "test" class. ~:class:test

// outputs
<p class="test">This will be displayed using the "test" class.</p>
```

```
[:& alert("Boo!") @: Fake Choice.:] ~:choice

// outputs (output is simplified for example purposes)
<ul><li class="choice"><a onclick='alert("Boo!")'>Fake Choice</a></li></ul>
```

The `delay` tag can be tricky. Basically, as each line is printed, it's set to delay for the amount of this delay plus `sadako.text_delay`.

```
Normal text.
This will take 5 seconds to display. ~:delay:5000
This will take 3 seconds to display. ~:delay:3000
This will also take 3 seconds.

// the choice will take 6 seconds to display
- ~:delay:6000
+ [Some Choice]
```

In the above example, the second line of text will actually take longer to display than the third line of text. 

Also, notice how it uses an empty `-` depth token to set the delay for the choice. Unlike `class` tags, `delay` will not work on choices because of the way they are displayed. Therefore, you should set it before displaying the choice. This trick also works with doing things like jumps which also don't allow tags. To remove the additional delay, just use the `delay` tag with a value of `0`.
    
**Sadako** provides two functions intended to be overwritten by the user. These are `sadako.doLineTags()` and `sadako.doChoiceTags()`. The return value is an array containing the text to display as the first element and classes to be added to the line as the remaining elements. Classes do not have to be provided, and if nothing is returned from the function, no text will be printed.

By default, each function looks like this:

```
sadako.doLineTags = function(text, tag) { return [text]; }
sadako.doChoiceTags = function(text, tag) { return [text]; }
```

Obviously this does nothing as it is. However, here's an example of how you can make use of the functions. 

```
sadako.doLineTag = function(text, tag) {
    if (tag === "ayren") return ['Ayren says, "' + text + '"', "test1", "test2"];
    return [text];
}

// in story script
Hi! ~:ayren


// outputs
<p class="test1 test2">Ayren says, "Hi!"</p>
```
    
This function is called once per tag with the current text and tag (converted to lowercase) as the arguments. Text you return from one function call with be sent as the argument for the function call of the next tag for this line. This is so can keep modifying the text with each new tag if desired.
    
Tags must come before a `::` conditional token since it's considered part of the line. Conditionals will be explained in a little bit.

```
Write it just like this. ~:test1 ~:test2 :: $.blah == 1
```


## Variables and Conditionals


### Variable embedding

For convenience sake, there are tokens that allow easy embedding of **Sadako** variables. They are as follows. (*foo* will be used as an example variable/text and does not actually exist.)

#### For use in story script

* `$:foo` becomes the value of `sadako.var.foo`
* `_:foo` becomes the value of `sadako.tmp.foo`
* `*:foo` becomes the value of `sadako.scenes.foo`
* `#:foo` becomes the value of `sadako.page_seen["foo"]`
* `%:foo` becomes the value of `sadako.label_seen["foo"]`

```
The color of the gem was a bright $:color.

// outputs (assuming sadako.var.color is "green")
The color of the gem was a bright green.
```

#### For use in condition blocks
* `$.foo` becomes `sadako.var.foo`
* `_.foo` becomes `sadako.tmp.foo`
* `*.foo` becomes `sadako.scenes.foo`
* `#.foo` becomes `sadako.page_seen["foo"]`
* `%.foo` becomes `sadako.label_seen["foo"]`
* `~~=foo` becomes `sadako.text = foo`
* `~~+'foo'` becomes `sadako.text += 'foo'`
    
To make sense of this, a few things should be explained briefly. 

`sadako.var` is an object variable that contains user defined variables. These variables are automatically saved to disk when you save the game.

`sadako.tmp` is also an object variable that contains user defined variables. However, these variables are cleared every time `sadako.doJump()`, `sadako.doChoice()`, and `sadako.doScript()` are called. That is to say, any time you click a link or call a function that progresses the story script.

`sadako.scenes` will be described in just a little bit. It's too in depth to describe here.
    
`sadako.text` is the variable that holds the text being processed for the current line. Just returning text from a function will not work unless you use the `=` value token inside the `[: :]` script block (which hopefully explains how the story script text replacements work). If you are inside a function and want to replace or add to the text output for the current line, `sadako.text` is the variable to use.

Script blocks will be described soon, but just know that the script inside the `[: :]` script block in this example is being executed, not displayed.

```
You found a bright [:& ~~=sadako.var.color:] gem.
You found a bright [:& ~~+.sadako.var.color:] gem.


// outputs (assuming sadako.var.color is "green")
green gem.
You found a bright green gem.
```

Notice how the first section of text is missing in the first line of the example output. This is because `~~=` replaces the text up to that point. `~~+` appends onto the text.

In most situations you can stack replacement tokens, so the above can be written like so and will have the same result.

```
You found a bright [:& ~~+$.color:] gem.
```

Regarding `sadako.page_seen` and `sadako.label_seen`, every time you  transition to a new page, progress past a label in the script, or select a choice that is preceded by a label, the counter for that page or label is increased by 1. This is convenient for checking whether you've seen a part of the script and how many times.


### Conditional display

`::` 

The statement preceding the `::` conditional token will only be displayed and scripts executed if the statement following it equates to true. 

In the following example, the line will not be displayed if *money* is less than 100.

```
You don't have enough money. :: $.money < 100
```


### Inline text options

`{:` `:}`

The inline conditional block is for easy selecting between between two different text options.

The sections of the statement are separated by `::` a conditional token. The first section is the condition check, the second section displays if the condition is true, and the third section (if provided) displays if the condition is false.

```
You check your wallet{:$.money < 50::, but it seems that you don't:: and it appears that you:} have enough money to buy it.


// outputs
// if less than 50: 
You check you wallet, but it seems that don't have enough money to buy it.

// otherwise:
You check your wallet and it appears that you have enough money to buy it.
```

You can also exclude the second option and it'll only print the first one if it's true and nothing if it's false.

```
You carefully pick up the {:$.vase_damaged::cracked :}vase and put it back on the shelf.


// outputs
// if vase is damaged:
You carefully pick up the cracked vase and put it back on the shelf.

// if not:
You carefully pick up the vase and put it back on the shelf.
```


### Script block

#### Redirects

`[:` `:]`

A standard script block inserts a link to a page. 

```
[:blargh:]

// outputs
<a onclick='sadako.doJump("#blargh")'>blargh</a>
```

If you follow the page name with the `@:` rename token, you can rename the link.

```
[:some_annnoying_title @: the next room:]

// outputs
<a onclick='sadako.doJump("#some_annnoying_title")'>the next room</a>
```

You can lead the script block with a token and it will do things besides linking to a page.

* `#` Links to a page. Same result as no token.
* `%` Links to a label.
* `&` Executes javascript. Does not print result.
* `=` Evaluates a variable or javascript and prints the text.
* `>` Creates a single line input box for storing text into a variable.
* `>>` Creates a multiline input box for storing text into variables.

**Sadako** assumes that a label is local unless otherwise stated. If you want to access a label that is not local, you must include the page with the label, like `some_page.some_label`.

```
## Page1
    // local label
    [:% bleh:]
    
    // nonlocal label
    [:% Page2.foo:]


// outputs
<a onclick='sadako.doJump("Page1.bleh")'>bleh</a>
<a onclick='sadako.doJump("Page2.foo")'>bleh</a>
```

#### Javscript

As an example of executable javascript, the following opens the javascript alert box with the "Hello world!" message.

```
[:& alert("Hello world!"):]
```

For `#`, `%`, and even the `@:` token used for renaming, you can follow it with a `=` value token and it will evaluate the value and use that.

```
[:#= "Page " + (2 - 1) @:= (1==1) ? "bleh" : "meh":]

// outputs
<a onclick='sadako.doJump("#Page1")'>bleh</a>
```

It's also important to note that the `[: :]` script block is the only block to ignore line breaks. This is so that you can include properly formatted javascript. The space between `[:` and the leading tokens are also ignored. Because of that, script like this won't break, even though it's an exercise in poor formatting.

```
[:
    #
= 
    (function() {
        if (1 == 1) {
            return "Page ";
        }
    }())
    
    + (2 - 1)

 @:
    = (1==0) ? 
    "bleh" : "meh"
:]


// outputs
<a onclick"sadako.doJump("Page1")>meh</a>
```

#### Input boxes

The input boxes can be a bit tricky. They go like this.

```
What is your name? [:> $.player_name:]

// outputs (brackets represent the input box)
What is your name? [                       ]
```

The variable defined in script block will be set to whatever the input text is. **Sadako** sets the variable whenever the input box loses focus.

Instead of displaying the input description using standard text, you can use the HTML `label` tag by using the `@:` rename label and following it with the text to display.

```
[:> $.player_name @: What is your name?:]

// outputs
What is your name? [                       ]
```

Visually this looks the same, but under the hood it works differently, especially for those with screen readers. Feel free to check out [this information](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/label) to get an idea on why labels are helpful.

Finally, if you begin the script block with two `>` input tokens instead of one, it becomes a multiline input box. A single input box will only accept the first line of text, no matter how much you write. A multiline text box will accept all lines. Also, the CSS class `multiline` will automatically be assigned to a multiline box so that you may resize it in CSS without having to affect single line input boxes.

Here's an example.

```
// CSS
textarea.multiline { height: 5em; width: 20em; }

// in story script
[:>> $.test_val @: Please type something.^^:]


// outputs
Please type something.
[                                   ]
[                                   ]
[                                   ]
[                                   ]
[                                   ]
[                                   ]
```


### Macros

`(:` `:)`

Macros are simply shortcuts for javascript functions. Their only real benefit is clarity of code and slightly less typing for constantly used functions.

To create a macro, create a new function member of `sadako.macros`, like this:

```
sadako.macros.say = function(who, what) { 
    sadako.text += who + ' says, "' + what + '"'; 
}

sadako.macros.blargh = function() { sadako.text += "bleh"; }

sadako.macros.doMath = function(x, y) { return x + y; }
```

Then to use them, you do this:

```
(:say "Ayren", "Hi!":)
(:blargh:)
(:=doMath 1, 2:)

// outputs
Ayren says, "Hi!"
bleh
3
```

If you look at the `doMath` macro, you'll see that it begins with the `=` value token as in a `[: :]` script block. This is treated in the same manner and adds the result to the output. Like always, the other option is to use the `sadako.text` variable for output. The choice is yours. If you don't always require output, I'd suggest the `=` value method.

Basically a macro is just a text replacement for a `[: :]` script block call to a `sadako.macros` function.

```
// this
(:say "Ayren", "Hi!":)

// is the same as
[:& sadako.macros.say("Ayren", "Hi!"):]
```

Please be aware that `sadako.macros` is not saved when you save your game. Because of this, any macros defined during game will not be saved and the game will crash when you reload. Therefore, always define your macros in your javascript before you call `sadako.startGame()`.


## Choices and Depths 

### Choice formatting

`[` `]`

This set of tokens is reserved for choices and formats it in a specific way. These tokens are not taken into account for any non-choice script.

When displaying the choice, the text before and inside the tokens will be displayed. When the choice is selected, the text before and after the tokens will be added to the new display.

```
+ You search the office[.], but you find nothing of use.

(choice text): You search the office.
(new text): You search the office, but you find nothing of use.
```

A handy trick is to put `[ ]` around all of the choice text. Doing so will prevent the choice text from displaying at all on the newly rendered page. This trick is used for most examples on this guide to make the example output easier to read.


### Static Choice 

`+`

A static choice differs from a `*` limited choice in the fact that it is reusable. Limited choices will be explained in a little bit.

To understand how choices are implemented, you must understand how depth levels work. All example code before this has been with a depth level of 1. That is to say it's at the shallowest level.

When the script is processed, it goes line by line through a depth level until it reaches the end.

```
Hello world!
+ [Finish]
    You have selected "finish".
    The End.
    
// outputs (choice is shown in <> brackets)
Hello world!
<Finish>


// when "Finish" is selected 
You have selected "finish".
The End.
```

When you select a choice, the script increases its depth by 1. Since "Finish" is level 1, it becomes level 2. The depth level for the choice is not chosen based on indentation, but is instead determined by the amount of tokens preceding the text. "Finish" is level 1 because there is only one `*` at the start of the line. 

```
Hello world!
++ [Finish]
    The End.

    
// outputs
Hello world!
```

In the above example, "Hello world" is level 1 but "Finish" is level 2. Because of this, the choice doesn't display. The script processes the first line, doesn't see any other level 1 lines, and completes. In fact, the script will output an error to the javascript console that looks like this.

```
Line depth difference is greater than 1:
++ [Finish]
```

Regardless of indentation, script between a choice and the next depth transition will remain with that depth. For example, the following code may not work the way you may expect.

```
Hello world!
+ [Finish]
    You have selected "finish".
The End.
    

// outputs (choice is shown in <> brackets)
Hello world!
<Finish>

// when "Finish" is selected 
You have selected "finish".
The End.
```

"The End" is still level 2, so it falls under "Finish" still, even though it's indented to a level 1 depth. 

The script will display all choices within that depth level until it reaches a line within that depth that is not a choice (usually a `-` depth token that will be explained a bit later).

```
+ [Choice One] 
    This was the first choice.
+ [Choice Two] 
    This was the second choice.
- 
+ [Choice Three]
    This choice is not shown in the example.

    
// outputs
<Choice One>
<Choice Two>

// when "Choice One" is selected 
This was choice one. 
<Choice Three>

// when "Choice Two" is selected 
This was choice two.
<Choice Three>
```

You can place any number of choices inside each other as long you use the correct depth levels.

```
+ [Choice 1]
    Next choice. 
    ++ [Choice 1.1]
    Another choice.
    ++ [Choice 1.2]
    One more.
+ [Choice 2]
    Foo

    
// outputs
<Choice 1>
<Choice 2>

// when "Choice 1" is selected 
Next choice.
<Choice 1.1>
<Choice 1.2>

// when "Choice 1.2" is selected 
One more.
```

### Labels

Simply displaying the choice does not increase its *seen* count, unlike other script lines assigned a label. Selecting a choice is the only way that its *seen* count is increased.

Jumping to a choice that has been assigned a label is the equivalent of selecting that choice. In other words, the *seen* count for the label assigned to that choice is increased and **Sadako** begins processing the lines inside that choice's story block.

```
## Page1
    Begin test.
    >> test

    This text will not be seen.

    + {test} Choice name will not display
        Hello!
        Times choice 1 has been seen: %:Page1.test
    + {test2} Second choice
        Bleh
        
    - Times choice 2 has been seen: %Page1.test2


// outputs
Begin test.
Hello!
Times choice 1 has been seen: 1
Times choice 2 has been seen: 0
```

Normally the game does not save progress in a choice tree. It only saves progress when you click a link that leads to a label or page (using `sadako.doLink()`). However, if you give a choice an inline label, the game will allow you to save progress after that choice has been selected.


### Limited Choice

`*`

Choices using a `*` limited choice token (as opposed to a `+` static choice token) that have an associated label will disappear after being clicked once.

```
{loop}
* {c1} [Choice 1] 
* {c2} [Choice 2] 
* {c3} [Choice 3] 
    The End
    << END    
- >> loop


// outputs
<Choice 1>
<Choice 2>
<Choice 3>

// if "Choice 1" is selected
<Choice 2>
<Choice 3>

// if "Choice 2" is selected
<Choice 3>

// if "Choice 3" is selected
The End
```

If you have a `*` limited choice and do not assign it a label, it will throw an error during compile. The error will look something like this:

```
Choice found without associated label.
[init] [0] [1]: "Sure!"
```

Fallback choices do not throw this error even if they do not have a label.

### Fallback Choice

Choices also come with a method for a default fallback when all other options have been chosen. All you need to do is have a choice without a text description. Once all visible choices have been exhausted, Sadako will then select the first unnamed choice that it sees. You can use this to safely exit a loop. 

Regardless of whether this is a `*` choice, `+` static, or has an `{ }`inline label, this choice will never disappear.

```
{loop}        
* {c1} [Choice 1]
* {c2} [Choice 2]
* {c3} [Choice 3]
+ [Choice 4] :: 1 === 0
*
    Exiting loop.
    >> finish
- >> loop
    
{finish} All done.


// outputs
<Choice 1>
<Choice 2>
<Choice 3>

// if "Choice 1" is selected
<Choice 2>
<Choice 3>

// if "Choice 2" is selected
<Choice 3>

// if "Choice 3" is selected
Exiting loop.
All done.
```

Notice that `Choice 4` is never displayed because of its inline condition. Because it's not available, the loop will safely enter the fallback.

Another thing to note is that the fallback is triggered when choices above it not available. That is to say, if you were to move the fallback choice to between `Choice 2` and `Choice 3`, the fallback will trigger once `Choice 1` and `Choice 2` are removed, even if `Choice 3` is still available.


### Depth token

`-`

The depth token realigns the depth. Say that you are three levels deep in choices and you want to get back to a depth of 1. The `-` depth token is the most convenient way to do it. 

The depth can also changed using `*` choice tokens, `+` static choice tokens, `=` label tokens, and `~` conditional tokens. The difference is that the `-` depth token only sets the depth and does not perform any extra functions.

The flow of story script goes like this:

1. All non-choice story script lines are processed. 
2. If the script sees `<< END` or `<< ABORT`, it stops processing any further lines of script.
3. If the script runs out of content in that depth, it looks for a depth changing token (listed above) in the next line and sets the depth to that. If there is not a depth token, the script stops processing.
4. If the script sees any choices, it will process all choices until it sees a non-choice depth token.
5. After a choice is selected, the script will jump to the story block with that choice and start again at step 1.

```
This is level 1.
+ [Choice 1]
    Choice 1, level 2.
    ++ [Choice 1.1]
    Choice 1.1, level 3.
    ++ [Choice 1.2]
    Choice 1.1, level 3.
    -- Level 2 again.
    Still level 2.
+ [Choice 2]
    Choice 2, level 2.
- Level 1 again.


// outputs
This is level 1.
<Choice 1>
<Choice 2>

// if "Choice 1" is selected 
Choice 1, level 2.
<Choice 1.1>
<Choice 1.2>

// if "Choice 1.1" is selected
Choice 1.1, level 3.
Level 2 again.
Still level 2. 
Level 1 again.
```

Notice that if you comment out or remove the `-- Level 2 again line.` line, it will not set the depth to level 2 and will instead find the level 1 depth token next. The level of depth is indicated by the number of `-` tokens, just like it is with choices. 

```
// if "Choice 1.1" is selected
Choice 1.1, level 3.
Level 1 again.
```
One convenient use of the `-` depth token is forcing a separation between multiple sets of choices, even if the line is blank.

```
+ [Choice 1]
+ [Choice 2]
-
+ [Choice 3]


// outputs
<Choice 1>
<Choice 2>

// if "Choice 1" is selected
<Choice 3>
```

** variable**: _sadako.token.depth_
    
    
### Depth labels

`=`

A depth label is basically a combination of a `-` depth token and a `{ }` label. It both sets the depth level and also sets a label you can jump to for that line. 

```
// this 
=== test

// is the equivalent of this 
--- {test}
```

The benefit of a `{ }` label block is that it can be followed by text or be set on a choice. This is not possible with a `=` depth label. The benefit of a depth label is clarity of code.

```
-- {test} This is kind of messy.
Some other stuff to write.
<<

== test
This is easier to read.
Some stuff to write
<<
```

Note that since the `=` label marker shares the same properties as a `-` depth marker, processing of choices will stop once the script sees this token.
    

### Condition Block

`~`

The condition block allows you to display or not display blocks of story script based on conditions. It's basically `if`/`else if`/`else` from javascript, except it runs story script instead.

It's important to note that the `~` condition token acts the same as a `+` static choice token. That is, it has levels of depth based on the number of leading tokens, and the script inside the block increases by one depth. However, the script will not stop at `-` depth tokens or `=` label tokens after seeing a `~` conditional token, which is the case with choices.

```
~ if ($.money > 100)
    You can buy the following items.
    ++ [A pack of gum.]
        You bought some gum.
    ++ [Some milk.]
        You bought some milk.
~ else if ($.money > 50)
    You almost have enough to buy something. Why is everything so expensive?
~ else
    You don't have enough money to buy anything.
- You should probably leave the store now.


// outputs
// if money less than 100
You don't have enough money to buy anything.
You should probably leave the store now.

// if money is less than 100 but greater than 50
You almost have enough to buy something. Why is everything so expensive?
You should probably leave the store now.
    
// if money is greater than 100
You can buy the following items.
<A pack of gum.>
<Some milk.>

// if "A pack of gum." is selected
You bought some gum.
You should probably leave the store now.
```
    
Notice that the depth level increased inside the conditional block, so the choices begin with two `+` choice tokens instead of one. If you only had one, the choice would be outside of the conditional block even though it was indented correctly. 

The following is an example of erroneous code.
    
```
Beginning test.
~ if (1 == 0)
    This text will not be seen.
    + [This choice is not inside the block]
        Test
        
// outputs
Beginning text.
<This choice is not inside the block>
```

Also be sure not to interrupt the flow of the conditional blocks. There should not be any `*` or `+` choices, `=` labels, or `-` depth tokens between `if`, `else if`, and `else` blocks or else the script will fail. Errors will be printed to the javascript console.

The following is an example of erroneous code.

```
## Page1
    ~ if (1 == 1)
        Write something.
        -- This is within the condition block and is okay.
    - This line makes it fail.
    ~ else if (1 == 1)
        Bleh.
```
        
This gives the following error.

```
'else if' found without 'if' statement.
story: [Page1] [0] [2]
eval: (1 == 1)
```

Be aware `{ }` inline labels are not allowed with condition blocks and will be striping during compiling.


### Scenes

Scenes are a way of expressing an event that is taking place or has taken place. Scenes can happen one after another, or many scenes at once. Whether they are running or not is based on conditions that are checked as every story script line is processed.

To make it clear what role a scene performs, first we should look at some script without scenes.

```
## example
    Your friend turns to you and asks "Would you like to go to the movies?"
    + "Sure!"
        "Sweet!" They pause. "You can buy your own ticket, right?"
        ++ "Yeah, no problem."
            "Great! Let's go!"
            You and your friend go to the movies and have a great time.
        ++ {no_money} "Sorry, no."
            "Ugh. I can't believe you. I'll have to go alone then." They wander away.
    + {no} "Nah."
        "Seriously? Well, whatever. I'm going without you."
    
    ~ if (%.example.no || %.example.no_money)
        You spend the day by yourself.
        
    + [Go Home]
        >> #home
        
## home
    You're at your home. {:(!%.example.no && !%.example.no_money) || %.home.called::Your friend is here with you.:}
    
    ~ if (%.home.called)
        Your friend looks happy but reserved. "That movie was pretty good. I wish you could have seen it."
    
    ~ else if (!%.example.no && !%.example.no_money)
        Your friend is happy. "That movie was great!"

    ~ else
        ++ [Call Friend]
            You decide to call your friend.
            "The movie is over now. I'll be right over."
            +++ {called} [Back]
                << RETURN
```


Pretty messy. There are a lot of conditionals based on whether you've seen labels or not and it's somewhat confusing looking even though the labels are still within sight. It'd only get worse as the conditions are moved further from their origin and replicated in other locations of the script. Scenes can alleviate this issue.

First we add the scene in javascript. This should be always be defined in your initialization script so that it's run whether you start a fresh game or load a save.

```
sadako.addScene("alone", "%.example.no || %.example.no_money", "%.home.called");
```

And now we rewrite it using scenes for the condition checks.

```
## example
    Your friend turns to you and asks "Would you like to go to the movies?"
    + "Sure!"
        "Sweet!" They pause. "You can buy your own ticket, right?"
        ++ "Yeah, no problem."
            "Great! Let's go!"
            You and your friend go to the movies and have a great time.
        ++ {no_money} "Sorry, no."
            "Ugh. I can't believe you. I'll have to go alone then." They wander away.
    + {no} "Nah."
        "Seriously? Well, whatever. I'm going without you."
    
    ~ if (*.alone.isActive)
        You spend the day by yourself.
        
    + [Go Home]
        >> #home
        
## home
    You're at your home. {:!*.alone.isActive::Your friend is here with you.:}
    
    ~ if (*.alone.hasEnded)
        Your friend looks happy but reserved. "That movie was pretty good. I wish you could have seen it."
        
    ~ else if (!*.alone.hasStarted)
        Your friend is happy. "That movie was great!"

    ~ else
        ++ [Call Friend]
            You decide to call your friend.
            "The movie is over now. I'll be right over."
            +++ {called} [Back]
                << RETURN
```

That's much easier to read. Also as mentioned in the variable embedding section, the `*.` token is the shortcut for the `sadako.scenes` variable, and `*:` is the shortcut to its value.

A scene comes with four members you can access for its state. These are set automatically based on the condition checks.

* `isActive`: Whether we are currently in the scene. This is initially set to `false`. It is set to `true` when the `startCheck` conditions have passed, and then set to `false` again once `endCheck` has passed.
* `hasStarted`: A count of how many times scene has started. Incremented every time `checkStart` passes.
* `hasEnded`: A count of how many times scene has ended. Incremented every time `checkEnd` passes.
* `ending`: Any value returned from `doEnd()` is stored in `ending`. This can be useful to determine which way a scene has ended if it has multiple ways of ending the scene.

The fifth member `isRecurring` is set manually during creation or any time after that to toggle reccuring activations of a scene.

That's not all scenes can do though. To understand its use, the arguments of the `sadako.addScene` function must first be explained.

`sadako.addScene(id, checkStart, checkEnd, doStart, doEnd, doBefore, doAfter, isRecurring)`

* `id`: The name of the scene to be defined.
* `checkStart`: The condition(s) to check for the start of the scene. String or function.
* `checkEnd`: The condition(s) to check for the end of the scene. String or function.
* `doStart`: The function to be run when `checkStart` evaluates to true.
* `doEnd`: The function to be run when `checkEnd` evaluates to true.
* `doBefore`: The function to run before every page renders while the scene is active.
* `doAfter`: The function to run after every page renders while the scene is active.
* `isRecurring`: Whether the scene should be run again if the start conditions are met after the scene has ended.

`id` and `checkStart` are the only required arguments. The others can be skipped over with a value of `undefined` or `null`.

`checkStart` and `checkEnd` can be either a string or a function. If the argument is a string, it will be evaluated to determine if the conditions are true. The string may contain sadako script like in the example. Strings are good for simple comparisons or when you want to take advantage of sadako script.

If the argument is a function, you must place your condition checks inside the function and return true if they evaluate to true. This is useful for more complex condition checks. The following is an example.

`sadako.addScene("test", function(){ if (1 === 1) return true; })`


### Saving Checkpoints

The way that **Sadako** manages saves is that whenever you reach a "checkpoint", it stores the current state (all of **Sadako**'s necessary variables along with whatever you store inside `sadako.var`) into a data object variable. When you decide to save your game, it writes the contents of that data to the disk. It only saves whatever the values of the data was at the time of last checkpoint, so it's entirely possible to progress through multiple choices without it saving your progress.

To manage this correctly, you must pay attention to what triggers a checkpoint. There are three things that do this.

* Clicking a link that navigates to a new label using `sadako.doLink()`. (Example:
`[:% some_label:]`)
* Clicking a link that navigates to a new page using `sadako.doLink()`. (Example: `[: some_page:]`)
* Clicking a choice that has an associated `{ }` inline label. (Example: `* {cp} Some Choice`)

`>>` jumps in the story script will not trigger a checkpoint. You can however trigger this manually with `sadako.doLink()` which will act exactly like clicking a link. That is to say, no text leading up to this call will be displayed and it will not process any lines following this story block since it is an immediate redirect to that label or page.

The `sadako.doLink()` function accepts an argument in the same format as a `>>` jump token.

```
// jumps to a label 
[:& sadako.doLink("some_label"):]

// jumps to a page 
[:& sadako.doLink("#some_page"):]
```
