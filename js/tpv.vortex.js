;(function() {
  'use strict';
  window.tpv = window.tpv || {};

  tpv.vortex = function() {

    /**
     * Can (and should) be changed using the chart.data() method.
     * This will be replaced by any data passed to the chart.data() method:
     * Each element should be like:
     * {'size': 123, 'name': 'My label here', 'color': '#ff0000'}
     * Should be in order, with the smallest 'size' element first.
     */
    var data = [];

    /**
     * Can be 'rect' or 'circle'.
     * Can be changed using the chart.shapeType() method.
     */
    var shapeType = 'circle';

    /**
     * Which shape is currently the focused one? Its index within both
     * shapes and data. Will be set below...
     */
    var currentIdx = 0;

    var transitionSpeed = 1000;

    /**
     * Opacity for shapes that aren't currently 'in focus'.
     */
    var unfocusedOpacity = 0.05;

    /**
     * True when we're zooming in or out.
     */
    var isAnimating = false;

    // Start setting things up.

    var container = d3.select('.js-container');

    // Total width and height of the browser window.
    var windowW = container.node().getBoundingClientRect().width;
    var windowH = container.node().getBoundingClientRect().height;
    var aspectRatio = windowW / windowH;

    // Center point of the browser window.
    var centerX = windowW / 2;
    var centerY = windowH / 2;

    function chart() {

      // We expect the data in order of smallest-to-largest, because that
      // makes most sense.
      // But we need to reverse it so we can draw the shapes in the correct
      // order, from big-to-small, back-to-front.
      data.reverse();

      // And so we start with what is now the final element in data, which is
      // the smallest size/shape:
      currentIdx = data.length - 1;

      // Fill the browser window.
      var svg = container.append('svg')
                  .classed('svg', true)
                  .attr('width', windowW)
                  .attr('height', windowH);

      // Create all the circles/rects.
      svg.selectAll(shapeType)
          .data(data)
          .enter()
        .append(shapeType)
          .attrs(getShapeAttrs)
          .attr('class', function(d, i) {
            return 'shape js-shape-' + i;
          })
          .attr('fill', function(d, i) {
            if (d.background) {
              return 'url(#bg-' + i + ')';
            } else {
              return d.color;
            };
          })
          .attr('opacity', function(d, i) {
            return i == currentIdx ? 1 : unfocusedOpacity;
          });

      svg.selectAll('pattern')
          .data(data)
          .enter()
        .append('pattern')
          .attr('patternUnits', 'objectBoundingBox')
          .attr('id', function(d, i) {
            return 'bg-'+i;
          })
          .attr('width', 1)
          .attr('height', 1)
        .append("image")
          .attr("xlink:href", function(d, i) {
            if (d.background) {
              return d.background;
            };
          })
          .attrs(getPatternAttrs);


      showControls();

      startListeners();

      /**
       * Return an object of width and height attributes used to size the
       * background images for circles/rects.
       */
      function getPatternAttrs(d, i) {
        if ( ! d.background) {
          return {};
        };

        var attrs = getShapeAttrs(d, i);

        if (shapeType == 'circle') {
          return {
            'width': attrs['r'] * 2,
            'height': attrs['r'] * 2,
          };

        } else {
          return {
            'width': attrs['width'],
            'height': attrs['height'],
          };
        };
      };

      /**
       * Return an object of attributes for circles/rects related to size and
       * position. Things that we would animate.
       */
      function getShapeAttrs(d, i) {
        var attrs;

        if (shapeType == 'circle') {
          attrs = getCircleAttrs(d, i);
        } else {
          attrs = getRectAttrs(d, i);
        };

        return attrs;
      };

      /**
       * Return an object containing x, y, width and height attributes for a rect.
       */
      function getRectAttrs(d, i) {
        // How much bigger is this shape compared to the current, focused, one?
        // e.g. 1 for the currently-focused one.
        var scaleFactor = ( d.size / data[currentIdx].size );

        // Total area of browser window.
        // ie what the currently-focused shape's area should be.
        var windowArea = windowW * windowH;

        var shapeArea = windowArea * scaleFactor;

        var h = Math.sqrt(shapeArea / aspectRatio);
        var w = Math.round(shapeArea / h);
        h = Math.round(h);

        var x = -((w - windowW) / 2);
        var y = -((h - windowH) / 2);

        return {
          'x': x,
          'y': y,
          'width': w,
          'height': h
        }
      };

      /**
       * Return an object containing cx, cy and r attributes for a circle.
       */
      function getCircleAttrs(d, i) {
        // How much bigger is this shape compared to the current, focused, one?
        // e.g. 1 for the currently-focused one.
        var scaleFactor = ( d.size / data[currentIdx].size );

        // The diameter of the currently-focused circle, so it fits:
        var windowRadius = d3.min([windowW, windowH]) / 2;

        // What the currently-focused shape's area should be.
        // Like windowArea for rects.
        var focusedArea = Math.PI * Math.pow(windowRadius, 2);

        var shapeArea = focusedArea * scaleFactor;

        var radius = Math.round(Math.sqrt((shapeArea / Math.PI)));

        var cy = centerY;

        if ((windowH / windowW) > 1.1) {
          // If the window is portrait, then move the circle upwards a bit.
          cy = centerY - ((windowH - windowW) / 2.5);
        };

        return {
          'cx': centerX,
          'cy': cy,
          'r': radius
        };
      };

      function startListeners() {
        d3.select('.js-next')
            .on('click', function() { return step('next'); });

        d3.select('.js-prev')
            .on('click', function() { return step('prev'); });
      };

      /**
       * A next/previous link has been clicked.
       * direction is either 'next' or 'prev'.
       */
      function step(direction) {

        if (
          isAnimating
          ||
          (direction == 'next' && currentIdx == 0)
          ||
          (direction == 'prev' && currentIdx == data.length-1)
        ) {
          return;
        };

        isAnimating = true;

        hideControls();

        if (direction == 'next') {
          currentIdx--;
        } else {
          currentIdx++;
        };
        animateShapes();
      };

      /**
       * Go through every shape and animate it to whatever its size should be
       * based on the value of currentIdx.
       */
      function animateShapes() {
        // Run when each transition ends.
        var finished = function(d, i) {
          if (i == 0) {
            // Only need to do this when one of the shapes has finished!
            showControls();
            isAnimating = false;
          };
        };

        var getOpacity = function(d, i) {
          var opacity = unfocusedOpacity;
          if (i == currentIdx) {
            // Highlight current shape.
            opacity = 1;
          } else if (i > currentIdx) {
            // Those we've zoomed past.
            // A bit visible, but not much.
            opacity = unfocusedOpacity * 3;
          };

          return opacity;
        };

        svg.selectAll(shapeType)
            .transition()
              .duration(transitionSpeed)
              .attrs(getShapeAttrs)
              .attr('opacity', getOpacity)
              .on('end', finished);


        svg.selectAll('pattern')
            .selectAll('image')
            .transition()
              .duration(transitionSpeed)
              .attrs(getPatternAttrs);
      };

      /**
       * Hide the label and the next/prev links.
       */
      function hideControls() {
        d3.selectAll('.js-control')
            .transition()
              .duration(200)
              .style('opacity', 0);
      };

      /**
       * Display the label and next/prev links.
       * Set the label text for the current shape.
       */
      function showControls() {

        setButtonStyles();

        var d = data[currentIdx];
        var format = d3.format(',');
        var noun = 'people';

        if (d.size == 1) {
          noun = 'person';
        };

        d3.select('.js-label')
            .style('border-color', d.color)
            .html(d.name + ': ' + format(d.size) + '&nbsp;' + noun);

        d3.selectAll('.js-control')
            .transition()
              .duration(200)
              .style('opacity', 1);
      };

      /**
       * Set whether the next/prev links should be disabled or not.
       */
      function setButtonStyles() {

        var nextLink = d3.select('.js-next');
        var prevLink = d3.select('.js-prev');

        if (currentIdx == data.length-1) {
          prevLink.classed('is-disabled', true);
        } else {
          prevLink.classed('is-disabled', false);
        };
        if (currentIdx == 0) {
          nextLink.classed('is-disabled', true);
        } else {
          nextLink.classed('is-disabled', false);
        };
      };

    };

    chart.data = function(value) {
      if (!arguments.length) return data;
      data = value;
      if (typeof render === 'function') render();
      return chart;
    };

    /**
     * Could be 'circle' or 'rect'.
     */
    chart.shapeType = function(value) {
      if (!arguments.length) return shapeType;
      shapeType = value;
      if (typeof render === 'function') render();
      return chart;
    };

    return chart;

  };

}());
