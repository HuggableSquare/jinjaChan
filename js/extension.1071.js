/********************************
 *                              *
 *        4chan Extension       *
 *                              *
 ********************************/

/**
 * Helpers
 */
var $ = {};

$.id = function(id) {
  return document.getElementById(id);
};

$.cls = function(klass, root) {
  return (root || document).getElementsByClassName(klass);
};

$.byName = function(name) {
  return document.getElementsByName(name);
};

$.tag = function(tag, root) {
  return (root || document).getElementsByTagName(tag);
};

$.qs = function(sel, root) {
  return (root || document).querySelector(sel);
};

$.qsa = function(selector, root) {
  return (root || document).querySelectorAll(selector);
};

$.extend = function(destination, source) {
  for (var key in source) {
    destination[key] = source[key];
  }
};

$.on = function(n, e, h) {
  n.addEventListener(e, h, false);
};

$.off = function(n, e, h) {
  n.removeEventListener(e, h, false);
};

if (!document.documentElement.classList) {
  $.hasClass = function(el, klass) {
    return (' ' + el.className + ' ').indexOf(' ' + klass + ' ') != -1;
  };
  
  $.addClass = function(el, klass) {
    el.className = (el.className === '') ? klass : el.className + ' ' + klass;
  };
  
  $.removeClass = function(el, klass) {
    el.className = (' ' + el.className + ' ').replace(' ' + klass + ' ', '');
  };
}
else {
  $.hasClass = function(el, klass) {
    return el.classList.contains(klass);
  };
  
  $.addClass = function(el, klass) {
    el.classList.add(klass);
  };
  
  $.removeClass = function(el, klass) {
    el.classList.remove(klass);
  };
}

$.get = function(url, callbacks, headers) {
  var key, xhr;
  
  xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
  if (callbacks) {
    for (key in callbacks) {
      xhr[key] = callbacks[key];
    }
  }
  if (headers) {
    for (key in headers) {
      xhr.setRequestHeader(key, headers[key]);
    }
  }
  xhr.send(null);
  return xhr;
};

$.xhr = function(method, url, callbacks, data) {
  var key, xhr, form;
  
  xhr = new XMLHttpRequest();
  
  xhr.open(method, url, true);
  
  if (callbacks) {
    for (key in callbacks) {
      xhr[key] = callbacks[key];
    }
  }
  
  if (data) {
    form = new FormData();
    for (key in data) {
      form.append(key, data[key]);
    }
    data = form;
  }
  else {
    data = null;
  }
  
  xhr.send(data);
  
  return xhr;
};

$.ago = function(timestamp) {
  var delta, count, head, tail;
  
  delta = Date.now() / 1000 - timestamp;
  
  if (delta < 1) {
    return 'moments ago';
  }
  
  if (delta < 60) {
    return (0 | delta) + ' seconds ago';
  }
  
  if (delta < 3600) {
    count = 0 | (delta / 60);
    
    if (count > 1) {
      return count + ' minutes ago';
    }
    else {
      return 'one minute ago';
    }
  }
  
  if (delta < 86400) {
    count = 0 | (delta / 3600);
    
    if (count > 1) {
      head = count + ' hours';
    }
    else {
      head = 'one hour';
    }
    
    tail = 0 | (delta / 60 - count * 60);
    
    if (tail > 1) {
      head += ' and ' + tail + ' minutes';
    }
    
    return head + ' ago';
  }
  
  count = 0 | (delta / 86400);
  
  if (count > 1) {
    head = count + ' days';
  }
  else {
    head = 'one day';
  }
  
  tail = 0 | (delta / 3600 - count * 24);
  
  if (tail > 1) {
    head += ' and ' + tail + ' hours';
  }
  
  return head + ' ago';
};

$.hash = function(str) {
  var i, j, msg = 0;
  for (i = 0, j = str.length; i < j; ++i) {
    msg = ((msg << 5) - msg) + str.charCodeAt(i);
  }
  return msg;
};

$.prettySeconds = function(fs) {
  var m, s;
  
  m = Math.floor(fs / 60);
  s = Math.round(fs - m * 60);
  
  return [ m, s ];
};

$.docEl = document.documentElement;

$.cache = {};

/**
 * Parser
 */
var Parser = {
  tipTimeout: null
};

Parser.init = function() {
  var o, a, h, m, tail, staticPath;
  
  if (Config.linkify || Config.embedSoundCloud
    || Config.embedYouTube || Main.hasMobileLayout) {
    this.needMsg = true;
  }
  
  staticPath = '//s.4cdn.org/image/';
  
  tail = window.devicePixelRatio >= 2 ? '@2x.gif' : '.gif';
  
  this.icons = {
    admin: staticPath + 'adminicon' + tail,
    founder: staticPath + 'foundericon' + tail,
    mod: staticPath + 'modicon' + tail,
    dev: staticPath + 'developericon' + tail,
    manager: staticPath + 'managericon' + tail,
    del: staticPath + 'filedeleted-res' + tail
  };
  
  this.prettify = typeof prettyPrint == 'function';
  
  this.customSpoiler = {};
  
  if (Config.localTime) {
    if (o = (new Date()).getTimezoneOffset()) {
      a = Math.abs(o);
      h = (0 | (a / 60));
      
      this.utcOffset = 'Timezone: UTC' + (o < 0 ? '+' : '-')
        + h + ((m = a - h * 60) ? (':' + m) : '');
    }
    else {
      this.utcOffset = 'Timezone: UTC';
    }
    
    this.weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  }
  
  this.postMenuIcon = Main.hasMobileLayout ? '...' : '▶';
};

Parser.parseThreadJSON = function(data) {
  var thread;
  
  try {
    thread = JSON.parse(data).posts;
  }
  catch (e) {
    console.log(e);
    thread = [];
  }
  
  return thread;
};

Parser.parseCatalogJSON = function(data) {
  var catalog;
  
  try {
    catalog = JSON.parse(data);
  }
  catch (e) {
    console.log(e);
    catalog = [];
  }
  
  return catalog;
};

Parser.setCustomSpoiler = function(board, val) {
  var s;
  if (!this.customSpoiler[board] && (val = parseInt(val))) {
    if (board == Main.board && (s = $.cls('imgspoiler')[0])) {
      this.customSpoiler[board] =
        s.firstChild.src.match(/spoiler(-[a-z0-9]+)\.png$/)[1];
    }
    else {
      this.customSpoiler[board] = '-' + board
        + (Math.floor(Math.random() * val) + 1);
    }
  }
};

Parser.buildPost = function(thread, board, pid) {
  var i, j, uid, el = null;
  
  for (i = 0; j = thread[i]; ++i) {
    if (j.no != pid) {
      continue;
    }
    
    if (!Config.revealSpoilers && thread[0].custom_spoiler) {
      Parser.setCustomSpoiler(board, thread[0].custom_spoiler);
    }
    
    el = Parser.buildHTMLFromJSON(j, board, false, true).lastElementChild;
    
    if (Config.IDColor && (uid = $.cls('posteruid', el)[Main.hasMobileLayout ? 0 : 1])) {
      IDColor.applyRemote(uid.firstElementChild);
    }
  }
  
  return el;
};

Parser.decodeSpecialChars = function(str) {
  return str.replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
};

Parser.encodeSpecialChars = function(str) {
  return str.replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
};

Parser.onDateMouseOver = function(el) {
  if (Parser.tipTimeout) {
    clearTimeout(Parser.tipTimeout);
    Parser.tipTimeout = null;
  }
  
  Parser.tipTimeout = setTimeout(Tip.show, 500, el, $.ago(+el.getAttribute('data-utc')));
};

Parser.onTipMouseOut = function() {
  if (Parser.tipTimeout) {
    clearTimeout(Parser.tipTimeout);
    Parser.tipTimeout = null;
  }
};

Parser.onUIDMouseOver = function(el) {
  var p;
  
  if (!$.hasClass(el.parentNode, 'posteruid')) {
    return;
  }
  
  if (!Main.tid) {
    p = el.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode;
    
    if (!$.hasClass(p, 'tExpanded')) {
      return;
    }
  }
  
  if (Parser.tipTimeout) {
    clearTimeout(Parser.tipTimeout);
    Parser.tipTimeout = null;
  }
  
  Parser.tipTimeout = setTimeout(Parser.showUIDCount, 500, el, el.textContent);
};

Parser.showUIDCount = function(t, uid) {
  var i, el, nodes, count, msg;
  
  count = 0;
  nodes = $.qsa('.postInfo .hand');
  
  for (i = 0; el = nodes[i]; ++i) {
    if (el.textContent === uid) {
      ++count;
    }
  }
  
  msg = count + ' post' + (count != 1 ? 's' : '') + ' by this ID';
  
  Tip.show(t, msg);
};

Parser.buildHTMLFromJSON = function(data, board, standalone, fromQuote) {
  var
    container = document.createElement('div'),
    isOP = false,
    
    userId,
    fileDims = '',
    imgSrc = '',
    fileInfo = '',
    fileHtml = '',
    fileThumb,
    filePath,
    fileName,
    fileSpoilerTip = '"',
    size = '',
    fileClass = '',
    shortFile = '',
    longFile = '',
    tripcode = '',
    capcodeStart = '',
    capcodeClass = '',
    capcode = '',
    flag,
    highlight = '',
    emailStart = '',
    emailEnd = '',
    name, mName,
    subject,
    noLink,
    quoteLink,
    replySpan = '',
    noFilename,
    decodedFilename,
    mobileLink = '',
    postType = 'reply',
    summary = '',
    postCountStr,
    resto,
    capcode_replies = '',
    threadIcons = '',
    needFileTip = false,
    
    i, q, href, quotes, tmp,
    
    imgDir;
  
  if (board !== 'f') {
    if (data.no % 3 > 2) {
      imgDir = '//is.4chan.org/' + board;
    }
    else {
      imgDir = '//is2.4chan.org/' + board;
    }
  }
  else {
    imgDir = '//i.4cdn.org/' + board;
  }
  
  if (data.resto === 0) {
    isOP = true;
    
    if (standalone) {
      if (data.replies > 0) {
        tmp = data.replies + ' Repl' + (data.replies > 1 ? 'ies' : 'y');
        if (data.images > 0) {
          tmp += ' / ' + data.images + ' Image' + (data.images > 1 ? 's' : '');
        }
      }
      else {
        tmp = '';
      }
      
      mobileLink = '<div class="postLink mobile"><span class="info">'
        + tmp + '</span><a href="'
        + 'thread/' + data.no + '" class="button">View Thread</a></div>';
      postType = 'op';
      replySpan = '&nbsp; <span>[<a href="'
        + 'thread/' + data.no + (data.semantic_url ? ('/' + data.semantic_url) : '')
        + '" class="replylink" rel="canonical">Reply</a>]</span>';
    }
    
    resto = data.no;
  }
  else {
    resto = data.resto;
  }
  
  
  if (!Main.tid || board != Main.board) {
    noLink = 'thread/' + resto + '#p' + data.no;
    quoteLink = 'thread/' + resto + '#q' + data.no;
  }
  else {
    noLink = '#p' + data.no;
    quoteLink = 'javascript:quote(\'' + data.no + '\')';
  }
  
  if (!data.capcode && data.id) {
    userId = ' <span class="posteruid id_'
      + data.id + '">(ID: <span class="hand" title="Highlight posts by this ID">'
      + data.id + '</span>)</span> ';
  }
  else {
    userId = '';
  }
  
  switch (data.capcode) {
    case 'admin_highlight':
      highlight = ' highlightPost';
      /* falls through */
    case 'admin':
      capcodeStart = ' <strong class="capcode hand id_admin" '
        + 'title="Highlight posts by Administrators">## Admin</strong>';
      capcodeClass = ' capcodeAdmin';
      
      capcode = ' <img src="' + Parser.icons.admin + '" '
        + 'alt="This user is a 4chan Administrator." '
        + 'title="This user is a 4chan Administrator." class="identityIcon">';
      break;
    case 'mod':
      capcodeStart = ' <strong class="capcode hand id_mod" '
        + 'title="Highlight posts by Moderators">## Mod</strong>';
      capcodeClass = ' capcodeMod';
      
      capcode = ' <img src="' + Parser.icons.mod + '" '
        + 'alt="This user is a 4chan Moderator." '
        + 'title="This user is a 4chan Moderator." class="identityIcon">';
      break;
    case 'developer':
      capcodeStart = ' <strong class="capcode hand id_developer" '
        + 'title="Highlight posts by Developers">## Developer</strong>';
      capcodeClass = ' capcodeDeveloper';
      
      capcode = ' <img src="' + Parser.icons.dev + '" '
        + 'alt="This user is a 4chan Developer." '
        + 'title="This user is a 4chan Developer." class="identityIcon">';
      break;
    case 'manager':
      capcodeStart = ' <strong class="capcode hand id_manager" '
        + 'title="Highlight posts by Managers">## Manager</strong>';
      capcodeClass = ' capcodeManager';
      
      capcode = ' <img src="' + Parser.icons.manager + '" '
        + 'alt="This user is a 4chan Manager." '
        + 'title="This user is a 4chan Manager." class="identityIcon">';
      break;
    case 'founder':
      capcodeStart = ' <strong class="capcode hand id_admin" '
        + 'title="Highlight posts by the Founder">## Founder</strong>';
      capcodeClass = ' capcodeAdmin';
      
      capcode = ' <img src="' + Parser.icons.founder + '" '
        + 'alt="This user is 4chan\'s Founder." '
        + 'title="This user is 4chan\'s Founder." class="identityIcon">';
    case 'verified':
      capcodeStart = ' <strong class="capcode hand id_verified" '
        + 'title="Highlight posts by Verified Users">## Verified</strong>';
      capcodeClass = ' capcodeVerified';
      
      capcode = '';
      break;
  }
  
  if (data.email) {
    emailStart = '<a href="mailto:' + data.email.replace(/ /g, '%20') + '" class="useremail">';
    emailEnd = '</a>';
  }
  
  if (data.country) {
    if (window.trollFlags) {
      flag = ' <img src="//s.4cdn.org/image/country/troll/'
        + data.country.toLowerCase() + '.gif" alt="'
        + data.country + '" title="' + data.country_name + '" class="countryFlag">';
    }
    else {
      flag = ' <span title="' + data.country_name + '" class="flag flag-'
        + data.country.toLowerCase() + '"></span>';
    }
  }
  else {
    flag = '';
  }
  
  if (data.filedeleted) {
    fileHtml = '<div id="f' + data.no + '" class="file"><span class="fileThumb"><img src="'
      + Parser.icons.del + '" class="fileDeletedRes" alt="File deleted."></span></div>';
  }
  else if (data.ext) {
    decodedFilename = Parser.decodeSpecialChars(data.filename);
    
    shortFile = longFile = data.filename + data.ext;
    
    if (decodedFilename.length > (isOP ? 40 : 30)) {
      shortFile = Parser.encodeSpecialChars(
        decodedFilename.slice(0, isOP ? 35 : 25)
      ) + '(...)' + data.ext;
      
      needFileTip = true;
    }
    
    if (!data.tn_w && !data.tn_h && data.ext == '.gif') {
      data.tn_w = data.w;
      data.tn_h = data.h;
    }
    if (data.fsize >= 1048576) {
      size = ((0 | (data.fsize / 1048576 * 100 + 0.5)) / 100) + ' M';
    }
    else if (data.fsize > 1024) {
      size = (0 | (data.fsize / 1024 + 0.5)) + ' K';
    }
    else {
      size = data.fsize + ' ';
    }
    
    if (data.spoiler) {
      if (!Config.revealSpoilers) {
        fileName = 'Spoiler Image';
        fileSpoilerTip = '" title="' + longFile + '"';
        fileClass = ' imgspoiler';
        
        fileThumb = '//s.4cdn.org/image/spoiler'
          + (Parser.customSpoiler[board] || '') + '.png';
        data.tn_w = 100;
        data.tn_h = 100;
        
        noFilename = true;
      }
      else {
        fileName = shortFile;
      }
    }
    else {
      fileName = shortFile;
    }
    
    if (!fileThumb) {
      fileThumb = '//i.4cdn.org/' + board + '/' + data.tim + 's.jpg';
    }
    
    fileDims = data.ext == '.pdf' ? 'PDF' : data.w + 'x' + data.h;
    
    if (board != 'f') {
      filePath = imgDir + '/' + data.tim + data.ext;
      
      imgSrc = '<a class="fileThumb' + fileClass + '" href="' + filePath
        + '" target="_blank"' + (data.m_img ? ' data-m' : '') + '><img src="' + fileThumb
        + '" alt="' + size + 'B" data-md5="' + data.md5
        + '" style="height: ' + data.tn_h + 'px; width: '
        + data.tn_w + 'px;">'
        + '<div data-tip data-tip-cb="mShowFull" class="mFileInfo mobile">'
        + size + 'B ' + data.ext.slice(1).toUpperCase()
        + '</div></a>';
      
      fileInfo = '<div class="fileText" id="fT' + data.no + fileSpoilerTip
        + '>File: <a' + (needFileTip ? (' title="' + longFile + '"') : '')
        + ' href="' + filePath + '" target="_blank">'
        + fileName + '</a> (' + size + 'B, ' + fileDims + ')</div>';
    }
    else {
      filePath = imgDir + '/' + data.filename + data.ext;
      
      fileDims += ', ' + data.tag;
      
      fileInfo = '<div class="fileText" id="fT' + data.no + '"'
        + '>File: <a href="' + filePath + '" target="_blank">'
        + data.filename + '.swf</a> (' + size + 'B, ' + fileDims + ')</div>';
    }
    
    fileHtml = '<div id="f' + data.no + '" class="file">'
      + fileInfo + imgSrc + '</div>';
  }
  
  if (data.trip) {
    tripcode = ' <span class="postertrip">' + data.trip + '</span>';
  }
  
  name = data.name || '';
  
  if (name.length > 30) {
    mName = '<span class="name" data-tip data-tip-cb="mShowFull">'
      + Parser.truncate(name, 30) + '(...)</span> ';
  }
  else {
    mName = '<span class="name">' + name + '</span> ';
  }
  
  if (isOP) {
    if (data.capcode_replies) {
      capcode_replies = Parser.buildCapcodeReplies(data.capcode_replies, board, data.no);
    }
    
    if (fromQuote && data.replies) {
      postCountStr = data.replies + ' repl' + (data.replies > 1 ? 'ies' : 'y');
      
      if (data.images) {
        postCountStr += ' and ' + data.images + ' image' +
          (data.images > 1 ? 's' : '');
      }
      
      summary = '<span class="summary preview-summary">' + postCountStr + '.</span>';
    }
    
    if (data.sticky) {
      threadIcons += '<img class="stickyIcon retina" title="Sticky" alt="Sticky" src="'
        + Main.icons2.sticky + '"> ';
    }
    
    if (data.closed) {
      if (data.archived) {
        threadIcons += '<img class="archivedIcon retina" title="Archived" alt="Archived" src="'
          + Main.icons2.archived + '"> ';
      }
      else {
        threadIcons += '<img class="closedIcon retina" title="Closed" alt="Closed" src="'
          + Main.icons2.closed + '"> ';
      }
    }
    
    if (data.sub === undefined) {
      subject = '<span class="subject"></span> ';
    }
    else if (data.sub.length > 30) {
      subject = '<span class="subject" data-tip data-tip-cb="mShowFull">'
        + Parser.truncate(data.sub, 30) + '(...)</span> ';
    }
    else {
      subject = '<span class="subject">' + data.sub + '</span> ';
    }
  }
  else {
    subject = '';
  }
  
  container.className = 'postContainer ' + postType + 'Container';
  container.id = 'pc' + data.no;
  
  container.innerHTML =
    (isOP ? '' : '<div class="sideArrows" id="sa' + data.no + '">&gt;&gt;</div>') +
    '<div id="p' + data.no + '" class="post ' + postType + highlight + '">' +
      '<div class="postInfoM mobile" id="pim' + data.no + '">' +
        '<span class="nameBlock' + capcodeClass + '">' +
        mName + tripcode +
        capcodeStart + capcode + userId + flag +
        '<br>' + subject +
        '</span><span class="dateTime postNum" data-utc="' + data.time + '">' +
        data.now + ' <a href="' + noLink + '" title="Link to this post">No.</a><a href="' +
          quoteLink + '" title="Reply to this post">' +
        data.no + '</a></span>' +
      '</div>' +
      (isOP ? fileHtml : '') +
      '<div class="postInfo desktop" id="pi' + data.no + '"' +
        (board != Main.board ? (' data-board="' + board + '"') : '') + '>' +
        '<input type="checkbox" name="' + data.no + '" value="delete"> ' +
        subject +
        '<span class="nameBlock' + capcodeClass + '">' + emailStart +
          '<span class="name">' + name + '</span>' + tripcode
          + (data.since4pass ? (' <span title="Pass user since ' + data.since4pass + '" class="n-pu"></span>') : '')
          + capcodeStart + emailEnd + capcode + userId + flag +
        ' </span> ' +
        '<span class="dateTime" data-utc="' + data.time + '">' + data.now + '</span> ' +
        '<span class="postNum desktop">' +
          '<a href="' + noLink + '" title="Link to this post">No.</a><a href="' +
          quoteLink + '" title="Reply to this post">' + data.no + '</a> '
            + threadIcons + replySpan +
        '</span>' +
      '</div>' +
      (isOP ? '' : fileHtml) +
      '<blockquote class="postMessage" id="m' + data.no + '">'
      + (data.com || '') + capcode_replies + summary + '</blockquote> ' +
    '</div>' + mobileLink;
  
  if (!Main.tid || board != Main.board) {
    quotes = container.getElementsByClassName('quotelink');
    for (i = 0; q = quotes[i]; ++i) {
      href = q.getAttribute('href');
      if (href.charAt(0) != '/') {
        q.href = '/' + board + '/thread/' + resto + href;
      }
    }
  }
  
  return container;
};

