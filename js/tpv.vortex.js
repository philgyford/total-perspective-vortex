;(function() {
  'use strict';
  window.tpv = window.tpv || {};

  tpv.vortex = function() {

    /**
     * Can (and should) be changed using the chart.data() method.
     * This will be replaced by any data passed to the chart.data() method:
     * Each element should be like:
     * {'size': 123, 'name': 'My label here'}
     */
    var data = [];

    /**
     * Can be 'rect' or 'circle'.
     * Can be changed using the chart.shapeType() method.
     */
    var shapeType = 'circle';

    /**
     * Which shape is currently the focused one? Its index within both
     * shapes and data.
     */
    var currentIdx = 0;

    /**
     * Will be an array of 'rect's or 'circle's, in the same order as their
     * related data in the data array.
     */
    var shapes = [];

    var transitionSpeed = 1000;

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

      // Fill the browser window.
      var svg = container.append('svg')
                  .classed('svg', true)
                  .attr('width', windowW)
                  .attr('height', windowH);

      // Create each shape, from the back (biggest) to the front (smallest).
      for (var n=data.length-1; n>=0; n--) {
        addShape(n);
      };

      showControls();

      d3.select('.js-next')
          .on('click', function() { return step('next'); });

      d3.select('.js-prev')
          .on('click', function() { return step('prev'); });

      /**
       * direction is either 'next' or 'prev'.
       */
      function step(direction) {

        if (
          isAnimating
          ||
          (direction == 'next' && currentIdx == shapes.length-1)
          ||
          (direction == 'prev' && currentIdx == 0)
        ) {
          return;
        };

        isAnimating = true;

        hideControls();

        if (direction == 'next') {
          currentIdx++;
        } else {
          currentIdx--;
        };
        animateShapes();
      };

      /**
       * Go through every shape and animate it to whatever its size should be
       * based on the value of currentIdx.
       */
      function animateShapes() {
        for (var n=0; n<data.length; n++) {
          animateShapeForward(n);
        };
      };

      /**
       * Given the index of a shape, transition it to its next, smaller, size.
       */
      function animateShapeForward(idx) {

        // Run when each transition ends.
        var finished = function(d) {
          if (idx == 0) {
            // Only need to do this when one of the shapes has finished!
            showControls();
            isAnimating = false;
          };
        };

        var shape = shapes[idx];
        var dim = getShapeDimensions(idx);

        if (shapeType == 'circle') {
          // cx and cy stay the same.
          shape.transition()
              .duration(transitionSpeed)
              .attr('r', dim['r'])
              .on('end', finished);

        } else {
          shape.transition()
              .duration(transitionSpeed)
              .attr('x', dim['x'])
              .attr('y', dim['y'])
              .attr('width', dim['w'])
              .attr('height', dim['h'])
              .on('end', finished);
        };
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
            .text(d.name + ': ' + format(d.size) + ' ' + noun);

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

        if (currentIdx == shapes.length-1) {
          nextLink.classed('is-disabled', true);
        } else {
          nextLink.classed('is-disabled', false);
        };
        if (currentIdx == 0) {
          prevLink.classed('is-disabled', true);
        } else {
          prevLink.classed('is-disabled', false);
        };
      };

      /**
       * Given the index of a shape in the shapes array, draws it at its
       * initial size. Adds it to the shapes array.
       */
      function addShape(idx) {

        var dim = getShapeDimensions(idx);
        var shape;

        if (shapeType == 'circle') {
          shape = drawCircle(idx, dim['cx'], dim['cy'], dim['r'], data[idx].color);

        } else {
          shape = drawRect(idx, dim['x'], dim['y'], dim['w'], dim['h'], data[idx].color);
        };

        shapes.unshift(shape);
      };

      /**
       * Returns the x, y, width and height for a shape of index idx,
       * based on its relation to currentIdx (the shape that will take up the
       * full window).
       *
       * Returns an object.
       */
      function getShapeDimensions(idx) {
        // How much bigger is this shape compared to the current, focused, one?
        // e.g. 1 for the currently-focused one.
        var scaleFactor = ( data[idx].size / data[currentIdx].size );


        if (shapeType == 'circle') {

          // The diameter of the currently-focused circle, so it fits:
          var windowRadius = d3.min([windowW, windowH]) / 2;

          // What the currently-focused shape's area should be.
          // Like windowArea for rects.
          var focusedArea = Math.PI * Math.pow(windowRadius, 2);

          var shapeArea = focusedArea * scaleFactor;

          var radius = Math.round(Math.sqrt((shapeArea / Math.PI)));

          return {
            'cx': centerX,
            'cy': centerY,
            'r': radius
          };

        } else {
          // Rect.

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
            'w': w,
            'h': h
          }
        };
      };

      /**
       * Draws a single rect in the svg.
       * Needs the index of the shape in the shapes array, plus its:
       * x, y, (for the top-left point), width and height and fill color.
       * Returns the object appended.
       */
      function drawRect(idx, x, y, w, h, color) {
        return svg.append('rect')
                    .classed('js-shape-'+idx, true)
                    .classed('shape', true)
                    .attr('x', x)
                    .attr('y', y)
                    .attr('width', w)
                    .attr('height', h)
                    .attr('fill', color);
      };

      function drawCircle(idx, cx, cy, r, color) {
        return svg.append('circle')
                    .classed('js-shape-'+idx, true)
                    .classed('shape', true)
                    .attr('cx', cx)
                    .attr('cy', cy)
                    .attr('r', r)
                    .attr('fill', color);
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
