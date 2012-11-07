;(function($) {
  // This Plugin provides a workflow functionality to give users a site tutorial.}
  $.fn.userTutorial = function(options) {
    var opts = $.extend({}, $.fn.userTutorial.defaults, options);
  
    // Request the usertutorial to attach it to its elements.
    // Collect an array of elements thats tutorial text are needed.
    var elements = [];
    this.each(function() {
      // Write element names 
      elements.push($(this).attr(opts.elementIdentification));
      
      // Initialize title attribute.
      if($(this).attr('title') === undefined) {
        $(this).attr('title', '');
      }
    });
    // Build request information.
    var data = $.extend({}, opts.additionalRequestData);
    data.tutorialElements = elements;
    
    $.ajax({
      url: opts.requestUrl,
      data: data,
      type: 'GET',
      dataType: 'json',
      success: function(returnData) {
        _beginTutorial(returnData);
      },
      error: function(errorData) {
      }
    });
  
    var elementIndex = 0; 
    var elements = [];
    var tooltip;
    var overlay;
    
    // private function for debugging
    var _debug = function($obj) {
      if (window.console && window.console.log) {
        window.console.log($obj);
      }
    };
    var _createTooltip = function() {
       tooltip = $('<div id="tutorial-tooltip-wrapper"/>')
       .attr('class', opts.tooltipClass)
       .append($('<div id="tutorial-tooltip-text"/>'))
       .append(
         $('<div id="tutorial-tooltip-button">')
         .append(opts.tooltipButton)
       )
       .appendTo('body');
       $('#tutorial-tooltip-button button').first().bind('click', _next);
       
       if(opts.darkenOverlay) {
         overlay = $('<div id="darken-overlay">')
         .css({
           width: $(document).width(),
           height: $(document).height(),
           zIndex: 9000
         })
         .appendTo('body');
       }
    };
    var _fillText = function(text) {
      $('#tutorial-tooltip-wrapper').find('#tutorial-tooltip-text').text(text);
    };
    var _getSelector = function(element) {
      // Build selector.
      return '[' + opts.elementIdentification + '=' + element.name +']';
    };
    var _getPositionInformation = function(jqObj) {
      var posData = {};
      // Collect informations for positioning
      posData.position = $(jqObj).position();
      posData.size = {
        width: $(jqObj).width(),
        height: $(jqObj).height()
      };
      posData.margin = {
        top: parseInt($(jqObj).css('margin-top').replace('px', '').replace('auto', 0)),
        left: parseInt($(jqObj).css('margin-left').replace('px', '').replace('auto', 0)),
        right: parseInt($(jqObj).css('margin-right').replace('px', '').replace('auto', 0)),
        bottom: parseInt($(jqObj).css('margin-bottom').replace('px', '').replace('auto', 0))
      }
      posData.padding = {
        top: parseInt($(jqObj).css('padding-top').replace('px', '').replace('auto', 0)),
        left: parseInt($(jqObj).css('padding-left').replace('px', '').replace('auto', 0)),
        right: parseInt($(jqObj).css('padding-right').replace('px', '').replace('auto', 0)),
        bottom: parseInt($(jqObj).css('padding-bottom').replace('px', '').replace('auto', 0))
      }
      
      return posData;
    };
    var _setPosition = function(element) {
      var jqObj = $(_getSelector(element));
      var cssPosition = {};
      // Save positioning data in element data container...
      element = $.extend({}, element, _getPositionInformation(jqObj));
      
      // Look at the type of positioning.
      switch(opts.position) {
        case 'above':
        break;
        case 'below':
        cssPosition = {
          top: element.position.top + element.size.height + element.margin.top + element.padding.top + element.padding.bottom + opts.gapSize,
          left: element.position.left + element.margin.left
        };
        break;
        case 'left':
        break;
        case 'right':
        break;
      }
      
      // Set position.
      $(tooltip).css(cssPosition);
    };
    var _tooltipFadeIn = function(element) {
      $(tooltip).fadeTo(opts.fadeSpeed, opts.tooltipTransperancy, function() {
        // Call show event.
        opts.show(element);
        
        elementIndex++;
      });
    };
    var _finish = function() {
      $(tooltip).fadeOut(opts.fadeSpeed, function() {
        $(tooltip).remove();
      });
      $(overlay).fadeOut(opts.fadeSpeed, function() {
        $(overlay).remove();
      });
      // Call finish event.
      opts.finish();
    };
    var _next = function() {
      // If the last tooltip is reached, only hide the tooltip.
      if(elementIndex == elements.length) {
        _finish();
        return;
      }
      
      // Make it easy ;).
      var element = elements[elementIndex];
      var selector = _getSelector(element);
      
      $(tooltip).fadeOut(opts.fadeSpeed, function() {
        _fillText(element.text);
        _setPosition(element);
        // Call hide-event.
        // Get next element in case that it exists.
        var nextElement = null;
        if(elementIndex < elements.length - 1) {
          nextElement = $(_getSelector(elements[elementIndex + 1]));
        }
        opts.hide(
          $(_getSelector(element)), 
          nextElement
        );
        // Decide if we first fade in the overlay and then show element + tooltip or...
        if(opts.darkenOverlay && overlay !== undefined) {
          $(overlay).find('#overlay-element-clone').fadeOut(opts.fadeSpeed, function() {
            $(overlay).find('#overlay-element-clone').remove();
          });
          $(overlay).fadeTo(opts.fadeSpeed, opts.darkenTransperancy, function() {
            // Since we cannot bring the current element in the foreground
            // while it has a custom positioning, we clone the element
            // and append it to the overlay. Then fade it in.
            clonedElement = $(_getSelector(element)).clone();
            // Get position information of original.
            positionInformation = _getPositionInformation($(_getSelector(element)));
            // Set position information.
            $(clonedElement).css({
              position: 'absolute',
              display: 'none',
              top: positionInformation.position.top,
              left: positionInformation.position.left
            }).attr('id', 'overlay-element-clone');
            // Add the cloned element to the overlay.
            overlay.append(clonedElement);
            // Fade element in.
            $(clonedElement).fadeIn(opts.fadeSpeed);
            // Show tooltip.
            _tooltipFadeIn(element);
          });  
        // Show tooltip instantly.
        } else {
          _tooltipFadeIn(element);          
        }
      });
    };
    var _beginTutorial = function(tutorialElements) {
      elements = tutorialElements;
      _createTooltip();
      opts.start();
      _next();
    };
    
  };
  
  // default options
  $.fn.userTutorial.defaults = {
    elementIdentification: 'rel',
    requestUrl: 'ajax/tutorial.php',
    additionalRequestData: {},
    tooltipClass: 'tutorialTooltip',
    tooltipButton: $('<button id="tutorial-tooltip-button"><span class="button-text">Continue</span></button>'),
    fadeSpeed:'normal',
    tooltipTransperancy: 0.8,
    position: 'below',
    align: 'center',
    gapSize: 10,
    darkenOverlay: true,
    darkenTransperancy: 0.6,
    
    // Events
    show: function(currentElement){},
    hide: function(curentElement, nextElement){},
    finish: function(){},
    start: function(){}
  };

})(jQuery);