Parser.truncate = function(str, len) {
  str = str.replace('&#44;', ',');
  str = Parser.decodeSpecialChars(str);
  str = str.slice(0, len);
  str = Parser.encodeSpecialChars(str);
  return str;
};

Parser.buildCapcodeReplies = function(replies, board, tid) {
  var i, capcode, id, html, map, post_ids, prelink, pretext;
  
  map = {
    admin: 'Administrator',
    mod: 'Moderator',
    developer: 'Developer',
    manager: 'Manager'
  };
  
  if (board != Main.board) {
    prelink = '/' + board + '/thread/';
    pretext = '&gt;&gt;&gt;/' + board + '/';
  }
  else {
    prelink = '';
    pretext = '&gt;&gt;';
  }
  
  html = '<br><br><span class="capcodeReplies"><span class="smaller">';
  
  for (capcode in replies) {
    html += '<span class="bold">' + map[capcode] + ' Replies:</span> ';
    
    post_ids = replies[capcode];
    
    for (i = 0; id = post_ids[i]; ++i) {
      html += '<a class="quotelink" href="'
        + prelink + tid + '#p' + id + '">' + pretext + id + '</a> ';
    }
  }
  
  return html + '</span></span>';
};

Parser.parseBoard = function() {
  var i, threads = document.getElementsByClassName('thread');
  
  for (i = 0; threads[i]; ++i) {
    Parser.parseThread(threads[i].id.slice(1));
  }
};

Parser.parseThread = function(tid, offset, limit) {
  var i, j, thread, posts, el, frag, summary, omitted, key, cnt;
  
  thread = $.id('t' + tid);
  posts = thread.getElementsByClassName('post');
  
  j = offset ? offset < 0 ? posts.length + offset : offset : 0;
  limit = limit ? j + limit : posts.length;
  
  if (Main.isMobileDevice && Config.quotePreview) {
    for (i = j; i < limit; ++i) {
      Parser.parseMobileQuotelinks(posts[i]);
    }
  }
  
  for (i = j; i < limit; ++i) {
    Parser.parsePost(posts[i].id.slice(1), tid);
  }
  
  if (offset) {
    if (Parser.prettify) {
      for (i = j; i < limit; ++i) {
        Parser.parseMarkup(posts[i]);
      }
    }
    if (window.math_tags) {
      if (window.MathJax) {
        for (i = j; i < limit; ++i) {
          if (Parser.postHasMath(posts[i])) {
            window.cleanWbr(posts[i]);
          }
          MathJax.Hub.Queue(['Typeset', MathJax.Hub, posts[i]]);
        }
      }
      else {
        for (i = j; i < limit; ++i) {
          if (Parser.postHasMath(posts[i])) {
            window.loadMathJax();
          }
        }
      }
    }
  }
  
  UA.dispatchEvent('4chanParsingDone', { threadId: tid, offset: j, limit: limit });
};

Parser.postHasMath = function(el) {
  return /\[(?:eqn|math)\]/.test(el.innerHTML);
};

Parser.parseMathOne = function(node) {
  if (window.MathJax) {
    MathJax.Hub.Queue(['Typeset', MathJax.Hub, node]);
  }
  else if (Parser.postHasMath(node)) {
    window.loadMathJax();
  }
};

