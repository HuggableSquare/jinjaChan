import json
import jinja2
import os
from htmlmin.minify import html_minify
import argparse
import requests

parser = argparse.ArgumentParser()
parser.add_argument('input', help='json input file')
parser.add_argument('output', help='html output file')
parser.add_argument('-b', '--board', help='defining the board makes title more accurate')
args = parser.parse_args()

# open thread json and add it to the render arguments
renderArgs = dict(posts=json.load(open(args.input))['posts'])

if args.board:
  boards = requests.get('https://a.4cdn.org/boards.json').json()['boards']
  # filter the boards json to find the correct board
  renderArgs['board'] = [b for b in boards if b['board'] == args.board][0]

templateLoader = jinja2.FileSystemLoader(os.getcwd())
templateEnv = jinja2.Environment(loader=templateLoader)
template = templateEnv.get_template('template.html')

outputText = template.render(renderArgs)
minified = html_minify(outputText)
# python 2 encoding fix
if not isinstance(minified, str):
  minified = minified.encode('utf-8')

outputFile = open(args.output, 'w')
outputFile.write(minified)
outputFile.close()
