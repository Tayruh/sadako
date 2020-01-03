# Tokens

Note: **Sadako** offers the ability to customize the tokens use for parsing the story script. I did my best to select tokens that were short in length, easy on the eyes, and avoided potential conflicts with javascript and a normal writing style. The information in this documentation is based on the default assignment for each token.

If you are unhappy with my choices, I provide the variable names of each token. You may change their values to suit your needs. Be aware that if you change them, you may need to escape special characters with `\\` in order for them to work correctly. Some but not all of them are used inside [regular expressions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions).


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
    
**variables**: _sadako.token.comment_open_, _sadako.token.comment_close_


### Line comment

`//`

Any line beginning with this token will be ignored by the script.

Unlike JavaScript, a `//` comment token will never comment out half a line of text. If you need to do this, use the `/* */` comment block.

**variable**: _sadako.token.comment_

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

**variable**: none (hardcoded)

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
        
**variable**: _sadako.token.page_


### Inline Labels

`{` `}`

A label marks a line of the script so that you can redirect the script to it whenever you wish. If you are familiar with programming `gosub` and `return` concepts, this is the label for use with that. 

The actual use of the `{ }` label will be described in the `>>` jump token and `<<` return token descriptions.

Whenever the script processes a line with the `{ }` label tokens, the *seen* counter for that label is increased by 1. This is stored in `sadako.label_seen["foo"]` (using "foo" as an example). This value can be used to check whether a label has been seen and how many times. The one caveat to this is that a choice with a label only increases the seen count if it is selected or jumped to, not when it is displayed.

Because of the way that page names, label names, and variable names are handled by **Sadako**, it is recommended that you do not include spaces or periods in them. Use underscores, dashes, or camel-casing instead.

**variables**: _sadako.token.label_open_, _sadako.token.label_close_

### Jumps

`>>`

The jump token is used to redirect the story script to a defined label or page.

**Sadako** assumes that a label that does not include the page is local. In order to jump outside that page, include the page in the jump command. Page jumps must include the `#` page token before its name.

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
    This is page 2.
    
## Page3
    {bleh}
    This is page 3.
    
    // jumps to "Page2"
    >> #Page2


// outputs
This is page 1.
This is still page 1.
This is page 3.
This is page 2.
```

Jumping to a page or label increases its *seen* count stored in `sadako.page_seen["page_name"]` and `sadako.label_seen["label_name"]` respectively. 

**variable**: _sadako.token.jump_, _sadako.token.page_embed_

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
    
* `<< EXIT`

    Same as `<< END` but more aggressive. It quits the current script and does not display any text. All script blocks and jumps will still be executed but no output will be displayed. The `EXIT` call is useful helping avoid some pitfalls that arise when calling `sadako.doPage()`, `sadako.doLabel()`, and `sadako.closeDialog()` from within a `[: :]` script block.


## Text Formatting

### Line ending

`.,` 

Separates lines of the script. **Sadako** uses carriage returns to separate lines, so this token is only necessary if you would like to include multiple statements on the same line for convenience.

```
Hello world!., This is the second line
```

This is the same as

```
Hello world!
This is the second line
```

**variable**: _sadako.token.line_


### Line break

`^^`

This inserts a line break (`<br>` tag) into the script.

**Sadako** separates script lines with either a carriage return or a line ending `.,` token. By default, the resulting text is wrapped in a `<p>` tag. The `^^` token inserts a `<br>` into the output so that the line break stays within paragraph tags.

```
Hello world!^^This is still within the paragraph.
This is a separate paragraph.


// outputs
<p>Hello world!<br>This is still within the paragraph.</p>
<p>This is a separate paragraph.</p>
```

**variable**: _sadako.token.break_


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

**variables**: _sadako.token.attach_


### Span markup

`<:` `:>`

Span token. This is used to easily attach a CSS class to a block of text. You separate the CSS class from the text using `::`. It doesn't save a ton of typing, but it makes the story script a bit more readable.

    <:test::This will use the "test" class.:>
    
    // outputs
    <span class="test">This will use the "test" class.</span>


**variables**: _sadako.token.span_open_, _sadako.token.span_close_, _sadako.token.cond_


### Tags

`*:`

Tags are used to alter the output or display of a line. Any number of tags can be added to a line. 

There are also two hardcoded tags in **Sadako**:

* `class:<classname>` (alias `c:<classname>`): Adds a CSS class to the line.
* `choice`: Displays the current line as though it were a choice. Useful for links that run javascript.

```
This will be displayed using the "test" class. *:class:test

