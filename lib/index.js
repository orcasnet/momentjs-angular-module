/**
 * momentjs-angular-module v0.4.1
 * Shaun Grady <grady@shaungrady.com>, 2017
 * https://github.com/orcasnet.com/angular-momentjs
 * Module Format: CommonJS
 * License: MIT
 */

exports["$moment"] =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.l = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };

/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};

/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};

/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 9);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports) {

module.exports = require("angular");

/***/ }),
/* 1 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_angular__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_angular___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_angular__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_indexof__ = __webpack_require__(7);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_indexof___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1_indexof__);



/* harmony default export */ __webpack_exports__["a"] = ['$moment', '$timeout', function inputDirective ($moment, $timeout) {
  // Maybe expose a setting for localization someday...
  var stepUnits = ['millisecond', 'second', 'minute', 'hour', 'day', 'month', 'year']
  var strictView = $moment.$strictView
  var strictModel = $moment.$strictModel

  return {
    priority: 10,
    restrict: 'E',
    require: '?ngModel',
    compile: function inputCompile (tElement, tAttr) {
      // Support both input[type=date] and input[type=moment] so one can use type=moment if
      // browser vendor type=date functionality is undesired (*ehem* Chrome).
      if (tAttr.type !== 'date' && tAttr.type !== 'moment') { return __WEBPACK_IMPORTED_MODULE_0_angular___default.a.noop }
      return function inputPostLink (scope, element, attr, ctrl) {
        // All the functionality of this directive requires ngModelCtrl.
        if (!ctrl) return

        // A Moment of the last value passed through the directive's validator. Allows
        // stepping function to not have to reparse ctrl.$viewValue and potentially fail
        // if another directive's formatter has changed the view value format.
        var momentValue
            // Formats may be overridden if attr.(view|model)Format or attr.format is set.
        var viewFormat = $moment.$defaultViewFormat
        var modelFormat = $moment.$defaultModelFormat
        var stepUnit, stepQuantity
            // We track focus state to prevent stepping if elem is blurred.
        var hasFocus = false
            // Min/max must be reparsed using view/model formats to account for differences
            // in date specificity. E.g., if min is '01-30-2000' and viewFormat is 'MM-YYYY'
            // and the model value is '01-2000'.
        var moments = {
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
        }

        var setPlaceholder = __WEBPACK_IMPORTED_MODULE_0_angular___default.a.noop

        // Utility Functions
        // ///////////////////

        if (element.attr('placeholder') == null) {
          setPlaceholder = function (format) {
            element.attr('placeholder', $moment.$parseFormat(format))
          }
        }

        var reparseOrReformatValue = function () {
          var hasModelValue = !ctrl.$isEmpty(ctrl.$modelValue)
          var hasViewValue = !ctrl.$isEmpty(ctrl.$viewValue)

          if (hasModelValue) { reformatModelValue() } else if (hasViewValue) { reparseViewValue() }
        }

        var reparseViewValue = function () {
          if (!ctrl.$isEmpty(ctrl.$viewValue)) {
            var val = ctrl.$viewValue
            ctrl.$setViewValue(val + ' ')
            ctrl.$setViewValue(val)
          }
        }
        var reformatModelValue = function () {
          // Is there a better way to resend the model value through the formatter pipeline?
          var modelValue = ctrl.$modelValue
          if (!ctrl.$isEmpty(modelValue)) {
            $timeout(function () {
              scope.$apply(function () { scope[attr.ngModel] = modelValue + ' ' })
              scope.$apply(function () { scope[attr.ngModel] = modelValue })
            }, 0, false)
          }
        }

        var setViewModelMomentsForAttr = function (attr) {
          // attr is either 'min' or 'max'
          if (moments[attr].attr && moments[attr].attr.isValid()) {
            moments[attr].view = $moment(moments[attr].attr.format(viewFormat), viewFormat)
            moments[attr].model = $moment(moments[attr].attr.format(modelFormat), modelFormat)
          } else { moments[attr].attr = moments[attr].view = moments[attr].model = null }
        }

        // Date Validation and Formatting
        // ////////////////////////////////

        var parseValidateAndFormatDate = function parseValidateAndFormatDate (origin, value) {
          var moment, isValid, isEmpty, inputFormat, outputFormat, strict

          if (origin === 'view') {
            inputFormat = viewFormat
            outputFormat = modelFormat
            strict = strictView
          } else {
            inputFormat = modelFormat
            outputFormat = viewFormat
            strict = strictModel
          }

          moment = $moment(value, inputFormat, strict)
          isValid = moment.isValid()
          isEmpty = ctrl.$isEmpty(value)
          momentValue = isEmpty ? $moment(null) : moment.clone()

          // Date validation
          if (!isEmpty && !isValid) {
            ctrl.$setValidity('date', false)
            if (attr.min) ctrl.$setValidity('min', true)
            if (attr.max) ctrl.$setValidity('max', true)
            return undefined
          } else { ctrl.$setValidity('date', true) }

          // Min validation
          if (attr.min) {
            if (!isEmpty && isValid && moments.min.attr && moment.isBefore(moments.min[origin])) { ctrl.$setValidity('min', false) } else { ctrl.$setValidity('min', true) }
          }

          // Max validation
          if (attr.max) {
            if (!isEmpty && isValid && moments.max.attr && moment.isAfter(moments.max[origin])) { ctrl.$setValidity('max', false) } else { ctrl.$setValidity('max', true) }
          }

          // Output and formatting
          if (ctrl.$error.min || ctrl.$error.max) { return undefined } else { return isEmpty ? value : moment.format(outputFormat) }
        }

        ctrl.$parsers.push(__WEBPACK_IMPORTED_MODULE_0_angular___default.a.bind(undefined, parseValidateAndFormatDate, 'view'))
        ctrl.$formatters.push(__WEBPACK_IMPORTED_MODULE_0_angular___default.a.bind(undefined, parseValidateAndFormatDate, 'model'))

        // Process format, viewFormat, modelFormat attrs
        // ///////////////////////////////////////////////

        if (attr.format && (!attr.viewFormat || !attr.modelFormat)) {
          viewFormat = scope.$eval(attr.format) || viewFormat
          modelFormat = scope.$eval(attr.format) || modelFormat

          scope.$watch(attr.format, function formatWatchAction (value) {
            viewFormat = value
            modelFormat = value
            setPlaceholder(value)
            setViewModelMomentsForAttr('min')
            setViewModelMomentsForAttr('max')
            reparseViewValue()
          })
        }

        if (attr.viewFormat) {
          viewFormat = scope.$eval(attr.viewFormat) || viewFormat

          scope.$watch(attr.viewFormat, function viewFormatWatchAction (format) {
            format = format || $moment.$defaultViewFormat
            if (format === viewFormat) return
            viewFormat = format
            setPlaceholder(format)
            setViewModelMomentsForAttr('min')
            setViewModelMomentsForAttr('max')
            reformatModelValue()
          })
        }

        if (attr.modelFormat) {
          modelFormat = scope.$eval(attr.modelFormat) || modelFormat

          scope.$watch(attr.modelFormat, function modelFormatWatchAction (format) {
            format = format || $moment.$defaultModelFormat
            if (format === modelFormat) return
            modelFormat = format
            setViewModelMomentsForAttr('min')
            setViewModelMomentsForAttr('max')
            reparseViewValue()
          })
        }

        setPlaceholder(viewFormat)

        // Min/Max Validation
        // ////////////////////

        var minWatchAction = function minWatchAction (minAttr) {
          var moment
          if (__WEBPACK_IMPORTED_MODULE_0_angular___default.a.isArray(minAttr) && minAttr.length === 2) { moment = $moment(minAttr[0], minAttr[1]) } else if (minAttr && __WEBPACK_IMPORTED_MODULE_0_angular___default.a.isString(minAttr)) {
            if (minAttr === 'today') { moment = $moment() } else { moment = $moment(minAttr, $moment.$defaultModelFormat) }
          } else { moment = null }
          // Has the min changed?
          if (!moment ^ !moments.min.attr || (moment && moments.min.attr && moment.format('X') !== moments.min.attr.format('X'))) {
            moments.min.attr = moment
            setViewModelMomentsForAttr('min')
            reparseOrReformatValue()
          }
        }

        minWatchAction(scope.$eval(attr.min))
        scope.$watch(function () {
          return scope.$eval(attr.min)
        }, minWatchAction, true)

        var maxWatchAction = function maxWatchAction (maxAttr) {
          var moment
          if (__WEBPACK_IMPORTED_MODULE_0_angular___default.a.isArray(maxAttr) && maxAttr.length === 2) { moment = $moment(maxAttr[0], maxAttr[1]) } else if (maxAttr && __WEBPACK_IMPORTED_MODULE_0_angular___default.a.isString(maxAttr)) {
            if (maxAttr === 'today') { moment = $moment() } else { moment = $moment(maxAttr, $moment.$defaultModelFormat) }
          } else { moment = null }

          if (!moment ^ !moments.max.attr || (moment && moments.max.attr && moment.format('X') !== moments.max.attr.format('X'))) {
            moments.max.attr = moment
            setViewModelMomentsForAttr('max')
            reparseOrReformatValue()
          }
        }

        maxWatchAction(scope.$eval(attr.max))
        scope.$watch(function () {
          return scope.$eval(attr.max)
        }, maxWatchAction, true)

        // Stepping
        // //////////

        // TODO: Allow this to be config'ed
        stepUnit = 'day'
        stepQuantity = 1

        if (attr.step) {
          scope.$watch(attr.step, function stepWatchAction (step) {
            if (!step || !__WEBPACK_IMPORTED_MODULE_0_angular___default.a.isString(step)) { return }

            var match = step.match(/(\d+)\s(\w+)/)
            if (match) {
              stepUnit = match[2]
              stepQuantity = parseInt(match[1], 10)
            } else {
              stepUnit = 'day'
              stepQuantity = 1
            }
          })
        }

        var inputStepHandler = function (event, eventData) {
          // Allow for passing custom event object in tests (so Kosher)
          if (eventData && (eventData.type || eventData.which)) {
            __WEBPACK_IMPORTED_MODULE_0_angular___default.a.extend(event, eventData)
            hasFocus = true
          }

          if (element.attr('readonly')) { return }

          //                               Up|Dn
          if (!hasFocus || (event.type === 'keydown' && !/38|40/.test(event.which))) return
          event.preventDefault()

          var isViewEmpty = ctrl.$isEmpty(ctrl.$viewValue)
          var momentView = isViewEmpty ? $moment() : $moment(momentValue.format(viewFormat), viewFormat, true)
          var wheelDelta, isIncrease, shiftedStepUnit, momentViewStepped, steppedViewValue

          if (!momentView.isValid()) { return }

          if (event.type === 'keydown') { isIncrease = /38/.test(event.which) } else {
            wheelDelta = event.originalEvent ? event.originalEvent.wheelDelta : event.wheelDelta
            isIncrease = wheelDelta / 120 > 0
          }

          if (event.shiftKey) {
            shiftedStepUnit = stepUnits[(__WEBPACK_IMPORTED_MODULE_1_indexof___default()(stepUnits, stepUnit.replace(/s$/, '')) + 1)] || stepUnit
          } else shiftedStepUnit = stepUnit

          if (isViewEmpty && moments.min.attr) {
            // Always step an empty value to the min if specified
            momentViewStepped = moments.min.view.clone()
          } else if (isIncrease) {
            if (isViewEmpty && !moments.min.attr) {
              // Then use today's date clamped to max
              momentViewStepped = momentView.max(moments.max.attr ? moments.max.view : undefined)
            } else if (moments.min.attr && momentView.isBefore(moments.min.view)) {
              momentViewStepped = moments.min.view.clone()
            } else if (moments.max.attr && !momentView.isAfter(moments.max.view)) {
              // Then step value up, clamp to max
              momentViewStepped = momentView.add(shiftedStepUnit, stepQuantity).max(moments.max.view)
            } else if (!moments.max.attr) {
              // If there's no max, increase; otherwise leave it exceeding max--we'll only bring it
              // back in bounds of the max when user decreases value.
              // This mimic's browser vendor behavior with min/max stepping for input[type=number]
              momentViewStepped = momentView.add(shiftedStepUnit, stepQuantity)
            }
          } else {
            // The opposite for decrease
            if (isViewEmpty && !moments.max.attr) {
              momentViewStepped = momentView.min(moments.min.attr ? moments.min.view : undefined)
            } else if (moments.max.attr && momentView.isAfter(moments.max.view)) {
              momentViewStepped = moments.max.view.clone()
            } else if (moments.min.attr && !momentView.isBefore(moments.min.view)) {
              momentViewStepped = momentView.subtract(shiftedStepUnit, stepQuantity).min(moments.min.view)
            } else if (!moments.min.attr) {
              momentViewStepped = momentView.subtract(shiftedStepUnit, stepQuantity)
            }
          }

          steppedViewValue = (momentViewStepped || momentView).format(viewFormat)

          scope.$apply(function () {
            ctrl.$setViewValue(steppedViewValue)
            ctrl.$render()
          })
        }

        element.on('mousewheel keydown', inputStepHandler)

        element.on('focus', function (e) { hasFocus = true })
        element.on('blur', function (e) { hasFocus = false })
      }
    }
  }
}];


