//!  Angular Moment.js v0.2.8
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
});

