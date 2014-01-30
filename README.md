Angular Moment.js Module 
================
**Version 0.2.4** - Jan. 30, 2014

An AngularJS module to add Moment.js functionality to Angular. No jQuery necessary!<br>

## Features at a Glance
* `$moment` service for configuring module-wide settings, such as the default model and view date formats.
* `input[type=moment]` directive for validating dates and translating date formats from the view to the model and back. Additionally, the directive adds support for specifying a `min` and `max` date as well as stepping dates with your mouse wheel or keyboard (up, down, plus, or minus). 

More features are planned, including a suite of filters and a date picker.

## Requirements
* [Moment.js] [1] v2.3.0+ (v2.5.1+ recommended)
* [AngularJS] [2] v1.2.0+

[1]: http://momentjs.com/
[2]: http://angularjs.org/

## Installing
After including the module script on your page, declare `moment` as a dependency of your app:
```
angular.module('myApp', ['moment']);
```

## Usage

### $momentProvider
Used to configure defaults across the module.
#### Methods

* **defaultModelFormat(**`string`**)**<br> Set the default Moment format to be used for the model value. Defaults to `moment.defaultFormat`, which is ISO8601 out-of-the-box (`YYYY-MM-DDTHH:mm:ssZ`).

* **defaultViewFormat(**`string`**)**<br> Set the default Moment format to be used for the view value. Defaults to `L`, a locale dependent format set to `MM/DD/YYYY` for `moment.lang('en')`.

* **strictModel(**`boolean`**)**<br> Set whether model date values should be parsed strictly or not. Strict parsing requires that the format and input match exactly. Defaults to `true`.

* **strictView(**`boolean`**)**<br> Set whether view date values should be parsed strictly. Strict parsing requires that the format and input match exactly. Defaults to `true`.
 

### Directive
``` html
<input type="moment"
       ng-model="{string}"
       [format="{string}"]
       [model-format="{string}"]
       [view-format="{string}"]
       [min="{expression}"]
       [max="{expression}"]
       [step="{string}"]>
</input>
```

#### Parameters

| Param                    | Type        | Default | Details |
| ---                      | ---         | ---     | ---     |
| format *(optional)*      | String      | &mdash; | Specify a single Moment format for both the model and view values. Overridden if `modelFormat` or `viewFormat` is set. Sets `date` validation error key if the date is invalid. |
| modelFormat *(optional)* | String      | `$moment.$defaultModelFormat` | Specify a Moment format for the model value. Sets `date` validation error key if the model date is invalid. |
| viewFormat *(optional)*  | String      | `$moment.$defaultViewFormat`  | Specify a Moment format for the view value. Sets `date` validation error key if the view date is invalid. |
| min *(optional)*         | Expression  | &mdash; | Sets `min` validation error key if the date value is before the `min` date. Expected value is a date string or an array of a date string and a Moment format to parse it with. |
| max *(optional)*         | Expression  | &mdash; | Sets `max` validation error key if the date value is after the `max` date. Expected value is a date string or an array of a date string and a Moment format to parse it with. |
| step *(optional)*        | String      | `1 day` | Specify a quantity and a unit of time to step the date by on mouse wheel up/down, up/down arrow keys, or plus/minus keys. Pressing shift causes the date to step by one greater or lesser unit of time. |

Note that all parameters can be bound data-bound and dynamic. If `modelFormat` is changed, the view value will be reparsed to provide the new format for the model value, and conversely if `viewFormat` is changed.


## Contributing
Please feel welcome to contribute by forking this repo, creating a new branch, and issuing a pull request. Please try to write tests to accompany your contribution. To get up and running for development:
```
npm install -g grunt-cli
npm install
bower install
```

### Task Running

To develop:
```
gulp develop
```

To build:
```
gulp build
```

To test:
```
gulp test
```