// outputs
<p class="test">This will be displayed using the "test" class.</p>
```

```
[:& alert("Boo!") @: Fake Choice.:] *:choice

// outputs (output is simplified for example purposes)
<ul><li class="choice"><a onclick='alert("Boo!")'>Fake Choice</a></li></ul>
```
    
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
Hi! *:ayren


// outputs
<p class="test1 test2">Ayren says, "Hi!"</p>
```
    
This function is called once per tag with the current text and tag (converted to lowercase) as the arguments. Text you return from one function call with be sent as the argument for the function call of the next tag for this line. This is so can keep modifying the text with each new tag if desired.
    
Tags must come before a `::` conditional token since it's considered part of the line. Conditionals will be explained in a little bit.

```
Write it just like this. *:test1 *:test2 :: $.blah == 1
```

**variable**: _sadako.token.tag_


## Variables and Conditionals


### Variable embedding

For convenience sake, there are tokens that allow easy embedding of **Sadako** variables. They are as follows. (*foo* will be used as an example variable/text and does not actually exist.)

#### For use in story script

* `$:foo` becomes `[:= sadako.var.foo:]`
* `_:foo` becomes `[:= sadako.tmp.foo:]`
* `#:foo` becomes `[:= sadako.page_seen["foo"]:]`
* `%:foo` becomes `[:= sadako.label_seen["foo"]:]`

```
The color of the gem was a bright $:color.

// outputs (assuming sadako.var.color is "green")
The color of the gem was a bright green.
```

#### For use in condition blocks
* `$.foo` becomes `sadako.var.foo`
* `_.foo` becomes `sadako.tmp.foo`
* `#.foo` becomes `sadako.page_seen["foo"]`
* `%.foo` becomes `sadako.label_seen["foo"]`
* `~.foo` becomes `sadako.text = foo`
* `~'foo'` becomes `sadako.text = 'foo'`
* `~"foo"` becomes `sadako.text = "foo"`
* `~+.foo"` becomes `sadako.text += foo`
* `~+'foo'` becomes `sadako.text += 'foo'`
* `~+"foo"` becomes `sadako.text += "foo"`
    
To make sense of this, a few things should be explained briefly. 

`sadako.var` is an object variable that contains user defined variables. These variables are automatically saved to disk when you save the game.

`sadako.tmp` is also an object variable that contains user defined variables. However, these variables are cleared every time `sadako.doPage()`, `sadako.doJump()`, `sadako.doChoice()`, and `sadako.doScript()` are called. That is to say, any time you click a link or call a function that progresses the story script.
    
`sadako.text` is the variable that holds the text being processed for the current line. Just returning text from a function will not work unless you use the `=` value token inside the `[: :]` script block (which hopefully explains how the story script text replacements work). If you are inside a function and want to replace or add to the text output for the current line, `sadako.text` is the variable to use.

Script blocks will be described soon, but just know that the script inside the `[: :]` script block in this example is being executed, not displayed.

```
You found a bright [:& ~.sadako.var.color:] gem.
You found a bright [:& ~+.sadako.var.color:] gem.


// outputs (assuming sadako.var.color is "green")
green gem.
You found a bright green gem.
```

Notice how the first section of text is missing in the first line of the example output. This is because `~.` replaces the text up to that point. `~+.` appends onto the text.

In most situations you can stack replacement tokens, so the above can be written like so and will have the same result.

```
You found a bright [:& ~+.$.color:] gem.
```

Regarding `sadako.page_seen` and `sadako.label_seen`, every time you  transition to a new page, progress past a label in the script, or select a choice that is preceded by a label, the counter for that page or label is increased by 1. This is convenient for checking whether you've seen a part of the script and how many times.

