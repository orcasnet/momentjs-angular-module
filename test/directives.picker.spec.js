/*global beforeEach, afterEach, describe, it, inject, expect, module, spyOn, moment, angular, $*/
describe('momentPicker directive', function () {
    'use strict';

    var $moment, $scope, $compile, compileHtml;

    beforeEach(module('moment'));
    beforeEach(module('templates'));

    beforeEach(module(function($momentProvider) {
      $momentProvider.definePickerTemplate({
        name: 'default',
        url:  'templates/momentpicker.day.html'
      });
    }));

    beforeEach(inject(function(_$moment_,  _$rootScope_, _$compile_) {
      $moment  = _$moment_;
      $scope   = _$rootScope_.$new();
      $compile = _$compile_;
      // TODO: Fix service so this workaround doesn't have to happen.
      $moment.$$pickerTemplates['default'] = {
        url:  'templates/momentpicker.day.html',
        unit: 'days' 
      };

      compileHtml = function(markup) {
        var elem = $compile(markup)($scope);
        $scope.$digest();
        return elem;
      };
    }));

    describe('controller initialization', function() {
        it('should set display to the current date', function() {
          var picker = compileHtml('<div moment-picker="date"></div>'),
              ctrl   = picker.controller('momentPicker');

          expect(ctrl.displayMoment.isSame($moment(), 'hour')).toBeTruthy();
        });

    });

});