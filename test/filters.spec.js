/*global beforeEach, afterEach, describe, it, inject, expect, module, spyOn, moment, angular, $*/
describe('$moment', function () {
    'use strict';

    // So we don't have to worry about timezones for test runner's machine
    moment.defaultFormat = 'X';

    var $moment, $scope, $compile, $filter, compile, controller;

    var modelDateLowest  = '307542400',
        modelDateLower   = '407542400',
        modelDateHigher  = '607542400',
        modelDateHighest = '707542400',

        viewDateLowest   = '09/30/1979',
        viewDateLower    = '11/30/1982',
        viewDateHigher   = '04/02/1989',
        viewDateHighest  = '06/02/1992';

    beforeEach(angular.mock.module('moment'));
    beforeEach(inject(function (_$moment_, _$rootScope_, _$compile_, _$filter_) {
      $moment  = _$moment_;
      $scope   = _$rootScope_.$new();
      $compile = _$compile_;
      $filter = _$filter_;
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

    });

});