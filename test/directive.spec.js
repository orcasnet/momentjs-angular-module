/*global beforeEach, afterEach, describe, it, inject, expect, module, spyOn, moment, angular, $*/
describe('$moment', function () {
    'use strict';

    var $moment, $scope, $compile, compile, controller;

    var momentInput       = '<input type="moment" ng-model="date">',
        momentInputFormat = '<input type="moment" ng-model="date" format="MM-DD-YYYY">';

    var viewDate  = '01/31/1986',
        modelDate = '1986-01-31T00:00:00-08:00';

    beforeEach(angular.mock.module('angular-momentjs'));
    beforeEach(inject(function (_$moment_, _$rootScope_, _$compile_) {
      $moment  = _$moment_;
      $scope   = _$rootScope_.$new();
      $compile = _$compile_;

      compile    = function(markup) { return $compile(markup)($scope); };
      // controller = function(elem, ctrl) { return elem.controller() }
    }));

    describe('Directive', function() {

      it('should set a placeholder value matching the viewFormat', function() {
        var input = compile(momentInput);
        expect(input.attr('placeholder')).toBe('MM/DD/YYYY');
      });

      it('should format a model date for the view', function() {
        var input = compile(momentInput);
        $scope.$apply("date = '1986-01-31T00:00:00-08:00'");
        expect(input.val()).toBe(viewDate);
      });

      it('should format a view date for the model', function() {
        var input = compile(momentInput),
            ctrl  = input.controller('ngModel');
        
        ctrl.$setViewValue(viewDate);
        expect($scope.date).toBe(modelDate);
      });

    });

});