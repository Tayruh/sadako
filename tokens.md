# Tokens

Note: **Sadako** offers the ability to customize the tokens use for parsing the story script. I did my best to select tokens that were short in length, easy on the eyes, and avoided potential conflicts with javascript and a normal writing style. The information in this documentation is based on the default assignment for each token.

If you are unhappy with my choices, I provide the variable names of each token. You may change their values to suit your needs. Be aware that if you change them, you may need to escape special characters with `\\` in order for them to work correctly. Some but not all of them are used inside regular expressions.

## Comments

### Comment block

`/*` `*/`

Anything within the these tokens is removed from the story script before it's even parsed. Because of this, you can use it also ignore line breaks.

    /*
    None of this will matter.
    So write whatever you want.
    */
    
**variables**: _sadako.token.comment_open_, _sadako.token.comment_close_


### Line comment

`//`

Any line beginning with this token will be ignored by the script.

Be sure not to confuse this with the `//` tag token. If this token begins a line, it's a comment. If it is preceded by any text, it'll be considered the tag token. If you dislike this or find it confusing, feel free to change the token string to something you find more desirable.

**variable**: _sadako.token.comment_


## Text Formatting

### Line ending

`.,` 

Separates lines of the script. **Sadako** uses carriage returns to separate lines, so this token is only necessary if you would like to include multiple statements on the same line for convenience.

    Hello world!., This is the second line

This is the same as

    Hello world!
    This is the second line

**variable**: _sadako.token.line_


### Line break

`^^`

This inserts a line break (`<br>` tag) into the script.

**Sadako** separates script lines with either a carriage return or a line ending `.,` token. By default, the resulting text is wrapped in a `<p>` tag. The `^^` token inserts a `<br>` into the output so that the line break stays within paragraph tags.

    Hello world!^^This is still within the paragraph.
    This is a separate paragraph.
    
    // outputs
    <p>Hello world!<br>This is still within the paragraph.</p>
    <p>This is a separate paragraph.</p>

**variable**: _sadako.token.break_


### Text attachment

`<>`

Attaches two lines of text together. `<>` can begin or end a line. If it begins the line, it'll be attached to the previous line. If it ends the line, the next one will be attached to this one.

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

**variables**: _sadako.token.attach_


### Span markup

`<:` `:>`

Span token. This is used to easily attach a CSS class to a block of text. You separate the CSS class from the text using `::`. It doesn't save a ton of typing, but it makes the story script a bit more readable.

    <:test::This will use the "test" class.:>
    
    // outputs
    <span class="test">This will use the "test" class.</span>


**variables**: _sadako.token.span_open_, _sadak.token.span_close_, _sadako.token.cond_


## Variables and Conditionals


### Variable embedding

For convenience sake, there are tokens that allow easy embedding of **Sadako** variables. They are as follows. (*foo* will be used as an example variable/text and does not actually exist.)

#### For use in story script

* `$:foo` becomes `[:= sadako.var.foo:]`
* `_:foo` becomes `[:= sadako.tmp.foo:]`
* `#:foo` becomes `[:= sadako.page_seen["foo"]:]`
* `%:foo` becomes `[:= sadako.label_seen["foo"]:]`


    The color of the gem was a bright $:sadako.var.color.
    
    // outputs (assuming sadako.var.color is "green")
    The color of the gem was a bright green.

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
    
`sadako.text` is the variable that holds the text being processed for the current line. Just returning text from a function will not work unless you use the `=` equate token inside the `[: :]` script block (which hopefully explains how the story script text replacements work). If you are inside a function and want to add to or replace the text output for the current line, `sadako.text` is the variable to use.

Notice how the first section of text is missing in the first line of the example. This is because `~.` replaces the text up to that point. `~+.` appends onto the text.

`sadako.var` is an object variable that contains user defined variables. These variables are automatically saved to disk when you save the game.

