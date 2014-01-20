Angular Moment.js Module
================

An AngularJS module to add Moment.js functionality to Angular. No jQuery necessary!

## Features at a Glance
* `$moment` service for configuring module-wide settings, such as the default model and view date formats.
* `input[type=moment]` directive for validating dates and translating date formats from the view to the model and back. Additionally, the directive adds support for specifying a `min` and `max` date as well as stepping dates with your mouse wheel or keyboard (up, down, plus, or minus). 

More features are planned, including a suite of filters and a date picker.

## Requirements
* [Moment.js] [1] 2.5.0+
* [AngularJS] [2] 1.2.0+

[1]: http://momentjs.com/
[2]: http://angularjs.org/

## Installing
After including the module script on your page, declare `angular-momentjs` as a dependency:
```
angular.module('myApp', ['angular-momentjs']);
```