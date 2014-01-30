/*!
  Angular Moment.js v0.2.5
  https://github.com/shaungrady/angular-momentjs
  (c) 2014 Shaun Grady
  License: MIT
*/

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


/*
  Angular Moment.js Service Provider
*/

'use strict';

angular.module('moment')

.provider('$moment', function $momentProvider() {
  // Strict parsing has trouble in Moment.js v2.3—2.5 with short tokens
  // E.g. 1-31-2000, M-D-YYYY is invalid.
  var config = {
    $strictView: true,
    $strictModel: true,
    $defaultViewFormat: 'L',
    $defaultModelFormat: moment.defaultFormat,
    $parseFormat: $parseFormat
  };

  // For parsing locale-dependent date formats (L, LL, etc.) 
  function $parseFormat (format) {
    format = format || '';
    if (format.match(/l/i))
      return moment().lang()._longDateFormat[format] || format;
    return format;
  }

  this.defaultViewFormat = function(format) {
    if (angular.isString(format))
      config.$defaultViewFormat = format;
    return this;
  };

  this.defaultModelFormat = function(format) {
    if (angular.isString(format))
      config.$defaultModelFormat = format;
    return this;
  };

  this.strictView = function(bool) {
    if (typeof bool === 'boolean')
      config.$strictView = bool;
    return this;
  };

  this.strictModel = function(bool) {
    if (typeof bool === 'boolean')
      config.$strictModel = bool;
    return this;
  };

  this.$get = function() {
    if (angular.isDefined(moment.$strictView))
      return moment;
    try {
      Object.defineProperty(moment, '$strictView', {
        value: config.$strictView
      });
      Object.defineProperty(moment, '$strictModel', {
        value: config.$strictModel
      });
      Object.defineProperty(moment, '$defaultViewFormat', {
        value: config.$defaultViewFormat
      });
      Object.defineProperty(moment, '$defaultModelFormat', {
        value: config.$defaultModelFormat
      });
      Object.defineProperty(moment, '$parseFormat', {
        value: config.$parseFormat
      });
    }
    catch(err) { angular.extend(moment, config); }
    return moment;
  };

});


/*
  Angular Moment.js Filters
*/

'use strict';

angular.module('moment')

.filter('momentFormat', ['$moment', function($moment) {
  // Format: String or Array
  // String: Moment output format (defaults to defaultViewFormat)
  // Array: Moment input format, moment output format, [strict]
  return function momentFormatFilter(date, format) {
    var moment, strict, inputFormat,
        outputFormat = $moment.$defaultViewFormat;

    if (!angular.isDefined(date))
      return date;

    if (angular.isString(format))
      outputFormat = format;
    else if (angular.isArray(format)) {
      inputFormat  = format[0];
      outputFormat = format[1] || outputFormat;
      strict       = format[2];
    }

    moment = $moment(date, inputFormat, strict);

    if (moment.isValid())
      return moment.format(outputFormat);

    // Try parsing it with the defaultModelFormat if inputFormat wasn't specified
    if (!angular.isDefined(inputFormat)) {
      moment = $moment(date, $moment.$defaultModelFormat, $moment.strictModel);
      if (moment.isValid())
        return moment.format(outputFormat);
    }

    return date;
  };
}]);
/*
  Angular Moment.js Directive
*/

'use strict';

angular.module('moment')