`sadako.tmp` is also an object variable that contains user defined variables. However, these variables are cleared every time `sadako.doPage()`, `sadako.doJump()`, `sadako.doChoice()`, and `sadako.doScript()` are called. That is to say, any time you click a link that progresses the story script.

    You found a bright [: ~.sadako.var.color:] gem.
    You found a bright [: ~+.sadako.var.color:] gem.

    // outputs (assuming sadako.var.color is "green")
    green gem.
    You found a bright green gem.

In most situations you can stack replacement tokens, so the above can be written like so and will have the same result.

    You found a bright [: ~+.$.color:] gem.

Regarding `sadako.page_seen` and `sadako.label_seen`, every time you  transition to a new page, progress past a label in the script, or select a choice that is preceded by a label, the counter for that page or label is increased by 1. This is convenient for checking whether you've seen a part of the script and how many times.

**variables**: 
* _var_embed_, _tmp_embed_
* _write_embed_, _write2_embed_, _write3_embed_
* _pluswrite_embed_, _pluswrite2_embed_, _pluswrite3_embed_

The `.` (variable) and `:` (value) tokens may also be changed.
* _cond_embed_, _value_embed_


### Conditional display

`::` 

The statement preceding the `::` conditional token will only be displayed and scripts executed if the statement following it equates to true. 

In the following example, the line will not be displayed if *money* is less than 100.

    You don't have enough money. :: $.money < 100

**variable**: _sadako.token.cond_


### Inline text options

`{:` `:}`

The inline conditional block is for easy selecting between swapping between two different text options.

The sections of the statement are separated by `::` conditional token. The first section is the condition check, the second section prints if the condition is true, and the third section (if provided) prints if the condition is false.

    You check your wallet{:$.money < 50::, but it seems that you don't:: and it appears that you:} have enough money to buy it.
    
    // outputs
    // if less than 50: 
    You check you wallet, but it seems that don't have enough money to buy it.
    // otherwise:
    You check your wallet and it appears that you have enough money to buy it.
    
You can also exclude the second option and it'll only print the first one if it's true and nothing if it's false.

    You carefully pick up the {:$.vase_damaged::cracked:}vase and put it back on the shelf.
    
    // outputs
    // if vase is damaged:
    You carefully pick up the cracked vase and put it back on the shelf.
    // if not:
    You carefully pick up the vase and put it back on the shelf.

**variables**: _sadako.token.inline_open_, _sadako.token.inline_close_, _sadako.token.cond_


### Script block

`[:` `:]`

A standard script block inserts a link to a page. 

    [:blargh:]
    
    // output
    <a onclick='sadako.doPage("blargh")'>blargh</a>

If you follow the page name with `@:`, you can rename the link.

    [:some_annnoying_title @: the next room:]
    
    // output
    <a onclick='sadako.doPage("some_annnoying_title")'>the next room</a>
    
You can lead the script block with a token and it will do things besides linking to a page.

* `#` Links to a page. Same result as no token.
* `%` Links to a label.
* `&` Executes javascript. Does not print result.
* `=` Evaluates a variable or javascript and prints the text.

**Sadako** assumes that a label is local unless otherwise stated. If you want to access a label that's not local, you must include the page with the label, like `some_page.some_label`.

As an example, the following the javascript alert box with the "Hello world!" message.
    
    [:& alert("Hello world!"):]

For `#`, `%`, and even the `@:` token used for renaming, you can follow it with `=` and it will evaluate the value and use that.

    [:#= "Page " + (2 - 1) @:= (1==1) ? "bleh" : "meh":]
    
    // output
    <a onclick='sadako.doPage("Page 1")'>bleh</a>
    
It's also important to note that the `[: :]` script block is the only block to ignore line breaks. The space between `[:` and the leading tokens are also ignored. This is so that you can include properly formatted javascript. Because of that, script like this won't break, even though it's an exercise in poor formatting.

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
    
    // output
    <a onclick"sadako.doPage("Page 1")>meh</a>
    
**variables**: 
* _sadako.token.tag_open_, _sadako.token.tag_close_
* _sadako.token.page_embed_, _sadako.token.label_embed_
* _sadako.token.eval_code_, _sadako.token.eval_value_
* _sadako.token.rename_


