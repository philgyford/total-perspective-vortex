;(function() {
  'use strict';
  window.tpv = window.tpv || {};

  tpv.controller = function() {

    var data = makeData();

    var chart = tpv.vortex().data(data);

    chart();


    // ?fb=200&twa=2700&twb=300&iga=89&igb=200
    function makeData() {
      var args = getUrlArgs();
      var data = [{
        'name': 'You',
        'size': 1,
        'color': '#999999'
      }];

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

        if (label && isNumeric(size)) {
          data.push({
            'name': label,
            'size': parseInt(size, 10),
            'color': color
          });
        }
      };

      data.sort(sortBySize);

      data.push({
        'name': 'Population of the UK',
        'size': 65640000,
        'color': '#66883f'
      });

      data.push({
        'name': 'Everyone on Earth',
        'size': 7600000000,
        'color': '#bda390',
        'background': 'img/bluemarble_2014089.jpg'
      });

      return data;
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