**variables**: 
* _sadako.token.var_embed_, _sadako.token.tmp_embed_
* _sadako.token.page_embed_, _sadako.token.label_embed_
* _sadako.token.write_embed_, _sadako.token.write2_embed_, _sadako.token.write3_embed_
* _sadako.token.pluswrite_embed_, _sadako.token.pluswrite2_embed_, _sadako.token.pluswrite3_embed_

The `.` (variable) and `:` (value) tokens may also be changed.
* _cond_embed_, _value_embed_


### Conditional display

`::` 

The statement preceding the `::` conditional token will only be displayed and scripts executed if the statement following it equates to true. 

In the following example, the line will not be displayed if *money* is less than 100.

```
You don't have enough money. :: $.money < 100
```

**variable**: _sadako.token.cond_


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

**variables**: _sadako.token.inline_open_, _sadako.token.inline_close_, _sadako.token.cond_


### Script block

`[:` `:]`

A standard script block inserts a link to a page. 

```
[:blargh:]

// outputs
<a onclick='sadako.doPage("blargh")'>blargh</a>
```

If you follow the page name with the `@:` rename token, you can rename the link.

```
[:some_annnoying_title @: the next room:]

// outputs
<a onclick='sadako.doPage("some_annnoying_title")'>the next room</a>
```

You can lead the script block with a token and it will do things besides linking to a page.

* `#` Links to a page. Same result as no token.
* `%` Links to a label.
* `&` Executes javascript. Does not print result.
* `=` Evaluates a variable or javascript and prints the text.

**Sadako** assumes that a label is local unless otherwise stated. If you want to access a label that is not local, you must include the page with the label, like `some_page.some_label`.

```
#Page1
    // local label
    [:% bleh:]
    
    // nonlocal label
    [:% Page2.foo:]


// outputs
<a onclick='sadako.doJump("Page1.bleh")'>bleh</a>
<a onclick='sadako.doJump("Page2.foo")'>bleh</a>
```

As an example of executable javascript, the following opens the javascript alert box with the "Hello world!" message.

```
[:& alert("Hello world!"):]
```

For `#`, `%`, and even the `@:` token used for renaming, you can follow it with a `=` value token and it will evaluate the value and use that.

```
[:#= "Page " + (2 - 1) @:= (1==1) ? "bleh" : "meh":]

// outputs
<a onclick='sadako.doPage("Page1")'>bleh</a>
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
<a onclick"sadako.doPage("Page1")>meh</a>
```

**variables**: 
* _sadako.token.tag_open_, _sadako.token.tag_close_
* _sadako.token.page_embed_, _sadako.token.label_embed_
* _sadako.token.eval_code_, _sadako.token.eval_value_
* _sadako.token.rename_


## Choices and Depths 

### Choice formatting

`[` `]`

This set of tokens is reserved for choices and formats it in a specific way. These tokens are not taken into account for any non-choice script.

When displaying the choice, the text before and inside the tokens will be displayed. When the choice is selected, the text before and after the tokens will be added to the new display.

```
* You search the office[.], but you find nothing of use.

(choice text): You search the office.
(new text): You search the office, but you find nothing of use.
```

A handy trick is to put `[ ]` around all of the choice text. Doing so will prevent the choice text from displaying at all on the newly rendered page. This trick is used for most examples on this guide to make the example output easier to read.

**variables**: _sadako.token.choice_format_open_, _sadako.token.choice_format_close_


### Choice 

`*`

To understand how choices are implemented, you must understand how depth levels work. All example code before this has been with a depth level of 1. That is to say it's at the shallowest level.

When the script is processed, it goes line by line through a depth level until it reaches the end.

```
Hello world!
* [Finish]
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
** [Finish]
    The End.

    
// outputs
Hello world!
```

In the above example, "Hello world" is level 1 but "Finish" is level 2. Because of this, the choice doesn't display. The script processes the first line, doesn't see any other level 1 lines, and completes. In fact, the script will output an error to the javascript console that looks like this.

```
Line depth difference is greater than 1:
** [Finish]
```

