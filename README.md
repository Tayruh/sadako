# Sadako

Sadako is a javascript library for creating hyperlink based interactive fiction similar to [Twine](https://twinery.org/), [ChoiceScript](https://www.choiceofgames.com/), and [Ink](https://www.inklestudios.com/ink/). Those engines are great at doing what they do and I highly encourage checking them out. However, each of them focuses on a specific area (Twine is HTML-like markup and Ink is choice based flow of dialogue) and do them really well, but it makes it quite difficult to emulate the functionality of the other without basically bending the framework beyond what it was intended to do. Sadako is my attempt of merging the two ideologies into a cohesive scripting language.

This library is intended to be fairly open ended so that it may easily fit into a node.js project or something similar rather than being tightly tied to HTML output. While it comes with a few functions used to make working with HTML easier, it's not reliant upon them. In fact, functions like the ones for text displaying are purposelly exposed so that the user can rewrite them suit their needs.

A goal of this project was to shoot for the high compatibility for browsers and javascript. It should be fully ECMAScript 5 compatible and  fully functioning in Internet Explorer and Microsoft Edge, and mobile browsers, along with more modern browsers like Chrome and Firefox.

A final note: The syntax to Sadako's scripting language shares a few commonalities with Twine and Ink's syntax due to my desire to merge the two. Sadako's concept is the result of my time spent toying around with each of the engines and reading their tutorials, and the implimentation of its syntax was derived from my understanding of each language and not based on their source code.

#### Tutorial

You can find the documentation [here](tutorial.md).