/***/ }),
/* 2 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_angular__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_angular___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_angular__);


/* harmony default export */ __webpack_exports__["a"] = ['$moment', '$log', function inputDirective ($moment, $log) {
  var weekStartDay = $moment().startOf('week').format('d')
  // var weekEndDay = $moment().endOf('week').format('d')
  var getTemplateDefinition = function (templateName) {
    return $moment.$$pickerTemplates[templateName || 'default']
  }

  return {
    restrict: 'A',
    templateUrl: function (tElement, tAttrs) {
      var template = getTemplateDefinition(tAttrs.template)
      if (template) { return template.url }
      // Ya dun' goofed.
      $log.error('Error: [momentDatepicker] Picker template \'' + tAttrs.template + '\' is undefined. Templates must be defined with \'$momentProvider.definePickerTemplate\'.')
    },
    scope: {
      dateModel: '=momentPicker',
      format: '=?',
      modelFormat: '=?',
      min: '=?',
      max: '=?',
      ngShow: '=?'
    },
    controller: ['$scope', '$element', '$attrs', '$parse', '$animate', '$moment',
      function ($scope, $element, $attr, $parse, $animate, $moment) {
        var self = this

        self.template = getTemplateDefinition($attr.template)
        self.format = $moment.$defaultModelFormat

        self.pickedMoment = Number.NaN
        self.maxMoment = Number.NaN
        self.minMoment = Number.NaN

        self.visible = true
        self.hidden = false

        function init () {
          $scope.today = $moment()
          $scope.lastMonthMoments = []
          $scope.thisMonthMoments = []
          $scope.nextMonthMoments = []
          $scope.monthsThisYearMoments = []

          self.setDisplayMoment($moment())
          rebuildScopeMoments()

          $scope.weekMoments = []
          var i = 7
          while (i--) { $scope.weekMoments.unshift($moment().startOf('week').add(i, 'day')) }
        }

        // Ctrl Methods
        // //////////////

        self.setVisibility = function (isVisible) {
          self.hidden = !isVisible
          self.visible = !!isVisible
          $animate[!isVisible ? 'addClass' : 'removeClass']($element, 'ng-hide')
        }

        self.setPickedMoment = function (input, format, lang, strict) {
          var moment = $moment.apply(null, arguments)
          var isValid = input && moment.isValid()

          if (!isValid) {
            self.pickedMoment = null
            $scope.pickedMoment = null
            return
          }

          if (self.minMoment && moment.isBefore(self.minMoment, self.template.unit)) { return }
          if (self.maxMoment && moment.isAfter(self.maxMoment, self.template.unit)) { return }

          // Clamp it to the min/max to keep it valid
          if (self.minMoment) { moment = moment.min(self.minMoment) }
          if (self.maxMoment) { moment = moment.max(self.maxMoment) }

          if (moment.isSame(self.pickedMoment)) { return }

          self.pickedMoment = moment.clone()
          $scope.pickedMoment = moment.clone()
          $scope.dateModel = moment.format(self.format)

          self.setDisplayMoment(moment)
        }

        self.setDisplayMoment = function (input, format, lang, strict) {
          var moment = $moment.apply(null, arguments)
          var isValid = input && moment.isValid()
          var fallbackMoment = self.pickedMoment ? self.pickedMoment : $moment()

          self.displayMoment = isValid ? moment.clone() : fallbackMoment.clone()
          $scope.displayMoment = isValid ? moment.clone() : fallbackMoment.clone()

          rebuildScopeMoments()
        }

        self.setMinMoment = function (input, format, lang, strict) {
          var moment = $moment.apply(null, arguments)
          var isValid = input && moment.isValid()

          self.minMoment = isValid ? moment.clone() : null
        }

        self.setMaxMoment = function (input, format, lang, strict) {
          var moment = $moment.apply(null, arguments)
          var isValid = input && moment.isValid()

          self.maxMoment = isValid ? moment.clone() : null
        }

        self.setFormat = function (format) {
          if (__WEBPACK_IMPORTED_MODULE_0_angular___default.a.equals(self.format, format)) { return }

          self.format = format || $moment.$defaultModelFormat
          self.setPickedMoment($scope.dateModel, self.format, $moment.$strictModel)
        }

        // Watchers
        // /////////

        $scope.$watch('dateModel', function (modelValue) {
          self.setPickedMoment(modelValue, self.format, $moment.$strictModel)
        })

        // Format or modelFormat
        if ($attr.format && !$attr.modelFormat) {
          self.format = $scope.format || $moment.$defaultModelFormat
          $scope.$watch('format', self.setFormat)
        } else if ($attr.modelFormat) {
          self.format = $scope.modelFormat || $moment.$defaultModelFormat
          $scope.$watch('modelFormat', self.setFormat)
        }

        // Min, Max
        if ($attr.min) {
          $scope.$watch('min', function (minValue) {
            var isArray = __WEBPACK_IMPORTED_MODULE_0_angular___default.a.isArray(minValue)
            self.setMinMoment.apply(null, isArray ? minValue : [minValue])
          }, true)
        }

        if ($attr.max) {
          $scope.$watch('max', function (maxValue) {
            var isArray = __WEBPACK_IMPORTED_MODULE_0_angular___default.a.isArray(maxValue)
            self.setMaxMoment.apply(null, isArray ? maxValue : [maxValue])
          }, true)
        }

        // Add ctrl methods to the scope that are
        // suitable for use in the picker template.
        // /////////////////////////////////////////

        $scope.setPickerVisibility = self.setVisibility
        $scope.setDisplayMoment = self.setDisplayMoment
        $scope.setPickedMoment = self.setPickedMoment

        // Private methods

        function rebuildScopeMoments () {
          var lastMonthMoment = self.displayMoment.clone().startOf('month')
          var thisMonthMoment = lastMonthMoment.clone()
          var nextMonthMoment = self.displayMoment.clone().endOf('month')
          var thisMonth = self.displayMoment.format('M')
          var thisYear = self.displayMoment.format('YYYY')

          if ($scope.thisMonthMoments.length && thisMonthMoment.isSame($scope.thisMonthMoments[0])) { return }

          $scope.today = $moment()
          $scope.lastMonthMoments = []
          $scope.thisMonthMoments = []
          $scope.nextMonthMoments = []
          $scope.monthsThisYearMoments = []

          while (lastMonthMoment.format('d') !== weekStartDay) { $scope.lastMonthMoments.unshift(lastMonthMoment.subtract(1, 'day').clone()) }

          while (thisMonthMoment.format('M') === thisMonth) {
            $scope.thisMonthMoments.push(thisMonthMoment.clone())
            thisMonthMoment.add(1, 'day')
          }

          while ($scope.lastMonthMoments.length + $scope.thisMonthMoments.length + $scope.nextMonthMoments.length < 42) { $scope.nextMonthMoments.push(nextMonthMoment.add(1, 'day').clone()) }

          while ($scope.monthsThisYearMoments.length < 12) {
            $scope.monthsThisYearMoments.push($moment({ year: thisYear, month: $scope.monthsThisYearMoments.length }))
          }
        }

        init()
      }
    ],
    require: 'momentPicker',
    link: function (scope, element, attr, ctrl) {
      // View helpers
      // //////////////

      scope.getClasses = function (moment, classes) {
        var isWeekend = /6|7/.test(moment.isoWeekday())
        var isWeekday = !isWeekend
        var classObject = {
          weekend: isWeekend,
          weekday: isWeekday
        }

        // Convenience classes: jan fri
        classObject[ moment.format('MMM ddd').toLowerCase() ] = true

        if (!classes) { return classObject }

        // Iterate over requested class names
        __WEBPACK_IMPORTED_MODULE_0_angular___default.a.forEach(classes.split(' '), function (className) {
          var name = className.split('-')[0]
          var unit = className.split('-')[1] || ctrl.template.unit

          if (scope.pickedMoment && name === 'picked') {
            classObject[className] = moment.isSame(scope.pickedMoment, ctrl.template.unit)
          } else if (name === 'current') {
            classObject[className + ' current'] = moment.isSame(scope.today, unit)
          } else if (name === 'invalid' && (ctrl.minMoment || ctrl.maxMoment)) {
            if (ctrl.minMoment && moment.isBefore(ctrl.minMoment, unit)) {
              classObject[className + ' invalid'] = true
            } else if (ctrl.maxMoment && moment.isAfter(ctrl.maxMoment, unit)) {
              classObject[className + ' invalid'] = true
            }
          }
        })

        return classObject
      }
    }
  }
}];


