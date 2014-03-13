'use strict';

angular.module('demoApp', ['moment'])
.config(['$momentProvider', function($momentProvider) {
  $momentProvider
    .definePickerTemplate({
      name: 'default',
      url:  'datepicker.template.html'
    }).definePickerTemplate({
      name: 'simple',
      url:  'datepicker.template-other.html'
    });
}])
.controller('DemoCtrl', ['$scope', '$moment', function($scope, $moment) {

}]);