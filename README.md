# Sadako

Sadako is a JavaScript library for creating hyperlink-based interactive fiction similar to [Twine](https://twinery.org/), [ChoiceScript](https://www.choiceofgames.com/make-your-own-games/choicescript-intro/), and [Ink](https://www.inklestudios.com/ink/). Sadako is my attempt at merging Twine-like markup and Ink-like choice trees into a cohesive scripting language that I call *Sadako script*.

A guide on how to setup an HTML page for use with Sadako can be viewed [here](getting-started.md).

A reference and guide on how to use Sadako script, the scripting language developed for Sadako, can be viewed [here](reference.md).

The reference for Sadako specific JavaScript functions and variables is [here](javascript_reference.md).

**[Rainy Day](https://tayruh.github.io/rainy_day/)** is a simple demo of Sadako in action. You can find its commented source code [here](https://github.com/Tayruh/tayruh.github.io/tree/master/rainy_day).

A more complex demo is my personal game in progress, **[Monster](https://tayruh.github.io/monster/)**. Its source code is [here](https://github.com/Tayruh/tayruh.github.io/tree/master/monster).

![alt text](https://github.com/Tayruh/sadako/blob/master/screenshot.png "Screenshot")

The following is a short example written in Sadako script.

```
## start
    [:& $.on_floor = true:]
    >> #main_room

    
## main_room
    You're in a dimly lit room.
    It's really dark in here. You can see that the windows are covered in cardboard with light just barely seeping out from the corners; not enough to light the room. <>
    In the corner of the room seems to be a [:% body @: large mass:] of some sort.
    Now that your eyes have adjusted to the darkness, you spot what appears to be a [:mop:] laying barely within reach. :: #.main_room > 1 && $.on_floor
    << END
    
    = body
    ~ if $.on_floor
        The mass is on the other side of the room. You'll have to get up in order to reach it.
        ++ {get_up} [Get up]
            ~~~ if %.main_room.get_up === 1
                You struggle to stand but your legs are incredibly weak and battered. When did this happen? What happened? You can't remember anything.
                Either way, you're going to need assistance to stand.
            ~~~ else
                You're not getting up on your own. Maybe there's something around in the darkness that can help support your weight.
            --- >> go_back
        ++ {body_ret} [Back];; << RETURN
    ~ else
        As you hobble your way to lump on the floor, it becomes increasingly clear that what you're looking at is a body. Are they dead, or just unconscious?
        
        ++ [Poke it]
            You gently poke the body with the end of the mop. It stirs slightly.
            +++ [Poke again]
                The person rolls over and reveals itself to be a young woman. She groans.
                >> chat
    - << END
    
    = chat
    + "Are you alright?"
        It takes her a moment to respond. "I think so..?" <>
    + "Hey. Get up."
        "Ugh. Hold on," she groans back at you.
    - She pushes herself up just enough to rest on her elbow and surveys her surroundings. "Where are we?"
    + "I don't know. What do you remember?"
    + "I can't remember anything."
    - "I remember.. falling."
    <b><i>End of Demo</i></b>
    << END
    
    = go_back
    + {gb} [Back];; << RETURN

    
## mop
    It's no wonder you didn't see the mop at first. Only the head of it manages to escape the darkness thanks to the smallest ray of light escaping the masked windows.
    + {take_mop} [Take]
        [:& $.on_floor = false:]
        Laying on your side, you reach out as far as you can and manage to grab the head of the mop. You pull it towards yourself. 
        You remove the mop head the handle and brace the handle against the floor. You pull and then push down on the handle as you unsteadily rise to your feet. You continue to rest against it as a makeshift cane.        
        ++ {take_ret} [Back];; >> #main_room
    + {mop_ret} [Back]
        >> #main_room
```

Why the name *Sadako* for a hypertext fiction engine? No real reason. I usually name my projects after my favorite characters in the respective genre. For example, I named a fighting game engine Kazama after Jun Kazama of Tekken and a visual novel engine after Reiko in Seasons of the Sakura. However, I don't have any favorite characters in this genre since most games don't have strong characters and only self-insert protagonists. Instead I chose to go with my favorite thing, which is japanese horror. I love Ringu and Juon, so I chose Sadako as the main engine, and I thought it'd be humorous to have Kayako as the compiler. Sadako vs Kayako. Yes, I'm lame. Please forgive me. 🙏
