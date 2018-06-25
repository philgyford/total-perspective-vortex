;(function() {
  'use strict';
  window.tpv = window.tpv || {};

  tpv.controller = function() {

    var numbers = [1, 300, 10000, 300000];

    var currentIdx = 0;

    var shapes = [];

    var transitionSpeed = 2000;

    var container = d3.select('.js-container');

    var windowW = container.node().getBoundingClientRect().width;
    var windowH = container.node().getBoundingClientRect().height;
    var aspectRatio = windowW / windowH;

    var centerX = windowW / 2;
    var centerY = windowH / 2;

    var windowArea = windowW * windowH;

    var svg = container.append('svg')
                .classed('svg', true)
                .attr('width', windowW)
                .attr('height', windowH);


    // Create each shape, from the back (biggest) to the front (smallest).
    for (var n=numbers.length-1; n>=0; n--) {
      addShape(n);
    };

    d3.select('.js-next')
        .on('click', stepForward);

    d3.select('.js-prev')
        .on('click', stepBackward);

    /**
     * Move forward, to the next-biggest shape.
     */
    function stepForward() {
      var nextLink = d3.select('.js-next');
      var prevLink = d3.select('.js-prev');

      if (currentIdx == shapes.length-2) {
        console.log('disabling next');
        nextLink.classed('is-disabled', true);
      };

      if (currentIdx < shapes.length-1) {
        prevLink.classed('is-disabled', false);
        currentIdx++;
        animateShapes();
      };
    };

    /**
     * Move backward to the next-smallest shape.
     */
    function stepBackward() {
      var nextLink = d3.select('.js-next');
      var prevLink = d3.select('.js-prev');

      if (currentIdx == 1) {
        prevLink.classed('is-disabled', true);
      };

      if (currentIdx > 0) {
        nextLink.classed('is-disabled', false);
        currentIdx--;
        animateShapes();
      };
    };

    function animateShapes() {
      // Go through each shape and animate it to its next size.
      for (var n=0; n<numbers.length; n++) {
        animateShapeForward(n);
      };
    };

    /**
     * Given the index of a shape, transition it to its next, smaller, size.
     */
    function animateShapeForward(idx) {

      var dim = getShapeDimensions(idx);

      shapes[idx].transition()
          .duration(transitionSpeed)
          .attr('x', dim['x'])
          .attr('y', dim['y'])
          .attr('width', dim['w'])
          .attr('height', dim['h']);
    }

    /**
     * Given the index of a shape in the shapes array, draws it at its
     * initial size. Adds it to the shapes array.
     */
    function addShape(idx) {

      var dim = getShapeDimensions(idx);

      var shape = drawShape(idx, dim['x'], dim['y'], dim['w'], dim['h']);

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
      // How much bigger is this shape/pop compared to the first, smallest one?
      // e.g. 1 for the first one!
      var scaleFactor = ( numbers[idx] / numbers[currentIdx] );

      var area = windowArea * scaleFactor;

      var h = Math.sqrt(area / aspectRatio);
      var w = Math.round(area / h);
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

    /**
     * Draws a single shape in the svg.
     * Needs the index of the shape in the shapes array, plus its
     * x, y, width and height.
     * Returns the object appended.
     */
    function drawShape(idx, x, y, w, h) {
      return svg.append('rect')
                  .classed('js-shape-'+idx, true)
                  .classed('shape', true)
                  .attr('x', x)
                  .attr('y', y)
                  .attr('width', w)
                  .attr('height', h);
    };

  };

}());
