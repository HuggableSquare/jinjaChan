jinjaChan
====
jinjaChan is a jinja2 template for creating html from [4chan's JSON API](https://github.com/4chan/4chan-API)  
works well with bibanon's [BASC-Archiver](https://github.com/bibanon/BASC-Archiver) (note: must slightly change file structure)

dependencies
----
- [jinja2](http://jinja.pocoo.org/)
- [django-htmlmin](https://github.com/cobrateam/django-htmlmin)

usage
----
the provided script is ran as the following:

    python jinjaChan.py "/path/to/json" "/path/to/output"

the css, js, and image folders are all supposed to be placed at the root of the webserver you are hosting the html on

your files must be in a folder structure like `http://example.com/b/thread/9001/` or else the extension js will break

notes
----
- the html must be minified before use or else the inline expanding is broken
- links get matched based on board/thread/tid
- filesizes read differently than on 4chan because of built in jinja filter #wontfix
- html doesn't get a title tag yet
- no way to change css yet
