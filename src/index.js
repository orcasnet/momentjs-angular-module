import angular from 'angular'

import service from './service'
import filter from './filter'
import inputDirective from './directive_input'
import momentPickerDirective from './directive_momentPicker'
import pickerDirective from './directive_picker'

export default angular
  .module('$moment', [])
  .provider('$moment', service)
  .filter('momentFormat', filter)
  .directive('input', inputDirective)
  .directive('picker', pickerDirective)
  .directive('momentPicker', momentPickerDirective)
  .name
