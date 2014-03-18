/*
  Angular Moment.js Moment Picker
*/

// TODO: No test coverage :(
// TODO: A concept of 'interval' instead of 'unit', and a way of setting the display bounds? E.g., mid-month month-end picker.

'use strict';

angular.module('moment')

.directive('momentPicker', ['$moment', '$log', 'indexOf', function inputDirective($moment, $log, indexOf) {
  var weekStartDay = $moment().startOf('week').format('d'),
      weekEndDay   = $moment().endOf('week')  .format('d'),
      getTemplateDefinition = function(templateName) {
        return $moment.$$pickerTemplates[templateName || 'default'];
      };

  return {
    restrict: 'A',
    templateUrl: function(tElement, tAttrs) {
      var template = getTemplateDefinition(tAttrs.template);
      if (template)
        return template.url;
      // Ya dun' goofed.
      $log.error('Error: [momentDatepicker] Picker template \''+ tAttrs.template +'\' is undefined. Templates must be defined with \'$momentProvider.definePickerTemplate\'.');
    },
    scope: {
      dateModel:   '=momentPicker',
      format:      '=?',
      modelFormat: '=?',
      min:         '=?',
      max:         '=?',
      ngShow:      '=?'
    },
    controller: ['$scope', '$element', '$attrs', '$parse', '$animate', '$moment', 'indexOf',
      function($scope, $element, $attr, $parse, $animate, $moment, indexOf) {
        var self = this;

        self.template = getTemplateDefinition($attr.template);
        self.format   = $moment.$defaultModelFormat;

        self.pickedMoment  = Number.NaN;
        self.maxMoment     = Number.NaN;
        self.minMoment     = Number.NaN;

        self.visible = true;
        self.hidden  = false;

        function init() {
          self.setDisplayMoment($moment());
          rebuildScopeMoments();

          $scope.weekMoments = []; 
          var i = 7;
          while (i--)
            $scope.weekMoments.unshift($moment().startOf('week').add(i, 'day'));
        }


        // Ctrl Methods
        ////////////////

        self.setVisibility = function(isVisible) {
          self.hidden  = !isVisible;
          self.visible = !!isVisible;
          $animate[!isVisible ? 'addClass' : 'removeClass']($element, 'ng-hide');
        };

        self.setPickedMoment = function(input, format, lang, strict) {
          var moment  = $moment.apply(null, arguments),
              isValid = input && moment.isValid();

          if (!isValid) {
            self.pickedMoment   = null;
            $scope.pickedMoment = null;
            return;
          }
          
          if (self.minMoment && moment.isBefore(self.minMoment, self.template.unit))
            return;
          if (self.maxMoment && moment.isAfter(self.maxMoment, self.template.unit))
            return;

          // Clamp it to the min/max to keep it valid
          if (self.minMoment)
            moment = moment.min(self.minMoment);
          if (self.maxMoment)
            moment = moment.max(self.maxMoment);

          if (moment.isSame(self.pickedMoment))
            return;

          self.pickedMoment   = moment.clone();
          $scope.pickedMoment = moment.clone();
          $scope.dateModel    = moment.format(format);

          self.setDisplayMoment(moment);
        };

        self.setDisplayMoment = function(input, format, lang, strict) {
          var moment  = $moment.apply(null, arguments),
              isValid = input && moment.isValid(),
              fallbackMoment = self.pickedMoment ? self.pickedMoment : $moment();

          self.displayMoment   = isValid ? moment.clone() : fallbackMoment.clone();
          $scope.displayMoment = isValid ? moment.clone() : fallbackMoment.clone();

          rebuildScopeMoments();
        };

        self.setMinMoment = function(input, format, lang, strict) {
          var moment  = $moment.apply(null, arguments),
              isValid = input && moment.isValid();

          self.minMoment = isValid ? moment.clone() : null;
        };

        self.setMaxMoment = function(input, format, lang, strict) {
          var moment  = $moment.apply(null, arguments),
              isValid = input && moment.isValid();

          self.maxMoment = isValid ? moment.clone() : null;
        };

        self.setFormat = function(format) {
          if (angular.equals(self.format, format))
            return;

          self.format = format || $moment.$defaultModelFormat;
          self.setPickedMoment($scope.dateModel, self.format, $moment.$strictModel);
        };


        // Watchers
        ///////////

        $scope.$watch('dateModel', function(modelValue) {
          self.setPickedMoment(modelValue, self.format, $moment.$strictModel);
        });

        // Format or modelFormat
        if ($attr.format && !$attr.modelFormat) {
          self.format = $scope.format || $moment.$defaultModelFormat;
          $scope.$watch('format', self.setFormat);
        }
        else if ($attr.modelFormat) {
          self.format = $scope.modelFormat || $moment.$defaultModelFormat;
          $scope.$watch('modelFormat', self.setFormat);
        }

        // Min, Max
        if ($attr.min) {
          $scope.$watch($attr.min, function(minValue) {
            var isArray = angular.isArray(minValue);
            self.setMinMoment.apply(null, isArray ? minValue : [minValue]);
          }, true);
        }

        if ($attr.max) {
          $scope.$watch($attr.max, function(maxValue) {
            var isArray = angular.isArray(maxValue);
            self.setMaxMoment.apply(null, isArray ? maxValue : [maxValue]);
          }, true);
        }


        // Add ctrl methods to the scope that are
        // suitable for use in the picker template.
        ///////////////////////////////////////////

        $scope.setPickerVisibility = self.setVisibility;
        $scope.setDisplayMoment    = self.setDisplayMoment;
        $scope.setPickedMoment     = self.setPickedMoment;


        // Private methods

        function rebuildScopeMoments() {
          // TODO: Check if rebuild is necessary

          $scope.today                 = $moment();
          $scope.lastMonthMoments      = [];
          $scope.thisMonthMoments      = [];
          $scope.nextMonthMoments      = [];
          $scope.monthsThisYearMoments = [];

          var lastMonthMoment = self.displayMoment.clone().startOf('month'),
              thisMonthMoment = lastMonthMoment.clone(),
              nextMonthMoment = self.displayMoment.clone().endOf('month'),
              thisMonth       = self.displayMoment.format('M'),
              thisYear        = self.displayMoment.format('YYYY');

          while (lastMonthMoment.format('d') !== weekStartDay)
            $scope.lastMonthMoments.unshift(lastMonthMoment.subtract(1, 'day').clone());

          while (thisMonthMoment.format('M') === thisMonth) {
            $scope.thisMonthMoments.push(thisMonthMoment.clone());
            thisMonthMoment.add(1, 'day');
          }

          while ($scope.lastMonthMoments.length + $scope.thisMonthMoments.length + $scope.nextMonthMoments.length < 42)
            $scope.nextMonthMoments.push(nextMonthMoment.add(1, 'day').clone());

          while ($scope.monthsThisYearMoments.length < 12)
            $scope.monthsThisYearMoments.push(moment({ year:thisYear, month:$scope.monthsThisYearMoments.length }));

        }


        init();
      }
    ],
    require: 'momentPicker',
    link: function(scope, element, attr, ctrl) {

      // View helpers
      ////////////////

      scope.getClasses = function(moment, classes) {
        var isWeekend   = /6|7/.test(moment.isoWeekday()),
            isWeekday   = !isWeekend,
            classObject = {
              weekend: isWeekend,
              weekday: isWeekday
            };

        // Convenience classes: jan fri
        classObject[ moment.format('MMM ddd').toLowerCase() ] = true;

        if (!classes)
          return classObject;

        angular.forEach(classes.split(' '), function(className) {
          var name = className.split('-')[0],
              unit = className.split('-')[1] || ctrl.template.unit;

          if (scope.pickedMoment && name == 'picked') {
            classObject[className] = moment.isSame(scope.pickedMoment, ctrl.template.unit);
          }

          else if (name == 'current')
            classObject[className +' current'] = moment.isSame(scope.today, unit);

          else if (name == 'invalid' && (ctrl.minMoment || ctrl.maxMoment)) {
            if (ctrl.minMoment && moment.isBefore(ctrl.minMoment, unit))
              classObject[className + ' invalid'] = true;
            else if (ctrl.maxMoment && moment.isAfter(ctrl.maxMoment, unit))
              classObject[className + ' invalid'] = true;
          }

        });

        return classObject;
      };

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
    require: ['picker', '?ngModel'],
    controller: ['$scope', function($scope) {
      this.weeeee = 'asd';
    }],
    link: function(scope, element, attr, ctrl) {
      console.log('!', ctrl);
      if (!ctrl || attr.type !== 'moment')
        return;

      var pickerAttrs = [ defaultStyleAttr ],
          pickerElem, pickerScope, pickerCtrl;

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
      pickerElem = $compile('<div moment-picker="'+ attr.ngModel +'" '+ pickerAttrs.join(' ') +'></div>')(scope);

      var deregister = scope.$watch(function(){
        pickerCtrl = pickerElem.controller('momentPicker');
        if (pickerCtrl) deregister();
      });


      angular.element(document.body).append(pickerElem);

      pickerElem.on('mousedown', function(event) {
        event.preventDefault();
      });

      // Input event binding
      element.on('focus click', function(event) {
        var offset = getOffset(element[0]);
  
        pickerElem.css({
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
        pickerElem.off().remove();
      });

    }
  };
}]);