/***/ }),
/* 3 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_angular__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_angular___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_angular__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__utils__ = __webpack_require__(6);
// Picker extends moment input directive with positioned momentPicker




/* harmony default export */ __webpack_exports__["a"] = ['$moment', '$compile', function inputDirective ($moment, $compile) {
  var defaultStyleAttr = 'style="position:absolute" class="input-picker"'
  var copiedAttrs = 'format modelFormat min max'.split(' ')

  var toSpinalCase = function (string) {
    return string.replace(/[a-z][A-Z]/g, function (w) { return w[0] + '-' + w[1] }).toLowerCase()
  }

  return {
    restrict: 'A',
    require: ['?ngModel'],
    link: function (scope, element, attr, ctrl) {
      if (!ctrl || attr.type !== 'moment') { return }

      var pickerAttrs = [ defaultStyleAttr ]
      var pickerElem, pickerScope, pickerCtrl, deregisterWatch

      function init () {
        deregisterWatch()
        pickerScope = pickerElem.isolateScope()
        pickerCtrl = pickerElem.controller('momentPicker')
        pickerCtrl.setVisibility(false)
        pickerScope.showClose = true
      }

      // Copy relevent attrs from input to picker
      if (attr.picker) { pickerAttrs.push('template=' + attr.picker) }

      __WEBPACK_IMPORTED_MODULE_0_angular___default.a.forEach(copiedAttrs, function (name) {
        if (attr[name]) { pickerAttrs.push(toSpinalCase(name) + '="' + attr[name] + '"') }
      })

      // Compile/inject/bind events to picker
      pickerElem = $compile('<div moment-picker="' + attr.ngModel + '" ' + pickerAttrs.join(' ') + '></div>')(scope)

      // Watch for controller instantiation
      deregisterWatch = scope.$watch(function () {
        if (pickerElem.controller('momentPicker')) { init() }
      })

      // DOM manipulation and event watching
      __WEBPACK_IMPORTED_MODULE_0_angular___default.a.element(document.body).append(pickerElem)

      pickerElem.on('mousedown', function (event) {
        event.preventDefault()
      })

      // Input event binding
      element.on('focus click', function (event) {
        var offset = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_1__utils__["a" /* getOffset */])(element[0])

        pickerElem.css({
          left: offset.left + 'px',
          top: offset.bottom + 'px'
        })

        pickerCtrl.setVisibility(true)
      })

      element.on('blur keydown', function (event) {
        if (event.type === 'keydown' && event.which !== 27) { return }
        pickerCtrl.setVisibility(false)
      })

      // Destruction cleanup
      scope.$on('$destroy', function () {
        pickerElem.off().remove()
      })
    }
  }
}];


