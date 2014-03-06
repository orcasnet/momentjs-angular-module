/*
  Angular Moment.js Datepicker
*/

'use strict';

angular.module('moment')

.directive('momentPicker', ['$moment', '$compile', 'getOffset', function inputDirective($moment, $compile, getOffset) {
  var defaultStyleAttr = 'style="position:absolute"';

  return {
    restrict: 'A',
    require: '?ngModel',
    scope: true,
    link: function(scope, element, attr, ctrl) {
      if (!ctrl)
        return;

      var pickerElement = $compile('<div moment-datepicker="'+ attr.ngModel +'" '+ defaultStyleAttr +' ng-show="isShowingMomentPicker"></div>')(scope);
      element.after(pickerElement);

      element.on('focus click', function(event) {
        var offset = getOffset(element[0]);

        pickerElement.css({
          left: offset.left + 'px',
          top: offset.bottom + 'px'
        });

        scope.$apply(function(scope) {
          scope.isShowingMomentPicker = true;
        });
      });

      pickerElement.on('mousedown', function(event) {
        event.preventDefault();
      });

      element.on('blur', function(event) {
        scope.$apply(function(scope) {
          scope.isShowingMomentPicker = false;
        });
      });

    }
  }
}])


.directive('momentDatepicker', ['$moment', function inputDirective($moment) {
  var weekStartDay = $moment().startOf('week').format('d'),
      weekEndDay   = $moment().endOf('week')  .format('d');

  return {
    restrict: 'A',
    templateUrl: 'datepicker.template.html',
    scope: { date:'=momentDatepicker', ngShow:'=' },
    link: function(scope, element, attr) {

      scope.weekMoments = [];
      
      scope.getDateCellClassNames = function(moment) {
        // isWeekend may not be accurate for all locales
        var isWeekend = /0|7/.test(moment.isoWeekday());
        return {
          today:   moment.isSame($moment(),  'day'),
          current: moment.isSame(scope.date, 'day'),
          weekend: isWeekend,
          weekday: !isWeekend
        };
      };

      var i = 7;
      while (i--) {
        scope.weekMoments.unshift($moment().startOf('week').add(i, 'day'));
      }

      scope.$watch('date', function(date) {
        var moment = $moment(date, $moment.$defaultModelFormat, $moment.$strictModel);
        if (date && moment.isValid())
          scope.moment = moment.clone();
        else
          scope.moment = $moment();
        scope.displayMoment = scope.moment.clone();
      });

      scope.$watch(function() { return scope.displayMoment.format('M/YYYY'); }, function(moment, oldMoment) {
        rebuild();
      });

      scope.setDateTo = function(moment) {
        scope.date = moment.format($moment.$defaultModelFormat);
      };

      function rebuild() {
        scope.today = $moment();
        scope.lastMonthMoments = [];
        scope.thisMonthMoments = [];
        scope.nextMonthMoments = [];

        var lastMonthMoment = scope.displayMoment.clone().startOf('month'),
            thisMonthMoment = lastMonthMoment.clone(),
            nextMonthMoment = scope.displayMoment.clone().endOf('month'),
            thisMonth       = scope.displayMoment.format('M');

        while (lastMonthMoment.format('d') !== weekStartDay) {
          scope.lastMonthMoments.push(lastMonthMoment.subtract(1, 'day').clone());
        }

        while (thisMonthMoment.format('M') === thisMonth) {
          scope.thisMonthMoments.push(thisMonthMoment.clone());
          thisMonthMoment.add(1, 'day');
        }

        while (nextMonthMoment.format('d') !== weekEndDay)
          scope.nextMonthMoments.push(nextMonthMoment.add(1, 'day').clone());






      }





    }
  };

}]);

