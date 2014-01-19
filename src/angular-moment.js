'use strict';

angular.module('angular-momentjs', [])

.provider('$moment', function $momentProvider() {
  // Strict parsing has trouble in Moment.js v2.3—2.5 with short tokens
  // E.g. 1-31-2000, M-D-YYYY is invalid.
  var config = {
    $strict: true,
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

  this.strict = function(bool) {
    if (typeof bool === 'boolean')
      config.$strict = bool;
    return this;
  };

  this.$get = function() {
    if (angular.isDefined(moment.$strict))
      return moment;
    try {
      Object.defineProperty(moment, '$strict', {
        value: config.$strict
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

.directive('input', ['$moment', '$timeout', function inputDirective($moment, $timeout) {
  var stepUnits = ['second', 'minute', 'hour', 'day', 'month', 'year'];

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
            momentMax, momentMaxView, momentMaxModel;

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
          $timeout(function() {
            scope.$apply(function() { scope[attr.ngModel] = modelValue + ' '; });
            scope.$apply(function() { scope[attr.ngModel] = modelValue; });
          });
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

        var parseValidateFormatDate = function(inputFormat, outputFormat, value) {
          var moment  = $moment(value, inputFormat, $moment.$strict),
              isEmpty = ctrl.$isEmpty(value);
          if (!isEmpty && !moment.isValid()) {
            ctrl.$setValidity('date', false);
            return undefined;
          } else {
            ctrl.$setValidity('date', true);
            return isEmpty ? value : moment.format(outputFormat);
          }
        };

        var dateParser = function(value) { return parseValidateFormatDate(viewFormat, modelFormat, value); };
        var dateFormatter = function(value) { return parseValidateFormatDate(modelFormat, viewFormat, value); };
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
          scope.$watch(attr.viewFormat, function viewFormatWatchAction(value, oldValue) {
            value = value || $moment.$defaultViewFormat;
            if (value === oldValue) return;
            viewFormat = value;
            setPlaceholder(value);
            setMinViewModelMoments();
            setMaxViewModelMoments();
            reformatModelValue();
          });
        }

        if (attr.modelFormat) {
          scope.$watch(attr.modelFormat, function modelFormatWatchAction(value, oldValue) {
            value = value || $moment.$defaultModelFormat;
            if (value === oldValue) return;
            modelFormat = value;
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
            var momentValue = $moment(value, viewFormat, $moment.$strict);
            if (!ctrl.$isEmpty(value) && momentMinModel && momentValue.isValid() && momentValue.isBefore(momentMinView)) {
              ctrl.$setValidity('min', false);
              return undefined;
            } else {
              ctrl.$setValidity('min', true);
              return value;
            }
          };

          var minFormatValidator = function(value) {
            var momentValue = $moment(value, modelFormat, $moment.$strict);
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
            var momentValue = $moment(value, viewFormat, $moment.$strict);
            if (!ctrl.$isEmpty(value) && momentMaxModel && momentValue.isValid() && momentValue.isAfter(momentMaxView)) {
              ctrl.$setValidity('max', false);
              return undefined;
            } else {
              ctrl.$setValidity('max', true);
              return value;
            }
          };

          var maxFormatValidator = function(value) {
            var momentValue = $moment(value, modelFormat, $moment.$strict);
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

        var stepUnit         = 'days',
            stepQuantity     = 1,
            inputStepHandler = function(event) {
              if (event.type == 'keydown' && ( event.which !== 38 && event.which !== 40 ))
                return;

              event.preventDefault();

              var isEmpty     = ctrl.$isEmpty(ctrl.$viewValue),
                  valueMoment = isEmpty ? moment() : moment(ctrl.$viewValue, (attr.viewFormat || attr.format)),
                  isIncrease  = event.which === 38 || (event.wheelDelta || event.originalEvent.wheelDelta) /120 > 0,
                  isShifted   = event.shiftKey,
                  format      = viewFormat,
                  min         = moment(attr.min || null).isValid() ? moment(moment(attr.min).format(format), format) : undefined,
                  max         = moment(attr.max || null).isValid() ? moment(moment(attr.max).format(format), format) : undefined,
                  shiftedStepUnit, steppedValueMoment, steppedValue;

              if (attr.step) {
                var match = attr.step.match(/(\d+)\s(\w+)/);
                if (match) {
                  stepUnit      = match[2];
                  stepQuantity  = parseInt(match[1], 10);
                } else {
                  stepUnit     = 'days';
                  stepQuantity = 1;
                }
              }

              if (!valueMoment.isValid())
                return;

              if (isShifted)
                shiftedStepUnit = stepUnits[(_.indexOf(stepUnits, stepUnit.replace(/s$/, '')) + 1)] || stepUnit;
              else
                shiftedStepUnit = stepUnit;

              if (isIncrease) {
                if (isEmpty && !min)
                  // Then use today's date clamped to max 
                  steppedValueMoment = valueMoment.max(max ? max : undefined);
                else if ((isEmpty && min) || (min && valueMoment.isBefore(min)))
                  steppedValueMoment = min;
                else if (max && !valueMoment.isAfter(max))
                  // Then step value, clamp to max
                  steppedValueMoment = valueMoment.add(shiftedStepUnit, stepQuantity).max(max);
                else if (!max)
                  // If there's no max, increase; otherwise leave it alone
                  // This mimic's browser vendor behavior with min/max stepping for input[type=number]
                  steppedValueMoment = valueMoment.add(shiftedStepUnit, stepQuantity);
              }
              // The opposite for decrease
              else {
                if (isEmpty && !max)
                  steppedValueMoment = valueMoment.min(min ? min : undefined);
                else if ((isEmpty && max) || (max && valueMoment.isAfter(max)))
                  steppedValueMoment = max;
                else if (min && !valueMoment.isBefore(min))
                  steppedValueMoment = valueMoment.subtract(shiftedStepUnit, stepQuantity).min(min);
                else if (!min)
                  steppedValueMoment = valueMoment.subtract(shiftedStepUnit, stepQuantity);
              }

              steppedValue = (steppedValueMoment || valueMoment).format(format);

              scope.$apply(function() {
                ctrl.$setViewValue(steppedValue);
              });

              ctrl.$render(function() {
                ctrl.$setViewValue(steppedValue);
              });
        };

        element.on('mousewheel keydown', inputStepHandler);



      };
    }
  };
}]);