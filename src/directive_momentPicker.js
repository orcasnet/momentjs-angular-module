import angular from 'angular'

export default ['$moment', '$log', function inputDirective ($moment, $log) {
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
          if (angular.equals(self.format, format)) { return }

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
            var isArray = angular.isArray(minValue)
            self.setMinMoment.apply(null, isArray ? minValue : [minValue])
          }, true)
        }

        if ($attr.max) {
          $scope.$watch('max', function (maxValue) {
            var isArray = angular.isArray(maxValue)
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
        angular.forEach(classes.split(' '), function (className) {
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
}]
