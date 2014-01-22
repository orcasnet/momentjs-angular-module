/*global beforeEach, afterEach, describe, it, inject, expect, module, spyOn, moment, angular, $*/
describe('$moment', function () {
    'use strict';

    var $moment;

    beforeEach(angular.mock.module('angular-momentjs'));
    beforeEach(inject(function (_$moment_) {
      $moment = _$moment_;
    }));

    describe('Service', function() {

      it('should be a reference to momentjs', function() {
        expect($moment.version).toBe(moment.version);
      });

      it('should be extended with angular-momentjs properties and methods', function() {
        expect($moment.$strictView).toBe(true);
        expect($moment.$strictModel).toBe(false);
        expect($moment.$defaultViewFormat).toBeDefined();
        expect($moment.$defaultModelFormat).toBeDefined();
        expect($moment.$parseFormat).toBeDefined();
      });

      it('should parse locale-dependent date formats into expanded form', function() {
        // Assuming moment.lang('en')
        expect($moment.$parseFormat('L')).toBe('MM/DD/YYYY');
        expect($moment.$parseFormat('LLLL')).toBe('dddd, MMMM D YYYY LT');
        expect($moment.$parseFormat('MM-YYYY')).toBe('MM-YYYY');
        expect($moment.$parseFormat(undefined)).toBe('');
      });

    });

});