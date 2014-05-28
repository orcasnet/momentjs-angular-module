//!  Angular Moment.js v0.3.2
//!  https://github.com/shaungrady/angular-momentjs
//!  (c) 2014 Shaun Grady
//!  License: MIT

'use strict';

angular.module('moment', []);

angular.module('moment')
.constant('indexOf', function indexOf(array, obj) {
  // Taken from github.com/angular/angular.js
  if (array.indexOf) return array.indexOf(obj);
  for (var i = 0; i < array.length; i++) {
    if (obj === array[i]) return i;
  }
  return -1;
})
.constant('getOffset', function getOffset(elem) {
  // Based on http://stackoverflow.com/a/8111175
  if (!elem)
    return;

  var doc      = document,
      win      = window,
      bodyElem = doc.body,
      docElem  = doc.documentElement,
      boxElem  = doc.createElement('div'),
      isBoxModel,
      clientTop, clientLeft,
      scrollTop, scrollLeft,
      offsetTop, offsetRight, offsetBottom, offsetLeft,
      adjustedScrollTop,
      adjustedScrollLeft;

  boxElem.style.paddingLeft = 
  boxElem.style.width       = '1px';

  bodyElem.appendChild(boxElem);
  isBoxModel = boxElem.offsetWidth == 2;
  bodyElem.removeChild(boxElem);
  boxElem = elem.getBoundingClientRect();

  clientTop  = docElem.clientTop  || bodyElem.clientTop  || 0;
  clientLeft = docElem.clientLeft || bodyElem.clientLeft || 0;
  scrollTop  = win.pageYOffset || isBoxModel && docElem.scrollTop  || bodyElem.scrollTop;
  scrollLeft = win.pageXOffset || isBoxModel && docElem.scrollLeft || bodyElem.scrollLeft;

  adjustedScrollTop  = scrollTop  - clientTop;
  adjustedScrollLeft = scrollLeft - clientLeft;

  offsetTop    = boxElem.top    + adjustedScrollTop;
  offsetLeft   = boxElem.left   + adjustedScrollLeft;
  offsetBottom = boxElem.bottom + adjustedScrollTop;
  offsetRight  = boxElem.right  + adjustedScrollLeft;

  return {
    top:    offsetTop,
    left:   offsetLeft,
    bottom: offsetBottom,
    right:  offsetRight
  };
});