.directive('input', ['$moment', '$timeout', 'indexOf', function inputDirective($moment, $timeout, indexOf) {
  // Maybe expose a setting for localization someday...
  var stepUnits   = ['millisecond', 'second', 'minute', 'hour', 'day', 'month', 'year'],
      strictView  = $moment.$strictView,
      strictModel = $moment.$strictModel;

  return {
    priority: 10,
    restrict: 'E',
    require: '?ngModel',
    compile: function inputCompile(tElement, tAttr) {
      // Support both input[type=date] and input[type=moment] so one can use type=moment if
      // browser vendor type=date functionality is undesired (*ehem* Chrome). 
      if (tAttr.type !== 'date' && tAttr.type !== 'moment')
        return angular.noop;
      return function inputPostLink(scope, element, attr, ctrl) {
        // All the functionality of this directive requires ngModelCtrl
        if (!ctrl)
          return;
        
        var // Formats may be overridden if attr.(view|model)Format or attr.format is set
            viewFormat  = $moment.$defaultViewFormat,
            modelFormat = $moment.$defaultModelFormat,
            stepUnit, stepQuantity,
            // Min/max must be reparsed using view/model formats to account for differences
            // in date specificity. E.g., if min is '01-30-2000' and viewFormat is 'MM-YYYY'
            // and the model value is '01-2000'. 
            moments = {
              min: {
                attr: null,
                view: null,
                model: null
              },
              max: {
                attr: null,
                view: null,
                model: null
              }
            };


        // Utility Functions
        /////////////////////

        var setPlaceholder = function(format) {
          element.attr('placeholder', $moment.$parseFormat(format));
        };

        var reparseViewValue = function() {
          if (!ctrl.$isEmpty(ctrl.$viewValue))
            ctrl.$setViewValue(ctrl.$viewValue);
        };
        var reformatModelValue = function() {
          // Is there a better way to resend the model value through the formatter pipeline?
          var modelValue = ctrl.$modelValue;
          if (!ctrl.$isEmpty(modelValue)) {
            $timeout(function() {
              scope.$apply(function() { scope[attr.ngModel] = modelValue + ' '; });
              scope.$apply(function() { scope[attr.ngModel] = modelValue; });
            }, 0, false);
          }
        };

        var setViewModelMomentsForAttr = function(attr) {
          // attr is either 'min' or 'max'
          if (moments[attr].attr && moments[attr].attr.isValid()) {
            moments[attr].view  = $moment(moments[attr].attr.format(viewFormat), viewFormat);
            moments[attr].model = $moment(moments[attr].attr.format(modelFormat), modelFormat);
          }
          else
            moments[attr].attr = moments[attr].view  = moments[attr].model = null;
        };

        // Date Validation and Formatting
        //////////////////////////////////

        var parseValidateAndFormatDate = function parseValidateAndFormatDate(origin, value) {
          var moment, isValid, isEmpty, inputFormat, outputFormat, strict;

          if (origin == 'view') {
            inputFormat  = viewFormat;
            outputFormat = modelFormat;
            strict       = strictView;
          } else {
            inputFormat  = modelFormat;
            outputFormat = viewFormat;
            strict       = strictModel;
          }

          moment  = $moment(value, inputFormat, strict);
          isValid = moment.isValid();
          isEmpty = ctrl.$isEmpty(value);

          // Date validation
          if (!isEmpty && !isValid) {
            ctrl.$setValidity('date', false);
            if (attr.min) ctrl.$setValidity('min', true);
            if (attr.max) ctrl.$setValidity('max', true);
            return undefined; }
          else
            ctrl.$setValidity('date', true);

          // Min validation
          if (attr.min) {
            if (!isEmpty && isValid && moments.min.attr && moment.isBefore(moments.min[origin]))
              ctrl.$setValidity('min', false);
            else
              ctrl.$setValidity('min', true);
          }

          // Max validation
          if (attr.max) {
            if (!isEmpty && isValid && moments.max.attr && moment.isAfter(moments.max[origin]))
              ctrl.$setValidity('max', false);
            else
              ctrl.$setValidity('max', true);
          }

          // Output and formatting
          if (ctrl.$error.min || ctrl.$error.max)
            return undefined;
          else
            return isEmpty ? value : moment.format(outputFormat);
        };

        ctrl.$parsers   .push(angular.bind(undefined, parseValidateAndFormatDate, 'view'));
        ctrl.$formatters.push(angular.bind(undefined, parseValidateAndFormatDate, 'model'));


        // Deal with the attributes
        ////////////////////////////

        if (attr.format && (!attr.viewFormat || !attr.modelFormat)) {
          viewFormat  = scope.$eval(attr.format) || viewFormat;
          modelFormat = scope.$eval(attr.format) || modelFormat;

          scope.$watch(attr.format, function formatWatchAction(value) {
            viewFormat  = value;
            modelFormat = value;
            setPlaceholder(value);
            setViewModelMomentsForAttr('min');
            setViewModelMomentsForAttr('max');
            reparseViewValue();
          });
        }

        if (attr.viewFormat) {
          viewFormat = scope.$eval(attr.viewFormat) || viewFormat;

          scope.$watch(attr.viewFormat, function viewFormatWatchAction(format) {
            format = format || $moment.$defaultViewFormat;
            if (format === viewFormat) return;
            viewFormat = format;
            setPlaceholder(format);
            setViewModelMomentsForAttr('min');
            setViewModelMomentsForAttr('max');
            reformatModelValue();
          });
        }

        if (attr.modelFormat) {
          modelFormat = scope.$eval(attr.modelFormat) || modelFormat;

          scope.$watch(attr.modelFormat, function modelFormatWatchAction(format) {
            format = format || $moment.$defaultModelFormat;
            if (format === modelFormat) return;
            modelFormat = format;
            setViewModelMomentsForAttr('min');
            setViewModelMomentsForAttr('max');
            reparseViewValue();
          });
        }

        setPlaceholder(viewFormat);


        // Min/Max Validation
        //////////////////////

        if (attr.min) {
          var minWatchAction = function minWatchAction(minAttr) {
            var moment;
            if (angular.isArray(minAttr) && minAttr.length == 2)
              moment = $moment(minAttr[0], minAttr[1]);
            else if (minAttr && angular.isString(minAttr)) {
              if (minAttr == 'today')
                moment = $moment();
              else
                moment = $moment(minAttr, $moment.$defaultModelFormat);
            }
            else
              moment = null;
            // Has the min changed?
            if (!moment ^ !moments.min.attr || (moment && moments.min.attr && moment.format('X') !== moments.min.attr.format('X'))) {
              moments.min.attr = moment;
              setViewModelMomentsForAttr('min');
              reparseViewValue();
            }
          };

          minWatchAction(scope.$eval(attr.min));
          scope.$watch(attr.min, minWatchAction, true);
        }

        if (attr.max) {
          var maxWatchAction = function maxWatchAction(maxAttr) {
            var moment;
            if (angular.isArray(maxAttr) && maxAttr.length == 2)
              moment = $moment(maxAttr[0], maxAttr[1]);
            else if (maxAttr && angular.isString(maxAttr)) {
              if (maxAttr == 'today')
                moment = $moment();
              else
                moment = $moment(maxAttr, $moment.$defaultModelFormat);
            }
            else
              moment = null;

            if (!moment ^ !moments.max.attr || (moment && moments.max.attr && moment.format('X') !== moments.max.attr.format('X'))) {
              moments.max.attr = moment;
              setViewModelMomentsForAttr('max');
              reparseViewValue();
            }
          };

          maxWatchAction(scope.$eval(attr.max));
          scope.$watch(attr.max, maxWatchAction, true);
        }


        // Stepping
        ////////////

        // TODO: Allow this to be config'ed
        stepUnit     = 'day',
        stepQuantity = 1;

        if (attr.step) {
          scope.$watch(attr.step, function stepWatchAction(step) {
            if (!step || !angular.isString(step))
              return;

            var match = step.match(/(\d+)\s(\w+)/);
            if (match) {
              stepUnit     = match[2];
              stepQuantity = parseInt(match[1], 10);
            } else {
              stepUnit     = 'day';
              stepQuantity = 1;
            }

          });
        }

        var inputStepHandler = function(event, eventData) {
          // Allow for passing custom event object in tests (so Kosher)
          if (!event.type && eventData && eventData.type)
            angular.extend(event, eventData);

          //                               Up|Dn
          if (event.type == 'keydown' && !/38|40/.test(event.which)) return;
          event.preventDefault();

          var isEmpty    = ctrl.$isEmpty(ctrl.$viewValue),
              momentView = isEmpty ? $moment() : $moment(ctrl.$viewValue, viewFormat, strictView),
              wheelDelta, isIncrease, shiftedStepUnit, momentViewStepped, steppedViewValue;

          if (!momentView.isValid())
            return;

          if (event.type == 'keydown')
            isIncrease = /38/.test(event.which);
          else {
            wheelDelta = event.originalEvent ? event.originalEvent.wheelDelta : event.wheelDelta;
            isIncrease = wheelDelta / 120 > 0;
          }

          if (!!event.shiftKey)
            shiftedStepUnit = stepUnits[(indexOf(stepUnits, stepUnit.replace(/s$/, '')) + 1)] || stepUnit;
          else
            shiftedStepUnit = stepUnit;

          if (isEmpty && moments.min.attr)
            // Always step an empty value to the min if specified
            momentViewStepped = moments.min.view.clone();
          else if (isIncrease) {
            if (isEmpty && !moments.min.attr)
              // Then use today's date clamped to max 
              momentViewStepped = momentView.max(moments.max.attr ? moments.max.view : undefined);
            else if (moments.min.attr && momentView.isBefore(moments.min.view))
              momentViewStepped = moments.min.view.clone();
            else if (moments.max.attr && !momentView.isAfter(moments.max.view))
              // Then step value up, clamp to max
              momentViewStepped = momentView.add(shiftedStepUnit, stepQuantity).max(moments.max.view);
            else if (!moments.max.attr)
              // If there's no max, increase; otherwise leave it exceeding max--we'll only bring it
              // back in bounds of the max when user decreases value. 
              // This mimic's browser vendor behavior with min/max stepping for input[type=number]
              momentViewStepped = momentView.add(shiftedStepUnit, stepQuantity);
          }
          // The opposite for decrease
          else {
            if (isEmpty && !moments.max.attr)
              momentViewStepped = momentView.min(moments.min.attr ? moments.min.view : undefined);
            else if (moments.max.attr && momentView.isAfter(moments.max.view))
              momentViewStepped = moments.max.view.clone();
            else if (moments.min.attr && !momentView.isBefore(moments.min.view))
              momentViewStepped = momentView.subtract(shiftedStepUnit, stepQuantity).min(moments.min.view);
            else if (!moments.min.attr)
              momentViewStepped = momentView.subtract(shiftedStepUnit, stepQuantity);
          }

          steppedViewValue = (momentViewStepped || momentView).format(viewFormat);

          scope.$apply(function() {
            ctrl.$setViewValue(steppedViewValue);
            ctrl.$render();
          });

        };

        element.on('mousewheel keydown', inputStepHandler);

      };
    }
  };
}]);

