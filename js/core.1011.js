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

function contentLoaded() {
  Tip.init();
}

function loadExtraScripts() {
  var el;
  
  if (window.FC) {
    el = document.createElement('script');
    el.type = 'text/javascript';
    el.src = '/js/extension.1071.js';
    document.head.appendChild(el);
  }
  else {
    document.write('<script type="text/javascript" src="/js/extension.1071.js"></script>');
  }
  
  return true;
}

document.addEventListener('DOMContentLoaded', contentLoaded, true);
