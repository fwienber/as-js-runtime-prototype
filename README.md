# AS-JS-Runtime prototype #

To re-generate linked and minified version, setup RequireJS optimizer as described
[here](http://requirejs.org/docs/optimization.html) and execute the following
command lines in the project root directory:

    node r.js -o baseUrl=amd name=hello-world out=hello-world-all.js optimize=none
    node r.js -o baseUrl=amd name=hello-world out=hello-world-all.min.js optimize=uglify2
