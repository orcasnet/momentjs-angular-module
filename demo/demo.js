'use strict';

angular.module('demoApp', ['moment'])
.config(['$momentProvider', function($momentProvider) {
  $momentProvider.definePickerTemplate({
    name: 'default',
    url:  'datepicker.template.html'
  });
}])
.controller('DemoCtrl', ['$scope', '$moment', function($scope, $moment) {

}]);