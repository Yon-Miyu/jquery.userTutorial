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
  
    // Set to -1, to have a 0 at the first call.
    var elementIndex = -1; 
    var elements = [];
    var tooltip;
    var tooltipTmpl;
    var overlay;
    
    // private function for debugging
    var _debug = function($obj) {
      if (window.console && window.console.log) {
        window.console.log($obj);
      }
    };
    var _bindButtonEvents = function() {
      tooltip.find('#tooltip-next').bind('click', _next);
      tooltip.find('#tooltip-back').bind('click', _back);
      tooltip.find('#tutorial-exit').bind('click', _exit);
    };
    var _createTooltip = function() {
      // Save compiled template for later use.
      tooltipTmpl = $('#' + opts.tooltipTemplate).tmpl({Text: ''});
      tooltip = $('<div id="user-tutorial-tooltip" />');
      tooltip.append(tooltipTmpl).appendTo('body');
      
      if(opts.darkenOverlay) {
        overlay = $('<div id="darken-overlay">')
        .css({
          width: $(document).width(),
          height: $(document).height(),
          zIndex: 9000
        })
        .appendTo('body');
        if(opts.exitByClickOnOverlay) {
          overlay.bind('click', _exit);
        }
      }
    };
    var _fillText = function(text) {
      tooltip.empty();
      tooltipTmpl = $('#' + opts.tooltipTemplate).tmpl({Text: text});
      tooltip.append(tooltipTmpl);
      
      _bindButtonEvents();
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
    var _handleButtonHiding = function() {
      // Check if we have to hide either the back or next button.
      if(elementIndex == 0) {
        tooltip.find('#tooltip-back').hide();
      } else {
        tooltip.find('#tooltip-back').show();
      }
      if(elementIndex == elements.length - 1) {
        tooltip.find('#tooltip-next').hide();
      } else {
        tooltip.find('#tooltip-next').show();
      }
    };
    var _exit = function() {
      _processStep(0);
    };
    var _next = function() {
      _processStep(1);
    };
    var _back = function() {
      _processStep(-1);
    };
    var _processStep = function(direction) {
      // If exit wanted, do it.
      if(direction == 0) {
        _finish();
        return;
      }
            
      elementIndex += direction;
      
      // Make it easy ;).
      var element = elements[elementIndex];
      var selector = _getSelector(element);
      
      $(tooltip).fadeOut(opts.fadeSpeed, function() {
        _fillText(element.text);
        _setPosition(element);
        
        // Call hide-event.
        // Get next element in case that it exists.
        var nextElement = null;
        if(elementIndex < elements.length - 1 && (elementIndex + direction) >= 0) {
          nextElement = $(_getSelector(elements[elementIndex + (1 * direction)] ));
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
          
          _handleButtonHiding();
          
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
    // The attribute that identifies an unique element.  
    elementIdentification: 'rel',
    // URL for ajax request.
    requestUrl: 'ajax/tutorial.php',
    // Additional url-parameters
    additionalRequestData: {},
    // The fade speed for all fading elements.
    fadeSpeed:'normal',
    // The transperancy of the tooltip
    tooltipTransperancy: 0.8,
    // The tooltip-positioning
    position: 'below',
    // The align of the tooltip.
    align: 'center',
    // The gap between the tooltip and its element.
    gapSize: 10,
    // Shows the overlay and highlight current element. 
    darkenOverlay: true,
    // The transperancy of the overlay
    darkenTransperancy: 0.6,
    // Exit by click on overlay?
    exitByClickOnOverlay: false,
    // Tooltip template for jquery.tmpl
    tooltipTemplate: 'tooltipTemplate',
    
    // Events
    show: function(currentElement){},
    hide: function(curentElement, nextElement){},
    finish: function(){},
    start: function(){}
  };

})(jQuery);
