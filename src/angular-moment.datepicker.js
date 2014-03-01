/*
  Angular Moment.js Datepicker
*/

'use strict';

angular.module('moment')

.directive('momentDatepicker', ['$moment', function inputDirective($moment) {
  var weekStartDay = $moment().startOf('week').format('d'),
      weekEndDay   = $moment().endOf('week')  .format('d');

  return {
    restrict: 'A',
    templateUrl: 'datepicker.template.html',
    scope: { date:'=momentDatepicker' },
    link: function(scope, element, attr) {

      scope.weekMoments = [];

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

