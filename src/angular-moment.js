'use strict';

angular.module('angular-momentjs', [])

.provider('$moment', function $momentProvider() {
  var config = {
    defaultViewFormat: 'L',
    defaultModelFormat: moment.defaultFormat
  };

  this.defaultViewFormat = function(format) {
    if (angular.isString(format))
      config.defaultViewFormat = format;
    return this;
  };

  this.defaultModelFormat = function(format) {
    if (angular.isString(format))
      config.defaultModelFormat = format;
    return this;
  };

  this.$get = function() {
    try {
      Object.defineProperty(moment, 'defaultViewFormat', {
        value: config.defaultViewFormat
      });
      Object.defineProperty(moment, 'defaultModelFormat', {
        value: config.defaultModelFormat
      });
    }
    catch(err) { angular.extend(moment, config); }
    return moment;
  };

})

.directive('input', [function inputDirective() {
  var defaultFormat = 'L',
      stepUnits     = ['second', 'minute', 'hour', 'day', 'month', 'year'];

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
                  format      = attr.viewFormat || attr.format || defaultFormat,
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

        if (angular.isDefined(attr.min)) {
          var minValidator = function(value) {
            var valueFormat = attr.viewFormat || attr.format,
                valueMoment = moment(value, valueFormat),
                minMomemt   = moment(attr.min),
                // For cases where valueFormat omits data, such as day, that min contains, we need
                // to ensure the value is as specific or non-specific as the valueFormat
                valueFormattedMinMoment = moment(minMomemt.format(valueFormat), valueFormat);

            // debugger;
            if (!ctrl.$isEmpty(value) && valueFormattedMinMoment.isValid() && valueMoment.isBefore(valueFormattedMinMoment)) {
              ctrl.$setValidity('min', false);
              return undefined;
            } else {
              ctrl.$setValidity('min', true);
              return value;
            }
          };

          ctrl.$parsers.push(minValidator);
          ctrl.$formatters.push(minValidator);
        }

        if (angular.isDefined(attr.max)) {
          var maxValidator = function(value) {
            var valueFormat = attr.viewFormat || attr.format,
                valueMoment = moment(value, valueFormat),
                maxMomemt   = moment(attr.max),
                valueFormattedMaxMoment = moment(maxMomemt.format(valueFormat), valueFormat);

            if (!ctrl.$isEmpty(value) && valueFormattedMaxMoment.isValid() && valueMoment.isAfter(valueFormattedMaxMoment)) {
              ctrl.$setValidity('max', false);
              return undefined;
            } else {
              ctrl.$setValidity('max', true);
              return value;
            }
          };

          ctrl.$parsers.push(maxValidator);
          ctrl.$formatters.push(maxValidator);
        }

        if (angular.isDefined(attr.viewFormat)) {
          // From view to model
          var modelFormatterValidator = function(value) {
            var valueMoment = moment(value, attr.viewFormat, true);
            if (ctrl.$isEmpty(value) || valueMoment.isValid()) {
              ctrl.$setValidity('date', true);
              return ctrl.$isEmpty(value) ? value : valueMoment.format(attr.modelFormat);
            } else {
              ctrl.$setValidity('date', false);
              return undefined;
            }
          };

          // From model to view
          var viewFormatterValidator = function(value) {
            var valueMoment = moment(value, attr.modelFormat);
            if (ctrl.$isEmpty(value) || valueMoment.isValid()) {
              ctrl.$setValidity('date', true);
              return ctrl.$isEmpty(value) ? value : valueMoment.format(attr.viewFormat);
            } else {
              ctrl.$setValidity('date', false);
              return undefined;
            }
          };

          ctrl.$parsers.push(modelFormatterValidator);
          ctrl.$formatters.push(viewFormatterValidator);
        }
        else if (attr.format) {
          var formatterValidator = function(value) {
            if (!ctrl.$isEmpty(value) || moment(value, attr.viewFormat).isValid()) {
              ctrl.$setValidity('date', true);
              return value;
            } else {
              ctrl.$setValidity('date', false);
              return undefined;
            }
          };
          
          ctrl.$parsers.push(formatterValidator);
          ctrl.$formatters.push(formatterValidator);
        }
        else {
          var dateValidator = function(value) {
            if (ctrl.$isEmpty(value) || moment(value).isValid()) {
              ctrl.$setValidity('date', true);
              return value;
            } else {
              ctrl.$setValidity('date', false);
              return undefined;
            }
          };

          ctrl.$parsers.push(dateValidator);
          ctrl.$formatters.push(dateValidator);
        }

      };
    }
  };
}]);