/***/ }),
/* 4 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_angular__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_angular___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_angular__);


/* harmony default export */ __webpack_exports__["a"] = ['$moment', function ($moment) {
  // Format: String or Array
  // String: Moment output format (defaults to defaultViewFormat)
  // Array: Moment input format, moment output format, [strict]
  return function momentFormatFilter (date, format) {
    var moment, strict, inputFormat
    var outputFormat = $moment.$defaultViewFormat

    if (!__WEBPACK_IMPORTED_MODULE_0_angular___default.a.isDefined(date)) { return date }

    if (__WEBPACK_IMPORTED_MODULE_0_angular___default.a.isString(format)) { outputFormat = format } else if (__WEBPACK_IMPORTED_MODULE_0_angular___default.a.isArray(format)) {
      inputFormat = format[0]
      outputFormat = format[1] || outputFormat
      strict = format[2]
    }

    moment = $moment(date, inputFormat, strict)

    if (moment.isValid()) { return moment.format(outputFormat) }

    // Try parsing it with the defaultModelFormat if inputFormat wasn't specified
    if (!__WEBPACK_IMPORTED_MODULE_0_angular___default.a.isDefined(inputFormat)) {
      moment = $moment(date, $moment.$defaultModelFormat, $moment.strictModel)
      if (moment.isValid()) { return moment.format(outputFormat) }
    }

    return date
  }
}];


