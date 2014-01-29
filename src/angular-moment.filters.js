/*
  Angular Moment.js Filters
*/

'use strict';

angular.module('moment')

.filter('momentFormat', ['$moment', function($moment) {
  // Format: String or Array
  // String: Moment output format (defaults to defaultViewFormat)
  // Array: Moment input format, moment output format, [strict]
  return function momentFormatFilter(date, format) {
    var moment, strict, inputFormat,
        outputFormat = $moment.$defaultViewFormat;

    if (!angular.isDefined(date))
      return date;

    if (angular.isString(format))
      outputFormat = format;
    else if (angular.isArray(format)) {
      inputFormat  = format[0];
      outputFormat = format[1] || outputFormat;
      strict       = format[2];
    }

    moment = $moment(date, inputFormat, strict);

    if (moment.isValid())
      return moment.format(outputFormat);

    // Try parsing it with the defaultModelFormat if inputFormat wasn't specified
    if (!angular.isDefined(inputFormat)) {
      moment = $moment(date, $moment.$defaultModelFormat, $moment.strictModel);
      if (moment.isValid())
        return moment.format(outputFormat);
    }

    return date;
  };
}]);