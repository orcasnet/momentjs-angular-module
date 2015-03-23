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
        // All the functionality of this directive requires ngModelCtrl.
        if (!ctrl)
          return;
        
        var // A Moment of the last value passed through the directive's validator. Allows
            // stepping function to not have to reparse ctrl.$viewValue and potentially fail
            // if another directive's formatter has changed the view value format.
            momentValue,
            // Formats may be overridden if attr.(view|model)Format or attr.format is set.
            viewFormat  = $moment.$defaultViewFormat,
            modelFormat = $moment.$defaultModelFormat,
            stepUnit, stepQuantity,
            // We track focus state to prevent stepping if elem is blurred.
            hasFocus = false,
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
          var ph = element.attr('placeholder');
          if( ph === null || ph === '' ){
            element.attr('placeholder', $moment.$parseFormat(format));
          }
        };

        var reparseOrReformatValue = function() {
          var hasModelValue = !ctrl.$isEmpty(ctrl.$modelValue),
              hasViewValue  = !ctrl.$isEmpty(ctrl.$viewValue);

          if (hasModelValue)
            reformatModelValue();
          else if (hasViewValue)
            reparseViewValue();
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

          moment      = $moment(value, inputFormat, strict);
          isValid     = moment.isValid();
          isEmpty     = ctrl.$isEmpty(value);
          momentValue = isEmpty ? $moment(null) : moment.clone();

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


        // Process format, viewFormat, modelFormat attrs
        /////////////////////////////////////////////////

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
              reparseOrReformatValue();
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
              reparseOrReformatValue();
            }
          };

          maxWatchAction(scope.$eval(attr.max));
          scope.$watch(attr.max, maxWatchAction, true);
        }


        // Stepping
        ////////////

        // TODO: Allow this to be config'ed
        stepUnit     = 'day';
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
          // TODO: Use gulp-remove-lines to strip this from build
          if (!event.type && eventData && eventData.type) {
            angular.extend(event, eventData);
            hasFocus = true;
          }

          if (element.attr('readonly'))
            return;

          //                               Up|Dn
          if (!hasFocus || (event.type == 'keydown' && !/38|40/.test(event.which))) return;
          event.preventDefault();

          var isViewEmpty = ctrl.$isEmpty(ctrl.$viewValue),
              momentView  = isViewEmpty ? $moment() : $moment(momentValue.format(viewFormat), viewFormat, true),
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

          if (isViewEmpty && moments.min.attr)
            // Always step an empty value to the min if specified
            momentViewStepped = moments.min.view.clone();
          else if (isIncrease) {
            if (isViewEmpty && !moments.min.attr)
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
            if (isViewEmpty && !moments.max.attr)
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

        element.on('focus', function(e) { hasFocus = true; });
        element.on('blur',  function(e) { hasFocus = false; });
      };
    }
  };
}]);