Regardless of indentation, script between a choice and the next depth transition will remain with that depth. For example, the following code may not work the way you may expect.

```
Hello world!
* [Finish]
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
* [Choice One] 
    This was the first choice.
* [Choice Two] 
    This was the second choice.
- 
* [Choice Three]
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
* [Choice 1]
    Next choice. 
    ** [Choice 1.1]
    Another choice.
    ** [Choice 1.2]
    One more.
* [Choice 2]
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

Simply displaying the choice does not increase its *seen* count, unlike other script lines assigned a label. Selecting a choice is the only way that its *seen* count is increased.

Jumping to a choice that has been assigned a label is the equivalent of selecting that choice. In other words, the *seen* count for the label assigned to that choice is increased and **Sadako** begins processing the lines inside that choice's story block.

```
## Page1
    Begin test.
    >> test

    This text will not be seen.

    * {test} Choice name will not display
        Hello!
        Times choice 1 has been seen: %:Page1.test
    * {test2} Second choice
        Bleh
        
    - Times choice 2 has been seen: %Page1.test2


// outputs
Begin test.
Hello!
Times choice 1 has been seen: 1
Times choice 2 has been seen: 0
```

Choices using a `*` choice token (as opposed to a `+` static choice token) will disappear after being clicked once.

```
{loop}
* Choice 1
* Choice 2
* Choice 3
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

Choices also come with a method for a default fallthrough when all other options have been chosen. All you need to do is have a choice without a text description. Once all visible choices have been exhausted, Sadako will then select the first unnamed choice that it sees. You can use this to safely exit a loop.

```
{loop}        
* [Choice 1]
* [Choice 2]
* [Choice 3]
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
    
**variable**: _sadako.token.choice_

    
### Static choice

`+`

A choice using `*` will be hidden once it's been chosen. To avoid thus behavior, use `+` instead. A choice using `+` will never be hidden. 

**variable**: _sadako.token.static_


### Depth token

`-`

The depth token realigns the depth. Say that you are three levels deep in choices and you want to get back to a depth of 1. The `-` depth token is the most convenient way to do it. 

The depth can also changed using `*` choice tokens, `+` static choice tokens, `=` label tokens, and `~` conditional tokens. The difference is that the `-` depth token only sets the depth and does not perform any extra functions.

The flow of story script goes like this:

1. All non-choice story script lines are processed. 
2. If the script sees `<< END` or `<< EXIT`, it stops processing any further lines of script.
3. If the script runs out of content in that depth, it looks for a depth changing token (listed above) in the next line and sets the depth to that. If there is not a depth token, the script stops processing.
4. If the script sees any choices, it will process all choices until it sees a non-choice depth token.
5. After a choice is selected, the script will jump to the story block with that choice and start again at step 1.

```
This is level 1.
* [Choice 1]
    Choice 1, level 2.
    ** [Choice 1.1]
    Choice 1.1, level 3.
    ** [Choice 1.2]
    Choice 1.1, level 3.
    -- Level 2 again.
    Still level 2.
* [Choice 2]
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
* [Choice 1]
* [Choice 2]
-
* [Choice 3]


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

**variable**: _sadako.token.label_
    

### Condition Block

`~`

The condition block allows you to display or not display blocks of story script based on conditions. It's basically `if`/`else if`/`else` from javascript, except it runs story script instead.

It's important to note that the `~` condition token acts the same as a `+` static choice token. That is, it has levels of depth based on the number of leading tokens, and the script inside the block increases by one depth. However, the script will not stop at `-` depth tokens or `=` label tokens after seeing a `~` conditional token, which is the case with choices.

```
~ if ($.money > 100)
    You can buy the following items.
    ** [A pack of gum.]
        You bought some gum.
    ** [Some milk.]
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
    
Notice that the depth level increased inside the conditional block, so the choices begin with two `*` choice tokens instead of one. If you only had one, the choice would be outside of the conditional block even though it was indented correctly. 

The following is an example of erroneous code.
    
```
Beginning test.
~ if (1 == 0)
    This text will not be seen.
    * [This choice is not inside the block]
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

**variable**: _sadako.token.cond_block_
