/*global beforeEach, afterEach, describe, it, inject, expect, module, spyOn, moment, angular, $*/
describe('$moment', function () {
    'use strict';

    // So we don't have to worry about timezones for test runner's machine
    moment.defaultFormat = 'X';

    var $moment, $scope, $compile, compile, controller;

    var momentInput       = '<input type="moment" ng-model="date">',
        momentInputFormat = '<input type="moment" ng-model="date" format="dateFormat">';

    var dateFormat1 = 'MM-DD-YYYY',
        dateFormat2 = 'YYYY-MM-DD',
        dateFormat3 = 'YYYY-MM-DD',
        monthFormat = 'MM-YYYY';

    var viewDate  = '01/31/1986',
        modelDate = '507542400';

    beforeEach(angular.mock.module('angular-momentjs'));
    beforeEach(inject(function (_$moment_, _$rootScope_, _$compile_) {
      $moment  = _$moment_;
      $scope   = _$rootScope_.$new();
      $compile = _$compile_;
      compile  = function(markup) { return $compile(markup)($scope); };
    }));

    describe('directive', function() {

      it('should initialize only on type "date" and "moment" inputs', function() {
        var textInput   = compile('<input type="text" ng-model="date">');
        var dateInput   = compile('<input type="date" ng-model="date">');
        var momentInput = compile('<input type="moment" ng-model="date">');
        $scope.$apply("dateFormat = '"+ modelDate +"'");
        expect(textInput.attr('class').split(' ')).not.toContain('ng-valid-date');
        expect(dateInput.attr('class').split(' ')).toContain('ng-valid-date');
        expect(momentInput.attr('class').split(' ')).toContain('ng-valid-date');
      });

      it('should initialize only on inputs with an ngModelController', function() {
        var plainInput  = compile('<input type="moment">');
        var momentInput = compile('<input type="moment" ng-model="date">');
        $scope.$apply("dateFormat = '"+ modelDate +"'");
        expect(plainInput.attr('class').split(' ')).not.toContain('ng-valid-date');
        expect(momentInput.attr('class').split(' ')).toContain('ng-valid-date');
      });

      it('should set the placeholder value to match the view\'s format', function() {
        var input = compile(momentInput);
        expect(input.attr('placeholder')).toBe('MM/DD/YYYY');
      });

      it('should change the placeholder value to match a dynamic format', function() {
        var input = compile(momentInputFormat);
        $scope.$apply("dateFormat = '"+ dateFormat1 +"'");
        expect(input.attr('placeholder')).toBe(dateFormat1);
        $scope.$apply("dateFormat = '"+ dateFormat2 +"'");
        expect(input.attr('placeholder')).toBe(dateFormat2);
      });

      it('should format a model date for the view', function() {
        var input = compile(momentInput);
        $scope.$apply("date = '"+ modelDate +"'");
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