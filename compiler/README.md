This package contains precompiled copies of **Kayako**.


------------------------------ 
**Using the pre-compiled binaries**

The commandline usage is: kayako_cli-win.exe input1.sko input2.sko input3.sko -o output.js

If the output file isn't provided, it outputs to `story.js` by default. The .sko extension isn't necessary. It accepts any extension.


------------------------------
**Using the source code**

Install node.js (includes npm and npx): https://nodejs.org/
Install pkg (from commandline after installing node.js): `npm install -g pkg`

To run Kayako with node.js: `node kayako_cli.js <parameters>`
To compile Kayako to binaries with node.js: `npx pkg kayako_cli.js`
