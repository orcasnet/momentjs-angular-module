/*global beforeEach, afterEach, describe, it, inject, expect, module, spyOn, moment, angular, $*/
describe('$moment', function () {
    'use strict';

    // So we don't have to worry about timezones for test runner's machine
    moment.defaultFormat = 'X';

    var $moment, $scope, $compile, $timeout, compile, controller, consoleLog;

    var momentInput                = '<input type="moment" ng-model="date">',
        momentInputFormat          = '<input type="moment" ng-model="date" format="dateFormat">',
        momentInputViewModelFormat = '<input type="moment" ng-model="date" view-format="dateViewFormat" model-format="dateModelFormat">',
        momentInputMinMax          = '<input type="moment" ng-model="date" min="dateMin" max="dateMax">',
        momentInputStep            = '<input type="moment" ng-model="date" step="dateStep">';

    var dateFormat1 = 'MM-DD-YYYY',
        dateFormat2 = 'YYYY-MM-DD',
        dateFormat3 = 'MM-YYYY-DD',
        monthFormat = 'MM-YYYY';

    var viewDate  = '01/31/1986',
        modelDate = '507542400';


    var modelDateLowest  = '307542400',
        modelDateLower   = '407542400',
        modelDateHigher  = '607542400',
        modelDateHighest = '707542400',

        viewDateLowest   = '09/30/1979',
        viewDateLower    = '11/30/1982',
        viewDateHigher   = '04/02/1989',
        viewDateHighest  = '06/02/1992';


    var wheelUpEvent   = ['mousewheel', { type:'wheel', wheelDelta:120, which:1 }],
        wheelDownEvent = ['mousewheel', { type:'wheel', wheelDelta:-120, which:1 }],
        upKeyEvent     = ['keydown', { type:'keydown', which:38 }],
        downKeyEvent   = ['keydown', { type:'keydown', which:40 }],
        plusKeyEvent   = ['keydown', { type:'keydown', which:107 }],
        minusKeyEvent  = ['keydown', { type:'keydown', which:109 }];

    beforeEach(angular.mock.module('moment'));
    beforeEach(inject(function (_$moment_, _$rootScope_, _$compile_, _$timeout_) {
      $moment  = _$moment_;
      $scope   = _$rootScope_.$new();
      $compile = _$compile_;
      $timeout = _$timeout_;
      compile  = function(markup) {
        var elem = $compile(markup)($scope);
        $scope.$digest();
        return elem;
      };

      consoleLog = console.log || angular.noop;
    }));

    describe('input directive', function() {

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

      it('should invalidate an invalid view date', function() {
        var input = compile(momentInput),
            ctrl  = input.controller('ngModel');

        ctrl.$setViewValue('Purple monkey dishwasher');
        expect(ctrl.$error.date).toBe(true);
        expect($scope.date).toBeUndefined();

        ctrl.$setViewValue('01/32/1986');
        expect(ctrl.$error.date).toBe(true);
        expect($scope.date).toBeUndefined();
      });

      it('should reformat view/model based on view- and model-format attrs', function() {
        var input = compile(momentInputViewModelFormat),
            ctrl  = input.controller('ngModel');

        // Flip default view and model formats
        $scope.$apply("dateModelFormat = 'L'");
        $scope.$apply("dateViewFormat  = 'X'");
        $scope.$apply("date = '"+ viewDate +"'");
        expect($scope.date).toBe(viewDate);
        expect(input.val()).toBe(modelDate);

        // Reset view format to default
        $scope.$apply("dateViewFormat = 'L'");
        $timeout.flush();
        expect(input.val()).toBe(viewDate);

        // Reset model format to default
        $scope.$apply("dateModelFormat = 'X'");
        expect($scope.date).toBe(modelDate);
      });

      it('should format the model if initialized after model is defined', function() {
        $scope.$apply("dateModelFormat = 'L'");
        $scope.$apply("dateViewFormat  = 'X'");
        $scope.$apply("date = '"+ viewDate +"'");

        var input = compile(momentInputViewModelFormat);

        expect($scope.date).toBe(viewDate);
        expect(input.val()).toBe(modelDate);
      });

      // Model-side min/max tests

      it('should validate the model against min and max string values', function() {
        var input = compile(momentInputMinMax),
            ctrl  = input.controller('ngModel');

        $scope.$apply("date    = '"+ modelDate +"'");
        $scope.$apply("dateMin = '"+ modelDateLower +"'");
        $scope.$apply("dateMax = '"+ modelDateHigher +"'");
        expect(ctrl.$error.min).toBe(false);
        expect(ctrl.$error.max).toBe(false);
        expect(input.val()).toBe(viewDate);

        $scope.$apply("date = '"+ modelDateLowest +"'");
        expect(ctrl.$error.min).toBe(true);
        expect(ctrl.$error.max).toBe(false);
        expect(input.val()).toBe('');

        $scope.$apply("date = '"+ modelDateHighest +"'");
        expect(ctrl.$error.min).toBe(false);
        expect(ctrl.$error.max).toBe(true);
        expect(input.val()).toBe('');

        $scope.$apply("date = '"+ modelDate +"'");
        expect(ctrl.$error.min).toBe(false);
        expect(ctrl.$error.max).toBe(false);
        expect(input.val()).toBe(viewDate);
      });

      it('should validate the model against min/max if compiled after model is set', function() {

        $scope.$apply("date = '"+ modelDateHighest +"'");
        $scope.$apply("dateMin = '"+ modelDateLower +"'");
        $scope.$apply("dateMax = '"+ modelDateHigher +"'");

        var input = compile(momentInputMinMax),
            ctrl  = input.controller('ngModel');
            
        expect(ctrl.$error.min).toBe(false);
        expect(ctrl.$error.max).toBe(true);
        expect(input.val()).toBe('');
        expect($scope.date).toBe(modelDateHighest);
      });

      it('should validate the model against min and max array values', function() {
        var input = compile(momentInputMinMax),
            ctrl  = input.controller('ngModel');

        $scope.$apply("date    = '"+ modelDate +"'");
        $scope.$apply("dateMin = ['"+ viewDateLower +"', 'MM-DD-YYYY'] ");
        $scope.$apply("dateMax = ['"+ viewDateHigher +"', 'MM-DD-YYYY'] ");

        expect(ctrl.$error.min).toBe(false);
        expect(ctrl.$error.max).toBe(false);
        expect(input.val()).toBe(viewDate);

        $scope.$apply("date = '"+ modelDateLowest +"'");
        expect(ctrl.$error.min).toBe(true);
        expect(ctrl.$error.max).toBe(false);
        expect(input.val()).toBe('');

        $scope.$apply("date = '"+ modelDateHighest +"'");
        expect(ctrl.$error.min).toBe(false);
        expect(ctrl.$error.max).toBe(true);
        expect(input.val()).toBe('');

        $scope.$apply("date = '"+ modelDate +"'");
        expect(ctrl.$error.min).toBe(false);
        expect(ctrl.$error.max).toBe(false);
        expect(input.val()).toBe(viewDate);
      });

      // View-side min/max tests

      it('should validate the view against min and max string values', function() {
        var input = compile(momentInputMinMax),
            ctrl  = input.controller('ngModel');

        $scope.$apply("dateMin = '"+ modelDateLower +"'");
        $scope.$apply("dateMax = '"+ modelDateHigher +"'");

        ctrl.$setViewValue(viewDateLowest);
        expect(ctrl.$error.min).toBe(true);
        expect(ctrl.$error.max).toBe(false);
        expect($scope.date).toBeUndefined();

        ctrl.$setViewValue(viewDateHighest);
        expect(ctrl.$error.min).toBe(false);
        expect(ctrl.$error.max).toBe(true);
        expect($scope.date).toBeUndefined();
      });

      it('should validate the view against min and max array values', function() {
        var input = compile(momentInputMinMax),
            ctrl  = input.controller('ngModel');

        $scope.$apply("dateMin = ['"+ viewDateLower +"', 'MM-DD-YYYY'] ");
        $scope.$apply("dateMax = ['"+ viewDateHigher +"', 'MM-DD-YYYY'] ");

        ctrl.$setViewValue(viewDateLowest);
        expect(ctrl.$error.min).toBe(true);
        expect(ctrl.$error.max).toBe(false);
        expect($scope.date).toBeUndefined();

        ctrl.$setViewValue(viewDateHighest);
        expect(ctrl.$error.min).toBe(false);
        expect(ctrl.$error.max).toBe(true);
        expect($scope.date).toBeUndefined();
      });

      // End view-size min/max tests

      it('should revalidate when min/max values change', function() {
        var input = compile(momentInputMinMax),
            ctrl  = input.controller('ngModel');

        $scope.$apply("date    = '"+ modelDate +"'");
        $scope.$apply("dateMin = '"+ modelDateLower +"'");
        $scope.$apply("dateMax = '"+ modelDateHigher +"'");

        $scope.$apply("dateMin = '"+ modelDateLowest +"'");
        $scope.$apply("dateMax = '"+ modelDateLower +"'");
        expect(ctrl.$error.min).toBe(false);
        expect(ctrl.$error.max).toBe(true);
        expect($scope.date).toBeUndefined();

        $scope.$apply("dateMin = '"+ modelDateHigher +"'");
        $scope.$apply("dateMax = '"+ modelDateHighest +"'");
        expect(ctrl.$error.min).toBe(true);
        expect(ctrl.$error.max).toBe(false);
        expect($scope.date).toBeUndefined();

        $scope.$apply("dateMin = '"+ modelDateLower +"'");
        $scope.$apply("dateMax = '"+ modelDateHigher +"'");
        expect(ctrl.$error.min).toBe(false);
        expect(ctrl.$error.max).toBe(false);
        expect($scope.date).toBe(modelDate);
      });

      // Stepping

      it('should set value to today\'s date on up, down, plus, or minus keys, or mousewheel', function() {
        var input = compile(momentInput),
            today = $moment().format('L');

        input.triggerHandler.apply(input, wheelUpEvent);
        expect(input.val()).toBe(today);

        $scope.$apply("date = undefined");
        input.triggerHandler.apply(input, wheelDownEvent);
        expect(input.val()).toBe(today);

        $scope.$apply("date = undefined");
        input.triggerHandler.apply(input, upKeyEvent);
        expect(input.val()).toBe(today);

        $scope.$apply("date = undefined");
        input.triggerHandler.apply(input, downKeyEvent);
        expect(input.val()).toBe(today);

        $scope.$apply("date = undefined");
        input.triggerHandler.apply(input, plusKeyEvent);
        expect(input.val()).toBe(today);

        $scope.$apply("date = undefined");
        input.triggerHandler.apply(input, minusKeyEvent);
        expect(input.val()).toBe(today);

      });

      it('should step by one day with a value', function() {
        var input     = compile(momentInput),
            ctrl      = input.controller('ngModel'),
            today     = $moment().format('L'),
            tomorrow  = $moment().add(1, 'day').format('L'),
            yesterday = $moment().subtract(1, 'day').format('L');

        ctrl.$setViewValue(today);
        input.triggerHandler.apply(input, wheelUpEvent);
        expect(ctrl.$viewValue).toBe(tomorrow);

        input.triggerHandler.apply(input, downKeyEvent);
        input.triggerHandler.apply(input, minusKeyEvent);
        expect(ctrl.$viewValue).toBe(yesterday);
      });

      it('should step by one month if shift key is pressed', function() {
        var input     = compile(momentInput),
            ctrl                = input.controller('ngModel'),
            today               = $moment().format('L'),
            nextMonth           = $moment().add(1, 'month').format('L'),
            wheelUpShiftEvent   = angular.copy(wheelUpEvent),
            wheelDownShiftEvent = angular.copy(wheelDownEvent);

        wheelUpShiftEvent[1].shiftKey   = true;
        wheelDownShiftEvent[1].shiftKey = true;

        ctrl.$setViewValue(today);
        input.triggerHandler.apply(input, wheelUpShiftEvent);
        expect(ctrl.$viewValue).toBe(nextMonth);

        input.triggerHandler.apply(input, wheelDownShiftEvent);
        expect(ctrl.$viewValue).toBe(today);
      });

      it('should not step if input view value is invalid', function() {
        var input = compile(momentInput),
            ctrl  = input.controller('ngModel');

        ctrl.$setViewValue('Purple monkey dishwasher');
        input.triggerHandler.apply(input, wheelUpEvent);
        expect(ctrl.$viewValue).toBe('Purple monkey dishwasher');
        expect($scope.date).toBeUndefined();
      });

      it('should not step if keydown event key isn\'t up, down, plus, or minus', function() {
        var input = compile(momentInput),
            ctrl  = input.controller('ngModel'),
            badKeyEvent = angular.copy(upKeyEvent);
        badKeyEvent[1].which = 39;

        input.triggerHandler.apply(input, badKeyEvent);
        expect(ctrl.$viewValue).toBeFalsy();
        expect($scope.date).toBeUndefined();
      });

      it('should begin stepping at min when specified', function() {
        var input = compile(momentInputMinMax),
            ctrl  = input.controller('ngModel');

        $scope.$apply("dateMin = '"+ modelDateLower +"'");
        $scope.$apply("dateMax = '"+ modelDateHigher +"'");

        input.triggerHandler.apply(input, minusKeyEvent);
        expect(ctrl.$viewValue).toBe(viewDateLower);

        $scope.$apply("date = undefined");
        input.triggerHandler.apply(input, plusKeyEvent);
        expect(ctrl.$viewValue).toBe(viewDateLower);
      });

      it('should not allow stepping out of min/max bounds', function() {
        var input = compile(momentInputMinMax),
            ctrl  = input.controller('ngModel');

        $scope.$apply("date    = '"+ modelDateLower +"'");
        $scope.$apply("dateMin = '"+ modelDateLower +"'");
        $scope.$apply("dateMax = '"+ modelDateHigher +"'");

        input.triggerHandler.apply(input, downKeyEvent);
        expect(ctrl.$viewValue).toBe(viewDateLower);

        $scope.$apply("date = '"+ modelDateHigher +"'");
        input.triggerHandler.apply(input, upKeyEvent);
        expect(ctrl.$viewValue).toBe(viewDateHigher);
      });

      it('should step out-of-bounds date to within min and max bounds when inc. and dec., respectively', function() {
        var input = compile(momentInputMinMax),
            ctrl  = input.controller('ngModel');

        $scope.$apply("dateMin = '"+ modelDateLower +"'");
        $scope.$apply("dateMax = '"+ modelDateHigher +"'");

        ctrl.$setViewValue(viewDateLowest);
        input.triggerHandler.apply(input, upKeyEvent);
        expect(ctrl.$viewValue).toBe(viewDateLower);

        ctrl.$setViewValue(viewDateHighest);
        input.triggerHandler.apply(input, downKeyEvent);
        expect(ctrl.$viewValue).toBe(viewDateHigher);
      });

      it('should respect the step attribute and ignore pluralization of unit', function() {
        var input = compile(momentInputStep),
            ctrl                = input.controller('ngModel'),
            today               = $moment().format('L'),
            nextMonth           = $moment().add(1, 'month').format('L');

        $scope.$apply("dateStep = '1 month'");

        input.triggerHandler.apply(input, upKeyEvent);
        expect(ctrl.$viewValue).toBe(today);

        $scope.$apply("dateStep = '1 months'");

        input.triggerHandler.apply(input, upKeyEvent);
        expect(ctrl.$viewValue).toBe(nextMonth);

        input.triggerHandler.apply(input, downKeyEvent);
        expect(ctrl.$viewValue).toBe(today);
      });

      it('should fall back to default stepping if step attribute is invalid', function() {
        var input = compile(momentInputStep),
            ctrl     = input.controller('ngModel'),
            today    = $moment().format('L'),
            tomorrow = $moment().add(1, 'day').format('L');

        input.triggerHandler.apply(input, upKeyEvent);
        $scope.$apply("dateStep = 'month 1'");

        input.triggerHandler.apply(input, upKeyEvent);
        expect(ctrl.$viewValue).toBe(tomorrow);

        $scope.$apply("dateStep = 'Purple monkey dishwasher'");
        input.triggerHandler.apply(input, downKeyEvent);
        expect(ctrl.$viewValue).toBe(today);
      });

    });

});