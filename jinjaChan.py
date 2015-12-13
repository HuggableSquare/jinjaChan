import sys
import json
import jinja2
import os
from htmlmin.minify import html_minify

json_data = open(sys.argv[1])
data = json.load(json_data)

templateLoader = jinja2.FileSystemLoader(os.getcwd())
templateEnv = jinja2.Environment(loader=templateLoader)
TEMPLATE_FILE = "template.html"
template = templateEnv.get_template(TEMPLATE_FILE)
outputText = template.render(posts=data)

minified_html = html_minify(outputText)

outputfile = open(sys.argv[2], "w")
outputfile.write(minified_html.encode('utf-8'))
outputfile.close()
json_data.close()
