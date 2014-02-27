'use strict';

angular.module('demoApp', ['moment'])
.config(['$momentProvider', function($momentProvider) {

}])
.controller('DemoCtrl', ['$scope', '$moment', function($scope, $moment) {

  var weekStartDay = $moment().startOf('week').format('d');
  var weekEndDay   = $moment().endOf('week').format('d');

  $scope.dayNames = [];
  angular.forEach('1234567', function(value, i) {
    var name = $moment().startOf('week').add(i, 'day').format('dd');
    $scope.dayNames[i] = name;
  });



  $scope.$watch('date', function(date) {

    var currentDayMoment    = $moment(date, $moment.defaultModelFormat),
        previousMonthMoment = currentDayMoment.clone().startOf('month'),
        currentMonthMoment  = currentDayMoment.clone().startOf('month'),
        nextMonthMoment     = currentDayMoment.clone().endOf('month');

    var currentMonth = currentMonthMoment.format('M');

    $scope.header            = currentMonthMoment.format('MMMM YYYY');
    $scope.daysCurrentMonth  = [];
    $scope.daysPreviousMonth = [];
    $scope.daysNextMonth     = [];

    while (previousMonthMoment.format('d') !== weekStartDay)
      $scope.daysPreviousMonth.push(previousMonthMoment.subtract(1, 'day').format('D'));

    while (currentMonthMoment.format('M') === currentMonth) {
      $scope.daysCurrentMonth.push(currentMonthMoment.format('D'));
      currentMonthMoment.add(1, 'day');
    }


    while (nextMonthMoment.format('d') !== weekEndDay)
      $scope.daysNextMonth.push(nextMonthMoment.add(1, 'day').format('D'));
    
  });


}]);