/***/ }),
/* 5 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_angular__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_angular___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_angular__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_moment__ = __webpack_require__(8);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_moment___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1_moment__);
/* harmony export (immutable) */ __webpack_exports__["a"] = $momentProvider;



function $momentProvider () {
  // Strict parsing has trouble in Moment.js v2.3—2.5 with short tokens
  // E.g. 1-31-2000, M-D-YYYY is invalid.
  var config = {
    $$pickerTemplates: {},
    $strictView: true,
    $strictModel: true,
    $defaultViewFormat: 'L',
    $defaultModelFormat: __WEBPACK_IMPORTED_MODULE_1_moment___default.a.defaultFormat,
    $parseFormat: $parseFormat
  }

  // For parsing locale-dependent date formats (L, LL, etc.)
  function $parseFormat (format) {
    format = format || ''
    if (format.match(/l/i)) { return __WEBPACK_IMPORTED_MODULE_1_moment___default()().lang()._longDateFormat[format] || format }
    return format
  }

  this.defaultViewFormat = function (format) {
    if (__WEBPACK_IMPORTED_MODULE_0_angular___default.a.isString(format)) { config.$defaultViewFormat = format }
    return this
  }

  this.defaultModelFormat = function (format) {
    if (__WEBPACK_IMPORTED_MODULE_0_angular___default.a.isString(format)) { config.$defaultModelFormat = format }
    return this
  }

  this.strictView = function (bool) {
    if (typeof bool === 'boolean') { config.$strictView = bool }
    return this
  }

  this.strictModel = function (bool) {
    if (typeof bool === 'boolean') { config.$strictModel = bool }
    return this
  }

  this.definePickerTemplate = function (template) {
    if (__WEBPACK_IMPORTED_MODULE_0_angular___default.a.isObject(template) && template.name && template.url) {
      config.$$pickerTemplates[template.name] = {
        url: template.url,
        unit: template.unit || 'days'
      }
    }
    return this
  }

  this.$get = function () {
    if (__WEBPACK_IMPORTED_MODULE_0_angular___default.a.isDefined(__WEBPACK_IMPORTED_MODULE_1_moment___default.a.$strictView)) { return __WEBPACK_IMPORTED_MODULE_1_moment___default.a }
    try {
      Object.defineProperty(__WEBPACK_IMPORTED_MODULE_1_moment___default.a, '$strictView', {
        value: config.$strictView
      })
      Object.defineProperty(__WEBPACK_IMPORTED_MODULE_1_moment___default.a, '$strictModel', {
        value: config.$strictModel
      })
      Object.defineProperty(__WEBPACK_IMPORTED_MODULE_1_moment___default.a, '$defaultViewFormat', {
        value: config.$defaultViewFormat
      })
      Object.defineProperty(__WEBPACK_IMPORTED_MODULE_1_moment___default.a, '$defaultModelFormat', {
        value: config.$defaultModelFormat
      })
      Object.defineProperty(__WEBPACK_IMPORTED_MODULE_1_moment___default.a, '$parseFormat', {
        value: config.$parseFormat
      })
      Object.defineProperty(__WEBPACK_IMPORTED_MODULE_1_moment___default.a, '$$pickerTemplates', {
        value: __WEBPACK_IMPORTED_MODULE_0_angular___default.a.copy(config.$$pickerTemplates),
        writable: true
      })
    } catch (err) { __WEBPACK_IMPORTED_MODULE_0_angular___default.a.extend(__WEBPACK_IMPORTED_MODULE_1_moment___default.a, config) }
    return __WEBPACK_IMPORTED_MODULE_1_moment___default.a
  }
}


