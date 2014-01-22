'use strict';

angular.module('angular-momentjs', [])

.constant('indexOf', function indexOf(array, obj) {
  // Taken from github.com/angular/angular.js
  if (array.indexOf) return array.indexOf(obj);
  for (var i = 0; i < array.length; i++) {
    if (obj === array[i]) return i;
  }
  return -1;
})

.provider('$moment', function $momentProvider() {
  // Strict parsing has trouble in Moment.js v2.3—2.5 with short tokens
  // E.g. 1-31-2000, M-D-YYYY is invalid.
  var config = {
    $strictView: true,
    $strictModel: false,
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

})

.directive('input', ['$moment', '$timeout', 'indexOf', function inputDirective($moment, $timeout, indexOf) {
  // Maybe expose a setting for localization someday...
  var stepUnits = ['millisecond', 'second', 'minute', 'hour', 'day', 'month', 'year'];

  return {
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
        
        var setPlaceholder = function(format) { element.attr('placeholder', $moment.$parseFormat(format)); },
            // Formats may be overridden if attr.(view|model)Format or attr.format is set
            viewFormat  = $moment.$defaultViewFormat,
            modelFormat = $moment.$defaultModelFormat,
            // Min/max must be reparsed using view/model formats to account for differences
            // in date specificity. E.g., if min is '01-30-2000' and viewFormat is 'MM-YYYY'
            // and the model value is '01-2000'. 
            momentMin, momentMinView, momentMinModel,
            momentMax, momentMaxView, momentMaxModel,
            stepUnit, stepQuantity;

        setPlaceholder(viewFormat);

        // Utility Functions
        /////////////////////

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

        var setMinViewModelMoments = function() {
          if (momentMin && momentMin.isValid()) {
            momentMinView  = $moment(momentMin.format(viewFormat), viewFormat);
            momentMinModel = $moment(momentMin.format(modelFormat), modelFormat);
          }
          else
            momentMinView  = momentMinModel = null;
        };

        var setMaxViewModelMoments = function() {
          if (momentMax && momentMax.isValid()) {
            momentMaxView  = $moment(momentMax.format(viewFormat), viewFormat);
            momentMaxModel = $moment(momentMax.format(modelFormat), modelFormat);
          }
          else
            momentMaxView  = momentMaxModel = null;
        };

        // Date Validation and Formatting
        //////////////////////////////////

        var parseValidateFormatDate = function(strict, inputFormat, outputFormat, value) {
          var moment  = $moment(value, inputFormat, strict),
              isEmpty = ctrl.$isEmpty(value);

          if (!isEmpty && !moment.isValid()) {
            ctrl.$setValidity('date', false);
            return undefined;
          } else {
            ctrl.$setValidity('date', true);
            return isEmpty ? value : moment.format(outputFormat);
          }
        };

        var dateParser = function(value) { return parseValidateFormatDate($moment.$strictView, viewFormat, modelFormat, value); };
        var dateFormatter = function(value) { return parseValidateFormatDate($moment.$strictModel, modelFormat, viewFormat, value); };
        // Parser needs to come after the rest of the parsers in this directive so they don't get a reformatted value
        ctrl.$formatters.push(dateFormatter);

        if (attr.format && (!attr.viewFormat || !attr.modelFormat)) {
          scope.$watch(attr.format, function formatWatchAction(value) {
            viewFormat  = value;
            modelFormat = value;
            setPlaceholder(value);
            setMinViewModelMoments();
            setMaxViewModelMoments();
            reparseViewValue();
          });
        }

        if (attr.viewFormat) {
          scope.$watch(attr.viewFormat, function viewFormatWatchAction(format) {
            format = format || $moment.$defaultViewFormat;
            if (format === viewFormat) return;
            viewFormat = format;
            setPlaceholder(format);
            setMinViewModelMoments();
            setMaxViewModelMoments();
            reformatModelValue();
          });
        }

        if (attr.modelFormat) {
          scope.$watch(attr.modelFormat, function modelFormatWatchAction(format) {
            format = format || $moment.$defaultModelFormat;
            if (format === modelFormat) return;
            modelFormat = format;
            setMinViewModelMoments();
            setMaxViewModelMoments();
            reparseViewValue();
          });
        }

        // Min/Max Validation
        //////////////////////

        if (attr.min) {
          scope.$watch(attr.min, function minWatchAction(minAttr) {
            if (angular.isArray(minAttr) && minAttr.length == 2)
              momentMin = $moment(minAttr[0], minAttr[1]);
            else if (minAttr && angular.isString(minAttr))
              // We're not using modelFormat as this value isn't directly related to this input
              momentMin = $moment(minAttr, $moment.$defaultModelFormat);
            else
              momentMin = null;
            setMinViewModelMoments();
            reparseViewValue();
          }, true);

          var minParseValidator = function(value) {
            var momentValue = $moment(value, viewFormat, $moment.$strictView);
            if (!ctrl.$isEmpty(value) && momentMinModel && momentValue.isValid() && momentValue.isBefore(momentMinView)) {
              ctrl.$setValidity('min', false);
              return undefined;
            } else {
              ctrl.$setValidity('min', true);
              return value;
            }
          };

          var minFormatValidator = function(value) {
            var momentValue = $moment(value, modelFormat, $moment.$strictModel);
            if (!ctrl.$isEmpty(value) && momentMinModel && momentValue.isValid() && momentValue.isBefore(momentMinModel)) {
              ctrl.$setValidity('min', false);
              return undefined;
            } else {
              ctrl.$setValidity('min', true);
              return value;
            }
          };

          ctrl.$parsers.push(minParseValidator);
          ctrl.$formatters.push(minFormatValidator);
        }

        if (attr.max) {
          scope.$watch(attr.max, function maxWatchAction(maxAttr) {
            if (angular.isArray(maxAttr) && maxAttr.length == 2)
              momentMax = $moment(maxAttr[0], maxAttr[1]);
            else if (maxAttr && angular.isString(maxAttr))
              momentMax = $moment(maxAttr, $moment.$defaultModelFormat);
            else
              momentMax = null;
            setMaxViewModelMoments();
            reparseViewValue();
          }, true);

          var maxParseValidator = function(value) {
            var momentValue = $moment(value, viewFormat, $moment.$strictView);
            if (!ctrl.$isEmpty(value) && momentMaxModel && momentValue.isValid() && momentValue.isAfter(momentMaxView)) {
              ctrl.$setValidity('max', false);
              return undefined;
            } else {
              ctrl.$setValidity('max', true);
              return value;
            }
          };

          var maxFormatValidator = function(value) {
            var momentValue = $moment(value, modelFormat, $moment.$strictModel);
            if (!ctrl.$isEmpty(value) && momentMaxModel && momentValue.isValid() && momentValue.isAfter(momentMaxModel)) {
              ctrl.$setValidity('max', false);
              return undefined;
            } else {
              ctrl.$setValidity('max', true);
              return value;
            }
          };

          ctrl.$parsers.push(maxParseValidator);
          ctrl.$formatters.push(maxFormatValidator);
        }

        ctrl.$parsers.push(dateParser);

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

          //                           Up, Down, Plus, Minus
          if (event.type == 'keydown' && !/38|40|107|109/.test(event.which)) return;
          event.preventDefault();

          var isEmpty    = ctrl.$isEmpty(ctrl.$viewValue),
              momentView = isEmpty ? $moment() : $moment(ctrl.$viewValue, viewFormat),
              wheelDelta, isIncrease, shiftedStepUnit, momentViewStepped, steppedViewValue;

          if (!momentView.isValid())
            return;

          if (event.type == 'keydown')
            isIncrease = /38|107/.test(event.which);
          else {
            wheelDelta = event.originalEvent ? event.originalEvent.wheelDelta : event.wheelDelta;
            isIncrease = wheelDelta / 120 > 0;
          }

          if (!!event.shiftKey)
            shiftedStepUnit = stepUnits[(indexOf(stepUnits, stepUnit.replace(/s$/, '')) + 1)] || stepUnit;
          else
            shiftedStepUnit = stepUnit;

          if (isEmpty && momentMin)
            // Always step an empty value to the min if specified
            momentViewStepped = momentMinView.clone();
          else if (isIncrease) {
            if (isEmpty && !momentMin)
              // Then use today's date clamped to max 
              momentViewStepped = momentView.max(momentMax ? momentMaxView : undefined);
            else if (momentMin && momentView.isBefore(momentMinView))
              momentViewStepped = momentMinView.clone();
            else if (momentMax && !momentView.isAfter(momentMaxView))
              // Then step value up, clamp to max
              momentViewStepped = momentView.add(shiftedStepUnit, stepQuantity).max(momentMaxView);
            else if (!momentMax)
              // If there's no max, increase; otherwise leave it exceeding max--we'll only bring it
              // back in bounds of the max when user decreases value. 
              // This mimic's browser vendor behavior with min/max stepping for input[type=number]
              momentViewStepped = momentView.add(shiftedStepUnit, stepQuantity);
          }
          // The opposite for decrease
          else {
            if (isEmpty && !momentMax)
              momentViewStepped = momentView.min(momentMin ? momentMinView : undefined);
            else if (momentMax && momentView.isAfter(momentMaxView))
              momentViewStepped = momentMaxView.clone();
            else if (momentMin && !momentView.isBefore(momentMinView))
              momentViewStepped = momentView.subtract(shiftedStepUnit, stepQuantity).min(momentMinView);
            else if (!momentMin)
              momentViewStepped = momentView.subtract(shiftedStepUnit, stepQuantity);
          }

          steppedViewValue = (momentViewStepped || momentView).format(viewFormat);

          scope.$apply(function() {
            element.val(steppedViewValue);
            ctrl.$setViewValue(steppedViewValue);
          });

        };

        element.on('mousewheel keydown', inputStepHandler);



      };
    }
  };
}]);