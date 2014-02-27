/*global beforeEach, afterEach, describe, it, inject, expect, module, spyOn, moment, angular, $*/
describe('$moment', function () {
    'use strict';

    // So we don't have to worry about timezones for test runner's machine
    moment.defaultFormat = 'X';

    var $moment, $scope, $compile, $filter, compile, controller;

    var modelDateLowest  = '307542400',
        viewDateLowest   = '09/30/1979';

    beforeEach(angular.mock.module('moment'));
    beforeEach(inject(function (_$moment_, _$rootScope_, _$compile_, _$filter_) {
      $moment  = _$moment_;
      $scope   = _$rootScope_.$new();
      $compile = _$compile_;
      $filter  = _$filter_;
      compile  = function(markup) {
        var elem = $compile(markup)($scope);
        $scope.$digest();
        return elem;
      };
    }));

    describe('momentFormat filter', function() {

      it('should parse "best guess" input to $moment.defaultViewFormat without arguments', function() {
        expect($filter('momentFormat')('Sept 30 1979')).toBe(viewDateLowest);
      });

      it('should fallback to parsing with defaultModelFormat to $moment.defaultViewFormat without arguments', function() {
        expect($filter('momentFormat')(modelDateLowest)).toBe(viewDateLowest);
      });

      it('should accept a string argument for formatting output', function() {
        expect($filter('momentFormat')('Jan 31 1980', 'M DD YYYY')).toBe('1 31 1980');
      });

      it('should accept an array argument for parse and format formats', function() {
        expect($filter('momentFormat')('1,1,80', ['M,D,YY', 'M D YYYY'])).toBe('1 1 1980');
      });

      it('should accept an array argument for parse, format, and strictness', function() {
        expect($filter('momentFormat')('It is 2012-05-25', ['YYYY-MM-DD', ''])).toBe('05/25/2012');
        expect($filter('momentFormat')('It is 2012-05-25', ['YYYY-MM-DD', '', false])).toBe('05/25/2012');
        expect($filter('momentFormat')('It is 2012-05-25', ['YYYY-MM-DD', '', true])).toBe('It is 2012-05-25');
      });

    });

});