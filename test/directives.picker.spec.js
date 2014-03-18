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
      
        it('should set displayMoment to the current date', function() {
          var picker   = compileHtml('<div moment-picker="date"></div>'),
              isoScope = picker.isolateScope(),
              ctrl     = picker.controller('momentPicker');
          expect(ctrl.displayMoment.isSame($moment(), 'hour')).toBeTruthy();
        });

        it('should set visible to $defaultModelFormat', function() {
          var picker = compileHtml('<div moment-picker="date"></div>'),
              ctrl   = picker.controller('momentPicker');
          expect(ctrl.format).toBe($moment.$defaultModelFormat);
        });

        it('should set format to true', function() {
          var picker = compileHtml('<div moment-picker="date"></div>'),
              ctrl   = picker.controller('momentPicker');
          expect(ctrl.visible).toBeTruthy();
          expect(ctrl.hidden).toBeFalsy();
        });

        it('should set pickedMoment to model date', function() {
          $scope.$apply(function() {
            $scope.date = $moment('01/01/2000').format($moment.$defaultModelDate);
          });

          var picker = compileHtml('<div moment-picker="date"></div>'),
              ctrl   = picker.controller('momentPicker');

          expect(ctrl.pickedMoment.isSame('01/01/2000')).toBeTruthy();
        });

        it('should not set pickedMoment to invalid model date', function() {
          $scope.$apply(function() {
            $scope.date = '*<(8^D)';
          });

          var picker = compileHtml('<div moment-picker="date"></div>'),
              ctrl   = picker.controller('momentPicker');

          expect(ctrl.pickedMoment).toBeFalsy();
        });

        it('should set displayMoment to match pickedMoment', function() {
          $scope.$apply(function() {
            $scope.date = $moment('01/01/2000').format($moment.$defaultModelDate);
          });

          var picker = compileHtml('<div moment-picker="date"></div>'),
              ctrl   = picker.controller('momentPicker');

          expect(ctrl.displayMoment.isSame('01/01/2000')).toBeTruthy();
        });

        it('should copy ctrl methods to scope', function() {
          var picker   = compileHtml('<div moment-picker="date"></div>'),
              ctrl     = picker.controller('momentPicker'),
              isoScope = picker.isolateScope();

          expect(isoScope.setPickerVisibility).toBeTruthy();
          expect(isoScope.setDisplayMoment).toBeTruthy();
          expect(isoScope.setPickedMoment).toBeTruthy();
        });

    });


    
    describe('controller method', function() {

      it('setVisibility should set/unset "ng-hide" class', function() {
        var picker = compileHtml('<div moment-picker="date"></div>'),
            ctrl   = picker.controller('momentPicker');

        ctrl.setVisibility(false);
        expect(ctrl.hidden).toBeTruthy();
        expect(ctrl.visible).toBeFalsy();
        expect(picker.hasClass('ng-hide')).toBeTruthy();

        ctrl.setVisibility(true);
        expect(ctrl.hidden).toBeFalsy();
        expect(ctrl.visible).toBeTruthy();
        expect(picker.hasClass('ng-hide')).toBeFalsy();

      });

      it('setVisibility should be referenced on the scope', function() {
        var picker = compileHtml('<div moment-picker="date"></div>'),
            ctrl   = picker.controller('momentPicker'),
            isoScope = picker.isolateScope();

        expect(ctrl.setVisibility.toString()).toEqual(isoScope.setPickerVisibility.toString());

      });



      it('setDisplayMoment should set displayMoment from string', function() {
        var picker = compileHtml('<div moment-picker="date"></div>'),
            ctrl   = picker.controller('momentPicker');

        ctrl.setDisplayMoment('01/01/2000');
        expect(ctrl.displayMoment.isSame('01/01/2000')).toBeTruthy();
      });

      it('setDisplayMoment should set displayMoment from moment object', function() {
        var picker = compileHtml('<div moment-picker="date"></div>'),
            ctrl   = picker.controller('momentPicker');

        ctrl.setDisplayMoment($moment('01/01/2000').add(1, 'year'));
        expect(ctrl.displayMoment.isSame('01/01/2001')).toBeTruthy();
      });

      it('setDisplayMoment should set displayMoment on the scope', function() {
        var picker = compileHtml('<div moment-picker="date"></div>'),
            ctrl   = picker.controller('momentPicker'),
            isoScope = picker.isolateScope();

        ctrl.setDisplayMoment('01/01/2000');
        expect(isoScope.displayMoment.isSame('01/01/2000')).toBeTruthy();
      });

      it('setDisplayMoment should unset to current date', function() {
        var picker = compileHtml('<div moment-picker="date"></div>'),
            ctrl   = picker.controller('momentPicker');

        ctrl.setDisplayMoment('01/01/2000');
        ctrl.setDisplayMoment();
        expect(ctrl.displayMoment.isSame($moment(), 'minute')).toBeTruthy();
      });



      it('setPickedMoment should set pickedMoment from string', function() {
        var picker = compileHtml('<div moment-picker="date"></div>'),
            ctrl   = picker.controller('momentPicker');

        ctrl.setPickedMoment('01/01/2000');
        expect(ctrl.pickedMoment.isSame('01/01/2000')).toBeTruthy();
      });

      it('setPickedMoment should set pickedMoment from moment object', function() {
        var picker = compileHtml('<div moment-picker="date"></div>'),
            ctrl   = picker.controller('momentPicker');

        ctrl.setPickedMoment($moment('01/01/2000').add(1, 'year'));
        expect(ctrl.pickedMoment.isSame('01/01/2001')).toBeTruthy();
      });

      it('setPickedMoment should set pickedMoment on the scope', function() {
        var picker = compileHtml('<div moment-picker="date"></div>'),
            ctrl   = picker.controller('momentPicker'),
            isoScope = picker.isolateScope();

        ctrl.setPickedMoment('01/01/2000');
        expect(isoScope.pickedMoment.isSame('01/01/2000')).toBeTruthy();
      });

      it('setPickedMoment should set displayMoment to match it', function() {
        var picker = compileHtml('<div moment-picker="date"></div>'),
            ctrl   = picker.controller('momentPicker');

        ctrl.setPickedMoment('01/01/2000');
        expect(ctrl.pickedMoment.isSame(ctrl.displayMoment)).toBeTruthy();
      });

      it('setPickedMoment should unset', function() {
        var picker = compileHtml('<div moment-picker="date"></div>'),
            ctrl   = picker.controller('momentPicker');

        ctrl.setPickedMoment('01/01/2000');
        ctrl.setPickedMoment();
        expect(ctrl.pickedMoment).toBeFalsy();
      });



      it('setMinMoment should set minMoment from string', function() {
        var picker = compileHtml('<div moment-picker="date"></div>'),
            ctrl   = picker.controller('momentPicker');

        ctrl.setMinMoment('01/01/2000');
        expect(ctrl.minMoment.isSame('01/01/2000')).toBeTruthy();
      });

      it('setMinMoment should set minMoment from moment object', function() {
        var picker = compileHtml('<div moment-picker="date"></div>'),
            ctrl   = picker.controller('momentPicker');

        ctrl.setMinMoment($moment('01/01/2000').add(1, 'year'));
        expect(ctrl.minMoment.isSame('01/01/2001')).toBeTruthy();
      });

      it('setMinMoment should unset', function() {
        var picker = compileHtml('<div moment-picker="date"></div>'),
            ctrl   = picker.controller('momentPicker');

        ctrl.setMinMoment('01/01/2000');
        ctrl.setMinMoment();
        expect(ctrl.minMoment).toBeFalsy();
      });



      it('setMaxMoment should set maxMoment from string', function() {
        var picker = compileHtml('<div moment-picker="date"></div>'),
            ctrl   = picker.controller('momentPicker');

        ctrl.setMaxMoment('01/01/2000');
        expect(ctrl.maxMoment.isSame('01/01/2000')).toBeTruthy();
      });

      it('setMaxMoment should set maxMoment from moment object', function() {
        var picker = compileHtml('<div moment-picker="date"></div>'),
            ctrl   = picker.controller('momentPicker');

        ctrl.setMaxMoment($moment('01/01/2000').add(1, 'year'));
        expect(ctrl.maxMoment.isSame('01/01/2001')).toBeTruthy();
      });

      it('setMaxMoment should unset', function() {
        var picker = compileHtml('<div moment-picker="date"></div>'),
            ctrl   = picker.controller('momentPicker');

        ctrl.setMaxMoment('01/01/2000');
        ctrl.setMaxMoment();
        expect(ctrl.maxMoment).toBeFalsy();
      });




    });

});