/***/ }),
/* 6 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return getOffset; });


function getOffset (elem) {
  // Based on http://stackoverflow.com/a/8111175
  if (!elem) { return }

  var doc = document
  var win = window
  var bodyElem = doc.body
  var docElem = doc.documentElement
  var boxElem = doc.createElement('div')
  var isBoxModel,
    clientTop, clientLeft,
    scrollTop, scrollLeft,
    offsetTop, offsetRight, offsetBottom, offsetLeft,
    adjustedScrollTop,
    adjustedScrollLeft

  boxElem.style.paddingLeft =
  boxElem.style.width = '1px'

  bodyElem.appendChild(boxElem)
  isBoxModel = boxElem.offsetWidth === 2
  bodyElem.removeChild(boxElem)
  boxElem = elem.getBoundingClientRect()

  clientTop = docElem.clientTop || bodyElem.clientTop || 0
  clientLeft = docElem.clientLeft || bodyElem.clientLeft || 0
  scrollTop = win.pageYOffset || isBoxModel && docElem.scrollTop || bodyElem.scrollTop
  scrollLeft = win.pageXOffset || isBoxModel && docElem.scrollLeft || bodyElem.scrollLeft

  adjustedScrollTop = scrollTop - clientTop
  adjustedScrollLeft = scrollLeft - clientLeft

  offsetTop = boxElem.top + adjustedScrollTop
  offsetLeft = boxElem.left + adjustedScrollLeft
  offsetBottom = boxElem.bottom + adjustedScrollTop
  offsetRight = boxElem.right + adjustedScrollLeft

  return {
    top: offsetTop,
    left: offsetLeft,
    bottom: offsetBottom,
    right: offsetRight
  }
}


/***/ }),
/* 7 */
/***/ (function(module, exports) {

module.exports = require("indexof");

/***/ }),
/* 8 */
/***/ (function(module, exports) {

module.exports = require("moment");

/***/ }),
/* 9 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_angular__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_angular___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_angular__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__service__ = __webpack_require__(5);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__filter__ = __webpack_require__(4);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__directive_input__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__directive_momentPicker__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__directive_picker__ = __webpack_require__(3);








/* harmony default export */ __webpack_exports__["default"] = __WEBPACK_IMPORTED_MODULE_0_angular___default.a
  .module('$moment', [])
  .provider('$moment', __WEBPACK_IMPORTED_MODULE_1__service__["a" /* default */])
  .filter('momentFormat', __WEBPACK_IMPORTED_MODULE_2__filter__["a" /* default */])
  .directive('input', __WEBPACK_IMPORTED_MODULE_3__directive_input__["a" /* default */])
  .directive('picker', __WEBPACK_IMPORTED_MODULE_5__directive_picker__["a" /* default */])
  .directive('momentPicker', __WEBPACK_IMPORTED_MODULE_4__directive_momentPicker__["a" /* default */])
  .name;


/***/ })
/******/ ]);