Parser.parseMobileQuotelinks = function(post) {
  var i, link, quotelinks, t, el;
  
  quotelinks = $.cls('quotelink', post);
  
  for (i = 0; link = quotelinks[i]; ++i) {
    t = link.getAttribute('href').match(/^(?:\/([^\/]+)\/)?(?:thread\/)?([0-9]+)?#p([0-9]+)$/);
    
    if (!t) {
      continue;
    }
    
    el = document.createElement('a');
    el.href = link.href;
    el.textContent = ' #';
    el.className = 'quoteLink';
    
    link.parentNode.insertBefore(el, link.nextSibling);
  }
};

Parser.parseMarkup = function(post) {
  var i, pre, el;
  
  if ((pre = post.getElementsByClassName('prettyprint'))[0]) {
    for (i = 0; el = pre[i]; ++i) {
      el.innerHTML = window.prettyPrintOne(el.innerHTML);
    }
  }
};

Parser.revealImageSpoiler = function(fileThumb) {
  var img, isOP, filename, finfo, txt;
  
  img = fileThumb.firstElementChild;
  fileThumb.removeChild(img);
  img.removeAttribute('style');
  isOP = $.hasClass(fileThumb.parentNode.parentNode, 'op');
  img.style.maxWidth = img.style.maxHeight = isOP ? '250px' : '125px';
  img.src = '//i.4cdn.org'
    + (fileThumb.pathname.replace(/\/([0-9]+).+$/, '/$1s.jpg'));
  
  filename = fileThumb.previousElementSibling;
  finfo = filename.title.split('.');
  
  if (finfo[0].length > (isOP ? 40 : 30)) {
    txt = finfo[0].slice(0, isOP ? 35 : 25) + '(...)' + finfo[1];
  }
  else {
    txt = filename.title;
    filename.removeAttribute('title');
  }
  
  filename.firstElementChild.innerHTML = txt;
  fileThumb.insertBefore(img, fileThumb.firstElementChild);
};

Parser.parsePost = function(pid, tid) {
  var hasMobileLayout, cnt, el, pi, file, msg, uid;
  
  hasMobileLayout = Main.hasMobileLayout;
  
  if (!tid) {
    pi = pid.getElementsByClassName('postInfo')[0];
    pid = pi.id.slice(2);
  }
  else {
    pi = document.getElementById('pi' + pid);
  }
  
  if (Parser.needMsg) {
    msg = document.getElementById('m' + pid);
  }
  
  el = document.createElement('a');
  el.href = '#';
  el.className = 'postMenuBtn';
  el.title = 'Post menu';
  el.setAttribute('data-cmd', 'post-menu');
  el.textContent = Parser.postMenuIcon;
  
  if (hasMobileLayout) {
    cnt = document.getElementById('pim' + pid);
    cnt.insertBefore(el, cnt.firstElementChild);
  }
  else {
    pi.appendChild(el);
  }
  
  if (tid) {
    if (Config.backlinks) {
      Parser.parseBacklinks(pid, tid);
    }
  }
  
  if (IDColor.enabled && (uid = $.cls('posteruid', pi.parentNode)[hasMobileLayout ? 0 : 1])) {
    IDColor.apply(uid.firstElementChild);
  }
  
  if (Config.linkify) {
    Linkify.exec(msg);
  }
  
  if (Config.embedSoundCloud) {
    Media.parseSoundCloud(msg);
  }
  
  if (Config.embedYouTube || Main.hasMobileLayout) {
    Media.parseYouTube(msg);
  }
  
  if (Config.revealSpoilers
      && (file = document.getElementById('f' + pid))
      && (file = file.children[1])
    ) {
    if ($.hasClass(file, 'imgspoiler')) {
      Parser.revealImageSpoiler(file);
    }
  }
  
  if (Config.localTime) {
    if (hasMobileLayout) {
      el = pi.parentNode.getElementsByClassName('dateTime')[0];
      el.firstChild.nodeValue
        = Parser.getLocaleDate(new Date(el.getAttribute('data-utc') * 1000)) + ' ';
    }
    else {
      el = pi.getElementsByClassName('dateTime')[0];
      //el.title = this.utcOffset;
      el.textContent
        = Parser.getLocaleDate(new Date(el.getAttribute('data-utc') * 1000));
    }
  }
  
};

Parser.getLocaleDate = function(date) {
  return ('0' + (1 + date.getMonth())).slice(-2) + '/'
    + ('0' + date.getDate()).slice(-2) + '/'
    + ('0' + date.getFullYear()).slice(-2) + '('
    + this.weekdays[date.getDay()] + ')'
    + ('0' + date.getHours()).slice(-2) + ':'
    + ('0' + date.getMinutes()).slice(-2) + ':'
    + ('0' + date.getSeconds()).slice(-2);
};

Parser.parseBacklinks = function(pid, tid) {
  var i, j, msg, backlinks, linklist, ids, target, bl, el, href;
  
  msg = document.getElementById('m' + pid);
  
  if (!(backlinks = msg.getElementsByClassName('quotelink'))) {
    return;
  }
  
  linklist = {};
  
  for (i = 0; j = backlinks[i]; ++i) {
    // [tid, pid]
    ids = j.getAttribute('href').split('#p');
    
    if (!ids[1]) {
      continue;
    }
    
    if (ids[1] == tid) {
      j.textContent += ' (OP)';
    }
    
    if (!(target = document.getElementById('pi' + ids[1]))) {
      if (Main.tid && j.textContent.charAt(2) != '>' ) {
        j.textContent += ' →';
      }
      continue;
    }
    
    // Already processed?
    if (linklist[ids[1]]) {
      continue;
    }
    
    linklist[ids[1]] = true;
    
    // Backlink node
    bl = document.createElement('span');
    
    if (!Main.tid) {
      href = 'thread/' + tid + '#p' + pid;
    }
    else {
      href = '#p' + pid;
    }
    
    if (!Main.hasMobileLayout) {
      bl.innerHTML = '<a href="' + href + '" class="quotelink">&gt;&gt;' + pid + '</a> ';
    }
    else {
      bl.innerHTML = '<a href="' + href + '" class="quotelink">&gt;&gt;' + pid
        + '</a><a href="' + href + '" class="quoteLink"> #</a> ';
    }
    
    // Backlinks container
    if (!(el = document.getElementById('bl_' + ids[1]))) {
      el = document.createElement('div');
      el.id = 'bl_' + ids[1];
      el.className = 'backlink';
      
      if (Main.hasMobileLayout) {
        el.className = 'backlink mobile';
        target = document.getElementById('p' + ids[1]);
      }
      
      target.appendChild(el);
    }
    
    el.appendChild(bl);
  }
};

Parser.buildSummary = function(tid, oRep, oImg) {
  var el;
  
  if (oRep) {
    oRep = oRep + ' repl' + (oRep > 1 ? 'ies' : 'y');
  }
  else {
    return null;
  }
  
  if (oImg) {
    oImg = ' and ' + oImg + ' image' + (oImg > 1 ? 's' : '');
  }
  else {
    oImg = '';
  }
  
  el = document.createElement('span');
  el.className = 'summary desktop';
  el.innerHTML = oRep + oImg
    + ' omitted. <a href="thread/'
    + tid + '" class="replylink">Click here</a> to view.';
  
  return el;
};

/**
 * Post Menu
 */
var PostMenu = {
  activeBtn: null
};

PostMenu.open = function(btn) {
  var div, html, pid, board, btnPos, el, href, left, limit, isOP, file;
  
  if (PostMenu.activeBtn == btn) {
    PostMenu.close();
    return;
  }
  
  PostMenu.close();
  
  pid = btn.parentNode.id.replace(/^[0-9]*[^0-9]+/, '');
  
  board = btn.parentNode.getAttribute('data-board');
  
  isOP = !board && !!$.id('t' + pid);
  
  html = '<ul>';
  
  if (el = $.id('pc' + pid)) {
    html += '<li data-cmd="hide-r" data-id="' + pid + '">'
      + ($.hasClass(el, 'post-hidden') ? 'Unhide' : 'Hide')
      + ' post</li>';
    /*
    if (Main.tid) {
      html += '<li data-cmd="hide-r" data-recurse="1" data-id="' + pid + '">'
        + ($.hasClass(el, 'post-hidden') ? 'Unhide' : 'Hide')
        + ' recursively</li>';
    }
    */
  }
  
  if (file = $.id('fT' + pid)) {
    el = $.cls('fileThumb', file.parentNode)[0];
    
    if (el) {
      href = 'http://i.4cdn.org/' + Main.board + '/'
        + el.href.match(/\/([0-9]+)\..+$/)[1] + 's.jpg';
      
      if (Main.hasMobileLayout) {
        html += '<li><a href="//www.google.com/searchbyimage?image_url=' + href
          + '" target="_blank">Search image on Google</a></li>'
          + '<li><a href="https://iqdb.org/?url='
          + href + '" target="_blank">Search image on iqdb</a></li>';
      }
      else {
        html += '<li><ul>'
          + '<li><a href="//www.google.com/searchbyimage?image_url=' + href
          + '" target="_blank">Google</a></li>'
          + '<li><a href="https://iqdb.org/?url='
          + href + '" target="_blank">iqdb</a></li></ul>Image search &raquo</li>';
      }
    }
  }
  
  div = document.createElement('div');
  div.id = 'post-menu';
  div.className = 'dd-menu';
  div.innerHTML = html + '</ul>';
  
  btnPos = btn.getBoundingClientRect();
  
  div.style.top = btnPos.bottom + 3 + window.pageYOffset + 'px';
  
  document.addEventListener('click', PostMenu.close, false);
  
  $.addClass(btn, 'menuOpen');
  PostMenu.activeBtn = btn;
  
  UA.dispatchEvent('4chanPostMenuReady', { postId: pid, isOP: isOP, node: div.firstElementChild });
  
  document.body.appendChild(div);
  
  left = btnPos.left + window.pageXOffset;
  limit = $.docEl.clientWidth - div.offsetWidth;
  
  if (left > (limit - 75)) {
    div.className += ' dd-menu-left';
  }
  
  if (left > limit) {
    left = limit;
  }
  
  div.style.left = left + 'px';
};

PostMenu.close = function() {
  var el;
  
  if (el = $.id('post-menu')) {
    el.parentNode.removeChild(el);
    document.removeEventListener('click', PostMenu.close, false);
    $.removeClass(PostMenu.activeBtn, 'menuOpen');
    PostMenu.activeBtn = null;
  }
};

/**
 * Quote inlining
 */
var QuoteInline = {};

QuoteInline.isSelfQuote = function(node, pid, board) {
  if (board && board != Main.board) {
    return false;
  }
  
  node = node.parentNode;
  
  if ((node.nodeName == 'BLOCKQUOTE' && node.id.split('m')[1] == pid)
      || node.parentNode.id.split('_')[1] == pid) {
    return true;
  }
  
  return false;
};

QuoteInline.toggle = function(link, e) {
  var i, j, t, pfx, src, el, count, media;
  
  t = link.getAttribute('href').match(/^(?:\/([^\/]+)\/)?(?:thread\/)?([0-9]+)?#p([0-9]+)$/);
  
  if (!t || t[1] == 'rs' || QuoteInline.isSelfQuote(link, t[3], t[1])) {
    return;
  }
  
  e && e.preventDefault();
  
  if (pfx = link.getAttribute('data-pfx')) {
    link.removeAttribute('data-pfx');
    $.removeClass(link, 'linkfade');
    
    el = $.id(pfx + 'p' + t[3]);
    
    media = $.cls('expandedWebm', el);
    
    for (i = 0; j = media[i]; ++i) {
      j.pause();
    }
    
    el.parentNode.removeChild(el);
    
    if (link.parentNode.parentNode.className == 'backlink') {
      el = $.id('pc' + t[3]);
      count = +el.getAttribute('data-inline-count') - 1;
      if (count === 0) {
        el.style.display = '';
        el.removeAttribute('data-inline-count');
      }
      else {
        el.setAttribute('data-inline-count', count);
      }
    }
    
    return;
  }
  
  if (src = $.id('p' + t[3])) {
    QuoteInline.inline(link, src, t[3]);
  }
  else {
    QuoteInline.inlineRemote(link, t[1] || Main.board, t[2], t[3]);
  }
};

QuoteInline.inlineRemote = function(link, board, tid, pid) {
  var onload, onerror, cached, key, el, dummy;
  
  if (link.hasAttribute('data-loading')) {
    return;
  }
  
  key = board + '-' + tid;
  
  if ((cached = $.cache[key]) && (el = Parser.buildPost(cached, board, pid))) {
    Parser.parsePost(el);
    QuoteInline.inline(link, el);
    return;
  }
  
  if ((dummy = link.nextElementSibling) && $.hasClass(dummy, 'spinner')) {
    dummy.parentNode.removeChild(dummy);
    return;
  }
  else {
    dummy = document.createElement('div');
  }
  
  dummy.className = 'preview spinner inlined';
  dummy.textContent = 'Loading...';
  link.parentNode.insertBefore(dummy, link.nextSibling);
  
  onload = function() {
    var el, thread;
    
    link.removeAttribute('data-loading');
    
    if (this.status === 200 || this.status === 304 || this.status === 0) {
      thread = Parser.parseThreadJSON(this.responseText);
      
      $.cache[key] = thread;
      
      if (el = Parser.buildPost(thread, board, pid)) {
        dummy.parentNode && dummy.parentNode.removeChild(dummy);
        Parser.parsePost(el);
        QuoteInline.inline(link, el);
      }
      else {
        $.addClass(link, 'deadlink');
        dummy.textContent = 'This post doesn\'t exist anymore';
      }
    }
    else if (this.status === 404) {
      $.addClass(link, 'deadlink');
      dummy.textContent = 'This thread doesn\'t exist anymore';
    }
    else {
      this.onerror();
    }
  };
  
  onerror = function() {
    dummy.textContent = 'Error: ' + this.statusText + ' (' + this.status + ')';
    link.removeAttribute('data-loading');
  };
  
  link.setAttribute('data-loading', '1');
  
  $.get('//a.4cdn.org/' + board + '/thread/' + tid + '.json',
    {
      onload: onload,
      onerror: onerror
    }
  );
};

QuoteInline.inline = function(link, src, id) {
  var i, j, now, el, blcnt, isBl, inner, tblcnt, pfx, dest, count, cnt, media;
  
  now = Date.now();
  
  if (id) {
    if ((blcnt = link.parentNode.parentNode).className == 'backlink') {
      el = blcnt.parentNode.parentNode.parentNode;
      isBl = true;
    }
    else {
      el = blcnt.parentNode;
    }
    
    while (el.parentNode !== document) {
      if (el.id.split('m')[1] == id) {
        return;
      }
      el = el.parentNode;
    }
  }
  
  link.className += ' linkfade';
  link.setAttribute('data-pfx', now);
  
  el = src.cloneNode(true);
  el.id = now + el.id;
  el.setAttribute('data-pfx', now);
  el.className += ' preview inlined';
  $.removeClass(el, 'highlight');
  $.removeClass(el, 'highlight-anti');
  
  if ((inner = $.cls('inlined', el))[0]) {
    while (j = inner[0]) {
      j.parentNode.removeChild(j);
    }
    inner = $.cls('quotelink', el);
    for (i = 0; j = inner[i]; ++i) {
      j.removeAttribute('data-pfx');
      $.removeClass(j, 'linkfade');
    }
  }
  
  media = $.cls('expandedWebm', el);
  
  for (i = 0; j = media[i]; ++i) {
    j.autoplay = false;
  }
  
  for (i = 0; j = el.children[i]; ++i) {
    j.id = now + j.id;
  }
  
  if (tblcnt = $.cls('backlink', el)[0]) {
    tblcnt.id = now + tblcnt.id;
  }
  
  if (isBl) {
    pfx = blcnt.parentNode.parentNode.getAttribute('data-pfx') || '';
    dest = $.id(pfx + 'm' + blcnt.id.split('_')[1]);
    dest.insertBefore(el, dest.firstChild);
    if (count = src.parentNode.getAttribute('data-inline-count')) {
      count = +count + 1;
    }
    else {
      count = 1;
      src.parentNode.style.display = 'none';
    }
    src.parentNode.setAttribute('data-inline-count', count);
  }
  else {
    if ($.hasClass(link.parentNode, 'quote')) {
      link = link.parentNode;
      cnt = link.parentNode;
    }
    else {
      cnt = link.parentNode;
    }
    
    while (cnt.nodeName === 'S') {
      link = cnt;
      cnt = cnt.parentNode;
    }
    
    cnt.insertBefore(el, link.nextSibling);
  }
};

/**
 * Quote preview
 */
var QuotePreview = {};

QuotePreview.init = function() {
  this.regex = /^(?:\/([^\/]+)\/)?(?:thread\/)?([0-9]+)?#p([0-9]+)$/;
  this.highlight = null;
  this.highlightAnti = null;
  this.cur = null;
};

QuotePreview.resolve = function(link) {
  var self, t, post, offset, pfx;
  
  self = QuotePreview;
  self.cur = null;
  
  t = link.getAttribute('href').match(self.regex);
  
  if (!t) {
    return;
  }
  
  // Quoted post in scope
  pfx = link.getAttribute('data-pfx') || '';
  
  if (post = document.getElementById(pfx + 'p' + t[3])) {
    // Visible and not filtered out?
    offset = post.getBoundingClientRect();
    if (offset.top > 0
        && offset.bottom < document.documentElement.clientHeight
        && !$.hasClass(post.parentNode, 'post-hidden')) {
      if (!$.hasClass(post, 'highlight') && location.hash.slice(1) != post.id) {
        self.highlight = post;
        $.addClass(post, 'highlight');
      }
      else if (!$.hasClass(post, 'op')) {
        self.highlightAnti = post;
        $.addClass(post, 'highlight-anti');
      }
      return;
    }
    // Nope
    self.show(link, post);
  }
  // Quoted post out of scope
  else {
    if (!UA.hasCORS) {
      return;
    }
    self.showRemote(link, t[1] || Main.board, t[2], t[3]);
  }
};

QuotePreview.showRemote = function(link, board, tid, pid) {
  var onload, onerror, el, cached, key;
  
  key = board + '-' + tid;
  
  QuotePreview.cur = key;
  
  if ((cached = $.cache[key]) && (el = Parser.buildPost(cached, board, pid))) {
    QuotePreview.show(link, el);
    return;
  }
  
  link.style.cursor = 'wait';
  
  onload = function() {
    var el, thread;
    
    link.style.cursor = '';
    
    if (this.status === 200 || this.status === 304 || this.status === 0) {
      thread = Parser.parseThreadJSON(this.responseText);
      
      $.cache[key] = thread;
      
      if ($.id('quote-preview') || QuotePreview.cur != key) {
        return;
      }
      
      if (el = Parser.buildPost(thread, board, pid)) {
        el.className = 'post preview';
        el.style.display = 'none';
        el.id = 'quote-preview';
        document.body.appendChild(el);
        QuotePreview.show(link, el, true);
      }
      else {
        $.addClass(link, 'deadlink');
      }
    }
    else if (this.status === 404) {
      $.addClass(link, 'deadlink');
    }
  };
  
  onerror = function() {
    link.style.cursor = '';
  };
  
  // note: this might actually work???
  $.get('//a.4cdn.org/' + board + '/thread/' + tid + '.json',
    {
      onload: onload,
      onerror: onerror
    }
  );
};

QuotePreview.show = function(link, post, remote) {
  var rect, postHeight, doc, docWidth, style, pos, quotes, i, j, qid,
    top, scrollTop, img, media;
  
  if (remote) {
    Parser.parsePost(post);
    post.style.display = '';
  }
  else {
    post = post.cloneNode(true);
    if (location.hash && location.hash == ('#' + post.id)) {
      post.className += ' highlight';
    }
    post.id = 'quote-preview';
    post.className += ' preview'
      + (!$.hasClass(link.parentNode.parentNode, 'backlink') ? ' reveal-spoilers' : '');
    
    if (Config.imageExpansion && (img = $.cls('expanded-thumb', post)[0])) {
      ImageExpansion.contract(img);
    }
  }
  
  if (media = $.cls('expandedWebm', post)[0]) {
    media.controls = false;
    media.autoplay = false;
  }
  
  if (!link.parentNode.className) {
    quotes = $.qsa(
      '#' + $.cls('postMessage', post)[0].id + ' > .quotelink', post
    );
    if (quotes[1]) {
      qid = '>>' + link.parentNode.parentNode.id.split('_')[1];
      for (i = 0; j = quotes[i]; ++i) {
        if (j.textContent == qid) {
          $.addClass(j, 'dotted');
          break;
        }
      }
    }
  }
  
  rect = link.getBoundingClientRect();
  doc = document.documentElement;
  docWidth = doc.offsetWidth;
  style = post.style;
  
  document.body.appendChild(post);
  
  if (Main.isMobileDevice) {
    style.top = rect.top + link.offsetHeight + window.pageYOffset + 'px';
    
    if ((docWidth - rect.right) < (0 | (docWidth * 0.3))) {
      style.right = docWidth - rect.right + 'px';
    }
    else {
      style.left = rect.left + 'px';
    }
  }
  else {
    if ((docWidth - rect.right) < (0 | (docWidth * 0.3))) {
      pos = docWidth - rect.left;
      style.right = pos + 5 + 'px';
    }
    else {
      pos = rect.left + rect.width;
      style.left = pos + 5 + 'px';
    }
    
    top = rect.top + link.offsetHeight + window.pageYOffset
      - post.offsetHeight / 2 - rect.height / 2;
    
    postHeight = post.getBoundingClientRect().height;
    
    if (doc.scrollTop != document.body.scrollTop) {
      scrollTop = doc.scrollTop + document.body.scrollTop;
    } else {
      scrollTop = document.body.scrollTop;
    }
    
    if (top < scrollTop) {
      style.top = scrollTop + 'px';
    }
    else if (top + postHeight > scrollTop + doc.clientHeight) {
      style.top = scrollTop + doc.clientHeight - postHeight + 'px';
    }
    else {
      style.top = top + 'px';
    }
  }
};

QuotePreview.remove = function(el) {
  var self, cnt;
  
  self = QuotePreview;
  self.cur = null;
  
  if (self.highlight) {
    $.removeClass(self.highlight, 'highlight');
    self.highlight = null;
  }
  else if (self.highlightAnti) {
    $.removeClass(self.highlightAnti, 'highlight-anti');
    self.highlightAnti = null;
  }
  
  if (el) {
    el.style.cursor = '';
  }
  
  if (cnt = $.id('quote-preview')) {
    document.body.removeChild(cnt);
  }
};

/**
 * Image expansion
 */
var ImageExpansion = {
  activeVideos: [],
  timeout: null
};

ImageExpansion.expand = function(thumb) {
  var img, href, ext, a;
  
  if (Config.imageHover) {
    ImageHover.hide();
  }
  
  a = thumb.parentNode;
  
  href = a.getAttribute('href');
  
  if (ext = href.match(/\.(?:webm|pdf)$/)) {
    if (ext[0] == '.webm') {
      return ImageExpansion.expandWebm(thumb);
    }
    return false;
  }
  
  if (Main.hasMobileLayout && a.hasAttribute('data-m')) {
    href = ImageExpansion.setMobileSrc(a);
  }
  
  thumb.setAttribute('data-expanding', '1');
  
  img = document.createElement('img');
  img.alt = 'Image';
  img.setAttribute('src', href);
  img.className = 'expanded-thumb';
  img.style.display = 'none';
  img.onerror = this.onError;
  
  thumb.parentNode.insertBefore(img, thumb.nextElementSibling);
  
  if (UA.hasCORS) {
    thumb.style.opacity = '0.75';
    this.timeout = this.checkLoadStart(img, thumb);
  }
  else {
    this.onLoadStart(img, thumb);
  }
  
  return true;
};

ImageExpansion.contract = function(img) {
  var cnt, p;
  
  clearTimeout(this.timeout);
  
  p = img.parentNode;
  cnt = p.parentNode.parentNode;
  
  $.removeClass(p.parentNode, 'image-expanded');
  
  if (Config.centeredThreads) {
    $.removeClass(cnt.parentNode, 'centre-exp');
    cnt.parentNode.style.marginLeft = '';
  }
  
  p.firstChild.style.display = '';
  
  p.removeChild(img);
  
  if (cnt.offsetTop < window.pageYOffset) {
    cnt.scrollIntoView();
  }
};

ImageExpansion.toggle = function(t) {
  if (t.hasAttribute('data-md5')) {
    if (!t.hasAttribute('data-expanding')) {
      return ImageExpansion.expand(t);
    }
  }
  else {
    ImageExpansion.contract(t);
  }
  
  return true;
};

ImageExpansion.setMobileSrc = function(a) {
  var href;
  
  a.removeAttribute('data-m');
  href = a.getAttribute('href');
  href = href.replace(/\/([0-9]+).+$/, '/$1m.jpg');
  a.setAttribute('href', href);
  
  return href;
};

ImageExpansion.expandWebm = function(thumb) {
  var el, link, fileText, left, href, maxWidth, self;
  
  if (Main.hasMobileLayout && /iPhone|iPad|iPod/.test(navigator.userAgent)) {
    return false;
  }
  
  self = ImageExpansion;
  
  if (el = document.getElementById('image-hover')) {
    document.body.removeChild(el);
  }
  
  link = thumb.parentNode;
  
  href = link.getAttribute('href');
  
  left = link.getBoundingClientRect().left;
  maxWidth = document.documentElement.clientWidth - left - 25;
  
  el = document.createElement('video');
  el.muted = !Config.unmuteWebm;
  el.controls = true;
  el.loop = true;
  el.autoplay = true;
  el.className = 'expandedWebm';
  el.onloadedmetadata = ImageExpansion.fitWebm;
  el.onplay = ImageExpansion.onWebmPlay;
  
  link.style.display = 'none';
  link.parentNode.appendChild(el);
  
  el.src = href;
  
  if (Config.unmuteWebm) {
    el.volume = 0.5;
  }
  
  if (Main.hasMobileLayout) {
    el = document.createElement('div');
    el.className = 'collapseWebm';
    el.innerHTML = '<span class="button">Close</span>';
    link.parentNode.appendChild(el);
  }
  else {
    fileText = thumb.parentNode.previousElementSibling;
    el = document.createElement('span');
    el.className = 'collapseWebm';
    el.innerHTML = '-[<a href="#">Close</a>]';
    fileText.appendChild(el);
  }
  
  el.firstElementChild.addEventListener('click', self.collapseWebm, false);
  
  return true;
};

ImageExpansion.fitWebm = function() {
  var imgWidth, imgHeight, maxWidth, maxHeight, ratio, left, cntEl,
    centerWidth, ofs;
  
  if (Config.centeredThreads) {
    centerWidth = $.cls('opContainer')[0].offsetWidth;
    cntEl = this.parentNode.parentNode.parentNode;
    $.addClass(cntEl, 'centre-exp');
  }
  
  left = this.getBoundingClientRect().left;
  
  maxWidth = document.documentElement.clientWidth - left - 25;
  maxHeight = document.documentElement.clientHeight;
  
  imgWidth = this.videoWidth;
  imgHeight = this.videoHeight;
  
  if (imgWidth > maxWidth) {
    ratio = maxWidth / imgWidth;
    imgWidth = maxWidth;
    imgHeight = imgHeight * ratio;
  }
  
  if (Config.fitToScreenExpansion && imgHeight > maxHeight) {
    ratio = maxHeight / imgHeight;
    imgHeight = maxHeight;
    imgWidth = imgWidth * ratio;
  }
  
  this.style.maxWidth = (0 | imgWidth) + 'px';
  this.style.maxHeight = (0 | imgHeight) + 'px';
  
  if (Config.centeredThreads) {
    left = this.getBoundingClientRect().left;
    ofs = this.offsetWidth + left * 2;
    if (ofs > centerWidth) {
      left = Math.floor(($.docEl.clientWidth - ofs) / 2);
      
      if (left > 0) {
        cntEl.style.marginLeft = left + 'px';
      }
    }
    else {
      $.removeClass(cntEl, 'centre-exp');
    }
  }
};

ImageExpansion.onWebmPlay = function() {
  var self = ImageExpansion;
  
  if (!self.activeVideos.length) {
    document.addEventListener('scroll', self.onScroll, false);
  }
  
  self.activeVideos.push(this);
};

ImageExpansion.collapseWebm = function(e) {
  var cnt, el, el2;
  
  e.preventDefault();
  
  this.removeEventListener('click', ImageExpansion.collapseWebm, false);
  
  cnt = this.parentNode;
  
  if (Main.hasMobileLayout) {
    el = cnt.previousElementSibling;
  }
  else {
    el = cnt.parentNode.parentNode.getElementsByClassName('expandedWebm')[0];
  }
  
  el.pause();
  
  if (Config.centeredThreads) {
    el2 = el.parentNode.parentNode.parentNode;
    $.removeClass(el2, 'centre-exp');
    el2.style.marginLeft = '';
  }
  
  el.previousElementSibling.style.display = '';
  el.parentNode.removeChild(el);
  cnt.parentNode.removeChild(cnt);
};

ImageExpansion.onScroll = function() {
  clearTimeout(ImageExpansion.timeout);
  ImageExpansion.timeout = setTimeout(ImageExpansion.pauseVideos, 500);
};

ImageExpansion.pauseVideos = function() {
  var self, i, el, pos, min, max, nodes;
  
  self = ImageExpansion;
  
  nodes = [];
  min = window.pageYOffset;
  max = window.pageYOffset + $.docEl.clientHeight;
  
  for (i = 0; el = self.activeVideos[i]; ++i) {
    pos = el.getBoundingClientRect();
    if (pos.top + window.pageYOffset > max || pos.bottom + window.pageYOffset < min) {
      el.pause();
    }
    else if (!el.paused){
      nodes.push(el);
    }
  }
  
  if (!nodes.length) {
    document.removeEventListener('scroll', self.onScroll, false);
  }
  
  self.activeVideos = nodes;
};

ImageExpansion.onError = function(e) {
  var thumb, img;
  
  Feedback.error('File no longer exists (404).', 2000);
  
  img = e.target;
  thumb = $.qs('img[data-expanding]', img.parentNode);
  
  img.parentNode.removeChild(img);
  thumb.style.opacity = '';
  thumb.removeAttribute('data-expanding');
};

ImageExpansion.onLoadStart = function(img, thumb) {
  var imgWidth, imgHeight, maxWidth, maxHeight, ratio, left, fileEl, cntEl,
    centerWidth, ofs, el;
  
  thumb.removeAttribute('data-expanding');
  
  fileEl = thumb.parentNode.parentNode;
  
  if (Config.centeredThreads) {
    cntEl = fileEl.parentNode.parentNode;
    centerWidth = $.cls('opContainer')[0].offsetWidth;
    $.addClass(cntEl, 'centre-exp');
  }
  
  left = thumb.getBoundingClientRect().left;
  
  maxWidth = $.docEl.clientWidth - left - 25;
  maxHeight = $.docEl.clientHeight;
  
  imgWidth = img.naturalWidth;
  imgHeight = img.naturalHeight;
  
  if (imgWidth > maxWidth) {
    ratio = maxWidth / imgWidth;
    imgWidth = maxWidth;
    imgHeight = imgHeight * ratio;
  }
  
  if (Config.fitToScreenExpansion && imgHeight > maxHeight) {
    ratio = maxHeight / imgHeight;
    imgHeight = maxHeight;
    imgWidth = imgWidth * ratio;
  }
  
  img.style.maxWidth = imgWidth + 'px';
  img.style.maxHeight = imgHeight + 'px';
  
  $.addClass(fileEl, 'image-expanded');
  
  img.style.display = '';
  thumb.style.display = 'none';
  
  if (Config.centeredThreads) {
    left = img.getBoundingClientRect().left;
    ofs = img.offsetWidth + left * 2;
    if (ofs > centerWidth) {
      left = Math.floor(($.docEl.clientWidth - ofs) / 2);
      
      if (left > 0) {
        cntEl.style.marginLeft = left + 'px';
      }
    }
    else {
      $.removeClass(cntEl, 'centre-exp');
    }
  }
  else if (Main.hasMobileLayout) {
    cntEl = thumb.parentNode.lastElementChild;
    if (!cntEl.firstElementChild) {
      fileEl = document.createElement('div');
      fileEl.className = 'mFileName';
      if (el = thumb.parentNode.parentNode.getElementsByClassName('fileText')[0]) {
        el = el.firstElementChild;
        fileEl.innerHTML = el.getAttribute('title') || el.innerHTML;
      }
      cntEl.insertBefore(fileEl, cntEl.firstChild);
    }
  }
};

ImageExpansion.checkLoadStart = function(img, thumb) {
  if (img.naturalWidth) {
    ImageExpansion.onLoadStart(img, thumb);
    thumb.style.opacity = '';
  }
  else {
    return setTimeout(ImageExpansion.checkLoadStart, 15, img, thumb);
  }
};

/**
 * Image hover
 */
var ImageHover = {};

ImageHover.show = function(thumb) {
  var el, href, ext;
  
  if (thumb.nodeName !== 'A') {
    href = thumb.parentNode.getAttribute('href');
  }
  else {
    href = thumb.getAttribute('href');
  }
  
  if (ext = href.match(/\.(?:webm|pdf)$/)) {
    if (ext[0] == '.webm') {
       ImageHover.showWebm(thumb);
    }
    return;
  }
  
  el = document.createElement('img');
  el.id = 'image-hover';
  el.alt = 'Image';
  el.onerror = ImageHover.onLoadError;
  el.src = href;
  
  if (Config.imageHoverBg) {
    el.style.backgroundColor = 'inherit';
  }
  
  document.body.appendChild(el);
  
  if (UA.hasCORS) {
    el.style.display = 'none';
    this.timeout = ImageHover.checkLoadStart(el, thumb);
  }
  else {
    el.style.left = thumb.getBoundingClientRect().right + 10 + 'px';
  }
};

ImageHover.hide = function() {
  var img;
  
  clearTimeout(this.timeout);
  
  if (img = $.id('image-hover')) {
    if (img.play) {
      img.pause();
      Tip.hide();
    }
    document.body.removeChild(img);
  }
};

ImageHover.showWebm = function(thumb) {
  var el, bounds, limit;
  
  el = document.createElement('video');
  el.id = 'image-hover';
  
  if (Config.imageHoverBg) {
    el.style.backgroundColor = 'inherit';
  }
  
  if (thumb.nodeName !== 'A') {
    el.src = thumb.parentNode.getAttribute('href');
  }
  else {
    el.src = thumb.getAttribute('href');
  }
  
  el.loop = true;
  el.muted = !Config.unmuteWebm;
  el.autoplay = true;
  el.onerror = ImageHover.onLoadError;
  el.onloadedmetadata = function() { ImageHover.showWebMDuration(this, thumb); };
  
  bounds = thumb.getBoundingClientRect();
  limit = window.innerWidth - bounds.right - 20;
  
  el.style.maxWidth = limit + 'px';
  el.style.top = window.pageYOffset + 'px';
  
  document.body.appendChild(el);
  
  if (Config.unmuteWebm) {
    el.volume = 0.5;
  }
};

ImageHover.showWebMDuration = function(el, thumb) {
  if (!el.parentNode) {
    return;
  }
  
  var sound, ms = $.prettySeconds(el.duration);
  
  if (el.mozHasAudio === true
    || el.webkitAudioDecodedByteCount > 0
    || (el.audioTracks && el.audioTracks.length)) {
    sound = ' (audio)';
  }
  else {
    sound = '';
  }
  
  Tip.show(thumb, ms[0] + ':' + ('0' + ms[1]).slice(-2) + sound);
};

ImageHover.onLoadError = function() {
  Feedback.error('File no longer exists (404).', 2000);
};

ImageHover.onLoadStart = function(img, thumb) {
  var bounds, limit;
  
  bounds = thumb.getBoundingClientRect();
  limit = window.innerWidth - bounds.right - 20;
  
  if (img.naturalWidth > limit) {
    img.style.maxWidth = limit + 'px';
  }
  
  img.style.display = '';
  img.style.top = window.pageYOffset + 'px';
};

ImageHover.checkLoadStart = function(img, thumb) {
  if (img.naturalWidth) {
    ImageHover.onLoadStart(img, thumb);
  }
  else {
    return setTimeout(ImageHover.checkLoadStart, 15, img, thumb);
  }
};

/**
 * Reply hiding
 */
var ReplyHiding = {};

ReplyHiding.init = function() {
  this.threshold = 7 * 86400000;
  this.hidden = {};
  this.hiddenR = {};
  this.hiddenRMap = {};
  this.hasR = false;
  this.load();
};

ReplyHiding.isHidden = function(pid) {
  var sa = $.id('sa' + pid);
  
  return !sa || sa.hasAttribute('data-hidden');
};

ReplyHiding.toggle = function(pid) {
  this.load();
  
  if (this.isHidden(pid)) {
    this.show(pid);
  }
  else {
    this.hide(pid);
  }
  this.save();
};

ReplyHiding.toggleR = function(pid) {
  var i, el, post, nodes, rid, parentPid;

  this.load();
  
  if (parentPid = this.hiddenRMap['>>' + pid]) {
    this.showR(parentPid, parentPid);
    
    for (i in this.hiddenRMap) {
      if (this.hiddenRMap[i] == parentPid) {
        this.showR(i.slice(2));
      }
    }
  }
  else {
    this.hideR(pid, pid);
    
    post = $.id('m' + pid);
    nodes = $.cls('postMessage');
    
    for (i = 1; nodes[i] !== post; ++i) {}
    
    for (; el = nodes[i]; ++i) {
      if (ReplyHiding.shouldToggleR(el)) {
        rid = el.id.slice(1);
        this.hideR(rid, pid);
      }
    }
  }
  
  this.hasR = false;
  
  for (i in this.hiddenRMap) {
    this.hasR = true;
    break;
  }
  
  this.save();
};

ReplyHiding.shouldToggleR = function(el) {
  var j, ql, hit, quotes;
  
  if (el.parentNode.hasAttribute('data-pfx')) {
    return false;
  }
  
  quotes = $.qsa('#' + el.id + ' > .quotelink', el);
  
  if (!quotes[0]) {
    return false;
  }
  
  hit = this.hiddenRMap[quotes[0].textContent];
  
  if (quotes.length === 1 && hit) {
    return hit;
  }
  else {
    for (j = 0; ql = quotes[j]; ++j) {
      if (!this.hiddenRMap[ql.textContent]) {
        return false;
      }
    }
  }
  
  return hit;
};

ReplyHiding.show = function(pid) {
  $.removeClass($.id('pc' + pid), 'post-hidden');
  $.id('sa' + pid).removeAttribute('data-hidden');
  
  delete ReplyHiding.hidden[pid];
};

ReplyHiding.showR = function(pid, parentPid) {
  $.removeClass($.id('pc' + pid), 'post-hidden');
  $.id('sa' + pid).removeAttribute('data-hidden');
  
  delete ReplyHiding.hiddenRMap['>>' + pid];
  
  if (parentPid) {
    delete ReplyHiding.hiddenR[parentPid];
  }
};

ReplyHiding.hide = function(pid) {
  $.addClass($.id('pc' + pid), 'post-hidden');
  $.id('sa' + pid).setAttribute('data-hidden', pid);
  
  ReplyHiding.hidden[pid] = Date.now();
};

ReplyHiding.hideR = function(pid, parentPid) {
  $.addClass($.id('pc' + pid), 'post-hidden');
  $.id('sa' + pid).setAttribute('data-hidden', pid);
  
  ReplyHiding.hiddenRMap['>>' + pid] = parentPid;
  
  if (pid === parentPid) {
    ReplyHiding.hiddenR[pid] = Date.now();
  }
  
  ReplyHiding.hasR = true;
};

ReplyHiding.load = function() {
  var storage;
  
  this.hasHiddenR = false;
  
  if (storage = localStorage.getItem('4chan-hide-r-' + Main.board)) {
    this.hidden = JSON.parse(storage);
  }
  
  if (storage = localStorage.getItem('4chan-hide-rr-' + Main.board)) {
    this.hiddenR = JSON.parse(storage);
  }
};

ReplyHiding.purge = function() {
  var tid, now;
  
  now = Date.now();
  
  for (tid in this.hidden) {
    if (now - this.hidden[tid] > this.threshold) {
      delete this.hidden[tid];
    }
  }
  
  for (tid in this.hiddenR) {
    if (now - this.hiddenR[tid] > this.threshold) {
      delete this.hiddenR[tid];
    }
  }
  
  this.save();
};

ReplyHiding.save = function() {
  var i, clr;
  
  clr = true;
  
  for (i in this.hidden) {
    localStorage.setItem('4chan-hide-r-' + Main.board,
      JSON.stringify(this.hidden)
    );
    clr = false;
    break;
  }
  
  clr && localStorage.removeItem('4chan-hide-r-' + Main.board);
  
  clr = true;
  
  for (i in this.hiddenR) {
    localStorage.setItem('4chan-hide-rr-' + Main.board,
      JSON.stringify(this.hiddenR)
    );
    clr = false;
    break;
  }
  
  clr && localStorage.removeItem('4chan-hide-rr-' + Main.board);
};

/**
 * ID colors
 */
var IDColor = {
  css: 'padding: 0 5px; border-radius: 6px; font-size: 0.8em;',
  ids: {}
};

IDColor.init = function() {
  var style;
  
  if (window.user_ids) {
    this.enabled = true;
    
    style = document.createElement('style');
    style.setAttribute('type', 'text/css');
    style.textContent = '.posteruid .hand {' + this.css + '}';
    document.head.appendChild(style);
  }
};

IDColor.compute = function(str) {
  var rgb, hash;
  
  rgb = [];
  hash = $.hash(str);
  
  rgb[0] = (hash >> 24) & 0xFF;
  rgb[1] = (hash >> 16) & 0xFF;
  rgb[2] = (hash >> 8) & 0xFF;
  rgb[3] = ((rgb[0] * 0.299) + (rgb[1] * 0.587) + (rgb[2] * 0.114)) > 125;
  
  this.ids[str] = rgb;
  
  return rgb;
};

IDColor.apply = function(uid) {
  var rgb;
  
  rgb = IDColor.ids[uid.textContent] || IDColor.compute(uid.textContent);
  uid.style.cssText = '\
    background-color: rgb(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ');\
    color: ' + (rgb[3] ? 'black;' : 'white;');
};

IDColor.applyRemote = function(uid) {
  this.apply(uid);
  uid.style.cssText += this.css;
};

/**
 * SWF embed
 */
var SWFEmbed = {};

SWFEmbed.init = function() {
  if (Main.hasMobileLayout) {
    return;
  }
  if (Main.tid) {
    this.processThread();
  }
  else {
    this.processIndex();
  }
};

SWFEmbed.processThread = function() {
  var fileText, el;
  
  fileText = $.id('fT' + Main.tid);
  
  if (!fileText) {
    return;
  }
  
  el = document.createElement('a');
  el.href = 'javascript:;';
  el.textContent = 'Embed';
  el.addEventListener('click', SWFEmbed.toggleThread, false);
  
  fileText.appendChild(document.createTextNode('-['));
  fileText.appendChild(el);
  fileText.appendChild(document.createTextNode(']'));
};

SWFEmbed.processIndex = function() {
  var i, tr, el, cnt, nodes, srcIndex, src;
  
  srcIndex = 2;
  
  cnt = $.cls('postblock')[0];
  
  if (!cnt) {
    return;
  }
  
  tr = cnt.parentNode;
  
  el = document.createElement('td');
  el.className = 'postblock';
  tr.insertBefore(el, tr.children[srcIndex].nextElementSibling);
  
  cnt = $.cls('flashListing')[0];
  
  if (!cnt) {
    return;
  }
  
  nodes = $.tag('tr', cnt);
  
  for (i = 1; tr = nodes[i]; ++i) {
    src = tr.children[srcIndex].firstElementChild;
    el = document.createElement('td');
    el.innerHTML = '[<a href="' + src.href + '">Embed</a>]';
    el.firstElementChild.addEventListener('click', SWFEmbed.embedIndex, false);
    tr.insertBefore(el, tr.children[srcIndex].nextElementSibling);
  }
};

SWFEmbed.toggleThread = function(e) {
  var cnt, link, el, post, maxWidth, ratio, width, height;
  
  if (cnt = $.id('swf-embed')) {
    cnt.parentNode.removeChild(cnt);
    e.target.textContent = 'Embed';
    return;
  }
  
  link = $.tag('a', e.target.parentNode)[0];
  
  maxWidth = document.documentElement.clientWidth - 100;
  
  width = +link.getAttribute('data-width');
  height = +link.getAttribute('data-height');
  
  if (width > maxWidth) {
    ratio = width / height;
    width = maxWidth;
    height = Math.round(maxWidth / ratio);
  }
  
  cnt = document.createElement('div');
  cnt.id = 'swf-embed';
  
  el = document.createElement('embed');
  el.setAttribute('allowScriptAccess', 'never');
  el.type = 'application/x-shockwave-flash';
  el.width = width;
  el.height = height;
  el.src = link.href;
  
  cnt.appendChild(el);
  
  post = $.id('m' + Main.tid);
  post.insertBefore(cnt, post.firstChild);
  
  $.cls('thread')[0].scrollIntoView(true);
  
  e.target.textContent = 'Remove';
};

SWFEmbed.embedIndex = function(e) {
  var el, cnt, header, icon, backdrop, width, height, cntWidth, cntHeight,
    maxWidth, maxHeight, docWidth, docHeight, margins, headerHeight, fileName,
    ratio;
  
  e.preventDefault();
  
  margins = 10;
  headerHeight = 20;
  
  el = e.target.parentNode.parentNode.children[2].firstElementChild;
  
  fileName = el.getAttribute('title') || el.textContent;
  
  cntWidth = width = +el.getAttribute('data-width');
  cntHeight = height = +el.getAttribute('data-height');
  
  docWidth = document.documentElement.clientWidth;
  docHeight = document.documentElement.clientHeight;
  
  maxWidth = docWidth - margins;
  maxHeight = docHeight - margins - headerHeight;
  
  ratio = width / height;
  
  if (cntWidth > maxWidth) {
    cntWidth = maxWidth;
    cntHeight = Math.round(maxWidth / ratio);
  }
  
  if (cntHeight > maxHeight) {
    cntHeight = maxHeight;
    cntWidth = Math.round(maxHeight * ratio);
  }
  
  el = document.createElement('embed');
  el.setAttribute('allowScriptAccess', 'never');
  el.src = e.target.href;
  el.width = '100%';
  el.height = '100%';
  
  cnt = document.createElement('div');
  cnt.style.position = 'fixed';
  cnt.style.width = cntWidth + 'px';
  cnt.style.height = cntHeight + 'px';
  cnt.style.top = '50%';
  cnt.style.left = '50%';
  cnt.style.marginTop = (-cntHeight / 2 - headerHeight / 2) + 'px';
  cnt.style.marginLeft = (-cntWidth / 2) + 'px';
  cnt.style.background = 'white';
  
  header = document.createElement('div');
  header.id = 'swf-embed-header';
  header.className = 'postblock';
  header.textContent = fileName + ', ' + width + 'x' + height;
  
  icon = document.createElement('img');
  icon.id = 'swf-embed-close';
  icon.className = 'pointer';
  icon.src = Main.icons.cross;
  
  header.appendChild(icon);
  
  cnt.appendChild(header);
  cnt.appendChild(el);
  
  backdrop = document.createElement('div');
  backdrop.id = 'swf-embed';
  backdrop.style.cssText = 'width: 100%; height: 100%; position: fixed;\
  top: 0; left: 0; background: rgba(128, 128, 128, 0.5)';
  
  backdrop.appendChild(cnt);
  backdrop.addEventListener('click', SWFEmbed.onBackdropClick, false);
  
  document.body.appendChild(backdrop);
};

SWFEmbed.onBackdropClick = function(e) {
  var backdrop = $.id('swf-embed');
  
  if (e.target === backdrop || e.target.id == 'swf-embed-close') {
    backdrop.removeEventListener('click', SWFEmbed.onBackdropClick, false);
    backdrop.parentNode.removeChild(backdrop);
  }
};

/**
 * Linkify
 */
var Linkify = {
  init: function() {
    this.probeRe = /(?:^|[^\B"])https?:\/\/[-.a-z0-9]+\.[a-z]{2,4}/;
    this.linkRe = /(^|[^\B"])(https?:\/\/[-.a-z0-9\u200b]+\.[a-z\u200b]{2,15}(?:\/[^\s<>]*)?)/ig;
    this.punct = /[:!?,.'"]+$/g;
    this.derefer = '//sys.4chan.org/derefer?url=';
  },
  
  exec: function(el) {
    if (!this.probeRe.test(el.innerHTML)) {
      return;
    }
    
    el.innerHTML = el.innerHTML
      .replace(/<wbr>/g, '\u200b')
      .replace(this.linkRe, this.funk)
      .replace(/\u200b/g, '<wbr>');
  },
  
  funk: function(match, pfx, url, o, str) {
    var m, mm, end, len, sfx;
    
    m = o + match.length;
    
    if (str.slice(m, m + 4) === '</a>') {
      return match;
    }
    
    end = len = url.length;
    
    if (m = url.match(Linkify.punct)) {
      end -= m[0].length;
    }
    
    if (m = url.match(/\)+$/g)) {
      mm = m[0].length;
      if (m = url.match(/\(/g)) {
        mm = mm - m.length;
        if (mm > 0) {
          end -= mm;
        }
      }
      else {
        end -= mm;
      }
    }
    
    if (end < len) {
      sfx = url.slice(end);
      url = url.slice(0, end);
    }
    else {
      sfx = '';
    }
    
    return pfx + '<a href="' + Linkify.derefer
      + encodeURIComponent(url.replace(/\u200b/g, ''))
      + '" target="_blank" class="linkified" rel="nofollow">'
      + url + '</a>' + sfx;
  }
};

/**
 * Media
 */
var Media = {};

Media.init = function() {
  this.matchSC = /(?:soundcloud\.com|snd\.sc)\/[^\s<]+(?:<wbr>)?[^\s<]*/g;
  this.matchYT = /(?:youtube\.com\/watch\?[^\s]*?v=|youtu\.be\/)[^\s<]+(?:<wbr>)?[^\s<]*(?:<wbr>)?[^\s<]*(?:<wbr>)?[^\s<]*/g;
  this.toggleYT = /(?:v=|\.be\/)([a-zA-Z0-9_-]{11})/;
  this.timeYT = /[#&]t=([ms0-9]+)/;
  
  this.map = {
    yt: this.toggleYouTube,
    sc: this.toggleSoundCloud,
  };
};

Media.parseSoundCloud = function(msg) {
  msg.innerHTML = msg.innerHTML.replace(this.matchSC, this.replaceSoundCloud);
};

Media.replaceSoundCloud = function(link, o, str) {
  var pfx;
  
  if (Config.linkify) {
    if (str[o + link.length - 1] === '"') {
      return link;
    }
    else {
      pfx = link + '</a>';
    }
  }
  else {
    pfx = '<span>' + link + '</span>';
  }

  return pfx + ' [<a href="javascript:;" data-cmd="embed" data-type="sc">Embed</a>]';
};

Media.toggleSoundCloud = function(node) {
  var xhr, url;
  
  if (node.textContent == 'Remove') {
    node.parentNode.removeChild(node.nextElementSibling);
    node.textContent = 'Embed';
  }
  else if (node.textContent == 'Embed') {
    url = node.previousElementSibling.textContent;
    
    xhr = new XMLHttpRequest();
    xhr.open('GET', '//soundcloud.com/oembed?show_artwork=false&'
      + 'maxwidth=500px&show_comments=false&format=json&url='
      + 'http://' + url.replace(/^https?:\/\//i, ''));
    xhr.onload = function() {
      var el;
      
      if (this.status == 200 || this.status == 304) {
        el = document.createElement('div');
        el.className = 'media-embed';
        el.innerHTML = JSON.parse(this.responseText).html;
        node.parentNode.insertBefore(el, node.nextElementSibling);
        node.textContent = 'Remove';
      }
      else {
        node.textContent = 'Error';
        console.log('SoundCloud Error (HTTP ' + this.status + ')');
      }
    };
    node.textContent = 'Loading...';
    xhr.send(null);
  }
};

Media.parseYouTube = function(msg) {
  msg.innerHTML = msg.innerHTML.replace(this.matchYT, this.replaceYouTube);
};

Media.replaceYouTube = function(link, o, str) {
  var pfx;
  
  if (Config.linkify) {
    if (str[o + link.length - 1] === '"') {
      return link;
    }
    else {
      pfx = link + '</a>';
    }
  }
  else {
    pfx = '<span>' + link + '</span>';
  }
  
  return pfx + ' [<a href="javascript:;" data-cmd="embed" data-type="yt">'
    + (!Main.hasMobileLayout ? 'Embed' : 'Open') + '</a>]';
};

Media.showYTPreview = function(link) {
  var cnt, img, vid, aabb, x, y, tw, th, pad;
  
  tw = 320; th = 180; pad = 5;
  
  aabb = link.getBoundingClientRect();
  
  vid = link.previousElementSibling.textContent.match(this.toggleYT)[1];
  
  if (aabb.right + tw + pad > $.docEl.clientWidth) {
    x = aabb.left - tw - pad;
  }
  else {
    x = aabb.right + pad;
  }
  
  y = aabb.top - th / 2 + aabb.height / 2;
  
  img = document.createElement('img');
  img.width = tw;
  img.height = th;
  img.alt = '';
  img.src = '//i1.ytimg.com/vi/' + encodeURIComponent(vid) + '/mqdefault.jpg';
  
  cnt = document.createElement('div');
  cnt.id = 'yt-preview';
  cnt.className = 'reply';
  cnt.style.left = (x + window.pageXOffset) + 'px';
  cnt.style.top = (y + window.pageYOffset) + 'px';
  
  cnt.appendChild(img);
  
  document.body.appendChild(cnt);
};

Media.removeYTPreview = function() {
  var el;
  
  if (el = $.id('yt-preview')) {
    document.body.removeChild(el);
  }
};

Media.toggleYouTube = function(node) {
  var vid, time, el, url;
  
  if (node.textContent == 'Remove') {
    node.parentNode.removeChild(node.nextElementSibling);
    node.textContent = 'Embed';
  }
  else {
    url = node.previousElementSibling.textContent;
    vid = url.match(this.toggleYT);
    time = url.match(this.timeYT);
    
    if (vid && (vid = vid[1])) {
      vid = encodeURIComponent(vid);
      
      if (time && (time = time[1])) {
        vid += '?start=' + encodeURIComponent(time);
      }
      
      if (Main.hasMobileLayout) {
        window.open('//www.youtube.com/watch?v=' + vid);
        return;
      }
      
      el = document.createElement('div');
      el.className = 'media-embed';
      el.innerHTML = '<iframe src="//www.youtube.com/embed/'
        + vid
        + '" width="640" height="360" frameborder="0" allowfullscreen></iframe>';
      
      node.parentNode.insertBefore(el, node.nextElementSibling);
      
      node.textContent = 'Remove';
    }
    else {
      node.textContent = 'Error';
    }
  }
};

Media.toggleEmbed = function(node) {
  var fn, type = node.getAttribute('data-type');
  
  if (type && (fn = Media.map[type])) {
    fn.call(this, node);
  }
};

/**
 * Custom CSS
 */
var CustomCSS = {};

CustomCSS.init = function() {
  var style, css;
  if (css = localStorage.getItem('4chan-css')) {
    style = document.createElement('style');
    style.id = 'customCSS';
    style.setAttribute('type', 'text/css');
    style.textContent = css;
    document.head.appendChild(style);
  }
};

CustomCSS.open = function() {
  var cnt, ta, data;
  
  if ($.id('customCSSMenu')) {
    return;
  }
  
  cnt = document.createElement('div');
  cnt.id = 'customCSSMenu';
  cnt.className = 'UIPanel';
  cnt.setAttribute('data-cmd', 'css-close');
  cnt.innerHTML = '\
<div class="extPanel reply"><div class="panelHeader">Custom CSS\
<span class="panelCtrl"><img alt="Close" title="Close" class="pointer" data-cmd="css-close" src="'
+ Main.icons.cross + '"></span></div>\
<textarea id="customCSSBox"></textarea>\
<div class="center"><button data-cmd="css-save">Save CSS</button></div>\
</td></tr></tfoot></table></div>';
  
  document.body.appendChild(cnt);
  
  cnt.addEventListener('click', this.onClick, false);
  
  ta = $.id('customCSSBox');
  
  if (data = localStorage.getItem('4chan-css')) {
    ta.textContent = data;
  }
  
  ta.focus();
};

CustomCSS.save = function() {
  var ta, style;
  
  if (ta = $.id('customCSSBox')) {
    localStorage.setItem('4chan-css', ta.value);
    if (Config.customCSS && (style = $.id('customCSS'))) {
      document.head.removeChild(style);
      CustomCSS.init();
    }
  }
};

CustomCSS.close = function() {
  var cnt;
  
  if (cnt = $.id('customCSSMenu')) {
    cnt.removeEventListener('click', this.onClick, false);
    document.body.removeChild(cnt);
  }
};

CustomCSS.onClick = function(e) {
  var cmd;
  
  if (cmd = e.target.getAttribute('data-cmd')) {
    switch (cmd) {
      case 'css-close':
        CustomCSS.close();
        break;
      case 'css-save':
        CustomCSS.save();
        CustomCSS.close();
        break;
    }
  }
};

/**
 * Draggable helper
 */
var Draggable = {
  el: null,
  key: null,
  scrollX: null,
  scrollY: null,
  dx: null, dy: null, right: null, bottom: null, offsetTop: null,
  
  set: function(handle) {
    handle.addEventListener('mousedown', Draggable.startDrag, false);
  },
  
  unset: function(handle) {
    handle.removeEventListener('mousedown', Draggable.startDrag, false);
  },
  
  startDrag: function(e) {
    var self, doc, offs;
    
    if (this.parentNode.hasAttribute('data-shiftkey') && !e.shiftKey) {
      return;
    }
    
    e.preventDefault();
    
    self = Draggable;
    doc = document.documentElement;
    
    self.el = this.parentNode;
    
    self.key = self.el.getAttribute('data-trackpos');
    offs = self.el.getBoundingClientRect();
    self.dx = e.clientX - offs.left;
    self.dy = e.clientY - offs.top;
    self.right = doc.clientWidth - offs.width;
    self.bottom = doc.clientHeight - offs.height;
    
    if (getComputedStyle(self.el, null).position != 'fixed') {
      self.scrollX = window.pageXOffset;
      self.scrollY = window.pageYOffset;
    }
    else {
      self.scrollX = self.scrollY = 0;
    }
    
    self.offsetTop = 0;
    
    document.addEventListener('mouseup', self.endDrag, false);
    document.addEventListener('mousemove', self.onDrag, false);
  },
  
  endDrag: function() {
    document.removeEventListener('mouseup', Draggable.endDrag, false);
    document.removeEventListener('mousemove', Draggable.onDrag, false);
    if (Draggable.key) {
      Config[Draggable.key] = Draggable.el.style.cssText;
      Config.save();
    }
    delete Draggable.el;
  },
  
  onDrag: function(e) {
    var left, top, style;
    
    left = e.clientX - Draggable.dx + Draggable.scrollX;
    top = e.clientY - Draggable.dy + Draggable.scrollY;
    style = Draggable.el.style;
    if (left < 1) {
      style.left = '0';
      style.right = '';
    }
    else if (Draggable.right < left) {
      style.left = '';
      style.right = '0';
    }
    else {
      style.left = (left / document.documentElement.clientWidth * 100) + '%';
      style.right = '';
    }
    if (top <= Draggable.offsetTop) {
      style.top = Draggable.offsetTop + 'px';
      style.bottom = '';
    }
    else if (Draggable.bottom < top &&
      Draggable.el.clientHeight < document.documentElement.clientHeight) {
      style.bottom = '0';
      style.top = '';
    }
    else {
      style.top = (top / document.documentElement.clientHeight * 100) + '%';
      style.bottom = '';
    }
  }
};

/**
 * User Agent
 */
var UA = {};

UA.init = function() {
  document.head = document.head || $.tag('head')[0];
  
  this.isOpera = Object.prototype.toString.call(window.opera) == '[object Opera]';
  
  this.hasCORS = 'withCredentials' in new XMLHttpRequest();
  
  this.hasFormData = 'FormData' in window;
};

UA.dispatchEvent = function(name, detail) {
  var e = document.createEvent('Event');
  e.initEvent(name, false, false);
  if (detail) {
    e.detail = detail;
  }
  document.dispatchEvent(e);
};

UA.getSelection = function(raw) {
  var sel;
  
  if (UA.isOpera && typeof (sel = document.getSelection()) == 'string') {}
  else {
    sel = window.getSelection();
    
    if (!raw) {
      sel = sel.toString();
    }
  }
  
  return sel;
};

/**
 * Config
 */
var Config = {
  quotePreview: true,
  backlinks: true,
  
  imageExpansion: true,
  fitToScreenExpansion: false,
  localTime: true,
  inlineQuotes: false,
  
  revealSpoilers: false,
  imageHover: false,
  IDColor: true,
  noPictures: false,
  embedYouTube: true,
  embedSoundCloud: false,
  
  customCSS: false,
  compactThreads: false,
  centeredThreads: false,
  darkTheme: false,
  linkify: false,
  unmuteWebm: false,
  
  disableAll: false
};

var ConfigMobile = {
  embedYouTube: false,
  compactThreads: false,
  linkify: true,
};

Config.load = function() {
  var storage;
  
  if (storage = localStorage.getItem('4chan-settings')) {
    storage = JSON.parse(storage);
    $.extend(Config, storage);
  }
  else {
    Main.firstRun = true;
  }
};

Config.loadFromURL = function() {
  var cmd, data;
  
  cmd = location.href.split('=', 2);
  
  if (/#cfg$/.test(cmd[0])) {
    try {
      data = JSON.parse(decodeURIComponent(cmd[1]));
      
      history.replaceState(null, '', location.href.split('#', 1)[0]);
      
      $.extend(Config, JSON.parse(data.settings));
      
      Config.save();
      
      if (data.css) {
        localStorage.setItem('4chan-css', data.css);
      }
      
      if (data.catalogSettings) {
        localStorage.setItem('catalog-settings', data.catalogSettings);
      }
      
      return true;
    }
    catch (e) {
      console.log(e);
    }
  }
  
  return false;
};

Config.toURL = function() {
  var data, cfg = {};
  
  cfg.settings = localStorage.getItem('4chan-settings');
  
  if (data = localStorage.getItem('4chan-css')) {
    cfg.css = data;
  }
  
  if (data = localStorage.getItem('catalog-settings')) {
    cfg.catalogSettings = data;
  }
  
  return encodeURIComponent(JSON.stringify(cfg));
};

Config.save = function(old) {
  localStorage.setItem('4chan-settings', JSON.stringify(Config));
  
  if (!old) {
    return;
  }
  
  if (old.darkTheme != Config.darkTheme) {
    if (Config.darkTheme) {
      Main.setCookie('nws_style', 'Tomorrow', '.4chan.org');
      Main.setCookie('ws_style', 'Tomorrow', '.4chan.org');
    }
    else {
      Main.removeCookie('nws_style', '.4chan.org');
      Main.removeCookie('ws_style', '.4chan.org');
    }
  }
};

/**
 * Settings menu
 */
var SettingsMenu = {};

// [ Name, Subtitle, available on mobile?, is sub-option?, is mobile only? ]
SettingsMenu.options = {
  'Quotes &amp; Replying': {
    quotePreview: [ 'Quote preview', 'Show post when mousing over post links', true ],
    backlinks: [ 'Backlinks', 'Show who has replied to a post', true ],
    inlineQuotes: [ 'Inline quote links', 'Clicking quote links will inline expand the quoted post, Shift-click to bypass inlining' ]
  },
  'Images &amp; Media': {
    imageExpansion: [ 'Image expansion', 'Enable inline image expansion, limited to browser width', true ],
    fitToScreenExpansion: [ 'Fit expanded images to screen', 'Limit expanded images to both browser width and height' ],
    imageHover: [ 'Image hover', 'Mouse over images to view full size, limited to browser size' ],
    imageHoverBg: [ 'Set a background color for transparent images', '', false, true ],
    revealSpoilers: [ "Don't spoiler images", 'Show image thumbnail and original filename instead of spoiler placeholders', true ],
    unmuteWebm: [ 'Un-mute WebM audio', 'Un-mute sound automatically for WebM playback', true ],
    noPictures: [ 'Hide thumbnails', 'Don\'t display thumbnails while browsing', true ],
    embedYouTube: [ 'Embed YouTube links', 'Embed YouTube player into replies' ],
    embedSoundCloud: [ 'Embed SoundCloud links', 'Embed SoundCloud player into replies' ],
  },
  'Miscellaneous': {
    linkify: [ 'Linkify URLs', 'Make user-posted links clickable', true ],
    darkTheme: [ 'Use a dark theme', 'Use the Tomorrow theme for nighttime browsing', true, false, true ],
    customCSS: [ 'Custom CSS [<a href="javascript:;" data-cmd="css-open">Edit</a>]', 'Include your own CSS rules', true ],
    IDColor: [ 'Color user IDs', 'Assign unique colors to user IDs on boards that use them', true ],
    compactThreads: [ 'Force long posts to wrap', 'Long posts will wrap at 75% browser width' ],
    centeredThreads: [ 'Center threads', 'Align threads to the center of page', false ],
    localTime: [ 'Convert dates to local time', 'Convert 4chan server time (US Eastern Time) to your local time', true ]
  }
};

SettingsMenu.save = function() {
  var i, options, el, key, old;
  
  old = {};
  $.extend(old, Config);
  
  options = $.id('settingsMenu').getElementsByClassName('menuOption');
  
  for (i = 0; el = options[i]; ++i) {
    key = el.getAttribute('data-option');
    Config[key] = el.type == 'checkbox' ? el.checked : el.value;
  }
  
  Config.save(old);
  
  UA.dispatchEvent('4chanSettingsSaved');
  
  SettingsMenu.close();
  location.href = location.href.replace(/#.+$/, '');
};

SettingsMenu.toggle = function() {
  if ($.id('settingsMenu')) {
    SettingsMenu.close();
  }
  else {
    SettingsMenu.open();
  }
};

SettingsMenu.open = function() {
  var i, cat, categories, key, html, cnt, opts, mobileOpts, el;
  
  if (Main.firstRun) {
    if (el = $.id('settingsTip')) {
      el.parentNode.removeChild(el);
    }
    if (el = $.id('settingsTipBottom')) {
      el.parentNode.removeChild(el);
    }
    Config.save();
  }
  
  cnt = document.createElement('div');
  cnt.id = 'settingsMenu';
  cnt.className = 'UIPanel';
  
  html = '<div class="extPanel reply"><div class="panelHeader">Settings'
    + '<span class="panelCtrl"><img alt="Close" title="Close" class="pointer" data-cmd="settings-toggle" src="'
    + Main.icons.cross + '"></a>'
    + '</span></div><ul>';
  
  html += '<ul><li id="settings-exp-all">[<a href="#" data-cmd="settings-exp-all">Expand All Settings</a>]</li></ul>';
  
  if (Main.hasMobileLayout) {
    categories = {};
    for (cat in SettingsMenu.options) {
      mobileOpts = {};
      opts = SettingsMenu.options[cat];
      for (key in opts) {
        if (opts[key][2]) {
          mobileOpts[key] = opts[key];
        }
      }
      for (i in mobileOpts) {
        categories[cat] = mobileOpts;
        break;
      }
    }
  }
  else {
    categories = SettingsMenu.options;
  }
  
  for (cat in categories) {
    opts = categories[cat];
    html += '<ul><li class="settings-cat-lbl">'
      + '<img alt="" class="settings-expand" src="' + Main.icons.plus + '">'
      + '<span class="settings-expand pointer">'
      + cat + '</span></li><ul class="settings-cat">';
    for (key in opts) {
      // Mobile layout only?
      if (opts[key][4] && !Main.hasMobileLayout) {
        continue;
      }
      html += '<li' + (opts[key][3] ? ' class="settings-sub">' : '>')
        + '<label><input type="checkbox" class="menuOption" data-option="'
        + key + '"' + (Config[key] ? ' checked="checked">' : '>')
        + opts[key][0] + '</label>'
        + (opts[key][1] !== false ? '</li><li class="settings-tip'
        + (opts[key][3] ? ' settings-sub">' : '">') + opts[key][1] : '')
        + '</li>';
    }
    html += '</ul></ul>';
  }
  
  html += '</ul><ul><li class="settings-off">'
    + '<label title="Completely disable the native extension (overrides any checked boxes)">'
    + '<input type="checkbox" class="menuOption" data-option="disableAll"'
    + (Config.disableAll ? ' checked="checked">' : '>')
    + 'Disable the native extension</label></li></ul>'
    + '<div class="center"><button data-cmd="settings-export">Export Settings</button>'
    + '<button data-cmd="settings-save">Save Settings</button></div>';
  
  cnt.innerHTML = html;
  cnt.addEventListener('click', SettingsMenu.onClick, false);
  document.body.appendChild(cnt);
  
  if (Main.firstRun) {
    SettingsMenu.expandAll();
  }
  
  (el = $.cls('menuOption', cnt)[0]) && el.focus();
};

SettingsMenu.showExport = function() {
  var cnt, str, el;
  
  if ($.id('exportSettings')) {
    return;
  }
  
  str = location.href.replace(location.hash, '') + '#cfg=' + Config.toURL();
  
  cnt = document.createElement('div');
  cnt.id = 'exportSettings';
  cnt.className = 'UIPanel';
  cnt.setAttribute('data-cmd', 'export-close');
  cnt.innerHTML = '\
<div class="extPanel reply"><div class="panelHeader">Export Settings\
<span class="panelCtrl"><img data-cmd="export-close" class="pointer" alt="Close" title="Close" src="'
+ Main.icons.cross + '"></span></div>\
<p class="center">Copy and save the URL below, and visit it from another \
browser or computer to restore your extension and catalog settings.</p>\
<p class="center">\
<input class="export-field" type="text" readonly="readonly" value="' + str + '"></p>\
<p style="margin-top:15px" class="center">Alternatively, you can drag the link below into your \
bookmarks bar and click it to restore.</p>\
<p class="center">[<a target="_blank" href="'
+ str + '">Restore 4chan Settings</a>]</p>';

  document.body.appendChild(cnt);
  cnt.addEventListener('click', this.onExportClick, false);
  el = $.cls('export-field', cnt)[0];
  el.focus();
  el.select();
};

SettingsMenu.closeExport = function() {
  var cnt;
  
  if (cnt = $.id('exportSettings')) {
    cnt.removeEventListener('click', this.onExportClick, false);
    document.body.removeChild(cnt);
  }
};

SettingsMenu.onExportClick = function(e) {
  if (e.target.id == 'exportSettings') {
    e.preventDefault();
    e.stopPropagation();
    SettingsMenu.closeExport();
  }
};

SettingsMenu.expandAll = function() {
  var i, el, nodes = $.cls('settings-expand');
  
  for (i = 0; el = nodes[i]; ++i) {
    el.src = Main.icons.minus;
    el.parentNode.nextElementSibling.style.display = 'block';
  }
};

SettingsMenu.toggleCat = function(t) {
  var icon, disp, el = t.parentNode.nextElementSibling;
  
  if (!el.style.display) {
    disp = 'block';
    icon = 'minus';
  }
  else {
    disp = '';
    icon = 'plus';
  }
  
  el.style.display = disp;
  t.parentNode.firstElementChild.src = Main.icons[icon];
};

SettingsMenu.onClick = function(e) {
  var el, t;
  
  t = e.target;
  
  if ($.hasClass(t, 'settings-expand')) {
    SettingsMenu.toggleCat(t);
  }
  else if (t.getAttribute('data-cmd') == 'settings-exp-all') {
    e.preventDefault();
    SettingsMenu.expandAll();
  }
  else if (t.id == 'settingsMenu' && (el = $.id('settingsMenu'))) {
    e.preventDefault();
    SettingsMenu.close(el);
  }
};

SettingsMenu.close = function(el) {
  if (el = (el || $.id('settingsMenu'))) {
    el.removeEventListener('click', SettingsMenu.onClick, false);
    document.body.removeChild(el);
  }
};

/**
 * Feedback
 */
var Feedback = {
  messageTimeout: null,
  
  showMessage: function(msg, type, timeout, onClick) {
    var el;
    
    Feedback.hideMessage();
    
    el = document.createElement('div');
    el.id = 'feedback';
    el.title = 'Dismiss';
    el.innerHTML = '<span class="feedback-' + type + '">' + msg + '</span>';
    
    $.on(el, 'click', onClick || Feedback.hideMessage);
    
    document.body.appendChild(el);
    
    if (timeout) {
      Feedback.messageTimeout = setTimeout(Feedback.hideMessage, timeout);
    }
  },
  
  hideMessage: function() {
    var el = $.id('feedback');
    
    if (el) {
      if (Feedback.messageTimeout) {
        clearTimeout(Feedback.messageTimeout);
        Feedback.messageTimeout = null;
      }
      
      $.off(el, 'click', Feedback.hideMessage);
      
      document.body.removeChild(el);
    }
  },
  
  error: function(msg, timeout) {
    if (timeout === undefined) {
      timeout = 5000;
    }
    
    Feedback.showMessage(msg || 'Something went wrong', 'error', timeout);
  },
  
  notify: function(msg, timeout) {
    if (timeout === undefined) {
      timeout = 3000;
    }
    
    Feedback.showMessage(msg, 'notify', timeout);
  }
};

/**
 * Main
 */
var Main = {};

Main.addTooltip = function(link, message, id) {
  var el, pos;
  
  el = document.createElement('div');
  el.className = 'click-me';
  if (id) {
    el.id = id;
  }
  el.innerHTML = message || 'Change your settings';
  link.parentNode.appendChild(el);
  
  pos = (link.offsetWidth - el.offsetWidth + link.offsetLeft - el.offsetLeft) / 2;
  el.style.marginLeft = pos + 'px';
  
  return el;
};

Main.init = function() {
  var params;
  
  document.addEventListener('DOMContentLoaded', Main.run, false);
  
  Main.now = Date.now();
  
  UA.init();
  
  Config.load();
  
  if (Main.firstRun && Config.loadFromURL()) {
    Main.firstRun = false;
  }
  
  if (Main.stylesheet = Main.getCookie(style_group)) {
    Main.stylesheet = Main.stylesheet.toLowerCase().replace(/ /g, '_');
  }
  else {
    Main.stylesheet =
      style_group == 'nws_style' ? 'yotsuba_new' : 'yotsuba_b_new';
  }
  
  Main.initIcons();
  
  Main.addCSS();
  
  Main.type = style_group.split('_')[0];
  
  params = location.pathname.split(/\//);
  Main.board = params[1];
  Main.page = params[2];
  Main.tid = params[3];
  
  UA.dispatchEvent('4chanMainInit');
};

Main.checkMobileLayout = function() {
  var mobile, desktop;
  
  if (window.matchMedia) {
    return (window.matchMedia('(max-width: 480px)').matches
      || window.matchMedia('(max-device-width: 480px)').matches)
      && localStorage.getItem('4chan_never_show_mobile') != 'true';
  }
  
  mobile = $.id('boardNavMobile');
  desktop = $.id('boardNavDesktop');
  
  return mobile && desktop && mobile.offsetWidth > 0 && desktop.offsetWidth === 0;
};

Main.disableDarkTheme = function() {
  Config.darkTheme = false;
  localStorage.setItem('4chan-settings', JSON.stringify(Config));
};

Main.run = function() {
  var el, thread;
  
  document.removeEventListener('DOMContentLoaded', Main.run, false);
  
  document.addEventListener('click', Main.onclick, false);
  
  $.id('settingsWindowLink').addEventListener('click', SettingsMenu.toggle, false);
  //$.id('settingsWindowLinkBot').addEventListener('click', SettingsMenu.toggle, false);
  $.id('settingsWindowLinkMobile').addEventListener('click', SettingsMenu.toggle, false);
  
  Main.hasMobileLayout = Main.checkMobileLayout();
  Main.isMobileDevice = /Mobile|Android|Dolfin|Opera Mobi|PlayStation Vita|Nintendo DS/.test(navigator.userAgent);
  
  if (Config.disableAll) {
    return;
  }
  
  if (Main.hasMobileLayout) {
    $.extend(Config, ConfigMobile);
  }
  else {
    if (Main.isMobileDevice) {
      $.addClass(document.body, 'isMobileDevice');
    }
  }
  
  if (Config.linkify) {
    Linkify.init();
  }
  
  if (Config.IDColor) {
    IDColor.init();
  }
  
  if (Config.customCSS) {
    CustomCSS.init();
  }
  
  $.addClass(document.body, Main.stylesheet);
  $.addClass(document.body, Main.type);
  
  if (Config.darkTheme) {
    $.addClass(document.body, 'm-dark');
    if (!Main.hasMobileLayout) {
      $.cls('stylechanger')[0].addEventListener('change', Main.disableDarkTheme, false);
    }
  }
  
  if (Config.compactThreads) {
    $.addClass(document.body, 'compact');
  }
  else if (Config.centeredThreads) {
    $.addClass(document.body, 'centeredThreads');
  }
  
  if (Config.noPictures) {
    $.addClass(document.body, 'noPictures');
  }
  
  if (Config.quotePreview || Config.imageHover) {
    thread = $.qs('.thread') || $.id('arc-list');
    thread.addEventListener('mouseover', Main.onThreadMouseOver, false);
    thread.addEventListener('mouseout', Main.onThreadMouseOut, false);
  }
  
  if (!Main.hasMobileLayout) {
    Main.initGlobalMessage();
  }
  
  if (Main.hasMobileLayout || Config.embedSoundCloud || Config.embedYouTube) {
    Media.init();
  }
  
  ReplyHiding.init();
  
  if (Config.quotePreview) {
    QuotePreview.init();
  }
  
  Parser.init();
  
  if (Main.tid) {
    Main.threadClosed = !document.forms.post || !!$.cls('closedIcon')[0];
    Main.threadSticky = !!$.cls('stickyIcon', $.id('pi' + Main.tid))[0];
    
    Parser.parseThread(Main.tid);
  }
  else {
    Parser.parseBoard();
  }
  
  if (Main.board === 'f') {
    SWFEmbed.init();
  }
  
  ReplyHiding.purge();
};

Main.isThreadClosed = function(tid) {
  var el;
  return window.thread_archived || ((el = $.id('pi' + tid)) && $.cls('closedIcon', el)[0]);
};

Main.setThreadState = function(state, mode) {
  var cnt, el, ref, cap;
  
  cap = state.charAt(0).toUpperCase() + state.slice(1);
  
  if (mode) {
    cnt = $.cls('postNum', $.id('pi' + Main.tid))[0];
    el = document.createElement('img');
    el.className = state + 'Icon retina';
    el.title = cap;
    el.src = Main.icons2[state];
    if (state == 'sticky' && (ref = $.cls('closedIcon', cnt)[0])) {
      cnt.insertBefore(el, ref);
      cnt.insertBefore(document.createTextNode(' '), ref);
    }
    else {
      cnt.appendChild(document.createTextNode(' '));
      cnt.appendChild(el);
    }
  }
  else {
    if (el = $.cls(state + 'Icon', $.id('pi' + Main.tid))[0]) {
      el.parentNode.removeChild(el.previousSibling);
      el.parentNode.removeChild(el);
    }
  }
  
  Main['thread' + cap] = mode;
};

Main.icons = {
  up: 'arrow_up.png',
  down: 'arrow_down.png',
  right: 'arrow_right.png',
  download: 'arrow_down2.png',
  refresh: 'refresh.png',
  cross: 'cross.png',
  gis: 'gis.png',
  iqdb: 'iqdb.png',
  minus: 'post_expand_minus.png',
  plus: 'post_expand_plus.png',
  rotate: 'post_expand_rotate.gif',
  quote: 'quote.png',
  notwatched: 'watch_thread_off.png',
  watched: 'watch_thread_on.png',
  help: 'question.png'
};

Main.icons2 = {
  archived: 'archived.gif',
  closed: 'closed.gif',
  sticky: 'sticky.gif',
  trash: 'trash.gif'
},

Main.initIcons = function() {
  var key, paths, url;
  
  paths = {
    yotsuba_new: 'futaba/',
    futaba_new: 'futaba/',
    yotsuba_b_new: 'burichan/',
    burichan_new: 'burichan/',
    tomorrow: 'tomorrow/',
    photon: 'photon/'
  };
  
  url = '//s.4cdn.org/image/';
  
  if (window.devicePixelRatio >= 2) {
    for (key in Main.icons) {
      Main.icons[key] = Main.icons[key].replace('.', '@2x.');
    }
    for (key in Main.icons2) {
      Main.icons2[key] = Main.icons2[key].replace('.', '@2x.');
    }
  }
  
  for (key in Main.icons2) {
    Main.icons2[key] = url + Main.icons2[key];
  }
  
  url += 'buttons/' + paths[Main.stylesheet];
  for (key in Main.icons) {
    Main.icons[key] = url + Main.icons[key];
  }
};

Main.initGlobalMessage = function() {
  var msg, btn, thisTs, oldTs;
  
  if ((msg = $.id('globalMessage')) && msg.textContent) {
    msg.nextElementSibling.style.clear = 'both';
    
    btn = document.createElement('img');
    btn.id = 'toggleMsgBtn';
    btn.className = 'extButton';
    btn.setAttribute('data-cmd', 'toggleMsg');
    btn.alt = 'Toggle';
    btn.title = 'Toggle announcement';
    
    oldTs = localStorage.getItem('4chan-global-msg');
    thisTs = msg.getAttribute('data-utc');
    
    if (oldTs && thisTs <= oldTs) {
      msg.style.display = 'none';
      btn.style.opacity = '0.5';
      btn.src = Main.icons.plus;
    }
    else {
      btn.src = Main.icons.minus;
    }
    
    msg.parentNode.insertBefore(btn, msg);
  }
};

Main.toggleGlobalMessage = function() {
  var msg, btn;
  
  msg = $.id('globalMessage');
  btn = $.id('toggleMsgBtn');
  if (msg.style.display == 'none') {
    msg.style.display = '';
    btn.src = Main.icons.minus;
    btn.style.opacity = '1';
    localStorage.removeItem('4chan-global-msg');
  }
  else {
    msg.style.display = 'none';
    btn.src = Main.icons.plus;
    btn.style.opacity = '0.5';
    localStorage.setItem('4chan-global-msg', msg.getAttribute('data-utc'));
  }
};

Main.getCookie = function(name) {
  var i, c, ca, key;
  
  key = name + "=";
  ca = document.cookie.split(';');
  
  for (i = 0; c = ca[i]; ++i) {
    while (c.charAt(0) == ' ') {
      c = c.substring(1, c.length);
    }
    if (c.indexOf(key) === 0) {
      return decodeURIComponent(c.substring(key.length, c.length));
    }
  }
  return null;
};

Main.setCookie = function(name, value, domain) {
  var date = new Date();
  
  date.setTime(date.getTime() + (365 * 24 * 60 * 60 * 1000));
  
  if (!domain) {
    domain = 'boards.4chan.org';
  }
  
  document.cookie = name + '=' + value
    + '; expires=' + date.toGMTString()
    + '; path=/; domain=' + domain;
};

Main.removeCookie = function(name, domain) {
  if (!domain) {
    domain = 'boards.4chan.org';
  }
  
  document.cookie = name + '='
    + '; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
    + '; path=/; domain=' + domain;
};

Main.onclick = function(e) {
  var t, cmd, tid, id;
  
  if ((t = e.target) == document) {
    return;
  }
  
  if (cmd = t.getAttribute('data-cmd')) {
    id = t.getAttribute('data-id');
    switch (cmd) {
      case 'post-menu':
        e.preventDefault();
        PostMenu.open(t);
        break;
      case 'totop':
      case 'tobottom':
        if (!e.shiftKey) {
          location.href = '#' + cmd.slice(2);
        }
        break;
      case 'hide-r':
        if (t.hasAttribute('data-recurse')) {
          ReplyHiding.toggleR(id);
        }
        else {
          ReplyHiding.toggle(id);
        }
        break;
      case 'embed':
        Media.toggleEmbed(t);
        break;
      case 'toggleMsg':
        Main.toggleGlobalMessage();
        break;
      case 'settings-toggle':
        SettingsMenu.toggle();
        break;
      case 'settings-save':
        SettingsMenu.save();
        break;
      case 'css-open':
        CustomCSS.open();
        break;
      case 'settings-export':
        SettingsMenu.showExport();
        break;
      case 'export-close':
        SettingsMenu.closeExport();
        break;
    }
  }
  else if (!Config.disableAll) {
    if (Config.imageExpansion && e.which == 1 && t.parentNode
      && $.hasClass(t.parentNode, 'fileThumb')
      && t.parentNode.nodeName == 'A'
      && !$.hasClass(t.parentNode, 'deleted')
      && !$.hasClass(t, 'mFileInfo')) {
      
      if (ImageExpansion.toggle(t)) {
        e.preventDefault();
      }
      
      return;
    }
    else if (Config.inlineQuotes && e.which == 1 && $.hasClass(t, 'quotelink') && Main.page !== 'archive') {
      if (!e.shiftKey) {
        QuoteInline.toggle(t, e);
      }
      else {
        e.preventDefault();
        window.location = t.href;
      }
    }
    else if (Main.isMobileDevice && Config.quotePreview
      && $.hasClass(t, 'quotelink')
      && t.getAttribute('href').match(QuotePreview.regex)) {
      e.preventDefault();
    }
    else if ($.hasClass(t, 'mFileInfo')) {
      e.preventDefault();
      e.stopPropagation();
    }
  }
  
  if (Main.hasMobileLayout && (Config.disableAll || !Config.imageExpansion)) {
    if (t.parentNode && t.parentNode.hasAttribute('data-m')) {
      ImageExpansion.setMobileSrc(t.parentNode);
    }
  }
};

Main.onThreadMouseOver = function(e) {
  var t = e.target;
  
  if (Config.quotePreview
    && $.hasClass(t, 'quotelink')
    && !$.hasClass(t, 'deadlink')
    && !$.hasClass(t, 'linkfade')) {
    QuotePreview.resolve(e.target);
  }
  else if (Config.imageHover && (
    (t.hasAttribute('data-md5') && !$.hasClass(t.parentNode, 'deleted'))
    ||
    (t.href && !$.hasClass(t.parentNode, 'fileText') && /(i\.4cdn|is\.4chan)\.org\/[a-z0-9]+\/[0-9]+\.(gif|jpg|png|webm)$/.test(t.href))
    )
  ) {
    ImageHover.show(t);
  }
  else if ($.hasClass(t, 'dateTime')) {
    Parser.onDateMouseOver(t);
  }
  else if ($.hasClass(t, 'hand')) {
    Parser.onUIDMouseOver(t);
  }
  else if (Config.embedYouTube && t.getAttribute('data-type') === 'yt' && !Main.hasMobileLayout) {
    Media.showYTPreview(t);
  }
};

Main.onThreadMouseOut = function(e) {
  var t = e.target;
  
  if (Config.quotePreview && $.hasClass(t, 'quotelink')) {
    QuotePreview.remove(t);
  }
  else if (Config.imageHover &&
    (t.hasAttribute('data-md5')
    || (t.href && !$.hasClass(t.parentNode, 'fileText') && /(i\.4cdn|is\.4chan)\.org\/[a-z0-9]+\/[0-9]+\.(gif|jpg|png|webm)$/.test(t.href))
    )
  ) {
    ImageHover.hide();
  }
  else if ($.hasClass(t, 'dateTime') || $.hasClass(t, 'hand')) {
    Parser.onTipMouseOut(t);
  }
  else if (Config.embedYouTube && t.getAttribute('data-type') === 'yt' && !Main.hasMobileLayout) {
    Media.removeYTPreview();
  }
};

Main.linkToThread = function(tid, board, post) {
  return '//' + location.host + '/'
    + (board || Main.board) + '/thread/'
    + tid + (post > 0 ? ('#p' + post) : '');
};

Main.addCSS = function() {
  var style, css = '\
.extButton.threadHideButton {\
  float: left;\
  margin-right: 5px;\
  margin-top: -1px;\
}\
.extButton.replyHideButton {\
  margin-top: 1px;\
}\
div.op > span .postHideButtonCollapsed {\
  margin-right: 1px;\
}\
.extPanel {\
  border: 1px solid rgba(0, 0, 0, 0.20);\
}\
.tomorrow .extPanel {\
  border: 1px solid #111;\
}\
.extButton,\
img.pointer {\
  width: 18px;\
  height: 18px;\
}\
.extControls {\
  display: inline;\
  margin-left: 5px;\
}\
.extButton {\
  cursor: pointer;\
  margin-bottom: -4px;\
}\
.trashIcon {\
  width: 16px;\
  height: 16px;\
  margin-bottom: -2px;\
  margin-left: 5px;\
}\
.threadUpdateStatus {\
  margin-left: 0.5ex;\
}\
.futaba_new .stub,\
.burichan_new .stub {\
  line-height: 1;\
  padding-bottom: 1px;\
}\
.stub .extControls,\
.stub .wbtn,\
.stub input {\
  display: none;\
}\
.stub .threadHideButton {\
  float: none;\
  margin-right: 2px;\
}\
.right {\
  float: right;\
}\
.center {\
  display: block;\
  margin: auto;\
}\
.pointer {\
  cursor: pointer;\
}\
.drag {\
  cursor: move !important;\
  user-select: none !important;\
  -moz-user-select: none !important;\
  -webkit-user-select: none !important;\
}\
#twHeader {\
  font-weight: bold;\
  text-align: center;\
  height: 17px;\
}\
.futaba_new #twHeader,\
.burichan_new #twHeader {\
  line-height: 1;\
}\
#twPrune {\
  margin-left: 3px;\
  margin-top: -1px;\
}\
#twClose {\
  float: left;\
  margin-top: -1px;\
}\
#watchList {\
  margin: 0;\
  padding: 0;\
  user-select: none;\
  -moz-user-select: none;\
  -webkit-user-select: none;\
}\
#watchList li:first-child {\
  margin-top: 3px;\
  padding-top: 2px;\
  border-top: 1px solid rgba(0, 0, 0, 0.20);\
}\
.photon #watchList li:first-child {\
  border-top: 1px solid #ccc;\
}\
.yotsuba_new #watchList li:first-child {\
  border-top: 1px solid #d9bfb7;\
}\
.yotsuba_b_new #watchList li:first-child {\
  border-top: 1px solid #b7c5d9;\
}\
.tomorrow #watchList li:first-child {\
  border-top: 1px solid #111;\
}\
#watchList a {\
  text-decoration: none;\
}\
#watchList li {\
  overflow: hidden;\
  white-space: nowrap;\
  text-overflow: ellipsis;\
}\
div.post div.image-expanded {\
  display: table;\
}\
div.op div.file .image-expanded-anti {\
  margin-left: -3px;\
}\
#quote-preview {\
  display: block;\
  position: absolute;\
  top: 0;\
  padding: 3px 6px 6px 3px;\
  margin: 0;\
}\
#quote-preview .dateTime {\
  white-space: nowrap;\
}\
#quote-preview.reveal-spoilers s {\
  background-color: #aaa !important;\
  color: inherit !important;\
  text-decoration: none !important;\
}\
#quote-preview.reveal-spoilers s a {\
  background: transparent !important;\
  text-decoration: underline;\
}\
.yotsuba_b_new #quote-preview.reveal-spoilers s a,\
.burichan_new #quote-preview.reveal-spoilers s a {\
  color: #D00 !important;\
}\
.yotsuba_new #quote-preview.reveal-spoilers s a,\
.futaba_new #quote-preview.reveal-spoilers s a {\
  color: #000080 !important;\
}\
.tomorrow #quote-preview.reveal-spoilers s { color: #000 !important; }\
.tomorrow #quote-preview.reveal-spoilers s a { color: #5F89AC !important; }\
.photon #quote-preview.reveal-spoilers s a {\
  color: #FF6600 !important;\
}\
.yotsuba_new #quote-preview.highlight,\
.yotsuba_b_new #quote-preview.highlight {\
  border-width: 1px 2px 2px 1px !important;\
  border-style: solid !important;\
}\
.yotsuba_new #quote-preview.highlight {\
  border-color: #D99F91 !important;\
}\
.yotsuba_b_new #quote-preview.highlight {\
  border-color: #BA9DBF !important;\
}\
.yotsuba_b_new .highlight-anti,\
.burichan_new .highlight-anti {\
  border-width: 1px !important;\
  background-color: #bfa6ba !important;\
}\
.yotsuba_new .highlight-anti,\
.futaba_new .highlight-anti {\
  background-color: #e8a690 !important;\
}\
.tomorrow .highlight-anti {\
  background-color: #111 !important;\
  border-color: #111;\
}\
.photon .highlight-anti {\
  background-color: #bbb !important;\
}\
.op.inlined {\
  display: block;\
}\
#quote-preview .inlined,\
#quote-preview .postMenuBtn,\
#quote-preview .extButton,\
#quote-preview .extControls {\
  display: none;\
}\
.hasNewReplies { font-weight: bold; }\
.hasYouReplies { font-style: italic; }\
.archivelink {\
  opacity: 0.5;\
}\
.deadlink {\
  text-decoration: line-through !important;\
}\
div.backlink {\
  font-size: 0.8em !important;\
  display: inline;\
  padding: 0;\
  padding-left: 5px;\
}\
.backlink.mobile {\
  padding: 3px 5px;\
  display: block;\
  clear: both !important;\
  line-height: 2;\
}\
.op .backlink.mobile,\
#quote-preview .backlink.mobile {\
  display: none !important;\
}\
.backlink.mobile .quoteLink {\
  padding-right: 2px;\
}\
.backlink span {\
  padding: 0;\
}\
.burichan_new .backlink a,\
.yotsuba_b_new .backlink a {\
  color: #34345C !important;\
}\
.burichan_new .backlink a:hover,\
.yotsuba_b_new .backlink a:hover {\
  color: #dd0000 !important;\
}\
.expbtn {\
  margin-right: 3px;\
  margin-left: 2px;\
}\
.tCollapsed .rExpanded {\
  display: none;\
}\
.tu-error {\
  color: red;\
}\
.newPostsMarker:not(#quote-preview) {\
  box-shadow: 0 3px red;\
}\
#toggleMsgBtn {\
  float: left;\
  margin-bottom: 6px;\
}\
.panelHeader {\
  font-weight: bold;\
  font-size: 16px;\
  text-align: center;\
  margin-bottom: 5px;\
  margin-top: 5px;\
  padding-bottom: 5px;\
  border-bottom: 1px solid rgba(0, 0, 0, 0.20);\
}\
.yotsuba_new .panelHeader {\
  border-bottom: 1px solid #d9bfb7;\
}\
.yotsuba_b_new .panelHeader {\
  border-bottom: 1px solid #b7c5d9;\
}\
.tomorrow .panelHeader {\
  border-bottom: 1px solid #111;\
}\
.panelHeader .panelCtrl {\
  position: absolute;\
  right: 5px;\
  top: 5px;\
}\
.UIMenu,\
.UIPanel {\
  position: fixed;\
  width: 100%;\
  height: 100%;\
  top: 0;\
  left: 0;\
  z-index: 9002;\
}\
.UIPanel {\
  line-height: 14px;\
  font-size: 14px;\
  background-color: rgba(0, 0, 0, 0.25);\
}\
.UIPanel:after {\
  display: inline-block;\
  height: 100%;\
  vertical-align: middle;\
  content: "";\
}\
.UIPanel > div {\
  -moz-box-sizing: border-box;\
  box-sizing: border-box;\
  display: inline-block;\
  height: auto;\
  max-height: 100%;\
  position: relative;\
  width: 400px;\
  left: 50%;\
  margin-left: -200px;\
  overflow: auto;\
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.25);\
  vertical-align: middle;\
}\
#settingsMenu > div {\
  top: 25px;;\
  vertical-align: top;\
  max-height: 85%;\
}\
.extPanel input[type="text"],\
.extPanel textarea {\
  border: 1px solid #AAA;\
  outline: none;\
}\
.UIPanel .center {\
  margin-bottom: 5px;\
}\
.UIPanel button {\
  display: inline-block;\
  margin-right: 5px;\
}\
.UIPanel code {\
  background-color: #eee;\
  color: #000000;\
  padding: 1px 4px;\
  font-size: 12px;\
}\
.UIPanel ul {\
  list-style: none;\
  padding: 0;\
  margin: 0 0 10px;\
}\
.UIPanel .export-field {\
  width: 385px;\
}\
#settingsMenu label input {\
  margin-right: 5px;\
}\
.tomorrow #settingsMenu ul {\
  border-bottom: 1px solid #282a2e;\
}\
.settings-off {\
  padding-left: 3px;\
}\
.settings-cat-lbl {\
  font-weight: bold;\
  margin: 10px 0 5px;\
  padding-left: 5px;\
}\
.settings-cat-lbl img {\
  vertical-align: text-bottom;\
  margin-right: 5px;\
  cursor: pointer;\
  width: 18px;\
  height: 18px;\
}\
.settings-tip {\
  font-size: 0.85em;\
  margin: 2px 0 5px 0;\
  padding-left: 23px;\
}\
#settings-exp-all {\
  padding-left: 7px;\
  text-align: center;\
}\
#settingsMenu .settings-cat {\
  display: none;\
  margin-left: 3px;\
}\
#tex-preview-cnt .extPanel { width: 600px; margin-left: -300px; }\
#tex-preview-cnt textarea,\
#customCSSMenu textarea {\
  display: block;\
  max-width: 100%;\
  min-width: 100%;\
  -moz-box-sizing: border-box;\
  box-sizing: border-box;\
  height: 200px;\
  margin: 0 0 5px;\
  font-family: monospace;\
}\
#tex-preview-cnt textarea { height: 75px; }\
#output-tex-preview {\
  min-height: 75px;\
  white-space: pre;\
  padding: 0 3px;\
  -moz-box-sizing: border-box; box-sizing: border-box;\
}\
#tex-protip { font-size: 11px; margin: 5px 0; text-align: center; }\
a.tex-logo sub { pointer-events: none; }\
#customCSSMenu .right,\
#settingsMenu .right {\
  margin-top: 2px;\
}\
#settingsMenu label {\
  display: inline-block;\
  user-select: none;\
  -moz-user-select: none;\
  -webkit-user-select: none;\
}\
#quote-preview iframe,\
#quote-preview .filter-preview {\
  display: none;\
}\
.post-hidden .extButton,\
.post-hidden:not(#quote-preview) .postInfo {\
  opacity: 0.5;\
}\
.post-hidden:not(.thread) .postInfo {\
  padding-left: 5px;\
}\
.post-hidden:not(#quote-preview) input,\
.post-hidden:not(#quote-preview) .replyContainer,\
.post-hidden:not(#quote-preview) .summary,\
.post-hidden:not(#quote-preview) .op .file,\
.post-hidden:not(#quote-preview) .file,\
.post-hidden .wbtn,\
.post-hidden .postNum span,\
.post-hidden:not(#quote-preview) .backlink,\
div.post-hidden:not(#quote-preview) div.file,\
div.post-hidden:not(#quote-preview) blockquote.postMessage {\
  display: none;\
}\
.click-me {\
  border-radius: 5px;\
  margin-top: 5px;\
  padding: 2px 5px;\
  position: absolute;\
  font-weight: bold;\
  z-index: 2;\
  white-space: nowrap;\
}\
.yotsuba_new .click-me,\
.futaba_new .click-me {\
  color: #800000;\
  background-color: #F0E0D6;\
  border: 2px solid #D9BFB7;\
}\
.yotsuba_b_new .click-me,\
.burichan_new .click-me {\
  color: #000;\
  background-color: #D6DAF0;\
  border: 2px solid #B7C5D9;\
}\
.tomorrow .click-me {\
  color: #C5C8C6;\
  background-color: #282A2E;\
  border: 2px solid #111;\
}\
.photon .click-me {\
  color: #333;\
  background-color: #ddd;\
  border: 2px solid #ccc;\
}\
.click-me:before {\
  content: "";\
  border-width: 0 6px 6px;\
  border-style: solid;\
  left: 50%;\
  margin-left: -6px;\
  position: absolute;\
  width: 0;\
  height: 0;\
  top: -6px;\
}\
.yotsuba_new .click-me:before,\
.futaba_new .click-me:before {\
  border-color: #D9BFB7 transparent;\
}\
.yotsuba_b_new .click-me:before,\
.burichan_new .click-me:before {\
  border-color: #B7C5D9 transparent;\
}\
.tomorrow .click-me:before {\
  border-color: #111 transparent;\
}\
.photon .click-me:before {\
  border-color: #ccc transparent;\
}\
.click-me:after {\
  content: "";\
  border-width: 0 4px 4px;\
  top: -4px;\
  display: block;\
  left: 50%;\
  margin-left: -4px;\
  position: absolute;\
  width: 0;\
  height: 0;\
}\
.yotsuba_new .click-me:after,\
.futaba_new .click-me:after {\
  border-color: #F0E0D6 transparent;\
  border-style: solid;\
}\
.yotsuba_b_new .click-me:after,\
.burichan_new .click-me:after {\
  border-color: #D6DAF0 transparent;\
  border-style: solid;\
}\
.tomorrow .click-me:after {\
  border-color: #282A2E transparent;\
  border-style: solid;\
}\
.photon .click-me:after {\
  border-color: #DDD transparent;\
  border-style: solid;\
}\
#image-hover {\
  position: absolute;\
  max-width: 100%;\
  max-height: 100%;\
  top: 0px;\
  right: 0px;\
  z-index: 9002;\
}\
.thread-stats {\
  float: right;\
  margin-right: 5px;\
  cursor: default;\
}\
.compact .thread {\
  max-width: 75%;\
}\
.dotted {\
  text-decoration: none;\
  border-bottom: 1px dashed;\
}\
.linkfade {\
  opacity: 0.5;\
}\
#quote-preview .linkfade {\
  opacity: 1.0;\
}\
kbd {\
  background-color: #f7f7f7;\
  color: black;\
  border: 1px solid #ccc;\
  border-radius: 3px 3px 3px 3px;\
  box-shadow: 0 1px 0 #ccc, 0 0 0 2px #fff inset;\
  font-family: monospace;\
  font-size: 11px;\
  line-height: 1.4;\
  padding: 0 5px;\
}\
.deleted {\
  opacity: 0.66;\
}\
div.collapseWebm { text-align: center; margin-top: 10px; }\
.noPictures a.fileThumb img:not(.expanded-thumb) {\
  opacity: 0;\
}\
.noPictures.futaba_new a.fileThumb,\
.noPictures.yotsuba_new a.fileThumb {\
  border: 1px solid #800;\
}\
.noPictures.burichan_new a.fileThumb,\
.noPictures.yotsuba_b_new a.fileThumb {\
  border: 1px solid #34345C;\
}\
.noPictures.tomorrow a.fileThumb:not(.expanded-thumb) {\
  border: 1px solid #C5C8C6;\
}\
.noPictures.photon a.fileThumb:not(.expanded-thumb) {\
  border: 1px solid #004A99;\
}\
.spinner {\
  margin-top: 2px;\
  padding: 3px;\
  display: table;\
}\
#settings-presets {\
  position: relative;\
  top: -1px;\
}\
#colorpicker { \
  position: fixed;\
  text-align: center;\
}\
.colorbox {\
  font-size: 10px;\
  width: 16px;\
  height: 16px;\
  line-height: 17px;\
  display: inline-block;\
  text-align: center;\
  background-color: #fff;\
  border: 1px solid #aaa;\
  text-decoration: none;\
  color: #000;\
  cursor: pointer;\
  vertical-align: top;\
}\
#palette-custom-input {\
  vertical-align: top;\
  width: 45px;\
  margin-right: 2px;\
}\
.burichan_new .depagelink,\
.futaba_new .depagelink {\
  text-decoration: underline;\
}\
.preview-summary {\
  display: block;\
}\
#swf-embed-header {\
  padding: 0 0 0 3px;\
  font-weight: normal;\
  height: 20px;\
  line-height: 20px;\
}\
.yotsuba_new #swf-embed-header,\
.yotsuba_b_new #swf-embed-header {\
  height: 18px;\
  line-height: 18px;\
}\
#swf-embed-close {\
  position: absolute;\
  right: 0;\
  top: 1px;\
}\
.postMenuBtn {\
  margin-left: 5px;\
  text-decoration: none;\
  line-height: 1em;\
  display: inline-block;\
  -webkit-transition: -webkit-transform 0.1s;\
  -moz-transition: -moz-transform 0.1s;\
  transition: transform 0.1s;\
  width: 1em;\
  height: 1em;\
  text-align: center;\
  outline: none;\
  opacity: 0.8;\
}\
.postMenuBtn:hover{\
  opacity: 1;\
}\
.yotsuba_new .postMenuBtn,\
.futaba_new .postMenuBtn {\
  color: #000080;\
}\
.tomorrow .postMenuBtn {\
  color: #5F89AC !important;\
}\
.tomorrow .postMenuBtn:hover {\
  color: #81a2be !important;\
}\
.photon .postMenuBtn {\
  color: #FF6600 !important;\
}\
.photon .postMenuBtn:hover {\
  color: #FF3300 !important;\
}\
.menuOpen {\
  -webkit-transform: rotate(90deg);\
  -moz-transform: rotate(90deg);\
  -ms-transform: rotate(90deg);\
  transform: rotate(90deg);\
}\
.settings-sub label:before {\
  border-bottom: 1px solid;\
  border-left: 1px solid;\
  content: " ";\
  display: inline-block;\
  height: 8px;\
  margin-bottom: 5px;\
  width: 8px;\
}\
.settings-sub {\
  margin-left: 25px;\
}\
.settings-tip.settings-sub {\
  padding-left: 32px;\
}\
.centeredThreads .opContainer {\
  display: block;\
}\
.centeredThreads .postContainer {\
  margin: auto;\
  width: 75%;\
}\
.centeredThreads .sideArrows {\
  display: none;\
}\
.centre-exp {\
  width: auto !important;\
  clear: both;\
}\
.centeredThreads .summary {\
  margin-left: 12.5%;\
  display: block;\
}\
.centre-exp div.op{\
  display: table;\
}\
#yt-preview { position: absolute; }\
#yt-preview img { display: block; }\
.autohide-nav { transition: top 0.2s ease-in-out }\
#feedback {\
  position: fixed;\
  top: 10px;\
  text-align: center;\
  width: 100%;\
  z-index: 9999;\
}\
.feedback-notify,\
.feedback-error {\
  border-radius: 5px;\
  cursor: pointer;\
  color: #fff;\
  padding: 3px 6px;\
  font-size: 16px;\
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);\
  text-shadow: 0 1px rgba(0, 0, 0, 0.2);\
}\
.feedback-error { background-color: #C41E3A; }\
.feedback-notify { background-color: #00A550; }\
.boardSelect .custom-menu-ctrl, .boardSelect .customBoardList { margin-left: 10px; }\
.boardSelect .custom-menu-ctrl { display: none; }\
.boardSelect:hover .custom-menu-ctrl { display: inline; }\
.persistentNav .boardList a, .persistentNav .customBoardList a, #boardNavMobile .boardSelect a { text-decoration: none; }\
@media only screen and (max-width: 480px) {\
.thread-stats { float: none; text-align: center; }\
.ts-replies:before { content: "Replies: "; }\
.ts-images:before { content: "Images: "; }\
.ts-ips:before { content: "Posters: "; }\
.ts-page:before { content: "Page: "; }\
#watchList {\
  padding: 0 10px;\
}\
div.post div.postInfoM span.nameBlock { clear: none }\
.btn-row {\
  margin-top: 5px;\
}\
.image-expanded .mFileName {\
  display: block;\
  margin-bottom: 2px;\
}\
.mFileName { display: none }\
.postLink .mobileHideButton {\
  margin-right: 3px;\
}\
.board .mobile-hr-hidden {\
  margin-top: 10px !important;\
}\
.board > .mobileHideButton {\
  margin-top: -20px !important;\
}\
.board > .mobileHideButton:first-child {\
  margin-top: 10px !important;\
}\
.extButton.threadHideButton {\
  float: none;\
  margin: 0;\
  margin-bottom: 5px;\
}\
.mobile-post-hidden {\
  display: none;\
}\
#toggleMsgBtn {\
  display: none;\
}\
.mobile-tu-status {\
  height: 20px;\
  line-height: 20px;\
}\
.mobile-tu-show {\
  width: 150px;\
  margin: auto;\
  display: block;\
  text-align: center;\
}\
.button input {\
  margin: 0 3px 0 0;\
  position: relative;\
  top: -2px;\
  border-radius: 0;\
  height: 10px;\
  width: 10px;\
}\
.UIPanel > div {\
  width: 320px;\
  margin-left: -160px;\
}\
.UIPanel .export-field {\
  width: 300px;\
}\
.yotsuba_new #quote-preview.highlight,\
#quote-preview {\
  border-width: 1px !important;\
}\
.yotsuba_new #quote-preview.highlight {\
  border-color: #D9BFB7 !important;\
}\
.m-dark .button {\
  background-color: rgb(27,28,30);\
  background-image: url("//s.4cdn.org/image/buttonfade-dark.png");\
  background-repeat: repeat-x;\
  border: 1px solid #282A2E;\
}\
.depaged-ad { margin-top: -25px; margin-bottom: -25px; }\
.depageNumber { font-size: 10px; margin-top: -21px; }\
.m-dark a, .m-dark div#absbot a { color: #81A2BE !important; }\
.m-dark a:hover { color: #5F89AC !important; }\
.m-dark .button a, .m-dark .button:hover, .m-dark .button { color: #707070 !important; }\
.m-dark #boardNavMobile {  background-color: #1D1F21;  border-bottom: 2px solid #282A2E; }\
body.m-dark { background: #1D1F21 none; color: #C5C8C6; }\
.m-dark #globalToggle {\
  background-color: #FFADAD;\
  background-image: url("//s.4cdn.org/image/buttonfade-red.png");\
  border: 1px solid #C45858;\
  color: #880000 !important;\
}\
.m-dark .boardTitle { color: #C5C8C6; }\
.m-dark hr, .m-dark div.board > hr { border-top: 1px solid #282A2E; }\
.m-dark div.opContainer,\
.m-dark div.reply { background-color: #282A2E; border: 1px solid #2D2F33 !important; }\
.m-dark .preview { background-color: #282A2E; border: 1px solid #333 !important; }\
.m-dark div.post div.postInfoM { background-color: #212326; border-bottom: 1px solid #2D2F33; }\
.m-dark div.postLink,\
.m-dark .backlink.mobile { background-color: #212326; border-top: 1px solid #2D2F33; }\
.m-dark div.post div.postInfoM span.dateTime,\
.m-dark div.postLink span.info,\
.m-dark div.post div.postInfoM span.dateTime a { color: #707070 !important; }\
.m-dark span.subject { color: #B294BB !important; }\
.m-dark .highlightPost:not(.op) { background: #3A171C !important; }\
.m-dark .reply:target, .m-dark .reply.highlight { background: #1D1D21 !important; padding: 2px; }\
.m-dark .reply:target, .m-dark .reply.highlight { background: #1D1D21 !important; padding: 2px; }\
}';
  
  style = document.createElement('style');
  style.setAttribute('type', 'text/css');
  style.textContent = css;
  document.head.appendChild(style);
};

Main.init();
