;(function() {
  'use strict';
  window.tpv = window.tpv || {};

  tpv.controller = function() {

    var worldPopulation = 7600000000;

    // Directory in which images for some data points are kept:
    var imagePath = '../img/';

    // Will contain the data submitted to the chart.
    var data = [];

    // Will be the chart object.
    var chart;

    makeData();


    // ?fb=200&twa=2700&twb=300&iga=89&igb=200&country=US
    function makeData() {
      var args = getUrlArgs();

      data.push({
        'name': 'You',
        'size': 1,
        'color': '#fcf14e',
        'background': imagePath + 'face.jpg'
      });

      for (var key in args) {
        var label;
        var color;
        var size = args[key];

        switch (key) {
          case 'fb':
            label = 'Your Facebook friends';
            color = '#4267b2';
            break;
          case 'twa':
            label = 'Your Twitter followers';
            color = '#1da1f2';
            break;
          case 'twb':
            label = 'People you follow on Twitter';
            color = '#2796dd';
            break;
          case 'iga':
            label = 'Your Instagram followers';
            color = '#df3171';
            break;
          case 'igb':
            label = 'People you follow on Instagram';
            color = '#ffb044';
            break;
        };

        if (label && isNumeric(size) && parseInt(size, 10) > 0) {
          data.push({
            'name': label,
            'size': parseInt(size, 10),
            'color': color
          });
        }
      };

      // A bit fiddly because of having to wait for the CSV to load, or not.
      // Either way, we finally want to call renderChart() when everything is
      // ready.
      if ('country' in args) {

        d3.csv('../data/countries.csv').then(function(countriesData) {
          // Get the country whose code was submitted as args['country']
          var countries = countriesData.filter(function(d) { return d.code == args['country']; });

          if (countries.length > 0) {
            data.push({
              'name': 'Population of ' + countries[0].name,
              'size': parseInt(countries[0].population * 1000, 10),
              'color': '#fff',
              'background': imagePath + 'flags/' + countries[0].code.toLowerCase() + '.png'
            });

            renderChart();
          } else {
            renderChart();
          };
        });
      } else {
        renderChart();
      };

    };

    /**
     * Once we've populated data, we just need to add the final datapoint
     * and render the chart.
     */
    function renderChart() {
      data.push({
        'name': 'Everyone on Earth',
        'size': worldPopulation,
        'color': '#6587e3',
        'background': imagePath + 'bluemarble_2014089.jpg'
      });

      // Sort so each item is in order, smallest first.
      data.sort(sortBySize);

      chart = tpv.vortex().data(data);

      chart();
    };


    function isNumeric(n) {
      return !isNaN(parseFloat(n)) && isFinite(n);
    };

    function sortBySize(a, b) {
      if (a.size < b.size)
        return -1;
      if (a.size > b.size)
        return 1;
      return 0;
    };

    /**
     * Get a dict of GET args from the current URL.
     * e.g.: {'a': 1, 'b': 3}
     */
    function getUrlArgs() {
      var query = window.location.search.substring(1);
      return parseQueryString(query);
    };

    /**
     * Given a query string like "a=1&b=3" this returns an object like
     * {'a': 1, 'b': 3}
     */
    function parseQueryString(query) {
      var vars = query.split("&");
      var query_string = {};
      for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split("=");
        var key = decodeURIComponent(pair[0]);
        var value = decodeURIComponent(pair[1]);
        if (key) {
          // If first entry with this name
          if (typeof query_string[key] === "undefined") {
            query_string[key] = decodeURIComponent(value);
            // If second entry with this name
          } else if (typeof query_string[key] === "string") {
            var arr = [query_string[key], decodeURIComponent(value)];
            query_string[key] = arr;
            // If third or later entry with this name
          } else {
            query_string[key].push(decodeURIComponent(value));
          }
        };
      }
      return query_string;
    };
  };

}());
