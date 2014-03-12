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

  offsetTop    = boxElem.top    + adjustedScrollTop,
  offsetLeft   = boxElem.left   + adjustedScrollLeft,
  offsetBottom = boxElem.bottom + adjustedScrollTop,
  offsetRight  = boxElem.right  + adjustedScrollLeft;

  return {
    top:    offsetTop,
    left:   offsetLeft,
    bottom: offsetBottom,
    right:  offsetRight
  };
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
    $$pickerTemplates: {},
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

  this.definePickerTemplate = function(template) {
    if (angular.isObject(template) && template.name && template.url)
      config.$$pickerTemplates[template.name] = template.url;
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
      Object.defineProperty(moment, '$$pickerTemplates', {
        value: angular.copy(config.$$pickerTemplates)
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
          element.attr('placeholder', $moment.$parseFormat(format));
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
          // TODO: Use gulp-remove-lines to strip this from build
          if (!event.type && eventData && eventData.type) {
            angular.extend(event, eventData);
            hasFocus = true;
          }

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


/*
  Angular Moment.js Moment Picker
*/

'use strict';

angular.module('moment')

.directive('momentPicker', ['$moment', '$log', 'indexOf', function inputDirective($moment, $log, indexOf) {
  var weekStartDay = $moment().startOf('week').format('d'),
      weekEndDay   = $moment().endOf('week')  .format('d');

  return {
    restrict: 'A',
    templateUrl: function(tElement, tAttrs) {
      var templateName = tAttrs.template || 'default',
          templateUrl  = $moment.$$pickerTemplates[templateName];
      if (templateUrl)
        return templateUrl;
      // Ya dun' goofed.
      $log.error('Error: [momentDatepicker] Picker template for \''+ templateName +'\' is undefined. Templates must be defined with \'$momentProvider.definePickerTemplate\'.');
    },
    scope: {
      dateModel:   '=momentPicker',
      format:      '=?',
      modelFormat: '=?',
      min:         '=?',
      max:         '=?',
      ngShow:      '=?'
    },
    link: function(scope, element, attr) {
      var format  = $moment.$defaultModelFormat,
          moments = {};

      // Initialize
      //////////////
      scope.hasNgShowAttr = !!attr.ngShow;

      if (!attr.ngShow)
        scope.ngShow = true;

      scope.displayMoment = $moment();
      scope.weekMoments   = [];

      var i = 7;
      while (i--)
        scope.weekMoments.unshift($moment().startOf('week').add(i, 'day'));

      // Process Format or modelFormat Attr
      //////////////////////////////////////

      var setFormat = function(newFormat) {
        if (angular.equals(format, newFormat))
          return;

        format = newFormat || $moment.$defaultModelFormat;
        parseDateModel(scope.dateModel);
      };

      if (attr.format && !attr.modelFormat) {
        format = scope.format || $moment.$defaultModelFormat;
        scope.$watch('format', setFormat);
      }
      else if (attr.modelFormat) {
        format = scope.modelFormat || $moment.$defaultModelFormat;
        scope.$watch('modelFormat', setFormat);
      }

      // Process Min/Max Attrs
      /////////////////////////

      var setMomentFromAttr = function(attrName, attrValue) {
        var moment;

        // Parse
        if (angular.isArray(attrValue) && attrValue.length == 2)
          moment = $moment(attrValue[0], attrValue[1], true);
        else if (attrValue && angular.isString(attrValue)) {
          if (attrValue == 'today')
            moment = $moment();
          else
            moment = $moment(attrValue, $moment.$defaultModelFormat, $moment.$strictModel);
        }
        else
          moment = $moment(null);

        // Set
        moments[attrName] = moment.isValid() ? moment : null;
      };

      if (attr.min) {
        scope.$watch('min', function(minValue) {
          setMomentFromAttr('min', minValue);
        }, true);
      }

      if (attr.max) {
        scope.$watch('max', function(maxValue) {
          setMomentFromAttr('max', maxValue);
        }, true);
      }


      // View helpers
      ////////////////

      scope.getClasses = function(moment, classes) {
        var isWeekend   = /0|6/.test(moment.isoWeekday()),
            isWeekday   = !isWeekend,
            classObject = {
              weekend: isWeekend,
              weekday: isWeekday
            };

        // Convenience classes: jan fri
        classObject[ moment.format('MMM ddd').toLowerCase() ] = true;

        if (!classes)
          return;

        angular.forEach(classes.split(' '), function(className) {
          switch(className) {
            case 'today':        classObject[className] = moment.isSame(scope.today, 'day'); break;
            case 'this-week':    classObject[className] = moment.isSame(scope.today, 'week'); break;
            case 'this-month':   classObject[className] = moment.isSame(scope.today, 'month'); break;
            case 'this-year':    classObject[className] = moment.isSame(scope.today, 'year'); break;

            case 'picked-day':   classObject[className] = moment.isSame(scope.dateMoment, 'day'); break;
            case 'picked-week':  classObject[className] = moment.isSame(scope.dateMoment, 'week'); break;
            case 'picked-month': classObject[className] = moment.isSame(scope.dateMoment, 'month'); break;
            case 'picked-year':  classObject[className] = moment.isSame(scope.dateMoment, 'year'); break;

            // We'll only check this if a min or max is set
            case 'invalid':
              if (!moments.min && !moments.max)
                break;
              if (moments.min && moment.isBefore(moments.min, 'day'))
                classObject.invalid = true;
              else if (moments.max && moment.isBefore(moments.max, 'day'))
                classObject.invalid = true;
              break;
          }
        });

        return classObject;
      };

      scope.setDateTo = function(moment) {
        if (moments.min && moment.isBefore(moments.min))
          return;
        if (moments.max && moment.isAfter(moments.max))
          return;

        // Clamp it to the min/max to keep it valid
        if (moments.min)
          moment = moment.min(moments.min);
        if (moments.max)
          moment = moment.max(moments.max);

        scope.dateModel = moment.format(format);
      };


      // Core things
      ///////////////

      var parseDateModel = function(dateModel) {
        var moment = $moment(dateModel, format, $moment.$strictModel);

        if (dateModel && moment.isValid()) {
          scope.dateMoment    = moment.clone();
          scope.displayMoment = moment.clone();
        }
        else {
          scope.dateMoment    = $moment('');
          scope.displayMoment = $moment();
        } 
      };

      scope.$watch('dateModel', parseDateModel);

      scope.$watch(function() { return scope.displayMoment.format('M/YYYY'); }, function(moment, oldMoment) {
        rebuild();
      });

      function rebuild() {
        scope.today = $moment();
        scope.lastMonthMoments = [];
        scope.thisMonthMoments = [];
        scope.nextMonthMoments = [];
        scope.monthsThisYearMoments = [];

        var lastMonthMoment = scope.displayMoment.clone().startOf('month'),
            thisMonthMoment = lastMonthMoment.clone(),
            nextMonthMoment = scope.displayMoment.clone().endOf('month'),
            thisMonth       = scope.displayMoment.format('M'),
            thisYear        = scope.displayMoment.format('YYYY');

        while (lastMonthMoment.format('d') !== weekStartDay)
          scope.lastMonthMoments.unshift(lastMonthMoment.subtract(1, 'day').clone());

        while (thisMonthMoment.format('M') === thisMonth) {
          scope.thisMonthMoments.push(thisMonthMoment.clone());
          thisMonthMoment.add(1, 'day');
        }

        while (scope.lastMonthMoments.length + scope.thisMonthMoments.length + scope.nextMonthMoments.length < 42)
          scope.nextMonthMoments.push(nextMonthMoment.add(1, 'day').clone());

        while (scope.monthsThisYearMoments.length < 12)
          scope.monthsThisYearMoments.push(moment({ year:thisYear, month:scope.monthsThisYearMoments.length }));

      }

    }
  };

}])


// Picker extends moment input directive with positioned momentPicker

.directive('picker', ['$moment', '$compile', 'getOffset', function inputDirective($moment, $compile, getOffset) {
  var defaultStyleAttr = 'style="position:absolute" class="input-picker"',
      copiedAttrs      = 'format modelFormat min max'.split(' ');

  var toSpinalCase = function(string) {
    return string.replace(/[a-z][A-Z]/g, function(w) { return w[0] +'-'+ w[1]; }).toLowerCase();
  };

  return {
    restrict: 'A',
    require: '?ngModel',
    link: function(scope, element, attr, ctrl) {
      if (!ctrl || attr.type !== 'moment')
        return;

      var pickerAttrs = [ defaultStyleAttr ];

      // Copy relevent attrs from input to picker
      if (attr.picker)
        pickerAttrs.push('template='+ attr.picker);

      angular.forEach(copiedAttrs, function(name) {
        if (attr[name])
          pickerAttrs.push(toSpinalCase(name) +'="'+ attr[name] +'"');
      });

      // 'ngShow' state tracking
      if (!scope.$momentPicker)
        scope.$momentPicker = {};
      scope.$momentPicker[attr.ngModel] = false;
      pickerAttrs.push('ng-show="$momentPicker[\''+ attr.ngModel +'\']"');

      // Compile/inject/bind events to picker
      var pickerElement = $compile('<div moment-picker="'+ attr.ngModel +'" '+ pickerAttrs.join(' ') +'></div>')(scope);
      angular.element(document.body).append(pickerElement);

      pickerElement.on('mousedown', function(event) {
        event.preventDefault();
      });

      // Input event binding
      element.on('focus click', function(event) {
        var offset = getOffset(element[0]);
  
        pickerElement.css({
          left: offset.left + 'px',
          top: offset.bottom + 'px'
        });

        scope.$apply(function(scope) {
          scope.$momentPicker[attr.ngModel] = true;
        });
      });

      element.on('blur keydown', function(event) {
        if (event.type == 'keydown' && event.which !== 27)
          return;
        scope.$apply(function(scope) {
          scope.$momentPicker[attr.ngModel] = false;
        });
      });

      // Destruction cleanup
      scope.$on('$destroy', function() {
        pickerElement.off().remove();
      });

    }
  };
}]);

