The compiler **Kayako** can be run or compiled on the command-line using node.js.

Node.js can be grabbed from here: https://nodejs.org

To compile to an executable: `npx pkg kayako_cli.js`

To run the JS file: `node kayako_cli.js`

For command-line arguments, Kayako accepts a list of files and will combine them all into a single JSON file as output. The default output file is `story.js`. You can change this with `-o` or `--output`.

Example: `kayako_cli.exe -o mystory.js file1.txt file2.txt file3.txt`

`kayako.html` is a really simple page used to compile sadako script into JSON. Just paste the script in the top edit box, hit compile, and then copy the resulting output in the bottom box as a .js file to use for your game.
