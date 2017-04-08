/**
 * Tooltips
 */
var Tip = {
  node: null,
  timeout: null,
  delay: 300,
  
  init: function() {
    document.addEventListener('mouseover', this.onMouseOver, false);
    document.addEventListener('mouseout', this.onMouseOut, false);
  },
  
  onMouseOver: function(e) {
    var cb, data, t;
    
    t = e.target;
    
    if (Tip.timeout) {
      clearTimeout(Tip.timeout);
      Tip.timeout = null;
    }
    
    if (t.hasAttribute('data-tip')) {
      data = null;
      
      if (t.hasAttribute('data-tip-cb')) {
        cb = t.getAttribute('data-tip-cb');
        if (window[cb]) {
          data = window[cb](t);
        }
      }
      Tip.timeout = setTimeout(Tip.show, Tip.delay, e.target, data);
    }
  },
  
  onMouseOut: function(e) {
    if (Tip.timeout) {
      clearTimeout(Tip.timeout);
      Tip.timeout = null;
    }
    
    Tip.hide();
  },
  
  show: function(t, data, pos) {
    var el, rect, style, left, top;
    
    rect = t.getBoundingClientRect();
    
    el = document.createElement('div');
    el.id = 'tooltip';
    
    if (data) {
      el.innerHTML = data;
    }
    else {
      el.textContent = t.getAttribute('data-tip');
    }
    
    if (!pos) {
      pos = 'top';
    }
    
    el.className = 'tip-' + pos;
    
    document.body.appendChild(el);
    
    left = rect.left - (el.offsetWidth - t.offsetWidth) / 2;
    
    if (left < 0) {
      left = rect.left + 2;
      el.className += '-right';
    }
    else if (left + el.offsetWidth > document.documentElement.clientWidth) {
      left = rect.left - el.offsetWidth + t.offsetWidth + 2;
      el.className += '-left';
    }
    
    top = rect.top - el.offsetHeight - 5;
    
    style = el.style;
    style.top = (top + window.pageYOffset) + 'px';
    style.left = left + window.pageXOffset + 'px';
    
    Tip.node = el;
  },
  
  hide: function() {
    if (Tip.node) {
      document.body.removeChild(Tip.node);
      Tip.node = null;
    }
  }
}

function cloneTopNav() {
  var navT, navB, ref, el;

  navT = document.getElementById('boardNavDesktop');

  if (!navT) {
    return;
  }

  ref = document.getElementById('absbot');

  navB = navT.cloneNode(true);
  navB.id = navB.id + 'Foot';

  if (el = navB.querySelector('#navtopright')) {
    el.id = 'navbotright';
  }

  if (el = navB.querySelector('#settingsWindowLink')) {
    el.id = el.id + 'Bot';
  }

  document.body.insertBefore(navB, ref);
}

function onStyleSheetChange(e) {
  setActiveStyleSheet(this.value);
}

var activeStyleSheet;

function initStyleSheet() {
  var i, rem, link, len;

  // hack for people on old things
  if (typeof style_group != "undefined" && style_group) {
    var cookie = readCookie(style_group);
    activeStyleSheet = cookie ? cookie : getPreferredStyleSheet();
  }

  switch(activeStyleSheet) {
  case "Yotsuba B":
    setActiveStyleSheet("Yotsuba B New", true);
    break;

  case "Yotsuba":
    setActiveStyleSheet("Yotsuba New", true);
    break;

  case "Burichan":
    setActiveStyleSheet("Burichan New", true);
    break;

  case "Futaba":
    setActiveStyleSheet("Futaba New", true);
    break;

  default:
    setActiveStyleSheet(activeStyleSheet, true);
    break;
  }
}

function setActiveStyleSheet(title, init) {
  var a, link, href, i, nodes;

  if( document.querySelectorAll('link[title]').length == 1 ) {
    return;
  }

  href = '';

  nodes = document.getElementsByTagName('link');

  for (i = 0; a = nodes[i]; i++) {
    if (a.getAttribute("title") == "switch") {
      link = a;
    }

    if (a.getAttribute("rel").indexOf("style") != -1 && a.getAttribute("title")) {
      if (a.getAttribute("title") == title) {
        href = a.href;
      }
    }
  }

  link && link.setAttribute("href", href);

  if (!init) {
		document.cookie = style_group + "=" + title;
  }
}

function getActiveStyleSheet() {
  var i, a;
  var link;

  if( document.querySelectorAll('link[title]').length == 1 ) {
    return 'Yotsuba P';
  }

  for (i = 0; (a = document.getElementsByTagName("link")[i]); i++) {
    if (a.getAttribute("title") == "switch")
               link = a;
    else if (a.getAttribute("rel").indexOf("style") != -1 && a.getAttribute("title") && a.href==link.href) return a.getAttribute("title");
  }
  return null;
}

function getPreferredStyleSheet() {
  return (style_group == "ws_style") ? "Yotsuba B New" : "Yotsuba New";
}

function readCookie(name) {
  var nameEQ = name + "=";
  var ca = document.cookie.split(';');
  for (var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) == 0) {
      return decodeURIComponent(c.substring(nameEQ.length, c.length));
    }
  }
  return '';
}

function contentLoaded() {
	document.removeEventListener('DOMContentLoaded', contentLoaded, true);

	cloneTopNav()

	if (el = document.getElementById('styleSelector')) {
    el.addEventListener('change', onStyleSheetChange, false);
  }

  Tip.init();
}

function init() {
  /*if (window.math_tags && pageHasMath()) {
    loadMathJax();
  }*/

  if( document.getElementById('styleSelector') ) {
    styleSelect = document.getElementById('styleSelector');
    len = styleSelect.options.length;
    for ( var i = 0; i < len; i++) {
      if (styleSelect.options[i].value == activeStyleSheet) {
        styleSelect.selectedIndex = i;
        continue;
      }
    }
  }
}

window.onload = init;
document.addEventListener('DOMContentLoaded', contentLoaded, true);

initStyleSheet();
