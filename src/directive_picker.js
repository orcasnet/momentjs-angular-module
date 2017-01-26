// Picker extends moment input directive with positioned momentPicker

import angular from 'angular'
import { getOffset } from './utils'

export default ['$moment', '$compile', function inputDirective ($moment, $compile) {
  var defaultStyleAttr = 'style="position:absolute" class="input-picker"'
  var copiedAttrs = 'format modelFormat min max'.split(' ')

  var toSpinalCase = function (string) {
    return string.replace(/[a-z][A-Z]/g, function (w) { return w[0] + '-' + w[1] }).toLowerCase()
  }

  return {
    restrict: 'A',
    require: ['?ngModel'],
    link: function (scope, element, attr, ctrl) {
      if (!ctrl || attr.type !== 'moment') { return }

      var pickerAttrs = [ defaultStyleAttr ]
      var pickerElem, pickerScope, pickerCtrl, deregisterWatch

      function init () {
        deregisterWatch()
        pickerScope = pickerElem.isolateScope()
        pickerCtrl = pickerElem.controller('momentPicker')
        pickerCtrl.setVisibility(false)
        pickerScope.showClose = true
      }

      // Copy relevent attrs from input to picker
      if (attr.picker) { pickerAttrs.push('template=' + attr.picker) }

      angular.forEach(copiedAttrs, function (name) {
        if (attr[name]) { pickerAttrs.push(toSpinalCase(name) + '="' + attr[name] + '"') }
      })

      // Compile/inject/bind events to picker
      pickerElem = $compile('<div moment-picker="' + attr.ngModel + '" ' + pickerAttrs.join(' ') + '></div>')(scope)

      // Watch for controller instantiation
      deregisterWatch = scope.$watch(function () {
        if (pickerElem.controller('momentPicker')) { init() }
      })

      // DOM manipulation and event watching
      angular.element(document.body).append(pickerElem)

      pickerElem.on('mousedown', function (event) {
        event.preventDefault()
      })

      // Input event binding
      element.on('focus click', function (event) {
        var offset = getOffset(element[0])

        pickerElem.css({
          left: offset.left + 'px',
          top: offset.bottom + 'px'
        })

        pickerCtrl.setVisibility(true)
      })

      element.on('blur keydown', function (event) {
        if (event.type === 'keydown' && event.which !== 27) { return }
        pickerCtrl.setVisibility(false)
      })

      // Destruction cleanup
      scope.$on('$destroy', function () {
        pickerElem.off().remove()
      })
    }
  }
}]
