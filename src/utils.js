export {getOffset}

function getOffset (elem) {
  // Based on http://stackoverflow.com/a/8111175
  if (!elem) { return }

  var doc = document
  var win = window
  var bodyElem = doc.body
  var docElem = doc.documentElement
  var boxElem = doc.createElement('div')
  var isBoxModel,
    clientTop, clientLeft,
    scrollTop, scrollLeft,
    offsetTop, offsetRight, offsetBottom, offsetLeft,
    adjustedScrollTop,
    adjustedScrollLeft

  boxElem.style.paddingLeft =
  boxElem.style.width = '1px'

  bodyElem.appendChild(boxElem)
  isBoxModel = boxElem.offsetWidth === 2
  bodyElem.removeChild(boxElem)
  boxElem = elem.getBoundingClientRect()

  clientTop = docElem.clientTop || bodyElem.clientTop || 0
  clientLeft = docElem.clientLeft || bodyElem.clientLeft || 0
  scrollTop = win.pageYOffset || isBoxModel && docElem.scrollTop || bodyElem.scrollTop
  scrollLeft = win.pageXOffset || isBoxModel && docElem.scrollLeft || bodyElem.scrollLeft

  adjustedScrollTop = scrollTop - clientTop
  adjustedScrollLeft = scrollLeft - clientLeft

  offsetTop = boxElem.top + adjustedScrollTop
  offsetLeft = boxElem.left + adjustedScrollLeft
  offsetBottom = boxElem.bottom + adjustedScrollTop
  offsetRight = boxElem.right + adjustedScrollLeft

  return {
    top: offsetTop,
    left: offsetLeft,
    bottom: offsetBottom,
    right: offsetRight
  }
}
